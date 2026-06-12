'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import MatchCard from '@/components/discover/MatchCard';
import CoinDisplay from '@/components/shared/CoinDisplay';
import RankBadge from '@/components/shared/RankBadge';
import { fadeUp, fadeIn, scaleIn, stagger, staggerFast, cardHover, tap, pageVariants } from '@/lib/motion';
import {
  Sparkles, Loader2, RefreshCw, Layers, Compass,
  ArrowUpRight, ArrowRight, Zap, Users, TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function DiscoverPage() {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [rankedRequests, setRankedRequests] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [matchError, setMatchError] = useState('');
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);

  async function loadMatches() {
    try {
      setIsLoadingMatches(true);
      setMatchError('');
      const { data } = await api.get('/ai/matches');
      setMatches(data.data || []);
    } catch (err) {
      console.error('Failed to load matches:', err);
      setMatchError('Could not compute AI matches. Check your skill settings or try again.');
    } finally {
      setIsLoadingMatches(false);
    }
  }

  async function loadRankedRequests() {
    try {
      setIsLoadingRequests(true);
      const { data } = await api.get('/ai/request-board');
      setRankedRequests(data.data?.slice(0, 5) || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadMatches();
    loadRankedRequests();
  }, [user?._id]);

  const handleRegenerateSummary = async () => {
    setIsRegeneratingSummary(true);
    try {
      await api.post('/ai/profile-summary');
      await loadMatches();
    } catch (err) {
      console.error('Failed to regenerate bio summary:', err);
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="show" className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-10 text-foreground">

      {/* ── Page header ── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Compass className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">AI-Powered</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Discover Peers</h1>
          <p className="text-sm text-muted-foreground mt-1">Smart recommendations based on your teach &amp; learn profile.</p>
        </div>

        {/* Stats pill */}
        <div className="flex items-stretch gap-px rounded-2xl overflow-hidden border border-border bg-card shadow-xs w-full sm:w-auto">
          <div className="flex flex-1 sm:flex-none flex-col items-center justify-center px-4 sm:px-5 py-3 bg-card">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Balance</span>
            <CoinDisplay amount={user?.skillCoinBalance || 0} size="sm" showLabel />
          </div>
          <div className="w-px bg-border" />
          <div className="flex flex-1 sm:flex-none flex-col items-center justify-center px-4 sm:px-5 py-3 bg-card">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Rank</span>
            <RankBadge rank={user?.rank || 'Beginner'} small />
          </div>
          <div className="w-px bg-border" />
          <div className="flex flex-1 sm:flex-none flex-col items-center justify-center px-4 sm:px-5 py-3 bg-card">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Matches</span>
            <span className="font-black text-sm text-primary font-mono">{isLoadingMatches ? '—' : matches.length}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* ── Left: Matches ── */}
        <div className="flex flex-col gap-5">

          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-base font-black text-foreground">Top AI Matches</h2>
              {!isLoadingMatches && matches.length > 0 && (
                <span className="badge badge-primary text-[10px] ml-1">{matches.length} found</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerateSummary}
                disabled={isRegeneratingSummary}
                className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground border border-border bg-card hover:bg-muted/70 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRegeneratingSummary ? 'animate-spin text-primary' : ''}`} />
                Regen Bio
              </button>
              <button
                onClick={loadMatches}
                disabled={isLoadingMatches}
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingMatches ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Match states */}
          {isLoadingMatches ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-1 bg-border" />
                  <div className="p-5 flex gap-4">
                    <div className="w-16 h-16 rounded-2xl shimmer" />
                    <div className="flex-1 flex flex-col gap-2 pt-1">
                      <div className="h-4 w-3/4 shimmer rounded" />
                      <div className="h-3 w-1/2 shimmer rounded" />
                      <div className="h-5 w-16 shimmer rounded-full" />
                    </div>
                  </div>
                  <div className="px-5 pb-4 flex flex-col gap-3">
                    <div className="h-3 shimmer rounded w-full" />
                    <div className="h-3 shimmer rounded w-4/5" />
                    <div className="flex gap-1.5 mt-1">
                      <div className="h-5 w-20 shimmer rounded-full" />
                      <div className="h-5 w-16 shimmer rounded-full" />
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <div className="h-9 shimmer rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : matchError ? (
            <div className="card p-10 rounded-2xl border-destructive/15 bg-destructive/5 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-bold text-destructive">{matchError}</p>
                <p className="text-xs text-muted-foreground mt-1">Make sure you have at least one teach and one learn skill.</p>
              </div>
              <button onClick={loadMatches} className="btn-primary px-6 py-2.5 rounded-xl text-xs">
                Try Again
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="card p-12 rounded-2xl border-dashed text-center flex flex-col items-center gap-4 min-h-[280px] justify-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                <Users className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">No matches yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Try expanding your Teach and Learn skills to find compatible peers.
                </p>
              </div>
              <Link href={`/profile/${user?._id}`}>
                <button className="btn-primary px-6 py-2.5 rounded-xl text-xs">
                  Edit Skill Profile
                </button>
              </Link>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {matches.map((match, idx) => (
                <motion.div variants={fadeUp} key={idx}>
                  <MatchCard match={match} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-5">

          {/* Matched requests */}
          <motion.div variants={scaleIn} whileHover={cardHover} className="card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-black text-sm text-card-foreground">Open Requests</h3>
              </div>
              <Link href="/requests" className="flex items-center gap-0.5 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors">
                All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-3 flex flex-col gap-2">
              {isLoadingRequests ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                </div>
              ) : rankedRequests.length === 0 ? (
                <div className="text-center py-8 px-2">
                  <p className="text-xs text-muted-foreground italic">No matching requests right now.</p>
                  <Link href="/requests" className="mt-2 inline-block text-xs font-bold text-primary">
                    Post one yourself →
                  </Link>
                </div>
              ) : (
                <motion.div variants={staggerFast} initial="hidden" animate="show" className="contents">
                {rankedRequests.map((req) => {
                  const reqUser = req.userId || {};
                  const urgencyClass =
                    req.urgency === 'High' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    req.urgency === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                    'bg-muted/50 text-muted-foreground border-border';

                  return (
                    <motion.div variants={fadeUp} key={req._id} className="p-3.5 rounded-xl bg-background border border-border hover:border-primary/25 hover:bg-primary/5 transition-all group cursor-default">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={reqUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${reqUser._id || reqUser.name}`}
                            alt={reqUser.name}
                            className="w-6 h-6 rounded-lg object-cover bg-muted flex-shrink-0"
                          />
                          <span className="text-[11px] font-bold text-card-foreground truncate">{reqUser.name}</span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${urgencyClass}`}>
                          {req.urgency}
                        </span>
                      </div>

                      <p className="text-[12px] font-semibold text-foreground leading-snug mb-1">{req.title}</p>
                      <span className="inline-block text-[10px] text-primary font-mono bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-lg">
                        {req.skillName}
                      </span>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                          <Zap className="w-3 h-3 text-primary" />
                          {req.coinOffer} SC reward
                        </div>
                        <Link
                          href={`/sessions/book?user=${reqUser._id || reqUser.id}&skill=${encodeURIComponent(req.skillName)}`}
                          className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                        >
                          Teach <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Quick guide */}
          <motion.div variants={scaleIn} whileHover={cardHover} className="card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-black text-sm text-card-foreground flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Barter Quick Guide
              </h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                { icon: '📚', text: 'List at least one Teach skill to unlock matches.' },
                { icon: '💰', text: '10 SkillCoins per standard session. You start with 100.' },
                { icon: '⭐', text: 'Submit a rating post-session to release coin transfers.' },
                { icon: '🏆', text: 'Teach more to climb the weekly leaderboard.' },
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{tip.icon}</span>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
