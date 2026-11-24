export const ACTIVE_DUTY = [
  'Ancient',
  'Anubis',
  'Cache',
  'Dust II',
  'Inferno',
  'Mirage',
  'Nuke',
] as const

export type ActiveMap = (typeof ACTIVE_DUTY)[number]

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function nowIso() {
  return new Date().toISOString()
}

export function nid() {
  return crypto.randomUUID()
}

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return 'Time not set'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  }).format(new Date(iso))
}

export function formatDay(iso: string | null | undefined) {
  if (!iso) return 'Date open'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(iso))
}

export function scoreLine(home: number | null, away: number | null, forfeited = false) {
  if (forfeited) return 'Forfeit'
  if (home == null || away == null) return '–'
  return `${home}–${away}`
}

export function validMapScore(home: number, away: number): string | null {
  if (!Number.isInteger(home) || !Number.isInteger(away)) return 'Rounds have to be whole numbers.'
  if (home < 0 || away < 0 || home > 99 || away > 99) return 'That round count is outside the book.'
  if (home === away) return 'A map cannot end tied.'
  const hi = Math.max(home, away)
  const lo = Math.min(home, away)
  if (hi === 13 && lo <= 11) return null
  if (hi > 13 && lo >= 12 && hi - lo >= 2) return null
  return 'Regulation is 13–11 or better. Overtime needs both sides at 12 and a two-round lead.'
}

export function scoreboardSvg(home: string, away: string, hs: number, as: number, map: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="400" viewBox="0 0 720 400">
    <rect width="720" height="400" fill="#12101a"/>
    <rect x="16" y="16" width="688" height="368" fill="none" stroke="#e6c56a" stroke-opacity="0.7"/>
    <text x="40" y="58" fill="#b1a8bd" font-family="Georgia, serif" font-size="16" letter-spacing="3">WIZARD &amp; WITCH · SCOREBOARD</text>
    <text x="40" y="96" fill="#f4efe4" font-family="Georgia, serif" font-size="28">${escapeXml(home)}</text>
    <text x="680" y="96" fill="#f4efe4" font-family="Georgia, serif" font-size="28" text-anchor="end">${escapeXml(away)}</text>
    <text x="360" y="210" fill="#e6c56a" font-family="Georgia, serif" font-size="84" text-anchor="middle">${hs}  –  ${as}</text>
    <text x="360" y="280" fill="#5ee0cb" font-family="Georgia, serif" font-size="20" text-anchor="middle" letter-spacing="4">${escapeXml(map.toUpperCase())}</text>
    <text x="40" y="350" fill="#7d758c" font-family="Georgia, serif" font-size="14">Filed for the Ashen Oath · not an official client capture</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function statusLabel(status: string) {
  switch (status) {
    case 'veto':
      return 'Veto open'
    case 'reported':
      return 'Score filed'
    case 'disputed':
      return 'Disputed'
    case 'forfeit':
      return 'Forfeit'
    case 'completed':
      return 'Final'
    case 'scheduled':
      return 'Scheduled'
    case 'registration':
      return 'Registration'
    case 'regular':
      return 'Regular season'
    case 'playoffs':
      return 'Playoffs'
    case 'draft':
      return 'Draft'
    default:
      return status
  }
}
