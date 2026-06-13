'use client';
import { Loader2, Sparkles } from 'lucide-react';

export default function SummaryModal({ isOpen, isLoading, text, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
      <div className="card max-w-md w-full p-6 rounded-2xl shadow-xl">
        <h3 className="font-bold text-base text-card-foreground flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-primary" /> Post-Session AI Notes
        </h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Takeaways and smart logs</p>
        {isLoading ? (
          <div className="flex justify-center items-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : (
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 border border-border p-4 rounded-xl">{text}</p>
        )}
        <button onClick={onClose} className="w-full mt-4 py-2 bg-muted hover:bg-secondary text-xs font-bold text-foreground rounded-xl border border-border">
          Close Notes
        </button>
      </div>
    </div>
  );
}
