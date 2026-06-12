'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, fadeIn, scaleIn, stagger, staggerFast, cardHover, tap, pageVariants } from '@/lib/motion';
import api from '@/lib/api';
import CoinDisplay from '@/components/shared/CoinDisplay';
import RankBadge from '@/components/shared/RankBadge';
import { Trophy, Loader2, Star, Flame, Award } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('all-time');
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadLeaderboard() {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'all-time' ? '/leaderboard' : '/leaderboard/weekly';
      const { data } = await api.get(endpoint);
      setLeaders(data.data || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadLeaderboard(); }, [activeTab]);

  const isWeekly = activeTab === 'weekly';

  const getUserData = (leader) => {
    const userObj = isWeekly ? leader.user : leader;
    return {
      userObj,
      name: userObj?.name || 'Knorvex Peer',
      avatar: userObj?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userObj?._id || userObj?.name}`,
      rank: userObj?.rank || 'Beginner',
      score: isWeekly ? userObj?.rankScore : leader.rankScore,
      avgRating: userObj?.avgRating || 0,
      sessionsCount: isWeekly ? leader.weeklySessionsTaught : (leader.totalSessionsTaught || 0),
    };
  };

  const getPodiumClass = (i) => {
    if (i === 0) return 'border-amber-400 bg-amber-500/10 text-amber-400';
    if (i === 1) return 'border-slate-400 bg-slate-500/10 text-slate-400';
    if (i === 2) return 'border-amber-600 bg-amber-700/10 text-amber-600';
    return 'border-border bg-muted/10 text-muted-foreground';
  };

  const getRankBadge = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  // Podium: reorder as 2nd, 1st, 3rd visually
  const podiumOrder = [1, 0, 2];
  const podiumHeights = { 0: 'h-24', 1: 'h-32', 2: 'h-20' };
  const podiumPositions = { 0: 'order-1', 1: 'order-2 -mb-1', 2: 'order-3' };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="show" className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10 text-foreground">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2.5 text-foreground">
            <Trophy className="w-8 h-8 text-amber-400" />
            Skill Leaderboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Top mentors and learners ranking up the barter ecosystem.
          </p>
        </div>

        <div className="flex bg-card border border-border p-1.5 rounded-2xl gap-1">
          {[['all-time', 'All-Time'], ['weekly', 'This Week']].map(([key, label]) => (
            <motion.button key={key} onClick={() => setActiveTab(key)}
              whileTap={tap}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="card p-16 rounded-3xl flex flex-col items-center justify-center min-h-[350px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-xs text-muted-foreground">Loading ranking statistics...</p>
        </div>
      ) : leaders.length === 0 ? (
        <div className="card p-16 rounded-3xl border-dashed text-center flex flex-col items-center justify-center min-h-[350px]">
          <Award className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground">Leaderboard is empty. Host a session to rank first!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Podium for top 3 */}
          {leaders.length >= 3 && (
            <div className="card p-4 sm:p-8 rounded-3xl mb-2 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8 relative z-10">Top Champions</p>
              <motion.div variants={stagger} initial="hidden" animate="show" className="flex items-end justify-center gap-4 relative z-10">
                {podiumOrder.map((i) => {
                  if (!leaders[i]) return null;
                  const { userObj, name, avatar, rank, score, avgRating } = getUserData(leaders[i]);
                  const isFirst = i === 0;
                  return (
                    <motion.div key={i} variants={scaleIn} whileHover={cardHover} className={`flex flex-col items-center gap-2 ${isFirst ? 'order-2' : i === 1 ? 'order-1' : 'order-3'}`}>
                      <div className={`relative ${isFirst ? 'scale-110' : ''}`}>
                        <Link href={`/profile/${userObj?._id}`}>
                          <img src={avatar} alt={name} loading="lazy"
                            className={`rounded-2xl object-cover border-2 bg-muted ${
                              i === 0 ? 'w-16 h-16 border-amber-400' : 'w-12 h-12 border-border'
                            }`}
                          />
                        </Link>
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-lg">{getRankBadge(i)}</span>
                      </div>
                      <div className="text-center mt-3">
                        <Link href={`/profile/${userObj?._id}`} className="text-xs font-bold text-foreground hover:text-primary transition-colors block truncate max-w-[80px]">
                          {name.split(' ')[0]}
                        </Link>
                        <div className="mt-1"><RankBadge rank={rank} small /></div>
                        <div className="flex items-center gap-0.5 justify-center mt-1">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-current" />
                          <span className="text-[10px] text-muted-foreground font-mono">{avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                      {/* Podium plinth */}
                      <div className={`w-20 rounded-t-xl flex items-center justify-center border-t border-x border-primary/15 bg-primary/8 ${
                        i === 0 ? 'h-24' : i === 1 ? 'h-16' : 'h-12'
                      }`}>
                        <span className="font-mono font-black text-primary text-sm">{score}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden rounded-3xl overflow-x-auto">
            <div className="grid grid-cols-12 px-4 sm:px-6 py-4 bg-muted/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider min-w-[500px]">
              <div className="col-span-2 md:col-span-1 text-center">Rank</div>
              <div className="col-span-6 md:col-span-5">Member</div>
              <div className="col-span-4 md:col-span-3 text-center">Rank Tier</div>
              <div className="hidden md:block md:col-span-2 text-center">Avg Rating</div>
              <div className="col-span-2 md:col-span-1 text-right">{isWeekly ? 'Sessions' : 'Points'}</div>
            </div>

            <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col divide-y divide-border min-w-[500px]">
              {leaders.map((leader, index) => {
                const { userObj, name, avatar, rank, score, avgRating, sessionsCount } = getUserData(leader);
                return (
                  <motion.div key={index}
                    variants={fadeUp}
                    className={`grid grid-cols-12 px-4 sm:px-6 py-4 items-center transition-colors ${
                      index < 3 ? 'hover:bg-amber-500/5' : 'hover:bg-muted/20'
                    }`}>
                    <div className="col-span-2 md:col-span-1 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-[11px] font-bold ${getPodiumClass(index)}`}>
                        {getRankBadge(index)}
                      </span>
                    </div>

                    <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                      <Link href={`/profile/${userObj?._id}`}>
                        <img src={avatar} alt={name} className="w-9 h-9 rounded-xl object-cover bg-muted border border-border" loading="lazy" />
                      </Link>
                      <div className="flex flex-col min-w-0">
                        <Link href={`/profile/${userObj?._id}`} className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate">
                          {name}
                        </Link>
                        {isWeekly && <span className="text-[9px] text-muted-foreground mt-0.5 font-mono">pts: {score}</span>}
                      </div>
                    </div>

                    <div className="col-span-4 md:col-span-3 flex justify-center">
                      <RankBadge rank={rank} small />
                    </div>

                    <div className="hidden md:flex md:col-span-2 justify-center items-center gap-1 text-xs text-amber-400 font-bold font-mono">
                      <Star className="w-3 h-3 fill-current" />
                      {avgRating.toFixed(1)}
                    </div>

                    <div className="col-span-2 md:col-span-1 text-right font-mono font-bold text-xs">
                      {isWeekly ? (
                        <span className="text-emerald-500 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <Flame className="w-3 h-3" />{sessionsCount}
                        </span>
                      ) : (
                        <span className="text-primary">{score}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
