'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { io } from 'socket.io-client';
import VideoRoom from '@/components/session/VideoRoom';
import SessionChat from '@/components/session/SessionChat';
import AIPrepCard from '@/components/session/AIPrepCard';
import RatingModal from '@/components/session/RatingModal';
import { Loader2, PhoneOff, Video } from 'lucide-react';

export default function SessionRoomPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id;

  const { user: currentUser } = useAuthStore();
  const [session, setSession] = useState(null);
  const [streamToken, setStreamToken] = useState('');
  const [chatToken, setChatToken] = useState('');
  const [streamCallId, setStreamCallId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    if (!sessionId || !currentUser) return;
    async function startAndLoadSession() {
      try {
        setIsLoading(true);
        setError('');
        const { data } = await api.post(`/sessions/${sessionId}/start`);
        setSession(data.data.session);
        setStreamToken(data.data.userToken || '');
        setChatToken(data.data.chatToken || '');
        setStreamCallId(data.data.streamCallId || sessionId);
      } catch (err) {
        console.error('Failed to start session room:', err);
        setError(err.response?.data?.message || 'Could not connect to the video call session.');
      } finally {
        setIsLoading(false);
      }
    }
    startAndLoadSession();
  }, [sessionId, currentUser]);

  // Listen for session:rate_required so the peer (who didn't click End) also sees the rating modal
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id || currentUser._id;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socket.on('connect', () => socket.emit('join', { userId }));
    socket.on('session:rate_required', ({ sessionId: sid }) => {
      if (sid === sessionId) setShowRating(true);
    });
    return () => {
      socket.off('session:rate_required');
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id || currentUser?._id, sessionId]);

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session call? Both participants will be directed to submit ratings.')) return;
    setIsEnding(true);
    try {
      await api.post(`/sessions/${sessionId}/end`);
      setShowRating(true);
    } catch (err) {
      console.error('Failed to end session:', err);
      alert(err.response?.data?.message || 'Could not end the session. Please try again.');
    } finally {
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm font-semibold text-muted-foreground">Scaffolding video conference room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
        <div className="card max-w-md w-full p-8 rounded-2xl border-destructive/20">
          <PhoneOff className="w-10 h-10 text-destructive mb-3 mx-auto" />
          <h4 className="font-bold text-sm text-card-foreground">Connection Interrupted</h4>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <button onClick={() => router.push('/sessions')} className="mt-6 w-full py-2 bg-muted hover:bg-secondary text-xs font-bold rounded-xl border border-border text-foreground">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isHost = session?.hostId?._id === (currentUser?.id || currentUser?._id);
  const peer = isHost ? session?.learnerId : session?.hostId;
  const skill = session?.skillTag || 'Skill Exchange';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground p-3 sm:p-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black leading-tight text-foreground">{skill} Session</h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Call with <strong className="text-foreground">{peer?.name || 'Peer'}</strong> (Role: {isHost ? 'Instructor' : 'Learner'})
            </p>
          </div>
        </div>
        <button
          onClick={handleEndSession}
          disabled={isEnding}
          className="px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{isEnding ? 'Ending Call...' : 'Disconnect Call'}</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-6">
          <div className="flex-1 h-full min-h-[280px] sm:min-h-[480px]">
            <VideoRoom
              sessionId={sessionId}
              streamToken={streamToken}
              currentUser={currentUser}
              peerUser={peer}
              onCallEnded={() => setShowRating(true)}
            />
          </div>
          <AIPrepCard sessionId={sessionId} />
        </div>
        <div className="lg:col-span-1 h-full min-h-[300px] sm:min-h-[400px]">
          <SessionChat sessionId={sessionId} streamToken={chatToken} currentUser={currentUser} peerUser={peer} />
        </div>
      </div>

      {showRating && (
        <RatingModal sessionId={sessionId} onSubmitted={() => { setShowRating(false); router.push('/sessions'); }} />
      )}
    </div>
  );
}
