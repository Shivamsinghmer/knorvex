'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { Loader2, Mail, Lock, LogIn, Sparkles, Zap, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, fadeLeft, fadeRight, stagger, tap } from '@/lib/motion';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/discover');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] auth-brand-panel flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 dot-bg" />

        <motion.div className="relative z-10" variants={fadeLeft} initial="hidden" animate="show">
          <h2 className="text-3xl font-black text-white leading-tight mb-2">
            The skill economy<br />is barter-powered.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Teach what you know, learn what you don't — with no money involved. Just skills, matched by AI.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {['100 free SkillCoins on signup', 'AI-powered peer matching', 'HD video sessions built in'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-2.5 h-2.5 text-white fill-white" />
                </div>
                <span className="text-white/80 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Illustration */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-4 min-h-0">
          <img
            src="https://topmate.io/cdn-cgi/image/width=640,quality=90/images/sign-in/sign-in-back.svg"
            alt="Skill exchange illustration"
            className="w-full max-w-xs object-contain drop-shadow-2xl"
            style={{ maxHeight: '260px' }}
            loading="lazy"
          />
        </div>

        <p className="text-white/40 text-xs relative z-10">© 2026 Knorvex · Built for DevQBX Arena</p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 sm:px-6 overflow-y-auto">
        <motion.div className="w-full max-w-md py-8" variants={fadeRight} initial="hidden" animate="show">
          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Welcome Back
            </span>
            <h1 className="text-2xl font-black text-foreground mb-1">Sign in to Knorvex</h1>
            <p className="text-muted-foreground text-sm">Ready to learn something new today?</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/8 border border-destructive/20 text-sm text-destructive leading-relaxed font-medium">
              {error}
            </div>
          )}

          <motion.form onSubmit={handleSubmit} className="flex flex-col gap-4" variants={stagger} initial="hidden" animate="show">
            <motion.div className="flex flex-col gap-2" variants={fadeUp}>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-icon"
                />
              </div>
            </motion.div>

            <motion.div className="flex flex-col gap-2" variants={fadeUp}>
              <div className="flex justify-between items-center">
                <label className="label mb-0">Password</label>
                <Link href="#" className="text-[11px] font-semibold text-primary hover:text-primary/80">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-icon"
                />
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm mt-2 group"
              variants={fadeUp}
              whileTap={tap}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In <ArrowRight className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1" /></>
              )}
            </motion.button>
          </motion.form>

          <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 font-bold transition-colors">Create one free</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
