'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useSessionStore from '@/store/sessionStore';
import useCoinStore from '@/store/coinStore';
import api from '@/lib/api';
import CoinDisplay from '@/components/shared/CoinDisplay';
import { Calendar, User, BookOpen, Clock, Loader2, Sparkles, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, fadeRight, stagger, tap, pageVariants } from '@/lib/motion';

export default function BookSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserParam = searchParams.get('user');
  const targetSkillParam = searchParams.get('skill');

  const { user: currentUser } = useAuthStore();
  const { bookSession } = useSessionStore();
  const fetchBalance = useCoinStore((s) => s.fetchBalance);

  const [peers, setPeers] = useState([]);
  const [selectedPeerId, setSelectedPeerId] = useState('');
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [peerSkills, setPeerSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);

  const [isLoadingPeers, setIsLoadingPeers] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPeers() {
      setIsLoadingPeers(true);
      try {
        const { data } = await api.get('/users');
        const list = data.data || [];
        const filteredList = list.filter((u) => u._id !== currentUser?.id && u._id !== currentUser?._id);
        setPeers(filteredList);
      } catch (err) {
        console.error('Failed to load peers:', err);
      } finally {
        setIsLoadingPeers(false);
      }
    }

    if (!targetUserParam) loadPeers();
  }, [targetUserParam, currentUser]);

  useEffect(() => {
    const peerIdToLoad = targetUserParam || selectedPeerId;
    if (!peerIdToLoad) {
      setSelectedPeer(null);
      setPeerSkills([]);
      return;
    }

    async function loadPeerDetails() {
      setIsLoadingDetails(true);
      setError('');
      try {
        const { data } = await api.get(`/users/${peerIdToLoad}`);
        const resolvedUser = data.data?.user;
        const resolvedSkills = data.data?.skills || [];

        setSelectedPeer(resolvedUser);
        const teachSkills = resolvedSkills.filter((s) => s.direction === 'teach');
        setPeerSkills(teachSkills);

        if (targetSkillParam && teachSkills.some((s) => s.name === targetSkillParam)) {
          setSelectedSkill(targetSkillParam);
        } else if (teachSkills.length > 0) {
          setSelectedSkill(teachSkills[0].name);
        } else {
          setSelectedSkill('');
        }
      } catch (err) {
        console.error('Failed to resolve peer details:', err);
        setError('Could not fetch skills for the selected user.');
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadPeerDetails();
  }, [targetUserParam, selectedPeerId, targetSkillParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPeer) { setError('Please select a partner.'); return; }
    if (!selectedSkill) { setError('Please select a skill topic.'); return; }
    if (!date || !time) { setError('Please schedule the date and time.'); return; }

    const scheduledAt = new Date(`${date}T${time}`);
    if (scheduledAt <= new Date()) { setError('Scheduled time must be in the future.'); return; }

    const walletBalance = currentUser?.skillCoinBalance || 0;
    if (walletBalance < 10) { setError('Insufficient SkillCoins. You need at least 10 SC to book a peer session.'); return; }

    setIsSubmitting(true);
    setError('');

    try {
      await bookSession({
        hostId: selectedPeer._id || selectedPeer.id,
        skillTag: selectedSkill,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: parseInt(duration),
      });
      await fetchBalance();
      router.push('/sessions');
    } catch (err) {
      console.error('Failed to book session:', err);
      setError(err.response?.data?.message || 'Failed to request session. The slot may be unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="show" className="max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-10 text-foreground relative">
      {/* Background glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[200px] h-[200px] rounded-full bg-chart-2/5 blur-[80px] pointer-events-none" />

      {/* Page header */}
      <motion.div variants={fadeUp} className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary mb-3">
          <Sparkles className="w-3.5 h-3.5" /> New Exchange
        </span>
        <h1 className="text-2xl font-black text-foreground">Schedule a Session</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a partner, pick a skill, and lock in a time.</p>
      </motion.div>

      {/* Peer preview card (when peer is selected) */}
      {selectedPeer && (
        <motion.div variants={fadeUp} className="card rounded-2xl p-4 mb-5 flex items-center gap-4 border-primary/15 bg-primary/5 relative z-10 overflow-hidden">
          <div className="h-0.5 absolute top-0 inset-x-0 bg-gradient-to-r from-primary via-chart-2 to-transparent" />
          <img
            src={selectedPeer.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedPeer._id}`}
            alt={selectedPeer.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-primary/20 bg-muted flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground truncate">{selectedPeer.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Teaching: <span className="text-primary font-bold">{selectedSkill || 'Select a skill below'}</span></p>
          </div>
          <Zap className="w-5 h-5 text-primary/40 flex-shrink-0" />
        </motion.div>
      )}

      <motion.div variants={fadeRight} className="card rounded-3xl relative z-10 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-violet-500" />

        <div className="p-5 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <motion.form onSubmit={handleSubmit} variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
            <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Partner User</label>
              {targetUserParam ? (
                <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {isLoadingDetails ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading profile…</span>
                  ) : selectedPeer ? (
                    <span className="text-xs text-foreground font-bold">{selectedPeer.name}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Loading details…</span>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <select
                    value={selectedPeerId}
                    onChange={(e) => setSelectedPeerId(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl pl-11 pr-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold"
                  >
                    <option value="">Select a partner peer…</option>
                    {peers.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Skill to Learn</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  disabled={isLoadingDetails || peerSkills.length === 0}
                  className="w-full bg-background border border-input rounded-xl pl-11 pr-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold disabled:opacity-50"
                >
                  {isLoadingDetails ? (
                    <option>Loading peer skills…</option>
                  ) : peerSkills.length === 0 ? (
                    <option>No skills listed by peer</option>
                  ) : (
                    peerSkills.map((s) => (
                      <option key={s._id} value={s.name}>{s.name} ({s.level})</option>
                    ))
                  )}
                </select>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duration</label>
              <div className="relative">
                <Clock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl pl-11 pr-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes</option>
                  <option value={90}>90 Minutes</option>
                </select>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl bg-primary/5 border border-primary/20 overflow-hidden">
              <div className="flex justify-between items-center p-4">
                <div>
                  <span className="text-xs font-black text-foreground block">Booking Fee</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">10 SC deducted now · returned if session is cancelled</span>
                </div>
                <CoinDisplay amount={10} size="sm" showLabel />
              </div>
            </motion.div>

            <motion.button
              variants={fadeUp}
              whileTap={tap}
              type="submit"
              disabled={isSubmitting || isLoadingDetails}
              className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting request…</>
              ) : (
                <><Calendar className="w-4 h-4" /><span>Confirm & Request Session</span><ArrowRight className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1" /></>
              )}
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </motion.div>
  );
}
