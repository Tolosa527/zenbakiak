const STORAGE_KEY = 'zenbakiak-progress-v1'

export const DEFAULT_PROGRESS = {
  completedUnitIndexes: [],
  xp: 0,
}

export function loadProgress() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return { progress: DEFAULT_PROGRESS, error: null }
    }

    const parsed = JSON.parse(saved)
    if (
      !Array.isArray(parsed.completedUnitIndexes) ||
      !parsed.completedUnitIndexes.every(Number.isInteger) ||
      !Number.isFinite(parsed.xp)
    ) {
      return { progress: DEFAULT_PROGRESS, error: 'Gordetako aurrerapena ezin izan da irakurri.' }
    }

    return {
      progress: {
        completedUnitIndexes: [...new Set(parsed.completedUnitIndexes)],
        xp: Math.max(0, parsed.xp),
      },
      error: null,
    }
  } catch {
    return { progress: DEFAULT_PROGRESS, error: 'Aurrerapena ezin izan da gorde nabigatzaile honetan.' }
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    return null
  } catch {
    return 'Aurrerapena ezin izan da gorde nabigatzaile honetan.'
  }
}
