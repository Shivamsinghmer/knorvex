import { getRankClass } from '@/lib/utils';

const RANK_EMOJI = {
  Beginner: '🌱',
  Explorer: '🔭',
  Mentor: '🎓',
  Expert: '⚡',
  Legend: '👑',
};

export default function RankBadge({ rank = 'Beginner', small = false, showEmoji = true }) {
  const rankClass = getRankClass(rank);

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold text-white rounded-full ${rankClass} ${
        small ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
      {showEmoji && <span>{RANK_EMOJI[rank]}</span>}
      {rank}
    </span>
  );
}
