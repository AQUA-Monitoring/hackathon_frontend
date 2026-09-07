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

const CANONICAL_TERRITORY_LABELS = new Map<string, string>([
  ['boehmerwaldt', 'Boehmerwald'],
  ['jardim-iririu', 'Jardim Iririú'],
  ['nova brasilia', 'Nova Brasília'],
  ['parque guarani', 'Parque Guarani'],
  ['sao marcos', 'São Marcos'],
  ['ulysses guimaraes', 'Ulysses Guimarães'],
  ['zone industrial 1', 'Zona Industrial Norte'],
  ['zone industrial 2', 'Zona Industrial Tupy'],
])

function formatWord(word: string, index: number) {
  const lowerCase = word.toLocaleLowerCase('pt-BR')
  if (ROMAN_NUMERAL.test(word)) return word.toLocaleUpperCase('pt-BR')
  if (index > 0 && SMALL_WORDS.has(lowerCase)) return lowerCase

  return lowerCase
    .split('-')
    .map((part) => `${part[0]?.toLocaleUpperCase('pt-BR') ?? ''}${part.slice(1)}`)
    .join('-')
}

/** Chave estável para busca e comparação, sem acentos, caixa ou espaços redundantes. */
export function normalizeTerritoryName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
}

/** Normaliza somente o rótulo apresentado, sem modificar ids enviados à API. */
export function formatTerritoryLabel(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) return ''

  const canonical = CANONICAL_TERRITORY_LABELS.get(normalizeTerritoryName(normalized))
  if (canonical) return canonical

  return normalized
    .split(' ')
    .map(formatWord)
    .join(' ')
}
