import { afterEach, describe, expect, it, vi } from 'vitest'
import { LESSON_LENGTH, UNITS } from './logic.js'
import { DEFAULT_PROGRESS, loadProgress, saveProgress } from './storage.js'

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
    const completedTasks = Array.from({ length: LESSON_LENGTH }, (_, index) => index)

    expect(error).toBeNull()
    expect(progress.completedUnitIndexes).toEqual([0, 2])
    expect(progress.completedTaskIndexesByUnit[0]).toEqual(completedTasks)
    expect(progress.completedTaskIndexesByUnit[1]).toEqual([])
    expect(progress.completedTaskIndexesByUnit[2]).toEqual(completedTasks)
    expect(progress.xp).toBe(40)
  })

  it('loads and saves partial task progress without losing unit or XP data', () => {
    const storage = setSavedProgress({
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
})
