'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { Loader2, User, Mail, Lock, Plus, X, Sparkles, UserPlus, Zap, ArrowRight, Star } from 'lucide-react';
import SkillTag from '@/components/shared/SkillTag';
import { motion } from 'framer-motion';
import { fadeUp, fadeLeft, fadeRight, stagger, tap } from '@/lib/motion';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDirection, setNewSkillDirection] = useState('teach');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase() && s.direction === newSkillDirection)) {
      setError(`"${newSkillName.trim()}" is already added as a ${newSkillDirection} skill.`);
      return;
    }
    setSkills([...skills, { name: newSkillName.trim(), direction: newSkillDirection, level: newSkillLevel }]);
    setNewSkillName('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all basic information fields.'); return; }
    if (skills.length === 0) { setError('Please add at least one skill you want to teach or learn.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await register({ name, email, password, skills });
      router.push('/discover');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check details or try another email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[36%] auth-brand-panel flex-col justify-between p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 dot-bg" />
        <motion.div className="relative z-10" variants={fadeLeft} initial="hidden" animate="show">
          <h2 className="text-2xl font-black text-white leading-tight mb-2">
            Your skills have<br />real exchange value.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Join thousands who barter knowledge daily. No money, just mutual growth.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {['Get 100 SkillCoins instantly', 'AI builds your match profile', 'Start learning in under 5 minutes'].map((item, i) => (
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
        <div className="relative z-10 flex-1 flex items-center justify-center py-3 min-h-0">
          <img
            src="https://topmate.io/cdn-cgi/image/width=640,quality=90/images/sign-in/sign-in-back.svg"
            alt="Skill exchange illustration"
            className="w-full max-w-[220px] object-contain drop-shadow-2xl"
            style={{ maxHeight: '180px' }}
            loading="lazy"
          />
        </div>

        <p className="text-white/40 text-xs relative z-10">© 2026 Knorvex · DevQBX Arena</p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 sm:px-6 overflow-y-auto">
        <motion.div className="w-full max-w-2xl py-6" variants={fadeRight} initial="hidden" animate="show">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Start Bartering
            </span>
            <h1 className="text-2xl font-black text-foreground mb-1">Join the Knorvex Exchange</h1>
            <p className="text-muted-foreground text-sm">List what you can teach, request what you want to learn.</p>
          </div>

          {error && (
            <div className="mb-3 p-3 rounded-xl bg-destructive/8 border border-destructive/20 text-sm text-destructive font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4" variants={stagger} initial="hidden" animate="show">
              {/* Profile Info */}
              <motion.div className="flex flex-col gap-3" variants={fadeUp}>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border">Account Details</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="label">Display Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="e.g. Jane Doe" value={name} onChange={(e) => setName(e.target.value)} className="input input-icon" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="label">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="email" placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input input-icon" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="label">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="input input-icon" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Skills */}
              <motion.div className="flex flex-col gap-3" variants={fadeUp}>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border">Skill Board</h3>
                  <div className="card-inset p-3 rounded-xl flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="label mb-0">Skill Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Python, Spanish, Photoshop"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="label mb-0">I want to...</label>
                        <select value={newSkillDirection} onChange={(e) => setNewSkillDirection(e.target.value)} className="input text-sm py-2">
                          <option value="teach">Teach</option>
                          <option value="learn">Learn</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="label mb-0">Level</label>
                        <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)} className="input text-sm py-2">
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                    </div>
                    <button type="button" onClick={handleAddSkill} className="btn-primary w-full py-2 rounded-xl text-sm">
                      <Plus className="w-4 h-4" /> Add Skill
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 min-h-[72px]">
                  <span className="label mb-0">Added Skills ({skills.length})</span>
                  {skills.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-border p-3">
                      <p className="text-xs text-muted-foreground italic text-center">No skills yet. Add at least one above.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s, idx) => (
                        <div key={idx} className="relative group">
                          <SkillTag name={s.name} direction={s.direction} level={s.level} />
                          <button
                            type="button"
                            onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:opacity-80 transition-opacity opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            <div className="pt-4 border-t border-border">
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 rounded-xl font-bold text-sm group">
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account & generating AI profile...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Register & Get 100 SkillCoins <ArrowRight className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
              <div className="text-center mt-3 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">Sign in</Link>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
