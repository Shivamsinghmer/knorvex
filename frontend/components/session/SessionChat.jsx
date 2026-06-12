'use client';

import { useState, useEffect, useRef } from 'react';
import { StreamChat } from 'stream-chat';
import { Send, Loader2, MessageSquare } from 'lucide-react';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

export default function SessionChat({ sessionId, streamToken, currentUser, peerUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [channel, setChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const clientRef = useRef(null);
  const channelRef = useRef(null);

  const userId = currentUser?.id || currentUser?._id;

  useEffect(() => {
    if (!sessionId || !streamToken || !userId || !STREAM_API_KEY) { setIsLoading(false); return; }
    let cancelled = false;

    async function initChat() {
      try {
        setIsLoading(true);
        const client = new StreamChat(STREAM_API_KEY);
        clientRef.current = client;

        await client.connectUser(
          { id: userId, name: currentUser.name || '', image: currentUser.avatar || '' },
          streamToken
        );
        if (cancelled) { await client.disconnectUser().catch(() => {}); return; }

        const peerId = peerUser?.id || peerUser?._id;
        const members = [userId, ...(peerId && peerId !== userId ? [peerId] : [])];

        // watch() creates the channel on first call, joins on subsequent calls.
        // Never pass created_by_id — Stream derives it from the connected user,
        // and passing it on an existing channel causes a 403 for the second participant.
        const chan = client.channel('messaging', sessionId, {
          name: `Session: ${sessionId.substring(0, 8)}`,
          members,
        });

        try {
          await chan.watch({ presence: true });
        } catch (watchErr) {
          console.warn('Stream Chat unavailable:', watchErr?.message);
          if (!cancelled) setIsLoading(false);
          return;
        }
        channelRef.current = chan;
        if (cancelled) { await chan.stopWatching().catch(() => {}); await client.disconnectUser().catch(() => {}); return; }

        setChannel(chan);
        setMessages(chan.state.messages || []);
        chan.on('message.new', (event) => {
          if (!cancelled) setMessages((prev) => prev.find((m) => m.id === event.message.id) ? prev : [...prev, event.message]);
        });
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) { console.error('Stream Chat init error:', err); setIsLoading(false); }
      }
    }

    initChat();
    return () => {
      cancelled = true;
      channelRef.current?.stopWatching().catch(() => {});
      clientRef.current?.disconnectUser().catch(() => {});
      channelRef.current = null;
      clientRef.current = null;
    };
  }, [sessionId, streamToken, userId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !channel) return;
    const text = inputText;
    setInputText('');
    try { await channel.sendMessage({ text }); }
    catch (err) { console.error('Failed to send message:', err); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 h-full items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
        <span className="text-xs text-muted-foreground">Connecting to chat…</span>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col flex-1 h-full items-center justify-center min-h-[300px] text-center p-4">
        <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
        <span className="text-xs text-muted-foreground">Chat server unavailable. Feel free to use the audio/video channel.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full card rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2 bg-card">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-card-foreground uppercase tracking-wider">Session Chat Room</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 min-h-[200px] bg-background">
        {messages.length === 0 ? (
          <div className="text-center my-auto p-4 text-muted-foreground italic text-xs">
            No text messages yet. Say hello to your partner!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === userId;
            return (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                {!isMe && <span className="text-[10px] text-muted-foreground mb-1 font-bold ml-1">{msg.user.name || msg.user.id}</span>}
                <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-card text-foreground rounded-tl-none border border-border'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 mr-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2 bg-card">
        <input
          type="text"
          placeholder="Send text message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </form>
    </div>
  );
}
