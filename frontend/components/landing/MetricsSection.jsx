'use client';

import { motion } from 'framer-motion';
import { Zap, Brain, MessageSquare } from 'lucide-react';
import { fadeUp, stagger, cardHover } from '@/lib/motion';

const metrics = [
  { value: '2×',  label: 'faster skill acquisition',     sub: 'vs solo self-study',   color: 'bg-primary/10 border-primary/20' },
  { value: '40%', label: 'of users teach & learn both',  sub: 'bidirectional growth',  color: 'bg-chart-4/10 border-chart-4/20' },
  { value: '4×',  label: 'more sessions per active user', sub: 'than alternatives',     color: 'bg-chart-2/10 border-chart-2/20' },
  { value: '₹0',  label: 'cost, ever',                   sub: 'SkillCoins only',        color: 'bg-muted border-border' },
];

const features = [
  { icon: Zap,           title: 'Instant SkillCoins',  desc: 'Coins are credited the moment a session ends. No waiting period, no approval queue. Start booking your next session immediately.' },
  { icon: Brain,         title: 'AI-Powered Discovery', desc: 'Our recommendation engine surfaces your profile to the most relevant learners — automatically, every day.' },
  { icon: MessageSquare, title: 'Async + Live Comms',   desc: '13% of bookings start from a DM. File sharing, image uploads, and real-time messaging keep every deal alive.' },
];

export default function MetricsSection() {
  return (
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
            <motion.div key={i} variants={fadeUp} whileHover={cardHover} className={`rounded-2xl border p-7 flex flex-col gap-2 hover-glow ${m.color}`}>
              <div className="text-4xl font-black font-mono tracking-tighter text-foreground">{m.value}</div>
              <p className="text-sm font-semibold text-foreground leading-tight">{m.label}</p>
              <p className="text-[11px] text-muted-foreground">{m.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5"
        >
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={cardHover} className="glass-card p-7 flex gap-4 items-start hover-glow">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-[18px] h-[18px] text-primary" />
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
  );
}
