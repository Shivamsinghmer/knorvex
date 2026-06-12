'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useSessionStore from '@/store/sessionStore';
import api from '@/lib/api';
import CoinDisplay from '@/components/shared/CoinDisplay';
import { Calendar, User, BookOpen, Clock, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

export default function BookSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserParam = searchParams.get('user');
  const targetSkillParam = searchParams.get('skill');

  const { user: currentUser } = useAuthStore();
  const { bookSession } = useSessionStore();

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
      router.push('/sessions');
    } catch (err) {
      console.error('Failed to book session:', err);
      setError(err.response?.data?.message || 'Failed to request session. The slot may be unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-12 text-foreground relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="card p-5 sm:p-8 rounded-3xl relative z-10">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Book Session
          </span>
          <h2 className="text-2xl font-black text-card-foreground">Schedule an Exchange</h2>
          <p className="text-xs text-muted-foreground mt-1">Specify date, time, and topic to submit a request.</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Partner User</label>
            {targetUserParam ? (
              <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3">
                <User className="w-4 h-4 text-muted-foreground" />
                {isLoadingDetails ? (
                  <span className="text-xs text-muted-foreground">Loading user profile...</span>
                ) : selectedPeer ? (
                  <span className="text-xs text-foreground font-bold">{selectedPeer.name}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Loading details...</span>
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
                  <option value="">Select a partner peer...</option>
                  {peers.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Skill Topic to Learn</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                disabled={isLoadingDetails || peerSkills.length === 0}
                className="w-full bg-background border border-input rounded-xl pl-11 pr-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold disabled:opacity-50"
              >
                {isLoadingDetails ? (
                  <option>Loading peer skills...</option>
                ) : peerSkills.length === 0 ? (
                  <option>No skills listed by peer</option>
                ) : (
                  peerSkills.map((s) => (
                    <option key={s._id} value={s.name}>{s.name} ({s.level})</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Duration (Minutes)</label>
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
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-foreground block">Booking Fee</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Transferred after completion</span>
            </div>
            <CoinDisplay amount={10} size="sm" showLabel />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingDetails}
            className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting request...</>
            ) : (
              <><Calendar className="w-4 h-4" /><span>Confirm & Request Session</span></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
