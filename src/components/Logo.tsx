import { useId } from 'react'

export function Logo({ size = 36 }: { size?: number }) {
  const id = useId().replace(/:/g, '')
  const ticks = Array.from({ length: 7 }, (_, index) => {
    const angle = ((-90 + index * (360 / 7)) * Math.PI) / 180
    return {
      x1: 32 + Math.cos(angle) * 23.2,
      y1: 32 + Math.sin(angle) * 23.2,
      x2: 32 + Math.cos(angle) * 26.2,
      y2: 32 + Math.sin(angle) * 26.2,
    }
  })
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3de9a" />
          <stop offset="1" stopColor="#a6853f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#120f18" stroke={`url(#${id}-gold)`} strokeWidth="1.4" />
      {ticks.map((tick) => (
        <line key={`${tick.x1}-${tick.y1}`} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="#e6c56a" strokeWidth="1.15" />
      ))}
      <path d="M32 16.2 44.8 23.6v15.2L32 47.8 19.2 38.8V23.6Z" fill="none" stroke="#cbb6ff" strokeWidth="1.2" />
      <path d="M29 23.4c5.4.6 8.6 4.6 8.6 8.6s-3.2 8-8.6 8.6c4.6-.4 9-3.5 9-8.6s-4.4-8.2-9-8.6z" fill="#5ee0cb" />
      <path d="M40.4 19.2l.95 2.5 2.6.2-2 1.7.65 2.5-2.2-1.35-2.2 1.35.65-2.5-2-1.7 2.6-.2z" fill="#e6c56a" />
      <path d="M26.4 43.4 37.4 23.6" stroke="#f6f1e6" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
  )
}
