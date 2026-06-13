'use client';

import { Loader2, MessageCircle, ChevronRight, Search } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function ConversationSidebar({
  selectedUser,
  conversations,
  requests,
  activeTab,
  search,
  isLoadingChats,
  myId,
  onTabChange,
  onSearch,
  onSelectUser,
}) {
  const filteredConvs = conversations.filter((c) =>
    !search || (c.otherUser?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
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
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[['chats', 'Chats'], ['requests', 'Requests']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
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
                onClick={() => onSelectUser(other)}
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
                onClick={() => onSelectUser(sender)}
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
  );
}
