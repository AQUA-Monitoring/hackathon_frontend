const SMALL_WORDS = new Set([
  'a',
  'ao',
  'aos',
  'as',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'na',
  'nas',
  'no',
  'nos',
])

const ROMAN_NUMERAL = /^(?=[ivxlcdm]+$)[ivxlcdm]+$/i

function formatWord(word: string, index: number) {
  const lowerCase = word.toLocaleLowerCase('pt-BR')
  if (ROMAN_NUMERAL.test(word)) return word.toLocaleUpperCase('pt-BR')
  if (index > 0 && SMALL_WORDS.has(lowerCase)) return lowerCase

  return lowerCase
    .split('-')
    .map((part) => `${part[0]?.toLocaleUpperCase('pt-BR') ?? ''}${part.slice(1)}`)
    .join('-')
}

/** Normaliza somente o rótulo apresentado, sem modificar ids ou valores enviados à API. */
export function formatTerritoryLabel(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) return ''

  return normalized.split(' ').map(formatWord).join(' ')
}
