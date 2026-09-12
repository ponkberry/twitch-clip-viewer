interface WheelIconProps {
  size?: number;
}

export function WheelIcon({ size = 18 }: WheelIconProps) {
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
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 3v6" />
      <path d="M12 15v6" />
      <path d="M4.4 7.5l5.2 3" />
      <path d="M14.4 13.5l5.2 3" />
      <path d="M19.6 7.5l-5.2 3" />
      <path d="M9.6 13.5l-5.2 3" />
    </svg>
  );
}
