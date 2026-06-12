'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';

export default function AIPrepCard({ sessionId }) {
  const [prep, setPrep] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPrep() {
      if (!sessionId) return;
      try {
        setIsLoading(true);
        const { data } = await api.get(`/ai/prep/${sessionId}`, { timeout: 60000 });
        setPrep(data.data?.prep || 'No recommendations generated yet.');
      } catch (err) {
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        setError(isTimeout
          ? 'AI prep took too long to respond. Refresh to retry.'
          : 'Unable to load AI preparation notes.');
      } finally {
        setIsLoading(false);
      }
    }
    loadPrep();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="card p-6 rounded-2xl flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <span className="text-xs text-muted-foreground font-medium">Brewing AI readiness preparation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 rounded-2xl">
        <div className="flex gap-2.5 items-center text-amber-600 dark:text-amber-400 mb-2.5">
          <BookOpen className="w-5 h-5" />
          <h4 className="font-bold text-sm">Readiness Prep</h4>
        </div>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  const tips = typeof prep === 'string' ? prep.split('\n').filter(l => l.trim().length > 0) : [];

  return (
    <div className="card hover-glow p-6 rounded-2xl border-primary/20 bg-primary/3 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="flex gap-2.5 items-center text-primary mb-3.5">
        <Sparkles className="w-5 h-5 animate-pulse" />
        <h4 className="font-bold text-sm tracking-wider uppercase">AI 2-Min Readiness Prep</h4>
      </div>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed font-medium">
        Custom-tailored topics and guidelines prepared by AI based on your and your peer's skills:
      </p>

      {tips.length > 0 ? (
        <ul className="flex flex-col gap-2.5 text-xs text-foreground">
          {tips.map((tip, idx) => (
            <li key={idx} className="flex gap-2.5 items-start">
              <span className="text-primary select-none mt-0.5">•</span>
              <span className="leading-relaxed">{tip.replace(/^[*\-\s•]+/, '')}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{prep}</p>
      )}

      <div className="mt-5 pt-3.5 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground font-mono">
        <span>GENERATED ON-DEMAND</span>
        <span className="text-primary">Knorvex Smart Prep</span>
      </div>
    </div>
  );
}
