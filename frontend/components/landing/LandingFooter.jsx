import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="relative z-10 py-14 border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center">
                <Zap size={12} className="text-primary-foreground fill-primary-foreground" />
              </div>
              <span className="font-black text-foreground tracking-tight text-lg">Knorvex</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Peer-to-peer skill exchange for Indian students and professionals. Barter knowledge, earn coins, grow together.
            </p>
            <p className="text-[11px] text-muted-foreground mt-4">© 2026 Knorvex · Built for DevQBX Arena</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-14 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-1">Platform</span>
              <Link href="/discover"    className="hover:text-foreground transition-colors">Discover</Link>
              <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
              <Link href="/sessions"    className="hover:text-foreground transition-colors">Sessions</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-1">Legal</span>
              <Link href="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Terms of Exchange</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
