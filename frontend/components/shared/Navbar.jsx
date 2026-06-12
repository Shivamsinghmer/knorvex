'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/authStore';
import useCoinStore from '@/store/coinStore';
import CoinDisplay from './CoinDisplay';
import RankBadge from './RankBadge';
import Avatar from './Avatar';
import {
  Compass, Newspaper, CalendarDays, MessageCircle, Trophy,
  LogOut, User, ChevronDown, Menu, X, HelpCircle
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/discover',    label: 'Discover',  icon: Compass },
  { href: '/feed',        label: 'Feed',       icon: Newspaper },
  { href: '/sessions',    label: 'Sessions',   icon: CalendarDays },
  { href: '/messages',    label: 'Messages',   icon: MessageCircle },
  { href: '/requests',    label: 'Requests',   icon: HelpCircle },
  { href: '/leaderboard', label: 'Ranks',      icon: Trophy },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, fetchMe, updateUser } = useAuthStore();
  const { balance } = useCoinStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Refresh user data once per browser session (not on every mount/navigation)
  useEffect(() => {
    if (!user) return;
    const key = 'knorvex_me_ts';
    const last = parseInt(sessionStorage.getItem(key) || '0', 10);
    if (Date.now() - last < 5 * 60 * 1000) return;
    fetchMe().catch(() => {});
    sessionStorage.setItem(key, Date.now().toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for coin credit events to immediately update navbar balance (e.g. host receives coins at booking)
  useEffect(() => {
    if (!user) return;
    const userId = user.id || user._id;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socket.on('connect', () => socket.emit('join', { userId }));
    socket.on('coins:credited', ({ newBalance }) => {
      updateUser({ skillCoinBalance: newBalance });
    });
    return () => {
      socket.off('coins:credited');
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id || user?._id]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const coinBalance = user?.skillCoinBalance ?? balance;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
      scrolled
        ? 'bg-card/95 backdrop-blur-xl border-b border-border shadow-sm'
        : 'bg-card/90 backdrop-blur-md border-b border-border/60'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4" style={{ height: '72px' }}>

        {/* Logo */}
        <Link href={user ? '/discover' : '/'} className="flex-shrink-0">
          <img
            src="/logo-dark.png"
            alt="Knorvex"
            className="h-14 sm:h-16 w-auto max-w-[220px] object-contain"
          />
        </Link>

        {/* Desktop nav links */}
        {user && (
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'text-primary bg-primary/8'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                  }`}>
                  <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <div className="hidden sm:block">
                <CoinDisplay amount={coinBalance} />
              </div>

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/70 transition-all"
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}>
                  <Avatar
                    src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user._id || user.id}`}
                    name={user.name}
                    className="w-7 h-7 rounded-full"
                  />
                  <span className="text-[13px] font-semibold hidden sm:block text-foreground max-w-[80px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={13} className={`text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 w-56 rounded-2xl overflow-hidden z-50 animate-scale-in card-elevated border border-border">
                    <div className="px-4 py-3.5 border-b border-border bg-muted/30">
                      <p className="text-sm font-bold text-card-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{user.email}</p>
                      <div className="mt-2"><RankBadge rank={user.rank} small /></div>
                    </div>
                    <div className="p-1.5 flex flex-col gap-0.5">
                      <Link href={`/profile/${user._id}`}
                        onMouseDown={(e) => e.preventDefault()}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted rounded-xl transition-colors">
                        <User size={14} className="text-muted-foreground" /> My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        onMouseDown={(e) => e.preventDefault()}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm w-full text-left text-destructive hover:bg-destructive/8 rounded-xl transition-colors">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted/70"
                onClick={() => setMobileOpen((v) => !v)}>
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost text-sm" style={{ padding: '7px 16px', fontSize: '13px' }}>Sign In</Link>
              <Link href="/register" className="btn-primary text-sm" style={{ padding: '7px 16px', fontSize: '13px' }}>Get Started</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="p-2 flex flex-col gap-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                  pathname.startsWith(href) ? 'text-primary bg-primary/8' : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}>
                <Icon size={16} /> {label}
              </Link>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border">
            <CoinDisplay amount={coinBalance} />
          </div>
        </div>
      )}
    </nav>
  );
}
