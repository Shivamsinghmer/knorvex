'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/authStore';
import useSessionStore from '@/store/sessionStore';
import api from '@/lib/api';
import CoinDisplay from '@/components/shared/CoinDisplay';
import RatingModal from '@/components/session/RatingModal';
import { Calendar, Video, CheckCircle2, MessageSquare, Loader2, Sparkles, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUp, fadeIn, scaleIn, stagger, pageVariants, cardHover, tap } from '@/lib/motion';

export default function SessionsPage() {
  const { user } = useAuthStore();
  const { sessions, isLoading, fetchSessions, updateSession } = useSessionStore();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [ratingSessionId, setRatingSessionId] = useState(null);
  const [summarySessionId, setSummarySessionId] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  // Auto-open rating modal + switch to Past Exchange when a session ends
  useEffect(() => {
    if (!user) return;
    const userId = user.id || user._id;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socket.on('connect', () => socket.emit('join', { userId }));
    socket.on('session:rate_required', ({ sessionId }) => {
      setRatingSessionId(sessionId);
      setActiveTab('past'); // move to Past Exchange tab where the session now lives
      fetchSessions();
    });
    socket.on('session:completed', () => {
      fetchSessions(); // refresh so the completed status shows
    });
    return () => {
      socket.off('session:rate_required');
      socket.off('session:completed');
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id || user?._id]);

  const handleConfirm = async (sessionId) => {
    try {
      await api.put(`/sessions/${sessionId}/confirm`);
      updateSession(sessionId, { status: 'confirmed' });
      fetchSessions();
    } catch (err) { console.error(err); }
  };

  const handleCancel = async (sessionId) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    try {
      await api.post(`/sessions/${sessionId}/cancel`, { reason: 'User requested cancellation.' });
      updateSession(sessionId, { status: 'cancelled' });
      setActiveTab('past'); // cancelled sessions live in Past Exchange
      fetchSessions();
    } catch (err) { console.error(err); }
  };

  const handleOpenSummary = async (sessionId) => {
    setSummarySessionId(sessionId); setSummaryText(''); setIsLoadingSummary(true);
    try {
      const { data } = await api.get(`/ai/summary/${sessionId}`);
      setSummaryText(data.data?.summary || 'No summary notes available for this session.');
    } catch (err) { setSummaryText('Failed to load session notes.'); }
    finally { setIsLoadingSummary(false); }
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'upcoming') return s.status === 'confirmed' || s.status === 'active';
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'past') return ['completed', 'pending_rating', 'cancelled'].includes(s.status);
    return true;
  });

  const tabCls = (tab) => `px-4 py-2 text-xs font-bold rounded-xl transition-all ${
    activeTab === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
  }`;

  const statusCls = (status) => {
    if (status === 'active') return 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/20 dark:bg-emerald-500/5';
    if (status === 'confirmed') return 'text-primary border-primary/20 bg-primary/5';
    if (status === 'pending') return 'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-500/20 dark:bg-amber-500/5';
    if (status === 'pending_rating') return 'text-violet-600 border-violet-200 bg-violet-50 dark:text-violet-400 dark:border-violet-500/20 dark:bg-violet-500/5';
    if (status === 'completed') return 'text-muted-foreground border-border bg-muted/30';
    if (status === 'cancelled') return 'text-destructive border-destructive/20 bg-destructive/5';
    return 'text-muted-foreground border-border bg-muted/30';
  };

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
            const myId = user?.id || user?._id;
            const count = sessions.filter(s => s.status === 'pending' && (s.hostId?._id === myId || s.hostId === myId)).length;
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
            const myId = user?.id || user?._id;
            const count = sessions.filter(s => {
              const isHost = s.hostId?._id === myId || s.hostId === myId;
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
          {filteredSessions.map((session) => {
            const isHost = session.hostId?._id === (user?.id || user?._id);
            const partner = isHost ? session.learnerId : session.hostId;
            const partnerName = partner?.name || 'Knorvex Peer';
            const partnerAvatar = partner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partner?._id || partnerName}`;
            const hasRated = isHost ? session.hostRated : session.learnerRated;
            const requiresRating = (session.status === 'completed' || session.status === 'pending_rating') && !hasRated;

            return (
              <motion.div key={session._id} variants={scaleIn} whileHover={cardHover} className="card hover-glow p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <img src={partnerAvatar} alt={partnerName} className="w-10 h-10 rounded-xl object-cover bg-muted border border-border" loading="lazy" />
                    <div>
                      <span className="text-xs font-bold text-card-foreground">{partnerName}</span>
                      <span className="text-[10px] text-muted-foreground block">@{partnerName.split(' ')[0].toLowerCase()}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls(session.status)}`}>
                    {session.status === 'pending_rating' ? 'awaiting rating' : session.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Exchange Details</span>
                    <span className="font-bold text-card-foreground">{isHost ? '📤 Teaching' : '📥 Learning'}</span>
                    <span className="block text-[10px] text-primary mt-0.5 font-mono">{session.skillTag}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Coins & Time</span>
                    <CoinDisplay amount={session.coinsReward} size="xs" />
                    <span className="block text-[10px] text-muted-foreground mt-1">
                      {new Date(session.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-2">
                  {session.status === 'pending' && isHost && (
                    <>
                      <motion.button whileTap={tap} onClick={() => handleConfirm(session._id)} className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Request
                      </motion.button>
                      <motion.button whileTap={tap} onClick={() => handleCancel(session._id)} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5">
                        <XCircle className="w-4 h-4" />
                      </motion.button>
                    </>
                  )}
                  {session.status === 'pending' && !isHost && (
                    <motion.button whileTap={tap} onClick={() => handleCancel(session._id)} className="flex-1 py-2 rounded-xl border border-border text-muted-foreground hover:text-destructive text-xs font-bold">
                      Cancel Request
                    </motion.button>
                  )}
                  {session.status === 'confirmed' && (
                    <>
                      <Link href={`/sessions/${session._id}`} className="flex-1">
                        <motion.button whileTap={tap} className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5">
                          <Video className="w-3.5 h-3.5" /> Enter Call
                        </motion.button>
                      </Link>
                      <motion.button whileTap={tap} onClick={() => handleCancel(session._id)} className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground text-xs font-semibold">
                        Cancel
                      </motion.button>
                    </>
                  )}
                  {session.status === 'active' && (
                    <Link href={`/sessions/${session._id}`} className="flex-1">
                      <motion.button whileTap={tap} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                        <Video className="w-3.5 h-3.5" /> Rejoin Live Call
                      </motion.button>
                    </Link>
                  )}
                  {requiresRating && (
                    <motion.button whileTap={tap} onClick={() => setRatingSessionId(session._id)} className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Submit Rating & Complete
                    </motion.button>
                  )}
                  {(session.status === 'completed' || session.status === 'pending_rating') && !requiresRating && (
                    <motion.button whileTap={tap} onClick={() => handleOpenSummary(session._id)} className="flex-1 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" /> View AI Summary
                    </motion.button>
                  )}
                  {session.status === 'cancelled' && (
                    <span className="text-xs text-muted-foreground italic py-1 leading-relaxed">
                      Cancelled {session.cancelledBy === user?.id ? 'by you' : 'by peer'}. Reason: {session.cancelReason || 'None'}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {ratingSessionId && (
        <RatingModal sessionId={ratingSessionId} onSubmitted={() => { setRatingSessionId(null); fetchSessions(); }} />
      )}

      {summarySessionId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 rounded-2xl shadow-xl">
            <h3 className="font-bold text-base text-card-foreground flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-primary" /> Post-Session AI Notes
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Takeaways and smart logs</p>
            {isLoadingSummary ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : (
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 border border-border p-4 rounded-xl">{summaryText}</p>
            )}
            <button onClick={() => setSummarySessionId(null)} className="w-full mt-4 py-2 bg-muted hover:bg-secondary text-xs font-bold text-foreground rounded-xl border border-border">
              Close Notes
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
