'use client';

import { motion } from 'framer-motion';
import { Code2, Palette, TrendingUp, Globe, Music, GraduationCap } from 'lucide-react';
import { fadeUp, stagger, cardHover } from '@/lib/motion';

const tags = ['All Skills', 'Code & Dev', 'Data & AI', 'Study Groups', 'Software', 'ML', 'Finance', 'Startup Mentor', 'Astrology', 'Marketing', 'Finance & Crypto', 'Others'];

const categories = [
  { name: 'Software Dev',  icon: Code2,         count: 124, color: 'text-blue-500',   bg: 'bg-blue-500/8 border-blue-500/15' },
  { name: 'UI/UX Design',  icon: Palette,       count: 86,  color: 'text-purple-500', bg: 'bg-purple-500/8 border-purple-500/15' },
  { name: 'Business',      icon: TrendingUp,    count: 64,  color: 'text-amber-500',  bg: 'bg-amber-500/8 border-amber-500/15' },
  { name: 'Languages',     icon: Globe,         count: 42,  color: 'text-cyan-500',   bg: 'bg-cyan-500/8 border-cyan-500/15' },
  { name: 'Music',         icon: Music,         count: 31,  color: 'text-pink-500',   bg: 'bg-pink-500/8 border-pink-500/15' },
  { name: 'Academics',     icon: GraduationCap, count: 95,  color: 'text-primary',    bg: 'bg-primary/8 border-primary/15' },
];

export default function CategorySection() {
  return (
    <section
      className="relative z-10 py-16 sm:py-32 border-t border-border"
      style={{ background: 'linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, var(--primary) 2%, var(--background)) 100%)' }}
    >
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

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {tags.map((tag, i) => (
            <motion.span
              key={i}
              variants={fadeUp}
              className={`px-4 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-all hover:border-primary/30 hover:text-primary ${
                i === 0 ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border'
              }`}
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {categories.map((c, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={cardHover} className={`flex items-center gap-4 p-5 rounded-2xl border hover-glow cursor-pointer transition-all ${c.bg}`}>
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
  );
}
