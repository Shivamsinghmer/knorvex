'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { uploadFile } from '@/lib/uploadImage';
import { io } from 'socket.io-client';
import {
  Send, Loader2, MessageCircle, CheckCircle2, ChevronRight, Sparkles,
  Paperclip, X, FileText, Download, Trash2, Image as ImageIcon, Search,
  MoreHorizontal, ArrowLeft
} from 'lucide-react';
import RankBadge from '@/components/shared/RankBadge';
import { timeAgo } from '@/lib/utils';

/* ── helpers ── */
const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const FileAttachment = ({ url, fileName, isImage }) => {
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        <img src={url} alt={fileName || 'image'} className="max-w-[220px] max-h-52 rounded-xl object-cover border border-white/10" />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/10 hover:bg-black/20 transition-colors max-w-[220px]"
    >
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold truncate">{fileName || 'Download file'}</p>
        <p className="text-[10px] opacity-60">Click to open</p>
      </div>
      <Download className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
    </a>
  );
};

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
  const filteredConvs = conversations.filter((c) =>
    !search || (c.otherUser?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col px-2 py-2 sm:px-4 sm:py-4 max-w-7xl mx-auto w-full">
      <div className="flex-1 flex rounded-2xl overflow-hidden border border-border bg-card shadow-sm min-h-0">

        {/* ════ SIDEBAR ════ */}
        <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-shrink-0 border-r border-border flex-col bg-card`}>

          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <h2 className="font-black text-base text-card-foreground mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {[['chats', 'Chats'], ['requests', 'Requests']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2.5 text-[11px] font-bold transition-all relative ${
                  activeTab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                {key === 'requests' && requests.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-black">
                    {requests.length}
                  </span>
                )}
                {activeTab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {isLoadingChats ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            ) : activeTab === 'chats' ? (
              filteredConvs.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground italic">{search ? 'No matches.' : 'No conversations yet.'}</p>
                </div>
              ) : filteredConvs.map((conv) => {
                const other = conv.otherUser || {};
                const isUnread = conv.receiverId === myId && conv.status !== 'read';
                const isSelected = selectedUser && (selectedUser._id === other._id || selectedUser.id === other._id);
                return (
                  <button
                    key={conv._id}
                    onClick={() => loadThread(other)}
                    className={`w-full p-3 rounded-xl text-left flex gap-3 items-center transition-all ${
                      isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/60 border border-transparent'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={other.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${other._id || other.name}`}
                        alt={other.name}
                        className="w-10 h-10 rounded-xl object-cover bg-muted"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-1">
                        <span className={`text-[12px] font-bold truncate ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>{other.name}</span>
                        <span className="text-[9px] text-muted-foreground flex-shrink-0">{timeAgo(conv.createdAt)}</span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${isUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {conv.senderId === myId ? 'You: ' : ''}
                        {conv.mediaUrl && !conv.content ? '📎 Attachment' : (conv.content || '…')}
                      </p>
                    </div>
                    {isUnread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              requests.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-10">No pending requests.</p>
              ) : requests.map((req) => {
                const sender = req.senderId || {};
                return (
                  <button
                    key={req._id}
                    onClick={() => loadThread(sender)}
                    className="w-full p-3 rounded-xl text-left border border-border bg-background hover:border-primary/20 hover:bg-muted/20 transition-all flex items-center gap-3"
                  >
                    <img src={sender.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${sender._id}`} alt={sender.name} className="w-9 h-9 rounded-xl object-cover bg-muted" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-foreground block truncate">{sender.name}</span>
                      <span className="text-[10px] text-muted-foreground">Wants to connect</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ════ CHAT AREA ════ */}
        <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 bg-background`}>
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border bg-card flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Back to sidebar on mobile */}
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="relative">
                    <img
                      src={selectedUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedUser._id}`}
                      alt={selectedUser.name}
                      className="w-9 h-9 rounded-xl object-cover bg-muted"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{selectedUser.name}</span>
                      <RankBadge rank={selectedUser.rank || 'Beginner'} small />
                    </div>
                    <span className="text-[10px] text-muted-foreground">@{(selectedUser.name || '').split(' ')[0].toLowerCase()}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1 min-h-0">
                {isLoadingThread ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
                    <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center">
                      <MessageCircle className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Start a conversation</p>
                    <p className="text-xs text-muted-foreground max-w-xs">Send a message to begin exchanging knowledge with {selectedUser.name}.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isMe = msg.senderId === myId || msg.senderId?.toString() === myId;
                      const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1]?.createdAt).toDateString();
                      const isImageMedia = msg.mediaType === 'image';
                      const isFileMedia  = msg.mediaType === 'file';

                      return (
                        <div key={msg._id}>
                          {showDate && (
                            <div className="flex items-center gap-3 my-3">
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                          )}

                          <div
                            className={`flex items-end gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            onMouseEnter={() => setHoveredMsgId(msg._id)}
                            onMouseLeave={() => setHoveredMsgId(null)}
                          >
                            {/* Avatar for other user */}
                            {!isMe && (
                              <img
                                src={selectedUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedUser._id}`}
                                alt={selectedUser.name}
                                className="w-6 h-6 rounded-lg object-cover bg-muted mb-0.5 flex-shrink-0"
                                loading="lazy"
                              />
                            )}

                            {/* Unsend button (own messages, on hover) */}
                            {isMe && !msg.unsent && hoveredMsgId === msg._id && (
                              <button
                                onClick={() => handleUnsend(msg._id)}
                                title="Unsend"
                                className="p-1.5 rounded-lg bg-muted/80 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all flex-shrink-0 mb-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Bubble */}
                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                              {msg.unsent ? (
                                <div className="px-3.5 py-2 rounded-2xl text-[11px] italic text-muted-foreground border border-border bg-muted/30">
                                  This message was unsent.
                                </div>
                              ) : (
                                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                  isMe
                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                    : 'bg-card text-foreground border border-border rounded-bl-sm'
                                }`}>
                                  {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                                  {(isImageMedia || isFileMedia) && msg.mediaUrl && (
                                    <FileAttachment url={msg.mediaUrl} fileName={msg.fileName} isImage={isImageMedia} />
                                  )}
                                </div>
                              )}
                              <span className="text-[9px] text-muted-foreground mt-1 font-mono select-none">{fmt(msg.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Attachment preview bar */}
              {attachPreview && (
                <div className="px-4 py-2.5 border-t border-border bg-card flex items-center gap-3">
                  {attachPreview.isImage ? (
                    <img src={attachPreview.url} className="w-12 h-12 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{attachPreview.name}</p>
                    {isUploading && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Loader2 className="w-3 h-3 text-primary animate-spin" />
                        <span className="text-[10px] text-muted-foreground">Uploading…</span>
                      </div>
                    )}
                  </div>
                  <button onClick={clearAttach} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input area */}
              {isPendingRequest ? (
                <div className="p-5 border-t border-border bg-primary/5 text-center flex flex-col items-center gap-3 flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Message Request
                  </span>
                  <p className="text-xs text-foreground max-w-sm">
                    <strong>{selectedUser.name}</strong> wants to connect. Accept to reply.
                  </p>
                  <button
                    onClick={handleAcceptRequest}
                    disabled={isAccepting}
                    className="px-7 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Accept Request
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="px-4 py-3 border-t border-border bg-card flex items-end gap-2 flex-shrink-0"
                >
                  {/* File attach */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all flex-shrink-0"
                    title="Attach file"
                  >
                    <Paperclip className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    placeholder={`Message ${selectedUser.name}…`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed max-h-28 overflow-y-auto"
                    style={{ scrollbarWidth: 'none' }}
                  />

                  {/* Send */}
                  <button
                    type="submit"
                    disabled={(isSending || isUploading) || (!inputText.trim() && !attachFile)}
                    className="p-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center flex-shrink-0"
                  >
                    {(isSending || isUploading)
                      ? <Loader2 className="w-4.5 h-4.5 text-primary-foreground animate-spin" style={{ width: '18px', height: '18px' }} />
                      : <Send className="text-primary-foreground" style={{ width: '18px', height: '18px' }} />
                    }
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Your Messages</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Select a conversation from the sidebar, or visit a peer's profile to start a new one.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
