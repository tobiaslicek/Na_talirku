export function HeartIcon({ filled, size = 26 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20.2s-7.6-4.6-8.9-9.6C2.3 7.4 4.2 4.4 7.3 4.3c2-.1 3.6 1 4.7 2.7 1.1-1.7 2.7-2.8 4.7-2.7 3.1.1 5 3.1 4.2 6.3-1.3 5-8.9 9.6-8.9 9.6z" />
    </svg>
  );
}

export function ThumbDownIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3.5v9.2" />
      <path d="M17 12.7 13.3 20.3a.9.9 0 0 1-.8.5c-1.5 0-2.6-1.4-2.3-2.9l.7-3.3H5.7a2.2 2.2 0 0 1-2.1-2.8l1.9-6.6A2.2 2.2 0 0 1 7.6 3.5H17h2.2c.7 0 1.3.6 1.3 1.3v6.6c0 .7-.6 1.3-1.3 1.3H17" />
    </svg>
  );
}

export function CrossIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  );
}
