'use client';

import { useState } from 'react';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Star, Loader2, Sparkles, X } from 'lucide-react';

export default function RatingModal({ sessionId, onSubmitted, onClose }) {
  const { fetchMe } = useAuthStore();
  const [clarity, setClarity] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [engagement, setEngagement] = useState(5);
  const [overall, setOverall] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const axes = [
    { label: 'Explanation & Clarity', val: clarity, set: setClarity, desc: 'How clear was the explanation?' },
    { label: 'Punctuality', val: punctuality, set: setPunctuality, desc: 'Did they join on time?' },
    { label: 'Engagement', val: engagement, set: setEngagement, desc: 'How interactive and supportive was the peer?' },
    { label: 'Overall Quality', val: overall, set: setOverall, desc: 'Overall satisfaction score' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.post(`/sessions/${sessionId}/rate`, {
        clarity, punctuality, engagement, overall,
        comment: comment.trim() || undefined,
      });
      // Refresh current user's profile so navbar coin balance and rank reflect immediately
      fetchMe().catch(() => {});
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setError(err.response?.data?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentVal, setter) => (
    <div className="flex gap-1.5 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => setter(star)} className="focus:outline-none transition-transform active:scale-90">
          <Star className={`w-6 h-6 ${star <= currentVal ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-muted-foreground/70'}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-lg w-full p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-1" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Session Completed!
          </span>
          <h2 className="text-2xl font-black text-card-foreground">Rate Your Experience</h2>
          <p className="text-xs text-muted-foreground mt-1">Your review updates the peer's rank, rating, and profile automatically.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            {axes.map((axis, idx) => (
              <div key={idx} className="flex justify-between items-center bg-muted/30 border border-border p-3 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-card-foreground">{axis.label}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{axis.desc}</p>
                </div>
                {renderStars(axis.val, axis.set)}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Written Feedback (Optional)</label>
            <textarea
              placeholder="What went well? Any suggestions for improvement?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary py-3 rounded-xl font-bold text-sm mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting review...</> : 'Submit Rating'}
          </button>
        </form>
      </div>
    </div>
  );
}
