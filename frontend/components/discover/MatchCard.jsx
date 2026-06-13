'use client';

import { memo } from 'react';
import Link from 'next/link';
import RankBadge from '@/components/shared/RankBadge';
import SkillTag from '@/components/shared/SkillTag';
import { Sparkles, Calendar, MessageCircle, ArrowUpRight } from 'lucide-react';

function MatchCard({ match }) {
  const { user, skills = [], compatibilityScore = 0, score = 0, reason = '' } = match;
  const displayScore = compatibilityScore || score;
  const userId = user?._id || user?.id || 'unknown';
  const name = user?.name || 'Knorvex User';
  const avatar = user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`;
  const rank = user?.rank || 'Beginner';
  const bio = user?.aiSummary || user?.bio || 'An eager learner and mentor on Knorvex.';

  const teachSkills = skills.filter(s => s.direction === 'teach');
  const learnSkills  = skills.filter(s => s.direction === 'learn');

  /* Score color band */
  const scoreConfig =
    displayScore >= 80 ? { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' } :
    displayScore >= 55 ? { bar: 'bg-primary',    text: 'text-primary',                            bg: 'bg-primary/8',                           border: 'border-primary/20' } :
                         { bar: 'bg-muted-foreground', text: 'text-muted-foreground',              bg: 'bg-muted/50',                            border: 'border-border' };

  return (
    <div className="group card hover-glow flex flex-col rounded-2xl overflow-hidden transition-all duration-200 relative">

      {/* ── Score bar (top accent) ── */}
      <div className="h-1 w-full bg-border">
        <div
          className={`h-full ${scoreConfig.bar} transition-all duration-700`}
          style={{ width: `${Math.max(displayScore, 4)}%` }}
        />
      </div>

      {/* ── Header: avatar + name + score badge ── */}
      <div className="px-5 pt-5 pb-4 flex items-start gap-4">
        <Link href={`/profile/${userId}`} className="flex-shrink-0 relative">
          <img
            src={avatar}
            alt={name}
            className="w-16 h-16 rounded-2xl object-cover bg-muted border-2 border-border group-hover:border-primary/30 transition-colors"
            loading="lazy"
          />
          {/* Online dot placeholder */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-card" />
        </Link>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/profile/${userId}`}
                className="font-black text-base text-card-foreground hover:text-primary transition-colors leading-tight block truncate"
              >
                {name}
              </Link>
              <span className="text-[11px] text-muted-foreground font-mono">@{name.split(' ')[0].toLowerCase()}</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl border flex-shrink-0 ${scoreConfig.text} ${scoreConfig.bg} ${scoreConfig.border}`}>
              <Sparkles className="w-2.5 h-2.5" />
              {displayScore}%
            </span>
          </div>
          <div className="mt-1.5">
            <RankBadge rank={rank} small />
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-border" />

      {/* ── Body ── */}
      <div className="px-5 pt-4 pb-5 flex flex-col gap-4 flex-1">

        {/* Bio */}
        <p className="text-muted-foreground text-[13px] leading-relaxed line-clamp-2">
          {bio}
        </p>

        {/* AI reason */}
        {reason && (
          <div className="flex gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/12">
            <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-foreground leading-relaxed">{reason}</p>
          </div>
        )}

        {/* Skills */}
        <div className="flex flex-col gap-3 flex-1">
          {teachSkills.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Can Teach
              </p>
              <div className="flex flex-wrap gap-1.5">
                {teachSkills.slice(0, 4).map((skill, i) => (
                  <Link key={i} href={`/sessions/book?user=${userId}&skill=${encodeURIComponent(skill.name)}`}>
                    <SkillTag name={skill.name} direction="teach" level={skill.level} />
                  </Link>
                ))}
                {teachSkills.length > 4 && (
                  <span className="badge badge-muted text-[10px]">+{teachSkills.length - 4}</span>
                )}
              </div>
            </div>
          )}
          {learnSkills.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-2 inline-block" />
                Wants to Learn
              </p>
              <div className="flex flex-wrap gap-1.5">
                {learnSkills.slice(0, 3).map((skill, i) => (
                  <SkillTag key={i} name={skill.name} direction="learn" level={skill.level} />
                ))}
                {learnSkills.length > 3 && (
                  <span className="badge badge-muted text-[10px]">+{learnSkills.length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="px-5 pb-5 flex gap-2">
        <Link href={`/sessions/book?user=${userId}`} className="flex-1">
          <button className="btn-primary w-full py-2.5 rounded-xl text-[13px] font-bold gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Book Session
          </button>
        </Link>
        <Link
          href={`/profile/${userId}`}
          className="w-10 h-10 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center transition-all text-muted-foreground hover:text-primary"
          title="View Profile"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
        <Link
          href={`/messages?user=${userId}`}
          className="w-10 h-10 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center transition-all text-muted-foreground hover:text-primary"
          title="Message"
        >
          <MessageCircle className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default memo(MatchCard);
