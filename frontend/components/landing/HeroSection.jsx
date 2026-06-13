'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import HeroBackground from '@/components/landing/HeroBackground';
import { fadeUp, scaleIn, stagger, cardHover, tap } from '@/lib/motion';

const stats = [
  { value: '₹0',    label: 'Cost to join',       accent: false },
  { value: '10K+',  label: 'Coins circulating',   accent: true  },
  { value: '98%',   label: 'Match satisfaction',  accent: false },
  { value: '2.4K+', label: 'Sessions hosted',     accent: true  },
];

export default function HeroSection() {
  const { user } = useAuthStore();

  return (
    <section className="relative h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      <HeroBackground />
      <div className="absolute inset-0 hero-overlay" style={{ zIndex: 1 }} />
      <div className="absolute inset-0 hero-overlay-side" style={{ zIndex: 1 }} />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #51f0a8 0%, transparent 70%)', zIndex: 1 }}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center"
        style={{ zIndex: 2 }}
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-[11px] font-bold uppercase tracking-widest mb-6"
        >
          <Sparkles className="w-3 h-3" />
          India&apos;s #1 Skill Barter Platform
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-[1.05] text-foreground mb-5"
          style={{ textShadow: '0 2px 24px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)' }}
        >
          Your All-in-One
          <br />
          <span className="gradient-text">Skill Exchange</span> Platform
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-base md:text-lg max-w-lg leading-relaxed mb-8"
          style={{ color: 'var(--foreground)', opacity: 0.75, textShadow: '0 1px 12px rgba(0,0,0,0.95)' }}
        >
          Teach what you know. Learn what you don&apos;t. Grow your skills and your reputation —
          all from a single profile. Powered by{' '}
          <strong className="font-semibold" style={{ opacity: 1, color: 'var(--foreground)' }}>SkillCoins</strong> and{' '}
          <strong className="font-semibold" style={{ opacity: 1, color: 'var(--foreground)' }}>AI Matching</strong>.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 items-center">
          {user ? (
            <Link href="/discover" className="btn-primary px-9 py-3 text-sm group" style={{ boxShadow: '0 8px 32px rgba(81,240,168,0.3)' }}>
              Go to Dashboard <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-primary px-9 py-3 text-sm group" style={{ boxShadow: '0 8px 32px rgba(81,240,168,0.3)' }}>
                Start My Profile <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="btn-ghost px-9 py-3 text-sm" style={{ background: 'rgba(0,0,0,0.6)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                Sign In
              </Link>
            </>
          )}
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-5 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs"
          style={{ color: 'var(--foreground)', opacity: 0.65, textShadow: '0 1px 8px rgba(0,0,0,0.95)' }}
        >
          {['No credit card required', '100 free SkillCoins on signup', 'Instant AI matching', 'Free forever'].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-primary flex-shrink-0" />{t}
            </span>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mt-12 w-full">
          {stats.map((s, i) => (
            <motion.div key={i} variants={scaleIn} whileHover={cardHover} whileTap={tap} className="glass-card px-5 py-4 text-center hover-glow">
              <div className={`text-2xl font-black font-mono tracking-tighter mb-0.5 ${s.accent ? 'gradient-text' : 'text-foreground'}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
