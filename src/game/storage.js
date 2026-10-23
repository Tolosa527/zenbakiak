import { LESSON_LENGTH, UNITS } from './logic.js'

const STORAGE_KEY = 'zenbakiak-progress-v1'

export const DEFAULT_PROGRESS = {
  completedUnitIndexes: [],
  completedTaskIndexesByUnit: UNITS.map(() => []),
  xp: 0,
}

function getCompleteTaskIndexes() {
  return Array.from({ length: LESSON_LENGTH }, (_, index) => index)
}

export function loadProgress() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return { progress: DEFAULT_PROGRESS, error: null }
    }

    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed.completedUnitIndexes) ||
      !parsed.completedUnitIndexes.every(Number.isInteger) ||
      !Number.isFinite(parsed.xp) ||
      (parsed.completedTaskIndexesByUnit !== undefined &&
        (!Array.isArray(parsed.completedTaskIndexesByUnit) ||
          parsed.completedTaskIndexesByUnit.some((tasks) => !Array.isArray(tasks) ||
            !tasks.every((task) => Number.isInteger(task) && task >= 0 && task < LESSON_LENGTH))))
    ) {
      return { progress: DEFAULT_PROGRESS, error: 'Gordetako aurrerapena ezin izan da irakurri.' }
    }

    const completedTaskIndexesByUnit = UNITS.map((_, unitIndex) => {
      if (parsed.completedUnitIndexes.includes(unitIndex)) {
        return getCompleteTaskIndexes()
      }

      return [...new Set(parsed.completedTaskIndexesByUnit?.[unitIndex] || [])].sort((a, b) => a - b)
    })
    const completedUnitIndexes = completedTaskIndexesByUnit
      .map((tasks, index) => tasks.length === LESSON_LENGTH ? index : -1)
      .filter((index) => index >= 0)

    return {
      progress: {
        completedUnitIndexes,
        completedTaskIndexesByUnit,
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
