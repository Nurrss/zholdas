import points from '../data/route.json'

// Fixed route Taraz -> Almaty, [lng, lat] points (about every 300 m).
export type LngLat = [number, number]
export const routePoints = points as LngLat[]

const R = 6371000
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

export function distance(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1])
  const dLng = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function bearing(a: LngLat, b: LngLat): number {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]))
  const x =
    Math.cos(rad(a[1])) * Math.sin(rad(b[1])) -
    Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]))
  return (deg(Math.atan2(y, x)) + 360) % 360
}

// Distance from start to each point
const cumulative: number[] = [0]
for (let i = 1; i < routePoints.length; i++) {
  cumulative.push(cumulative[i - 1] + distance(routePoints[i - 1], routePoints[i]))
}
export const routeLength = cumulative[cumulative.length - 1]

function angleDiff(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180
}

// Turns: places where the road changes direction a lot
export type Turn = { at: number; dir: 'left' | 'right' }
export const turns: Turn[] = []
for (let i = 1; i < routePoints.length - 1; i++) {
  const d = angleDiff(bearing(routePoints[i - 1], routePoints[i]), bearing(routePoints[i], routePoints[i + 1]))
  if (Math.abs(d) > 35) turns.push({ at: cumulative[i], dir: d > 0 ? 'right' : 'left' })
}

// Position and direction of the car after `meters` from the start
export function positionAt(meters: number): { pos: LngLat; heading: number } {
  const m = Math.max(0, Math.min(meters, routeLength))
  let lo = 0
  let hi = cumulative.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cumulative[mid] <= m) lo = mid
    else hi = mid
  }
  const a = routePoints[lo]
  const b = routePoints[hi]
  const seg = cumulative[hi] - cumulative[lo] || 1
  const t = (m - cumulative[lo]) / seg
  return { pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], heading: bearing(a, b) }
}

export function nextTurn(meters: number): Turn | null {
  return turns.find((t) => t.at > meters + 30) ?? null
}

export { angleDiff }
