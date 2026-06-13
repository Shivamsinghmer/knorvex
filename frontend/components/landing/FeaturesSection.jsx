'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { fadeUp, fadeLeft, stagger } from '@/lib/motion';

const capabilities = [
  { title: 'Book 1:1 Skill Sessions',        desc: 'Schedule live video sessions with verified peers. The platform handles booking, reminders, and video room creation automatically.' },
  { title: 'Set up AI matching in seconds',   desc: 'List your skills once and let our LLM engine continuously surface the best complementary matches — no manual searching required.' },
  { title: 'Earn SkillCoins while teaching',  desc: 'Every session you host earns coins. Spend them to learn from others. The economy is self-sustaining — zero rupees ever change hands.' },
  { title: 'Share files & async messages',    desc: 'Exchange notes, code snippets, PDFs, and images through real-time DMs. Keep the conversation going between sessions.' },
  { title: 'Build your reputation',           desc: 'Multi-axis peer ratings (clarity, punctuality, engagement) build your public profile. High-rated mentors unlock Expert and Legend ranks.' },
  { title: 'Sell your knowledge — for free',  desc: 'No subscription, no commission, no payment gateway needed. Your skills are the currency. Every learner you help levels you up.' },
];

export default function FeaturesSection() {
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
  );
}
