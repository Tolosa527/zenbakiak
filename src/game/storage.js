import { TASKS_PER_UNIT, UNITS } from './logic.js'

const STORAGE_KEY = 'zenbakiak-progress-v1'
export const PLAYERS_STORAGE_KEY = 'zenbakiak-players-v1'

export const DEFAULT_PROGRESS = {
  version: 2,
  completedUnitIndexes: [],
  completedTaskIndexesByUnit: UNITS.map(() => []),
  xp: 0,
}

function getCompleteTaskIndexes() {
  return Array.from({ length: TASKS_PER_UNIT }, (_, index) => index)
}

function parseProgress(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { progress: DEFAULT_PROGRESS, error: 'Gordetako aurrerapena ezin izan da irakurri.' }
  }

  if (!Array.isArray(parsed.completedUnitIndexes) ||
      !parsed.completedUnitIndexes.every(Number.isInteger) ||
      !Number.isFinite(parsed.xp) ||
      (parsed.completedTaskIndexesByUnit !== undefined &&
        (!Array.isArray(parsed.completedTaskIndexesByUnit) ||
          parsed.completedTaskIndexesByUnit.some((tasks) => !Array.isArray(tasks) ||
            !tasks.every((task) => Number.isInteger(task) && task >= 0 && task < TASKS_PER_UNIT * 2))))) {
    return { progress: DEFAULT_PROGRESS, error: 'Gordetako aurrerapena ezin izan da irakurri.' }
  }

  const completedTaskIndexesByUnit = UNITS.map((_, unitIndex) => {
    if (parsed.completedUnitIndexes.includes(unitIndex)) {
      return getCompleteTaskIndexes()
    }

    const saved = parsed.completedTaskIndexesByUnit?.[unitIndex] || []
    // Legacy saves had 5 one-lesson tasks per unit; each now maps to two tasks.
    const migrated = parsed.version === 2
      ? saved
      : saved.flatMap((task) => [task * 2, task * 2 + 1])
    return [...new Set(migrated.filter((task) => task < TASKS_PER_UNIT))].sort((a, b) => a - b)
  })
  const completedUnitIndexes = completedTaskIndexesByUnit
    .map((tasks, index) => tasks.length === TASKS_PER_UNIT ? index : -1)
    .filter((index) => index >= 0)

  return {
    progress: {
      version: 2,
      completedUnitIndexes,
      completedTaskIndexesByUnit,
      xp: Math.max(0, parsed.xp),
    },
    error: null,
  }
}

function readLegacyProgress() {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    return { progress: DEFAULT_PROGRESS, error: null, hasSavedProgress: false }
  }

  try {
    const parsed = JSON.parse(saved)
    const result = parseProgress(parsed)
    return { ...result, hasSavedProgress: true }
  } catch {
    return {
      progress: DEFAULT_PROGRESS,
      error: 'Aurrerapena ezin izan da gorde nabigatzaile honetan.',
      hasSavedProgress: true,
    }
  }
}

export function loadProgress() {
  try {
    return readLegacyProgress()
  } catch {
    return { progress: DEFAULT_PROGRESS, error: 'Aurrerapena ezin izan da irakurri.' }
  }
}

function normalizePlayerName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ')
}

function playerKey(name) {
  return normalizePlayerName(name).toLocaleLowerCase('eu')
}

function parsePlayers(parsed) {
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.players)) {
    return { players: [], lastUser: null, error: 'Gordetako jokalariak ezin izan dira irakurri.' }
  }

  const keys = new Set()
  const players = []
  for (const player of parsed.players) {
    const name = normalizePlayerName(player?.name)
    const key = playerKey(name)
    if (!name || keys.has(key)) {
      return { players: [], lastUser: null, error: 'Gordetako jokalariak ezin izan dira irakurri.' }
    }

    const progress = parseProgress(player.progress)
    if (progress.error) {
      return { players: [], lastUser: null, error: progress.error }
    }

    keys.add(key)
    players.push({ name, progress: progress.progress })
  }

  const lastUser = normalizePlayerName(parsed.lastUser)
  const currentPlayer = players.find((player) => playerKey(player.name) === playerKey(lastUser))
  return {
    players,
    lastUser: currentPlayer?.name || null,
    error: null,
  }
}

export function loadPlayerSession() {
  try {
    const saved = window.localStorage.getItem(PLAYERS_STORAGE_KEY)
    if (!saved) {
      const legacy = readLegacyProgress()
      return {
        players: [],
        lastUser: null,
        currentProgress: null,
        legacyProgress: legacy.progress,
        error: legacy.error,
        hasLegacyProgress: legacy.hasSavedProgress,
      }
    }

    const parsed = parsePlayers(JSON.parse(saved))
    const currentPlayer = parsed.players.find((player) => player.name === parsed.lastUser)
    return {
      ...parsed,
      currentProgress: currentPlayer?.progress || null,
      legacyProgress: DEFAULT_PROGRESS,
      hasLegacyProgress: false,
    }
  } catch {
    return {
      players: [],
      lastUser: null,
      currentProgress: null,
      legacyProgress: DEFAULT_PROGRESS,
      hasLegacyProgress: false,
      error: 'Aurrerapena ezin izan da irakurri.',
    }
  }
}

export function savePlayerProgress(name, progress) {
  const normalizedName = normalizePlayerName(name)
  if (!normalizedName) {
    return 'Jokalariaren izena beharrezkoa da.'
  }

  try {
    const saved = window.localStorage.getItem(PLAYERS_STORAGE_KEY)
    const parsed = saved ? parsePlayers(JSON.parse(saved)) : { players: [], error: null }
    if (parsed.error) {
      return parsed.error
    }

    const players = [...parsed.players]
    const existingIndex = players.findIndex((player) => playerKey(player.name) === playerKey(normalizedName))
    const player = { name: normalizedName, progress }
    if (existingIndex >= 0) {
      players[existingIndex] = player
    } else {
      players.push(player)
    }

    window.localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify({
      version: 1,
      lastUser: normalizedName,
      players,
    }))
    return null
  } catch {
    return 'Aurrerapena ezin izan da gorde nabigatzaile honetan.'
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
