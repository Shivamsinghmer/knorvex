'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { scaleIn, stagger, cardHover } from '@/lib/motion';

const testimonials = [
  { name: 'Arjun Mehta',  role: 'CS Student · IIT Delhi',   text: 'I traded Python tutoring for Spanish lessons. Completely free, and the AI matching was scarily accurate. Did 8 sessions in my first month.' },
  { name: 'Priya Nair',   role: 'Freelance Designer · Pune', text: 'Taught Figma to three learners and learned digital marketing in return. The SkillCoin system is genius — I never spent a single rupee.' },
  { name: 'Rohit Sharma', role: 'Backend Dev · Bangalore',   text: "The built-in video rooms are seamless. I've done 12 sessions and never had a technical issue. The rating system keeps quality high." },
];

export default function TestimonialsSection() {
  return (
    <section
      className="relative z-10 py-16 sm:py-32 border-t border-border"
      style={{ background: 'linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, var(--muted) 60%, var(--background)) 100%)' }}
    >
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
            <motion.div key={i} variants={scaleIn} whileHover={cardHover} className="glass-card p-7 hover-glow flex flex-col gap-5">
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-primary fill-primary" />)}
              </div>
              <p className="text-foreground text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
                  {t.name[0]}
                </div>
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
  );
}
