'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { Sparkles, ChevronRight } from 'lucide-react';
import { scaleIn } from '@/lib/motion';

export default function CTASection() {
  const { user } = useAuthStore();
  if (user) return null;

  return (
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
  );
}
