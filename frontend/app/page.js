'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import {
  ArrowRight, Sparkles, Zap, Users, Star, Shield,
  Video, Brain, ChevronRight, ArrowUpRight, Check,
  MessageSquare, Award, Code2, Palette, TrendingUp,
  Globe, Music, GraduationCap, Plus, Minus
} from 'lucide-react';
import HeroBackground from '@/components/landing/HeroBackground';
import {
  fadeUp, fadeIn, fadeLeft, fadeRight,
  scaleIn, stagger, staggerSlow,
  cardHover, tap, pageVariants,
} from '@/lib/motion';

/* ── tiny FAQ accordion ── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left py-5 border-b border-border flex justify-between items-start gap-6 group"
    >
      <span className={`text-base font-semibold transition-colors ${open ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>{q}</span>
      <span className="flex-shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
        {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </span>
      {open && (
        <span className="sr-only">{a}</span>
      )}
      {/* answer rendered outside button for accessibility */}
    </button>
  );
}

function FaqBlock({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex justify-between items-start gap-6 group"
      >
        <span className={`text-base font-semibold leading-snug transition-colors ${open ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>{q}</span>
        <span className="flex-shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
          {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </button>
      {open && (
        <p className="text-sm text-muted-foreground pb-5 leading-relaxed pr-8">{a}</p>
      )}
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuthStore();


  const capabilities = [
    { title: 'Book 1:1 Skill Sessions',        desc: 'Schedule live video sessions with verified peers. The platform handles booking, reminders, and video room creation automatically.' },
    { title: 'Set up AI matching in seconds',   desc: 'List your skills once and let our LLM engine continuously surface the best complementary matches — no manual searching required.' },
    { title: 'Earn SkillCoins while teaching',  desc: 'Every session you host earns coins. Spend them to learn from others. The economy is self-sustaining — zero rupees ever change hands.' },
    { title: 'Share files & async messages',    desc: 'Exchange notes, code snippets, PDFs, and images through real-time DMs. Keep the conversation going between sessions.' },
    { title: 'Build your reputation',           desc: 'Multi-axis peer ratings (clarity, punctuality, engagement) build your public profile. High-rated mentors unlock Expert and Legend ranks.' },
    { title: 'Sell your knowledge — for free',  desc: 'No subscription, no commission, no payment gateway needed. Your skills are the currency. Every learner you help levels you up.' },
  ];

  const metrics = [
    { value: '2×',  label: 'faster skill acquisition',     sub: 'vs solo self-study',   color: 'bg-primary/10 border-primary/20' },
    { value: '40%', label: 'of users teach & learn both',  sub: 'bidirectional growth',  color: 'bg-chart-4/10 border-chart-4/20' },
    { value: '4×',  label: 'more sessions per active user', sub: 'than alternatives',     color: 'bg-chart-2/10 border-chart-2/20' },
    { value: '₹0',  label: 'cost, ever',                   sub: 'SkillCoins only',        color: 'bg-muted border-border' },
  ];

  const categories = [
    { name: 'Software Dev',  icon: Code2,        count: 124, color: 'text-blue-500',   bg: 'bg-blue-500/8 border-blue-500/15' },
    { name: 'UI/UX Design',  icon: Palette,      count: 86,  color: 'text-purple-500', bg: 'bg-purple-500/8 border-purple-500/15' },
    { name: 'Business',      icon: TrendingUp,   count: 64,  color: 'text-amber-500',  bg: 'bg-amber-500/8 border-amber-500/15' },
    { name: 'Languages',     icon: Globe,        count: 42,  color: 'text-cyan-500',   bg: 'bg-cyan-500/8 border-cyan-500/15' },
    { name: 'Music',         icon: Music,        count: 31,  color: 'text-pink-500',   bg: 'bg-pink-500/8 border-pink-500/15' },
    { name: 'Academics',     icon: GraduationCap,count: 95,  color: 'text-primary',    bg: 'bg-primary/8 border-primary/15' },
  ];

  const testimonials = [
    { name: 'Arjun Mehta',   role: 'CS Student · IIT Delhi',    text: 'I traded Python tutoring for Spanish lessons. Completely free, and the AI matching was scarily accurate. Did 8 sessions in my first month.' },
    { name: 'Priya Nair',    role: 'Freelance Designer · Pune',  text: 'Taught Figma to three learners and learned digital marketing in return. The SkillCoin system is genius — I never spent a single rupee.' },
    { name: 'Rohit Sharma',  role: 'Backend Dev · Bangalore',    text: 'The built-in video rooms are seamless. I\'ve done 12 sessions and never had a technical issue. The rating system keeps quality high.' },
  ];

  const faqs = [
    { q: 'What is Knorvex?',                    a: 'Knorvex is a peer-to-peer skill exchange platform where you teach what you know and learn what you don\'t — without spending money. Skills are bartered using SkillCoins, a platform currency you earn by teaching.' },
    { q: 'Can I join without paying anything?',  a: 'Yes, completely. Knorvex is free forever. You sign up, get 100 SkillCoins credited instantly, and start booking or hosting sessions. No credit card, no subscription, no hidden fees.' },
    { q: 'How do SkillCoins work?',             a: 'SkillCoins are Knorvex\'s internal currency. You earn coins by hosting sessions and spend them to book sessions from others. The exchange rate is set by the platform to keep things fair and balanced.' },
    { q: 'How does AI matching work?',          a: 'When you set up your profile, you list skills you can teach and skills you want to learn. Our LLM (powered by Groq) continuously scans the community to find users whose teach list matches your learn list, and vice versa — surfacing high-compatibility matches daily.' },
    { q: 'What are the transaction charges?',   a: 'Zero. There are no transaction charges because no real money is exchanged. All sessions are paid for in SkillCoins. The platform takes no commission on any exchange.' },
    { q: 'Is Knorvex really free?',             a: 'Yes. We monetise through premium features (coming soon) and institutional partnerships — never through session commissions or user fees. The core barter economy will always be free.' },
  ];

  const stats = [
    { value: '₹0',    label: 'Cost to join',       accent: false },
    { value: '10K+',  label: 'Coins circulating',   accent: true  },
    { value: '98%',   label: 'Match satisfaction',  accent: false },
    { value: '2.4K+', label: 'Sessions hosted',     accent: true  },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        <HeroBackground />
        <div className="absolute inset-0 hero-overlay" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 hero-overlay-side" style={{ zIndex: 1 }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07] blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse, #51f0a8 0%, transparent 70%)', zIndex: 1 }} />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center"
          style={{ zIndex: 2 }}
        >

          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-[11px] font-bold uppercase tracking-widest mb-6">
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
            all from a single profile. Powered by <strong className="font-semibold" style={{ opacity: 1, color: 'var(--foreground)' }}>SkillCoins</strong> and{' '}
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
                <Link href="/login" className="btn-ghost px-9 py-3 text-sm" style={{ background: 'rgba(0,0,0,0.6)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)' }}>Sign In</Link>
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

          {/* Stats row */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mt-12 w-full">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={cardHover}
                whileTap={tap}
                className="glass-card px-5 py-4 text-center hover-glow"
              >
                <div className={`text-2xl font-black font-mono tracking-tighter mb-0.5 ${s.accent ? 'gradient-text' : 'text-foreground'}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ WHAT YOU CAN DO ═══════════ */}
      <section className="relative z-10 py-16 sm:py-32 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start">

            {/* Left — sticky text */}
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="lg:sticky lg:top-28"
            >
              <span className="section-label inline-flex items-center gap-2 mb-5">
                <span className="w-8 h-px bg-primary/40 inline-block" />
                Everything in one place
              </span>
              <h2 className="text-4xl md:text-5xl tracking-tight text-foreground mb-6">
                Create your Knorvex profile in a{' '}
                <span className="gradient-text italic">flash</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-sm">
                Start earning SkillCoins by the time you finish reading this page. List your skills, get matched, and book your first session — all in under 5 minutes.
              </p>
              <Link href="/register" className="btn-primary inline-flex px-7 py-3 text-sm gap-2 group">
                Launch my profile
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>

            {/* Right — accordion list */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="flex flex-col divide-y divide-border"
            >
              {capabilities.map((c, i) => (
                <motion.div key={i} variants={fadeUp} className="py-5 flex gap-4 items-start group cursor-default">
                  <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{c.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="relative z-10 py-16 sm:py-32 border-t border-border" style={{ background: 'linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, var(--muted) 60%, var(--background)) 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <span className="section-label inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-primary/40 inline-block" />
              Don&apos;t just take our word for it
              <span className="w-8 h-px bg-primary/40 inline-block" />
            </span>
            <h2 className="text-4xl md:text-5xl tracking-tight text-foreground mt-2">Real people, real exchanges</h2>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={cardHover}
                className="glass-card p-7 hover-glow flex flex-col gap-5"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-primary fill-primary" />)}
                </div>
                <p className="text-foreground text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-sm font-black text-primary flex-shrink-0">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ EARN & CONVERT ═══════════ */}
      <section className="relative z-10 py-16 sm:py-32 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <span className="section-label inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-primary/40 inline-block" />
              Grow &amp; convert more with Knorvex
              <span className="w-8 h-px bg-primary/40 inline-block" />
            </span>
            <h2 className="text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              Earn <span className="gradient-text italic">&amp; Grow</span> more with Knorvex
            </h2>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {metrics.map((m, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={cardHover}
                className={`rounded-2xl border p-7 flex flex-col gap-2 hover-glow ${m.color}`}
              >
                <div className="text-4xl font-black font-mono tracking-tighter text-foreground">{m.value}</div>
                <p className="text-sm font-semibold text-foreground leading-tight">{m.label}</p>
                <p className="text-[11px] text-muted-foreground">{m.sub}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Feature tiles */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5"
          >
            {[
              { icon: Zap,            title: 'Instant SkillCoins',   desc: 'Coins are credited the moment a session ends. No waiting period, no approval queue. Start booking your next session immediately.' },
              { icon: Brain,          title: 'AI-Powered Discovery',  desc: 'Our recommendation engine surfaces your profile to the most relevant learners — automatically, every day.' },
              { icon: MessageSquare,  title: 'Async + Live Comms',    desc: '13% of bookings start from a DM. File sharing, image uploads, and real-time messaging keep every deal alive.' },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={cardHover} className="glass-card p-7 flex gap-4 items-start hover-glow">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-primary" style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">{f.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ GO-TO PLATFORM ═══════════ */}
      <section className="relative z-10 py-16 sm:py-32 border-t border-border" style={{ background: 'linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, var(--primary) 2%, var(--background)) 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="section-label inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-primary/40 inline-block" />
              The go-to platform for skill builders
              <span className="w-8 h-px bg-primary/40 inline-block" />
            </span>
            <h2 className="text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              Experts from every niche use{' '}
              <span className="gradient-text italic">Knorvex</span>
            </h2>
            <p className="text-muted-foreground text-sm mt-3">to teach, learn, rate, and grow.</p>
          </div>

          {/* Category pills */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {['All Skills', 'Code & Dev', 'Data & AI', 'Study Groups', 'Software', 'ML', 'Finance', 'Startup Mentor', 'Astrology', 'Marketing', 'Finance & Crypto', 'Others'].map((tag, i) => (
              <motion.span
                key={i}
                variants={fadeUp}
                className={`px-4 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-all hover:border-primary/30 hover:text-primary ${i === 0 ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border'}`}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>

          {/* Category grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {categories.map((c, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={cardHover}
                className={`flex items-center gap-4 p-5 rounded-2xl border hover-glow cursor-pointer transition-all ${c.bg}`}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-background border border-border">
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground leading-tight">{c.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[11px] text-muted-foreground font-medium">{c.count} active users</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="relative z-10 py-16 sm:py-32 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start">

            {/* Left */}
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="lg:sticky lg:top-28"
            >
              <span className="section-label inline-flex items-center gap-2 mb-5">
                <span className="w-8 h-px bg-primary/40 inline-block" />
                FAQ
              </span>
              <h2 className="text-4xl md:text-5xl tracking-tight text-foreground mb-4">
                Frequently asked questions
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
                Can&apos;t find the answer you&apos;re looking for?{' '}
                <a href="mailto:support@knorvex.com" className="text-primary underline underline-offset-2">Reach out to us.</a>
              </p>
            </motion.div>

            {/* Right — FAQ list */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
            >
              {faqs.map((f, i) => (
                <FaqBlock key={i} q={f.q} a={f.a} />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      {!user && (
        <section className="relative z-10 py-24 border-t border-border">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="glass-card cta-glow-border p-14 md:p-20 rounded-3xl relative overflow-hidden text-center"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: '#51f0a8' }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-[11px] font-bold uppercase tracking-widest mb-8">
                  <Sparkles className="w-3 h-3" />
                  Free forever
                </div>
                <h2 className="text-4xl md:text-[52px] tracking-tighter text-foreground mb-5 leading-[1.05]">
                  Start exchanging skills today.
                </h2>
                <p className="text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed text-sm">
                  Join thousands of learners and mentors across India. Get 100 SkillCoins on signup — no payment, no catch, no commission.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/register" className="btn-primary px-10 py-3.5 text-sm group" style={{ boxShadow: '0 8px 32px rgba(81,240,168,0.35)' }}>
                    Create Free Account <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/login" className="btn-ghost px-10 py-3.5 text-sm">Already have an account</Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════ FOOTER ═══════════ */}
      <motion.footer
        variants={fadeIn}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="relative z-10 py-14 border-t border-border mt-auto"
      >
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
      </motion.footer>
    </div>
  );
}
