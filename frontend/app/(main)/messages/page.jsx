'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { uploadFile } from '@/lib/uploadImage';
import { io } from 'socket.io-client';
import ConversationSidebar from '@/components/messages/ConversationSidebar';
import MessageThread from '@/components/messages/MessageThread';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const initialUserQuery = searchParams.get('user');
  const { user: currentUser } = useAuthStore();
  // Stable primitive — won't change reference when fetchMe() refreshes user object
  const currentUserId = currentUser?.id || currentUser?._id;

  const [conversations, setConversations] = useState([]);
  const [requests, setRequests]           = useState([]);
  const [activeTab, setActiveTab]         = useState('chats');
  const [search, setSearch]               = useState('');

  const [selectedUser, setSelectedUser]             = useState(null);
  const [messages, setMessages]                     = useState([]);
  const [inputText, setInputText]                   = useState('');
  const [attachFile, setAttachFile]                 = useState(null);    // File object
  const [attachPreview, setAttachPreview]           = useState(null);    // { url, name, isImage }
  const [hoveredMsgId, setHoveredMsgId]             = useState(null);

  const [isPendingRequest, setIsPendingRequest]     = useState(false);
  const [activeConversationId, setActiveConversationId] = useState('');

  const [isLoadingChats, setIsLoadingChats]   = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending]             = useState(false);
  const [isUploading, setIsUploading]         = useState(false);
  const [isAccepting, setIsAccepting]         = useState(false);

  const socketRef      = useRef(null);
  const messagesEndRef  = useRef(null);
  const fileInputRef   = useRef(null);
  const textareaRef    = useRef(null);
  // Keep latest selectedUser accessible inside socket callbacks without re-creating the socket
  const selectedUserRef = useRef(null);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  /* auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* sidebar — only runs once currentUser is hydrated from Zustand persist */
  const loadSidebar = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const [convRes, reqRes] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/messages/requests'),
      ]);
      setConversations(convRes.data?.data || []);
      setRequests(reqRes.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoadingChats(false); }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    loadSidebar();
  }, [currentUserId, loadSidebar]);

  /* socket — created once per user session (depends on stable ID, not object ref) */
  useEffect(() => {
    if (!currentUserId) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join', { userId: currentUserId }));

    socket.on('message:new', ({ message }) => {
      const peer = selectedUserRef.current;
      if (peer && (peer._id === message.senderId || peer.id === message.senderId)) {
        setMessages((prev) => prev.find((m) => m._id === message._id) ? prev : [...prev, message]);
      } else {
        loadSidebar();
      }
    });

    socket.on('message:unsent', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, unsent: true, content: '', mediaUrl: '', fileName: '' } : m)
      );
    });

    return () => {
      socket.off('connect');
      socket.off('message:new');
      socket.off('message:unsent');
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]); // intentionally omit selectedUser — handled via ref above

  /* load thread */
  async function loadThread(peer) {
    if (!peer) return;
    setSelectedUser(peer);
    setIsLoadingThread(true);
    const peerId = peer._id || peer.id;
    try {
      const { data } = await api.get(`/messages/conversations/${peerId}`);
      const list = data.data || [];
      setMessages(list);
      const myId = currentUser.id || currentUser._id;
      const pending = list.find((m) => m.isRequest && m.status === 'pending' && m.receiverId === myId);
      setIsPendingRequest(!!pending);
      if (list.length > 0) setActiveConversationId(list[0].conversationId);
    } catch (err) { console.error(err); }
    finally { setIsLoadingThread(false); }
  }

  /* resolve ?user= param */
  useEffect(() => {
    if (!initialUserQuery || !currentUserId) return;
    api.get(`/users/${initialUserQuery}`)
      .then(({ data }) => { if (data.data?.user) loadThread(data.data.user); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserQuery, currentUserId]);

  /* file picker */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    setAttachFile(file);
    setAttachPreview({ url: isImage ? URL.createObjectURL(file) : null, name: file.name, isImage });
  };

  const clearAttach = () => {
    setAttachFile(null);
    setAttachPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* send */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachFile) || !selectedUser || isSending) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    const peerId = selectedUser._id || selectedUser.id;
    try {
      let mediaUrl = '', mediaType = '', fileName = '';

      if (attachFile) {
        setIsUploading(true);
        const result = await uploadFile(attachFile, 'messages');
        mediaUrl  = result.url;
        mediaType = result.isImage ? 'image' : 'file';
        fileName  = result.originalName || attachFile.name;
        setIsUploading(false);
        clearAttach();
      }

      const { data } = await api.post('/messages', { receiverId: peerId, content, mediaUrl, mediaType, fileName });
      setMessages((prev) => [...prev, data.data]);
      loadSidebar();
    } catch (err) {
      console.error('Failed to send:', err);
      setIsUploading(false);
    } finally { setIsSending(false); }
  };

  /* unsend */
  const handleUnsend = async (msgId) => {
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, unsent: true, content: '', mediaUrl: '', fileName: '' } : m));
    } catch (err) { console.error(err); }
  };

  /* accept request */
  const handleAcceptRequest = async () => {
    if (!activeConversationId) return;
    setIsAccepting(true);
    try {
      await api.put(`/messages/${activeConversationId}/accept`);
      setIsPendingRequest(false);
      if (selectedUser) loadThread(selectedUser);
      loadSidebar();
    } catch (err) { console.error(err); }
    finally { setIsAccepting(false); }
  };

  /* Enter to send, Shift+Enter for newline */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
  };

  const myId = currentUser?.id || currentUser?._id;

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col px-2 py-2 sm:px-4 sm:py-4 max-w-7xl mx-auto w-full">
      <div className="flex-1 flex rounded-2xl overflow-hidden border border-border bg-card shadow-sm min-h-0">

        <ConversationSidebar
          selectedUser={selectedUser}
          conversations={conversations}
          requests={requests}
          activeTab={activeTab}
          search={search}
          isLoadingChats={isLoadingChats}
          myId={myId}
          onTabChange={setActiveTab}
          onSearch={setSearch}
          onSelectUser={loadThread}
        />

        <MessageThread
          selectedUser={selectedUser}
          messages={messages}
          myId={myId}
          inputText={inputText}
          attachPreview={attachPreview}
          isPendingRequest={isPendingRequest}
          isLoadingThread={isLoadingThread}
          isSending={isSending}
          isUploading={isUploading}
          isAccepting={isAccepting}
          hoveredMsgId={hoveredMsgId}
          messagesEndRef={messagesEndRef}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
          onBack={() => setSelectedUser(null)}
          onSendMessage={handleSendMessage}
          onUnsend={handleUnsend}
          onAcceptRequest={handleAcceptRequest}
          onKeyDown={handleKeyDown}
          onInputChange={setInputText}
          onFileChange={handleFileChange}
          onClearAttach={clearAttach}
          onHoverMsg={setHoveredMsgId}
          onLeaveMsg={() => setHoveredMsgId(null)}
        />

      </div>
    </div>
  );
}
