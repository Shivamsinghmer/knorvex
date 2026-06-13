'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import useCoinStore from '@/store/coinStore';
import { useSocket } from '@/context/SocketContext';
import RankBadge from './RankBadge';
import Avatar from './Avatar';
import RadialGlowButton from './RadialGlowButton';
import {
  Compass, Newspaper, CalendarDays, MessageCircle, Trophy,
  LogOut, User, ChevronDown, Menu, X, HelpCircle,
  Zap,
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
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout, fetchMe, updateUser } = useAuthStore();
  const { balance }                            = useCoinStore();
  const { socketRef, version }                 = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const key  = 'knorvex_me_ts';
    const last = parseInt(sessionStorage.getItem(key) || '0', 10);
    if (Date.now() - last < 5 * 60 * 1000) return;
    fetchMe().catch(() => {});
    sessionStorage.setItem(key, Date.now().toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !user) return;
    const onCredited = ({ newBalance }) => updateUser({ skillCoinBalance: newBalance });
    const onDebited  = ({ newBalance }) => updateUser({ skillCoinBalance: newBalance });
    socket.on('coins:credited', onCredited);
    socket.on('coins:debited',  onDebited);
    return () => {
      socket.off('coins:credited', onCredited);
      socket.off('coins:debited',  onDebited);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, user?.id || user?._id]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const coinBalance = user?.skillCoinBalance ?? balance;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-200"
      style={{
        background: scrolled ? 'rgba(10,10,10,0.96)' : 'rgba(10,10,10,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? '0 1px 24px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: '72px' }}>

        {/* ── Logo ── */}
        <Link href={user ? '/discover' : '/'} className="flex-shrink-0 flex items-center">
          <img
            src="/logo-dark.png"
            alt="Knorvex"
            className="h-25 w-auto object-contain"
            style={{ maxWidth: '160px' }}
          />
        </Link>

        {/* ── Desktop nav links ── */}
        {user && (
          <div className="hidden md:flex items-center" style={{ gap: '2px' }}>
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors duration-150"
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                    borderRadius: '8px',
                    background: isActive ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--foreground)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                >
                  {label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2"
                      style={{
                        width: '16px', height: '2px',
                        background: 'var(--primary)',
                        borderRadius: '99px',
                        bottom: '2px',
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Right section ── */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Coins pill + Upgrade — hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Coin pill */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="var(--primary)" opacity="0.12" />
                    <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.5" />
                    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--primary)" fontFamily="monospace">S</text>
                  </svg>
                  <span
                    className="font-bold text-primary"
                    style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                  >
                    {coinBalance ?? 0}
                  </span>
                </div>

                {/* Upgrade button */}
                <Link href="/upgrade" tabIndex={-1}>
                  <RadialGlowButton style={{ padding: '6px 14px', fontSize: '11px' }}>
                    <Zap size={10} /> Upgrade
                  </RadialGlowButton>
                </Link>
              </div>

              {/* Vertical separator */}
              <div
                className="hidden sm:block w-px h-6 mx-1 flex-shrink-0"
                style={{ background: 'var(--border)' }}
              />

              {/* User avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                  className="flex items-center gap-2 rounded-lg transition-colors duration-150"
                  style={{
                    padding: '5px 10px 5px 5px',
                    border: '1px solid var(--border)',
                    background: dropdownOpen ? 'var(--muted)' : 'var(--card)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                  onMouseLeave={e => { if (!dropdownOpen) e.currentTarget.style.background = 'var(--card)'; }}
                >
                  <Avatar
                    src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user._id || user.id}`}
                    name={user.name}
                    className="w-7 h-7 rounded-full flex-shrink-0"
                  />
                  <span className="hidden sm:block text-[13px] font-semibold text-foreground max-w-[72px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown
                    size={12}
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{
                      color: 'var(--muted-foreground)',
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-11 w-56 z-50 animate-scale-in overflow-hidden"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    {/* User info header */}
                    <div
                      className="px-4 py-3"
                      style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}
                    >
                      <p className="text-[13px] font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <RankBadge rank={user.rank} small />
                        {/* Coin balance in dropdown for mobile */}
                        <div className="flex items-center gap-1 sm:hidden">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.5" />
                            <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--primary)" fontFamily="monospace">S</text>
                          </svg>
                          <span className="text-[11px] font-bold text-primary font-mono">{coinBalance ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5 flex flex-col gap-0.5">
                      <Link
                        href={`/profile/${user._id}`}
                        onMouseDown={e => e.preventDefault()}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-xl transition-colors duration-150"
                        style={{ color: 'var(--foreground)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <User size={13} style={{ color: 'var(--muted-foreground)' }} />
                        My Profile
                      </Link>
                      <Link
                        href="/upgrade"
                        onMouseDown={e => e.preventDefault()}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-xl transition-colors duration-150 sm:hidden"
                        style={{ color: 'var(--primary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 8%, transparent)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Zap size={13} />
                        Upgrade
                      </Link>
                      <button
                        onClick={handleLogout}
                        onMouseDown={e => e.preventDefault()}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] w-full text-left rounded-xl transition-colors duration-150"
                        style={{ color: 'var(--destructive)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--destructive) 8%, transparent)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={13} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg transition-colors duration-150"
                style={{ color: 'var(--muted-foreground)' }}
                onClick={() => setMobileOpen(v => !v)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost" style={{ padding: '8px 18px', fontSize: '13px' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {user && mobileOpen && (
        <div
          className="md:hidden animate-fade-in"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
        >
          <div className="px-3 py-2 flex flex-col gap-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors duration-150"
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                    background: isActive ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                  }}
                >
                  <Icon size={15} /> {label}
                </Link>
              );
            })}
          </div>
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="var(--primary)" opacity="0.12" />
                <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.5" />
                <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--primary)" fontFamily="monospace">S</text>
              </svg>
              <span className="font-bold text-primary text-sm font-mono">{coinBalance ?? 0} coins</span>
            </div>
            <Link
              href="/upgrade"
              onClick={() => setMobileOpen(false)}
              className="text-[12px] font-bold text-primary"
            >
              Upgrade →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
