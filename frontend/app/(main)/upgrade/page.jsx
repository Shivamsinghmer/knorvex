'use client';

import { useState } from 'react';
import { Crown, Check, Zap, MessageSquare, Sparkles, TrendingDown } from 'lucide-react';

const PREMIUM_FEATURES = [
  'Access all past recorded sessions from teachers',
  'Publish & monetize your own recorded sessions',
  '20 free SkillCoins credited every day',
  'Priority session matching & booking',
  'Verified premium badge on your profile',
  'Early access to new features',
];

const COIN_FEATURES = [
  'Coins never expire — use anytime',
  'Book sessions with any peer or teacher',
  'No subscription or hidden charges',
  'Instant credit, available right away',
];

const PRESETS = [25, 50, 100, 200];

function getPricePerCoin(coins) {
  if (coins >= 200) return 1.5;
  if (coins >= 100) return 1.75;
  if (coins >= 50)  return 1.9;
  return 2;
}

function getSavingsPct(coins) {
  return Math.round(((2 - getPricePerCoin(coins)) / 2) * 100);
}

export default function UpgradePage() {
  const [coins, setCoins] = useState(50);

  const rate    = getPricePerCoin(coins);
  const price   = Math.round(coins * rate);
  const savings = getSavingsPct(coins);
  const pct     = ((coins - 10) / (300 - 10)) * 100;

  return (
    <div className="flex flex-col px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="text-center mb-6">
        <span className="badge badge-primary inline-flex mb-2">
          <Sparkles className="w-3 h-3" /> Upgrade Knorvex
        </span>
        <h1
          className="text-2xl sm:text-3xl text-foreground"
          style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}
        >
          Learn more. Earn faster.
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Go Premium for recordings &amp; daily coins — or top up your balance anytime.
        </p>
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">

        {/* ── Premium Card ── */}
        <article
          className="relative overflow-hidden rounded-2xl text-white flex flex-col h-full"
          style={{
            backgroundImage: 'url(https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/046f0e74-64ae-4e71-ae2d-67940e33e9bc_1600w.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(6,5,20,0.74)' }} />

          <div className="relative z-10 flex flex-col flex-1 p-4">
            {/* top row */}
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Knorvex Premium
              </span>
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border border-white/30 rounded-md px-1.5 py-0.5"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <Crown className="w-2.5 h-2.5" /> Most Popular
              </span>
            </div>

            {/* title */}
            <div className="mt-2 flex-shrink-0">
              <h2
                className="text-xl leading-tight"
                style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: '#fff' }}
              >
                Built for learners who want more
              </h2>
              <p className="text-[10.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.52)' }}>
                Recordings, daily coins, and priority matching.
              </p>
            </div>

            {/* price */}
            <div className="mt-2 flex items-baseline gap-1 flex-shrink-0">
              <span
                className="text-[32px] leading-none tracking-tight"
                style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}
              >
                ₹500
              </span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>/month</span>
            </div>

            {/* buttons */}
            <div className="mt-2.5 flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => alert('Payment integration coming soon!')}
                className="btn-primary text-[11px]"
                style={{ padding: '6px 12px', borderRadius: '8px' }}
              >
                <Crown className="w-3 h-3" /> Go Premium
              </button>
              <button
                className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-3 py-1.5 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              >
                <MessageSquare className="w-2.5 h-2.5" /> Learn more
              </button>
            </div>

            {/* divider */}
            <div className="mt-2.5 flex-shrink-0" style={{ height: '1px', background: 'rgba(255,255,255,0.09)' }} />

            {/* features */}
            <ul className="mt-2 flex flex-col gap-1.5 flex-1">
              {PREMIUM_FEATURES.map(text => (
                <li
                  key={text}
                  className="flex items-start gap-2 text-[11px]"
                  style={{ color: 'rgba(255,255,255,0.72)' }}
                >
                  <Check className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </article>

        {/* ── Coin Slider Card ── */}
        <article className="card flex flex-col overflow-hidden">
          <div className="flex flex-col p-4">

            {/* top row */}
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground">SkillCoin Top-Up</span>
              <span className="badge badge-primary text-[9px]">
                <Zap className="w-2.5 h-2.5" /> Instant
              </span>
            </div>

            {/* title */}
            <div className="mt-2 flex-shrink-0">
              <h2
                className="text-xl leading-tight text-foreground"
                style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}
              >
                Buy coins, learn now
              </h2>
              <p className="text-[10.5px] text-muted-foreground mt-0.5">
                No subscription. Pay once and book any peer session.
              </p>
            </div>

            {/* coin display box */}
            <div
              className="mt-2.5 flex-shrink-0 rounded-xl px-3 py-2 flex items-center justify-between"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">SkillCoins</p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="font-bold leading-none"
                    style={{ fontSize: '34px', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}
                  >
                    {coins}
                  </span>
                  <span className="text-[10px] text-muted-foreground">coins</span>
                </div>
                <p className="text-[9.5px] text-muted-foreground mt-0.5">= {coins} sessions you can book</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Total</p>
                <span
                  className="font-bold leading-none"
                  style={{ fontSize: '28px', fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: 'var(--foreground)' }}
                >
                  ₹{price}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                  <span className="text-[9.5px] text-muted-foreground">₹{rate}/coin</span>
                  {savings > 0 && (
                    <span className="badge badge-primary" style={{ fontSize: '8px', padding: '2px 5px' }}>
                      <TrendingDown className="w-2 h-2" /> Save {savings}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* slider */}
            <div className="mt-2.5 flex-shrink-0">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                <span>10</span><span>Drag to adjust</span><span>300</span>
              </div>
              <input
                type="range"
                min={10}
                max={300}
                step={5}
                value={coins}
                onChange={e => setCoins(Number(e.target.value))}
                className="w-full"
                style={{
                  appearance: 'none',
                  height: '4px',
                  borderRadius: '99px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--muted) ${pct}%, var(--muted) 100%)`,
                }}
              />
              <style>{`
                input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none; appearance: none;
                  width: 16px; height: 16px; border-radius: 50%;
                  background: var(--primary); cursor: pointer;
                  border: 3px solid var(--card);
                  box-shadow: 0 0 0 1px var(--primary);
                }
                input[type=range]::-moz-range-thumb {
                  width: 16px; height: 16px; border-radius: 50%;
                  background: var(--primary); cursor: pointer;
                  border: 3px solid var(--card);
                }
              `}</style>
            </div>

            {/* presets */}
            <div className="mt-2 flex gap-1.5 flex-shrink-0">
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => setCoins(p)}
                  className="flex-1 text-[11px] font-bold py-1 rounded-lg transition-all"
                  style={{
                    background: coins === p ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'var(--muted)',
                    color: coins === p ? 'var(--primary)' : 'var(--muted-foreground)',
                    border: coins === p ? '1px solid color-mix(in srgb, var(--primary) 35%, transparent)' : '1px solid var(--border)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* divider */}
            <div className="divider mt-2.5 flex-shrink-0" />

            {/* features */}
            <ul className="mt-2 flex flex-col gap-1.5">
              {COIN_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <Check className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => alert('Payment integration coming soon!')}
              className="btn-primary mt-2.5 w-full flex-shrink-0 text-[12px]"
              style={{ borderRadius: '9px', padding: '8px' }}
            >
              <Zap className="w-3 h-3" />
              Buy {coins} Coins for ₹{price}
            </button>

          </div>
        </article>

      </div>
    </div>
  );
}
