import { afterEach, describe, expect, it, vi } from 'vitest'
import { TASKS_PER_UNIT, UNITS } from './logic.js'
import {
  DEFAULT_PROGRESS,
  loadPlayerSession,
  loadProgress,
  savePlayerProgress,
  saveProgress,
} from './storage.js'

function setSavedProgress(value) {
  const storage = {
    getItem: vi.fn(() => JSON.stringify(value)),
    setItem: vi.fn(),
  }
  vi.stubGlobal('window', { localStorage: storage })
  return storage
}

describe('local progress storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('migrates legacy completed units to completed task nodes', () => {
    setSavedProgress({ completedUnitIndexes: [0, 2], xp: 40 })

    const { progress, error } = loadProgress()
    const completedTasks = Array.from({ length: TASKS_PER_UNIT }, (_, index) => index)

    expect(error).toBeNull()
    expect(progress.completedUnitIndexes).toEqual([0, 2])
    expect(progress.completedTaskIndexesByUnit[0]).toEqual(completedTasks)
    expect(progress.completedTaskIndexesByUnit[1]).toEqual([])
    expect(progress.completedTaskIndexesByUnit[2]).toEqual(completedTasks)
    expect(progress.xp).toBe(40)
  })

  it('migrates legacy 5-task progress to the 10-task layout', () => {
    setSavedProgress({ completedUnitIndexes: [], completedTaskIndexesByUnit: [[0, 1], [], [], [], []], xp: 20 })

    expect(loadProgress().progress.completedTaskIndexesByUnit[0]).toEqual([0, 1, 2, 3])
  })

  it('loads and saves partial task progress without losing unit or XP data', () => {
    const storage = setSavedProgress({
      version: 2,
      completedUnitIndexes: [],
      completedTaskIndexesByUnit: [[0, 1], [], [], [], []],
      xp: 20,
    })

    const { progress } = loadProgress()
    expect(progress.completedTaskIndexesByUnit[0]).toEqual([0, 1])
    expect(progress.completedUnitIndexes).toEqual([])

    expect(saveProgress(progress)).toBeNull()
    expect(storage.setItem).toHaveBeenCalledWith('zenbakiak-progress-v1', JSON.stringify(progress))
  })

  it('provides empty task progress for a new player', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    }
    vi.stubGlobal('window', { localStorage: storage })

    expect(loadProgress().progress).toEqual(DEFAULT_PROGRESS)
    expect(DEFAULT_PROGRESS.completedTaskIndexesByUnit).toHaveLength(UNITS.length)
  })

  it('starts without an active player when no player has been saved', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
    })

    expect(loadPlayerSession()).toMatchObject({
      lastUser: null,
      players: [],
      currentProgress: null,
      hasLegacyProgress: false,
    })
  })

  it('saves separate progress for multiple players and restores the last one', () => {
    const values = new Map()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((key) => values.get(key) || null),
        setItem: vi.fn((key, value) => values.set(key, value)),
      },
    })

    const aliceProgress = { ...DEFAULT_PROGRESS, xp: 30 }
    const bobProgress = { ...DEFAULT_PROGRESS, xp: 70 }
    expect(savePlayerProgress(' Alice ', aliceProgress)).toBeNull()
    expect(savePlayerProgress('Bob', bobProgress)).toBeNull()

    const session = loadPlayerSession()
    expect(session.lastUser).toBe('Bob')
    expect(session.players).toHaveLength(2)
    expect(session.currentProgress.xp).toBe(70)
    expect(session.players.find((player) => player.name === 'Alice').progress.xp).toBe(30)
  })

  it('offers legacy progress to the first player profile', () => {
    const legacy = { completedUnitIndexes: [], completedTaskIndexesByUnit: [[], [], [], [], []], xp: 25 }
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((key) => key === 'zenbakiak-progress-v1' ? JSON.stringify(legacy) : null),
        setItem: vi.fn(),
      },
    })

    const session = loadPlayerSession()
    expect(session.hasLegacyProgress).toBe(true)
    expect(session.legacyProgress.xp).toBe(25)
  })
})
