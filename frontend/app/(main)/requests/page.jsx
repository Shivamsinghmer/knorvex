'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import CoinDisplay from '@/components/shared/CoinDisplay';
import { Calendar, HelpCircle, Loader2, Sparkles, Plus, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function RequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('casual');
  const [coinOffer, setCoinOffer] = useState(50);
  const [showForm, setShowForm] = useState(false);

  async function loadRequests() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/ai/request-board');
      setRequests(data.data || []);
    } catch (err) {
      console.error('Failed to load request board:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!title.trim() || !skillName.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (user?.skillCoinBalance < coinOffer) {
      setError(`Insufficient SkillCoins. Your balance is ${user?.skillCoinBalance} SC.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/ai/request-board', {
        title,
        skillName: skillName.trim(),
        description: `${title.trim()}: ${description.trim()}`,
        urgency,
        coinOffer: parseInt(coinOffer),
      });

      setTitle('');
      setSkillName('');
      setDescription('');
      setUrgency('casual');
      setCoinOffer(50);
      setShowForm(false);
      loadRequests();
    } catch (err) {
      console.error('Failed to post request:', err);
      setError(err.response?.data?.message || 'Failed to submit skill request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyBadge = (level) => {
    if (level === 'urgent') return 'bg-destructive/10 text-destructive border border-destructive/20';
    if (level === 'soon') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    return 'bg-muted text-muted-foreground border border-border';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-10 text-foreground relative">
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2 text-foreground">
            <HelpCircle className="w-8 h-8 text-primary" />
            Skill Requests
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Browse requests from peers or post one to seek custom learning help.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'View Board' : 'Post Skill Request'}</span>
        </button>
      </div>

      {showForm ? (
        <div className="card max-w-2xl mx-auto p-5 sm:p-8 rounded-3xl shadow-2xl relative z-10 mb-8 animate-fade-in">
          <h2 className="text-xl font-black text-card-foreground mb-1 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-primary" /> Ask the Community
          </h2>
          <p className="text-xs text-muted-foreground mb-6 border-b border-border pb-3">Specify details to let users know how they can help.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Request Subject</label>
              <input
                type="text"
                placeholder="e.g. Need help with React component states"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Target Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g. React.js, Python, Figma"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Urgency Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="bg-background border border-input rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="casual">Casual (Just curious)</option>
                  <option value="soon">Soon (Next few days)</option>
                  <option value="urgent">Urgent (Need today)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Explain what you want to learn</label>
              <textarea
                placeholder="List specific topics, issues, or what project you want to build during the session..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center bg-primary/5 border border-primary/20 p-4 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-foreground block">SkillCoins Reward Offer</span>
                <span className="text-[9px] text-muted-foreground block mt-0.5">Will be locked until session ends</span>
              </div>
              <input
                type="number"
                min={10}
                max={500}
                value={coinOffer}
                onChange={(e) => setCoinOffer(e.target.value)}
                className="bg-background border border-input rounded-xl px-4 py-2 text-xs text-foreground text-right font-mono font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 mt-2"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Publish Community Request
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-primary" />
              AI-Ranked Skill Board
            </h2>

            {isLoading ? (
              <div className="card p-12 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-xs text-muted-foreground">Loading open listings...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="card p-12 rounded-2xl border-dashed text-center flex flex-col items-center justify-center min-h-[300px]">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-xs text-muted-foreground">Request board is currently clear.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {requests.map((req) => {
                  const reqUser = req.userId || {};
                  return (
                    <div
                      key={req._id}
                      className="card hover-glow p-6 rounded-2xl flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img
                            src={reqUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${reqUser._id || reqUser.name}`}
                            alt={reqUser.name}
                            className="w-8 h-8 rounded-lg object-cover bg-muted"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-card-foreground">{reqUser.name}</span>
                            <span className="text-[9px] text-muted-foreground">@{(reqUser.name || 'user').split(' ')[0].toLowerCase()}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getUrgencyBadge(req.urgency)}`}>
                          {req.urgency}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-card-foreground leading-relaxed">{req.description}</span>
                        <span className="text-[10px] text-primary mt-1.5 font-mono bg-primary/5 border border-primary/10 px-2.5 py-0.5 rounded w-max">
                          Skill: {req.skillName}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-border mt-2 text-xs">
                        <CoinDisplay amount={req.coinOffer} size="xs" showLabel />
                        {reqUser._id !== user?.id && reqUser._id !== user?._id && (
                          <Link href={`/sessions/book?user=${reqUser._id || reqUser.id}&skill=${encodeURIComponent(req.skillName)}`}>
                            <button className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[11px] transition-colors">
                              Teach Skill
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="card p-6 rounded-2xl text-xs leading-relaxed text-muted-foreground">
              <h3 className="font-bold text-sm text-card-foreground mb-2 flex items-center gap-1.5">
                <span>🎒</span> Community Notes
              </h3>
              <p className="text-muted-foreground">
                AI ranks open skill requests based on your profile's listed <strong className="text-foreground">Teach Skills</strong>. If a peer needs help with something you listed, it will float to the top of your request feed!
              </p>
              <ul className="flex flex-col gap-1.5 list-disc list-inside mt-3 text-muted-foreground">
                <li>Teach requests to earn double coins.</li>
                <li>Ensure you have sufficient balance before requesting help.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
