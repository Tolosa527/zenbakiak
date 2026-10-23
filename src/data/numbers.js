import numberSource from '../../docs/zenbakiak.md?raw'

const numberEntries = numberSource
  .split(/\r?\n/)
  .flatMap((line) => {
    const match = line.match(/^(\d+):\s*(.+)$/)
    return match ? [[Number(match[1]), match[2].trim()]] : []
  })

export const BASQUE_NUMBERS = new Map(numberEntries)

if (BASQUE_NUMBERS.size !== 9999) {
  throw new Error(
    `Zenbakien erreferentziak 1-9999 arteko 9999 sarrera behar ditu; ${BASQUE_NUMBERS.size} aurkitu dira.`,
  )
}

export function getBasqueNumber(number) {
  if (!Number.isInteger(number) || number < 1 || number > 9999) {
    throw new RangeError('Zenbakiak 1 eta 9999 artekoa izan behar du.')
  }

  return BASQUE_NUMBERS.get(number)
}

export function getWordBlocks(number) {
  return getBasqueNumber(number)
    .replaceAll(',', '')
    .split(/\s+/)
    .map((text, index) => ({ id: `${index}-${text}`, text }))
}
