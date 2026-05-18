export function formatDuration(mins?: number) {
  if (!mins && mins !== 0) return '-'
  const m = Math.max(0, Math.trunc(mins))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return `${h}h ${rest}m`
}
