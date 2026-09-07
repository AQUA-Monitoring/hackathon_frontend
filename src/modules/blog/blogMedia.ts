const FALLBACK_API_ORIGIN = 'https://api-aqua.michalski.app'

function getApiOrigin() {
  try {
    return new URL(
      String(import.meta.env.VITE_BASE_URL || '/api/'),
      window.location.origin,
    ).origin
  } catch {
    return FALLBACK_API_ORIGIN
  }
}

export function blogMediaUrl(value: string) {
  try {
    return new URL(value, `${getApiOrigin()}/`).toString()
  } catch {
    return value
  }
}
