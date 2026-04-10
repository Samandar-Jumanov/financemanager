interface Props { size?: number; color?: string; }

export default function ChartLogo({ size = 32, color = 'currentColor' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 27h24" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="5.5" y="17" width="5" height="10" rx="1.5" fill={color} opacity="0.4" />
      <rect x="13.5" y="11" width="5" height="16" rx="1.5" fill={color} opacity="0.65" />
      <rect x="21.5" y="5" width="5" height="22" rx="1.5" fill={color} />
      <circle cx="8" cy="13.5" r="2" fill={color} />
      <circle cx="16" cy="7.5" r="2" fill={color} />
      <path d="M8 13.5 L16 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  );
}
