const COMMON = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function SunIcon() {
  return (
    <svg {...COMMON}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg {...COMMON}>
      <path d="M20 13.4A8.2 8.2 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4Z" />
    </svg>
  )
}

export function ComputerIcon() {
  return (
    <svg {...COMMON}>
      <rect x="2.8" y="4" width="18.4" height="12" rx="1.6" />
      <path d="M8.5 20h7M12 16v4" />
    </svg>
  )
}
