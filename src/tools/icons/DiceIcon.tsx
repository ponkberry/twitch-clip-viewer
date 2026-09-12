interface DiceIconProps {
  size?: number;
}

export function DiceIcon({ size = 18 }: DiceIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
