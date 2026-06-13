'use client';

import {
  Send, Loader2, MessageCircle, CheckCircle2, Sparkles,
  Paperclip, X, FileText, Download, Trash2, ArrowLeft
} from 'lucide-react';
import RankBadge from '@/components/shared/RankBadge';

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

export default function MessageThread({
  selectedUser,
  messages,
  myId,
  inputText,
  attachPreview,
  isPendingRequest,
  isLoadingThread,
  isSending,
  isUploading,
  isAccepting,
  hoveredMsgId,
  messagesEndRef,
  fileInputRef,
  textareaRef,
  onBack,
  onSendMessage,
  onUnsend,
  onAcceptRequest,
  onKeyDown,
  onInputChange,
  onFileChange,
  onClearAttach,
  onHoverMsg,
  onLeaveMsg,
}) {
  return (
    <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 bg-background`}>
      {selectedUser ? (
        <>
          {/* Chat header */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border bg-card flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back to sidebar on mobile */}
              <button
                onClick={onBack}
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
                        onMouseEnter={() => onHoverMsg(msg._id)}
                        onMouseLeave={() => onLeaveMsg()}
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
                            onClick={() => onUnsend(msg._id)}
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
              <button onClick={onClearAttach} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
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
                onClick={onAcceptRequest}
                disabled={isAccepting}
                className="px-7 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
              >
                {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Accept Request
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSendMessage}
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
                onChange={onFileChange}
                className="hidden"
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                placeholder={`Message ${selectedUser.name}…`}
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed max-h-28 overflow-y-auto"
                style={{ scrollbarWidth: 'none' }}
              />

              {/* Send */}
              <button
                type="submit"
                disabled={(isSending || isUploading) || (!inputText.trim() && !attachPreview)}
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
  );
}
