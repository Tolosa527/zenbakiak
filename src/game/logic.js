import { getBasqueNumber, getWordBlocks } from '../data/numbers.js'

export const UNITS = [
  {
    id: 'lehen-urratsak',
    title: 'Lehen urratsak',
    place: 'Mendiko bidea',
    description: '1etik 10era',
    min: 1,
    max: 10,
    scene: 'mountain',
  },
  {
    id: 'itsasertza',
    title: 'Itsasertza',
    place: 'Kostaldea',
    description: '11tik 20ra',
    min: 11,
    max: 20,
    scene: 'coast',
  },
  {
    id: 'baso-berdea',
    title: 'Baso berdea',
    place: 'Harana eta basoa',
    description: '21etik 99ra',
    min: 21,
    max: 99,
    scene: 'forest',
  },
  {
    id: 'hiri-zaharra',
    title: 'Hiri zaharra',
    place: 'Herri eta plazak',
    description: '100etik 999ra',
    min: 100,
    max: 999,
    scene: 'village',
  },
  {
    id: 'izarretara',
    title: 'Izarretara',
    place: 'Mendi tontorra',
    description: '1000tik 9999ra',
    min: 1000,
    max: 9999,
    scene: 'stars',
  },
]

export const LESSON_LENGTH = 5

export function normalizePhrase(phrase) {
  return phrase
    .toLocaleUpperCase('eu')
    .replaceAll(',', '')
    .replace(/\s+/g, ' ')
    .trim()
}

function randomInteger(min, max, random) {
  return min + Math.floor(random() * (max - min + 1))
}

function shuffle(items, random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function getNumberOptions(target, min, max, random) {
  const options = new Set([target])
  let attempts = 0

  while (options.size < Math.min(4, max - min + 1) && attempts < 24) {
    options.add(randomInteger(min, max, random))
    attempts += 1
  }

  for (let candidate = min; options.size < Math.min(4, max - min + 1); candidate += 1) {
    options.add(candidate)
  }

  return shuffle([...options], random)
}

export function createExercise(unitIndex, questionIndex, random = Math.random) {
  const unit = UNITS[unitIndex]
  if (!unit) {
    throw new RangeError('Ikasgaiaren maila ez da baliozkoa.')
  }

  const number = randomInteger(unit.min, unit.max, random)
  const type = questionIndex % 2 === 0 ? 'build-word' : 'choose-number'
  const word = getBasqueNumber(number)

  if (type === 'build-word') {
    return {
      type,
      number,
      word,
      blocks: shuffle(getWordBlocks(number), random),
    }
  }

  return {
    type,
    number,
    word,
    options: getNumberOptions(number, unit.min, unit.max, random),
  }
}

export function createPlacementExercise(unitIndex, random = Math.random) {
  const exercise = createExercise(unitIndex, unitIndex, random)
  return exercise.type === 'build-word'
    ? { ...exercise, type: 'choose-number', options: getNumberOptions(exercise.number, UNITS[unitIndex].min, UNITS[unitIndex].max, random) }
    : { ...exercise, type: 'build-word', blocks: shuffle(getWordBlocks(exercise.number), random) }
}

export function checkExercise(exercise, answer) {
  if (exercise.type === 'build-word') {
    return normalizePhrase(answer) === normalizePhrase(exercise.word)
  }
  return Number(answer) === exercise.number
}

export function getPlacementStartUnit(correctAnswers) {
  return Math.min(correctAnswers, UNITS.length - 1)
}

export function getCurrentUnit(completedUnitIndexes) {
  return UNITS.findIndex((_, index) => !completedUnitIndexes.includes(index))
}
