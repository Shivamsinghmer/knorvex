'use client';
import { CheckCircle2, MessageSquare, Sparkles, Video, XCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { scaleIn, cardHover, tap } from '@/lib/motion';
import CoinDisplay from '@/components/shared/CoinDisplay';

const statusCls = (status) => {
  if (status === 'active') return 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/20 dark:bg-emerald-500/5';
  if (status === 'confirmed') return 'text-primary border-primary/20 bg-primary/5';
  if (status === 'pending') return 'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-500/20 dark:bg-amber-500/5';
  if (status === 'pending_rating') return 'text-violet-600 border-violet-200 bg-violet-50 dark:text-violet-400 dark:border-violet-500/20 dark:bg-violet-500/5';
  if (status === 'completed') return 'text-muted-foreground border-border bg-muted/30';
  if (status === 'cancelled') return 'text-destructive border-destructive/20 bg-destructive/5';
  return 'text-muted-foreground border-border bg-muted/30';
};

export default function SessionCard({ session, currentUserId, onConfirm, onCancel, onOpenSummary, onRate }) {
  const isHost = session.hostId?._id === currentUserId;
  const partner = isHost ? session.learnerId : session.hostId;
  const partnerName = partner?.name || 'Knorvex Peer';
  const partnerAvatar = partner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partner?._id || partnerName}`;
  const hasRated = isHost ? session.hostRated : session.learnerRated;
  const requiresRating = (session.status === 'completed' || session.status === 'pending_rating') && !hasRated;

  return (
    <motion.div variants={scaleIn} whileHover={cardHover} className="card hover-glow p-6 rounded-2xl flex flex-col gap-4">
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
            <motion.button whileTap={tap} onClick={() => onConfirm(session._id)} className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve Request
            </motion.button>
            <motion.button whileTap={tap} onClick={() => onCancel(session._id)} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5">
              <XCircle className="w-4 h-4" />
            </motion.button>
          </>
        )}
        {session.status === 'pending' && !isHost && (
          <motion.button whileTap={tap} onClick={() => onCancel(session._id)} className="flex-1 py-2 rounded-xl border border-border text-muted-foreground hover:text-destructive text-xs font-bold">
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
            <motion.button whileTap={tap} onClick={() => onCancel(session._id)} className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground text-xs font-semibold">
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
          <motion.button whileTap={tap} onClick={() => onRate(session._id)} className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Submit Rating & Complete
          </motion.button>
        )}
        {(session.status === 'completed' || session.status === 'pending_rating') && !requiresRating && (
          <motion.button whileTap={tap} onClick={() => onOpenSummary(session._id)} className="flex-1 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-primary" /> View AI Summary
          </motion.button>
        )}
        {session.status === 'cancelled' && (
          <span className="text-xs text-muted-foreground italic py-1 leading-relaxed">
            Cancelled {session.cancelledBy === currentUserId ? 'by you' : 'by peer'}. Reason: {session.cancelReason || 'None'}
          </span>
        )}
      </div>
    </motion.div>
  );
}
