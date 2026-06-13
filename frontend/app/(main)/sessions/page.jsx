'use client';

import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '@/store/authStore';
import useSessionStore from '@/store/sessionStore';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import RatingModal from '@/components/session/RatingModal';
import { Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUp, fadeIn, stagger, pageVariants, tap } from '@/lib/motion';
import SummaryModal from '@/components/sessions/SummaryModal';
import SessionCard from '@/components/sessions/SessionCard';

export default function SessionsPage() {
  const { user } = useAuthStore();
  const { sessions, isLoading, fetchSessions, updateSession } = useSessionStore();
  const { socketRef, version } = useSocket();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [ratingSessionId, setRatingSessionId] = useState(null);
  const [summarySessionId, setSummarySessionId] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  // Real-time session events via shared socket
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const onRateRequired = ({ sessionId }) => { setRatingSessionId(sessionId); setActiveTab('past'); fetchSessions(); };
    const onCompleted    = () => fetchSessions();
    const onBooked       = () => { fetchSessions(); setActiveTab('pending'); };
    const onConfirmed    = () => { fetchSessions(); setActiveTab('upcoming'); };
    const onCancelled    = () => fetchSessions();

    socket.on('session:rate_required', onRateRequired);
    socket.on('session:completed',     onCompleted);
    socket.on('session:booked',        onBooked);
    socket.on('session:confirmed',     onConfirmed);
    socket.on('session:cancelled',     onCancelled);

    return () => {
      socket.off('session:rate_required', onRateRequired);
      socket.off('session:completed',     onCompleted);
      socket.off('session:booked',        onBooked);
      socket.off('session:confirmed',     onConfirmed);
      socket.off('session:cancelled',     onCancelled);
    };
  // re-subscribe after reconnect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const handleConfirm = useCallback(async (sessionId) => {
    try {
      await api.put(`/sessions/${sessionId}/confirm`);
      updateSession(sessionId, { status: 'confirmed' });
      // fetchSessions is intentionally omitted — updateSession handles local state
      // the socket event session:confirmed will trigger a background refresh
    } catch (err) { console.error(err); }
  }, [updateSession]);

  const handleCancel = useCallback(async (sessionId) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    try {
      await api.post(`/sessions/${sessionId}/cancel`, { reason: 'User requested cancellation.' });
      updateSession(sessionId, { status: 'cancelled' });
      setActiveTab('past');
    } catch (err) { console.error(err); }
  }, [updateSession]);

  const handleOpenSummary = async (sessionId) => {
    setSummarySessionId(sessionId); setSummaryText(''); setIsLoadingSummary(true);
    try {
      const { data } = await api.get(`/ai/summary/${sessionId}`);
      setSummaryText(data.data?.summary || 'No summary notes available for this session.');
    } catch (err) { setSummaryText('Failed to load session notes.'); }
    finally { setIsLoadingSummary(false); }
  };

  const currentUserId = user?.id || user?._id;

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'upcoming') return s.status === 'confirmed' || s.status === 'active';
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'past') return ['completed', 'pending_rating', 'cancelled'].includes(s.status);
    return true;
  });

  const tabCls = (tab) => `px-4 py-2 text-xs font-bold rounded-xl transition-all ${
    activeTab === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
  }`;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-10 text-foreground">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2 text-foreground">
            <Calendar className="w-8 h-8 text-primary" /> Your Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Manage your booked learning and teaching exchanges.</p>
        </div>
        <motion.button whileTap={tap} onClick={fetchSessions} className="text-xs font-bold text-primary hover:text-primary/80 border border-primary/20 bg-primary/5 px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
        </motion.button>
      </motion.div>

      <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="flex gap-2 border-b border-border pb-3 mb-6 overflow-x-auto">
        {/* Upcoming & Ongoing — pulse dot when a call is live */}
        <button onClick={() => setActiveTab('upcoming')} className={`${tabCls('upcoming')} flex items-center gap-1.5`}>
          {sessions.some(s => s.status === 'active') && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          )}
          Upcoming &amp; Ongoing
        </button>

        {/* Pending Approval — inline badge */}
        <button onClick={() => setActiveTab('pending')} className={`${tabCls('pending')} flex items-center gap-1.5`}>
          Pending Approval
          {(() => {
            const count = sessions.filter(s => s.status === 'pending' && (s.hostId?._id === currentUserId || s.hostId === currentUserId)).length;
            return count > 0 ? (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-black rounded-full flex-shrink-0">
                {count}
              </span>
            ) : null;
          })()}
        </button>

        {/* Past Exchange — inline badge for unrated sessions */}
        <button onClick={() => setActiveTab('past')} className={`${tabCls('past')} flex items-center gap-1.5`}>
          Past Exchange
          {(() => {
            const count = sessions.filter(s => {
              const isHost = s.hostId?._id === currentUserId || s.hostId === currentUserId;
              return s.status === 'pending_rating' && !(isHost ? s.hostRated : s.learnerRated);
            }).length;
            return count > 0 ? (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex-shrink-0">
                {count}
              </span>
            ) : null;
          })()}
        </button>
      </motion.div>

      {isLoading ? (
        <div className="card p-12 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-xs text-muted-foreground">Loading session logs...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="card p-12 rounded-2xl border-dashed text-center flex flex-col items-center justify-center min-h-[300px]">
          <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground">No sessions found in this category.</p>
          <Link href="/discover" className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl">Book a peer session</Link>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSessions.map((s) => (
            <SessionCard
              key={s._id}
              session={s}
              currentUserId={currentUserId}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onOpenSummary={handleOpenSummary}
              onRate={(id) => setRatingSessionId(id)}
            />
          ))}
        </motion.div>
      )}

      {ratingSessionId && (
        <RatingModal
          sessionId={ratingSessionId}
          onSubmitted={() => { setRatingSessionId(null); fetchSessions(); }}
          onClose={() => setRatingSessionId(null)}
        />
      )}

      <SummaryModal
        isOpen={!!summarySessionId}
        isLoading={isLoadingSummary}
        text={summaryText}
        onClose={() => setSummarySessionId(null)}
      />
    </motion.div>
  );
}
