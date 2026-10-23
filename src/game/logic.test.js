import { describe, expect, it } from 'vitest'
import { BASQUE_NUMBERS, getBasqueNumber } from '../data/numbers.js'
import {
  checkExercise,
  completeTask,
  createExercise,
  createPlacementExercise,
  getCurrentUnit,
  getNextTaskIndex,
  getPlacementStartUnit,
  normalizePhrase,
  UNITS,
} from './logic.js'

describe('Basque number reference', () => {
  it('loads every number from 1 through 9999', () => {
    expect(BASQUE_NUMBERS.size).toBe(9999)
    for (let number = 1; number <= 9999; number += 1) {
      expect(getBasqueNumber(number)).toBeTruthy()
    }
  })

  it('preserves the documented forms', () => {
    expect(getBasqueNumber(1)).toBe('BAT')
    expect(getBasqueNumber(21)).toBe('HOGEITA BAT')
    expect(getBasqueNumber(200)).toBe('BERREHUN')
    expect(getBasqueNumber(1001)).toBe('MILA ETA BAT')
    expect(getBasqueNumber(9999)).toBe('BEDERATZI MILA, BEDERATZIEHUN ETA LAUROGEITA HEMERETZI')
  })

  it('rejects values outside the documented range', () => {
    expect(() => getBasqueNumber(0)).toThrow(RangeError)
    expect(() => getBasqueNumber(10000)).toThrow(RangeError)
  })
})

describe('lesson exercises', () => {
  it('creates word-block exercises with the exact documented answer', () => {
    const exercise = createExercise(2, 0, () => 0)
    expect(exercise.type).toBe('build-word')
    expect(exercise.word).toBe(getBasqueNumber(exercise.number))
    expect(checkExercise(exercise, exercise.word)).toBe(true)
    expect(checkExercise(exercise, 'oker')).toBe(false)
  })

  it('creates number-choice exercises with one correct option', () => {
    let seed = 0
    const random = () => ((seed += 0.173) % 1)
    const exercise = createExercise(3, 1, random)
    expect(exercise.type).toBe('choose-number')
    expect(exercise.options).toContain(exercise.number)
    expect(new Set(exercise.options).size).toBe(exercise.options.length)
    expect(checkExercise(exercise, exercise.number)).toBe(true)
    expect(checkExercise(exercise, exercise.options.find((option) => option !== exercise.number))).toBe(false)
  })

  it('accepts comma-free answers without changing the word itself', () => {
    const exercise = {
      type: 'build-word',
      word: getBasqueNumber(1801),
    }
    expect(normalizePhrase(exercise.word)).toBe(normalizePhrase(exercise.word.replace(',', '')))
    expect(checkExercise(exercise, exercise.word.replace(',', ''))).toBe(true)
  })

  it('alternates task types in placement and chooses the first uncompleted unit', () => {
    expect(UNITS).toHaveLength(5)
    expect(createPlacementExercise(0, () => 0).type).toBe('choose-number')
    expect(getPlacementStartUnit(0)).toBe(0)
    expect(getPlacementStartUnit(UNITS.length)).toBe(UNITS.length - 1)
    expect(getCurrentUnit([0, 1])).toBe(2)
    expect(getCurrentUnit(UNITS.map((_, index) => index))).toBe(-1)
  })

  it('unlocks one unit task at a time', () => {
    expect(getNextTaskIndex([])).toBe(0)
    expect(getNextTaskIndex([0, 1, 2])).toBe(3)
    expect(getNextTaskIndex([0, 1, 2, 3, 4])).toBe(-1)
  })

  it('completes a unit in order and awards XP only once per task', () => {
    let progress = {
      completedUnitIndexes: [],
      completedTaskIndexesByUnit: UNITS.map(() => []),
      xp: 0,
    }

    for (let taskIndex = 0; taskIndex < 4; taskIndex += 1) {
      const completion = completeTask(progress, 0, taskIndex)
      expect(completion.unitComplete).toBe(false)
      expect(completion.xpEarned).toBe(10)
      progress = completion.progress
    }

    const finalCompletion = completeTask(progress, 0, 4)
    expect(finalCompletion.unitComplete).toBe(true)
    expect(finalCompletion.progress.completedUnitIndexes).toEqual([0])
    expect(finalCompletion.progress.xp).toBe(50)
    expect(getCurrentUnit(finalCompletion.progress.completedUnitIndexes)).toBe(1)

    const replay = completeTask(finalCompletion.progress, 0, 2)
    expect(replay.xpEarned).toBe(0)
    expect(replay.progress.xp).toBe(50)
  })

  it('rejects skipping a locked task', () => {
    const progress = {
      completedUnitIndexes: [],
      completedTaskIndexesByUnit: UNITS.map(() => []),
      xp: 0,
    }

    expect(() => completeTask(progress, 0, 1)).toThrow(RangeError)
    expect(() => completeTask(progress, 1, 0)).toThrow(RangeError)
  })
})
