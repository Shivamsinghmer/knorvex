'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { uploadFile } from '@/lib/uploadImage';
import { useSocket } from '@/context/SocketContext';
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

  const { socketRef, version } = useSocket();
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

  /* socket — listen on shared connection, re-subscribe after reconnect */
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !currentUserId) return;

    const onNewMessage = ({ message }) => {
      const peer = selectedUserRef.current;
      if (peer && (peer._id === message.senderId || peer.id === message.senderId)) {
        setMessages((prev) => prev.find((m) => m._id === message._id) ? prev : [...prev, message]);
      } else {
        // Message from someone not currently open — bump their conv to top
        setConversations((prev) => {
          const idx = prev.findIndex((c) => {
            const otherId = c.otherUser?._id || c.otherUser?.id;
            return otherId === message.senderId;
          });
          if (idx === -1) { loadSidebar(); return prev; }
          const conv = { ...prev[idx], lastMessage: message };
          return [conv, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
      }
    };

    const onUnsent = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, unsent: true, content: '', mediaUrl: '', fileName: '' } : m)
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:unsent', onUnsent);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:unsent', onUnsent);
    };
  // re-subscribe after reconnect; selectedUser handled via ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, currentUserId]);

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
      const newMsg = data.data;
      setMessages((prev) => [...prev, newMsg]);
      // Update sidebar locally — move this conversation to top with latest message
      setConversations((prev) => {
        const idx = prev.findIndex((c) => {
          const otherId = c.otherUser?._id || c.otherUser?.id;
          return otherId === peerId;
        });
        if (idx === -1) { loadSidebar(); return prev; }
        const conv = { ...prev[idx], lastMessage: newMsg };
        return [conv, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
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
