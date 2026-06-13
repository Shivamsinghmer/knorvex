'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { fadeUp, fadeLeft, stagger } from '@/lib/motion';

const faqs = [
  { q: 'What is Knorvex?',                    a: "Knorvex is a peer-to-peer skill exchange platform where you teach what you know and learn what you don't — without spending money. Skills are bartered using SkillCoins, a platform currency you earn by teaching." },
  { q: 'Can I join without paying anything?',  a: 'Yes, completely. Knorvex is free forever. You sign up, get 100 SkillCoins credited instantly, and start booking or hosting sessions. No credit card, no subscription, no hidden fees.' },
  { q: 'How do SkillCoins work?',              a: "SkillCoins are Knorvex's internal currency. You earn coins by hosting sessions and spend them to book sessions from others. The exchange rate is set by the platform to keep things fair and balanced." },
  { q: 'How does AI matching work?',           a: 'When you set up your profile, you list skills you can teach and skills you want to learn. Our LLM (powered by Groq) continuously scans the community to find users whose teach list matches your learn list, and vice versa — surfacing high-compatibility matches daily.' },
  { q: 'What are the transaction charges?',    a: 'Zero. There are no transaction charges because no real money is exchanged. All sessions are paid for in SkillCoins. The platform takes no commission on any exchange.' },
  { q: 'Is Knorvex really free?',              a: 'Yes. We monetise through premium features (coming soon) and institutional partnerships — never through session commissions or user fees. The core barter economy will always be free.' },
];

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
      {open && <p className="text-sm text-muted-foreground pb-5 leading-relaxed pr-8">{a}</p>}
    </motion.div>
  );
}

export default function FAQSection() {
  return (
    <section className="relative z-10 py-16 sm:py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start">

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
  );
}
