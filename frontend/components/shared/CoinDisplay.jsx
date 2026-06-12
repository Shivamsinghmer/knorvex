import { formatCoins } from '@/lib/utils';

export default function CoinDisplay({ amount = 0, size = 'sm', showLabel = false }) {
  const sizes = {
    xs: { icon: 12, text: '12px' },
    sm: { icon: 14, text: '14px' },
    md: { icon: 18, text: '18px' },
    lg: { icon: 24, text: '24px' },
  };
  const { icon, text } = sizes[size] || sizes.sm;

  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="var(--primary)" opacity="0.15" />
        <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.5" />
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--primary)" fontFamily="monospace">S</text>
      </svg>
      <span className="font-mono font-bold text-primary" style={{ fontSize: text }}>
        {formatCoins(amount)}
      </span>
      {showLabel && (
        <span className="text-muted-foreground font-semibold" style={{ fontSize: '11px' }}>SC</span>
      )}
    </span>
  );
}
