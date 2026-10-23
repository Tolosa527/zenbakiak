import { useEffect, useState } from 'react'
import {
  checkExercise,
  completeTask,
  createExercise,
  createPlacementExercise,
  getCurrentUnit,
  getNextTaskIndex,
  getPlacementStartUnit,
  LESSON_LENGTH,
  UNITS,
} from './game/logic.js'
import { DEFAULT_PROGRESS, loadProgress, saveProgress } from './game/storage.js'

function Header({ progress, onGoHome }) {
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={onGoHome} aria-label="Hasierara joan">
        <span className="brand-mark" aria-hidden="true">Z</span>
        <span>ZENBAKIAK</span>
      </button>
      <div className="header-stats" aria-label="Ikaskuntza-aurrerapena">
        <span className="stat-pill">
          <span aria-hidden="true">✦</span> {progress.xp} XP
        </span>
      </div>
    </header>
  )
}

function CharacterPlaceholder() {
  return (
    <div className="character-placeholder">
      <img className="character-image" src="/img/front.webp" alt="Ardi pertsonaia" />
    </div>
  )
}

function HomeScreen({ progress, onStartAssessment, onGoToPath }) {
  const currentUnitIndex = getCurrentUnit(progress.completedUnitIndexes)
  const hasProgress = progress.xp > 0 || progress.completedTaskIndexesByUnit.some((tasks) => tasks.length > 0)

  return (
    <main className="page-shell home-screen">
      <section className="hero panel">
        <div className="hero-copy">
          <p className="eyebrow">EUSKARAZ IKASI, JOLASTUZ</p>
          <h1>Zenbakiak ikasi Euskal Herrian barrena!</h1>
          <p className="hero-description">
            Egin aurrera paisaiaz paisaia, eta ezagutu euskarazko zenbakiak urratsez urrats.
          </p>
          <div className="hero-actions">
            <button className="button button-primary button-large" type="button" onClick={onGoToPath}>
              {hasProgress ? 'Bidearekin jarraitu' : 'Bidaia hasi'}
            </button>
            <button className="button button-secondary button-large" type="button" onClick={onStartAssessment}>
              {hasProgress ? 'Maila-proba egin' : 'Nire maila ezagutu'}
            </button>
          </div>
          <p className="small-note">
            {hasProgress && currentUnitIndex >= 0
              ? `Hurrengo geltokia: ${UNITS[currentUnitIndex].place}`
              : 'Ez dago presarik: ikasi zure erritmoan.'}
          </p>
        </div>
        <div className="hero-art">
          <img className="hero-landscape" src="/img/scenes/coast.jpeg" alt="Kostaldeko paisaia" />
          <CharacterPlaceholder />
          <div className="hero-number-bubble" aria-hidden="true">1 · 2 · 3</div>
        </div>
      </section>

      <section className="home-feature-grid" aria-label="Jokoaren ezaugarriak">
        <article className="feature-card panel">
          <span className="feature-icon" aria-hidden="true">🧩</span>
          <h2>Hitzak osatu</h2>
          <p>Zenbakia ikusita, jarri hitz-blokeak ordenan.</p>
        </article>
        <article className="feature-card panel">
          <span className="feature-icon" aria-hidden="true">🔎</span>
          <h2>Zenbakia aurkitu</h2>
          <p>Irakurri euskarazko hitza eta hautatu zenbakia.</p>
        </article>
        <article className="feature-card panel">
          <span className="feature-icon" aria-hidden="true">🗺️</span>
          <h2>Euskal Herrian barrena</h2>
          <p>Ikasgai bakoitzak bideko hurrengo paisaiara eramango zaitu.</p>
        </article>
      </section>
    </main>
  )
}

function ProgressBar({ current, total, label }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
    >
      <span className="progress-fill" style={{ width: `${(current / total) * 100}%` }} />
    </div>
  )
}

function ExerciseCard({ exercise, onComplete, retryOnWrong = true, step, total }) {
  const [selectedBlocks, setSelectedBlocks] = useState([])
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    setSelectedBlocks([])
    setSelectedNumber(null)
    setFeedback(null)
  }, [exercise])

  const isBuildTask = exercise.type === 'build-word'
  const targetBlockCount = exercise.word.replaceAll(',', '').split(/\s+/).length
  const availableBlocks = isBuildTask
    ? exercise.blocks.filter((block) => !selectedBlocks.some((selected) => selected.id === block.id))
    : []
  const hasAnswer = isBuildTask ? selectedBlocks.length === targetBlockCount : selectedNumber !== null

  function submitAnswer() {
    const answer = isBuildTask
      ? selectedBlocks.map((block) => block.text).join(' ')
      : selectedNumber
    setFeedback(checkExercise(exercise, answer))
  }

  function moveForward() {
    if (feedback === false && retryOnWrong) {
      setSelectedBlocks([])
      setSelectedNumber(null)
      setFeedback(null)
      return
    }
    onComplete(feedback)
  }

  return (
    <section className="exercise-card panel" aria-labelledby="exercise-title">
      <div className="exercise-topline">
        <span className="eyebrow">{step ? `IKASGAIA · ${step}/${total}` : 'MAILA-PROBA'}</span>
        {step && <span className="exercise-count">{step} / {total}</span>}
      </div>
      <ProgressBar current={step ? step - 1 : 0} total={total} label="Ikasgaiaren aurrerapena" />
      <h1 id="exercise-title">
        {isBuildTask ? 'Osatu hitza zenbakiarekin' : 'Aurkitu zenbakia hitzetik abiatuta'}
      </h1>
      <p className="exercise-instruction">
        {isBuildTask ? 'Sakatu blokeak hitza osatzeko.' : 'Zein zenbaki da hitz honen esanahia?'}
      </p>

      <div className="question-prompt">
        {isBuildTask ? (
          <span className="prompt-number">{exercise.number}</span>
        ) : (
          <span className="prompt-word">{exercise.word}</span>
        )}
      </div>

      {isBuildTask ? (
        <div className="word-builder" aria-label="Hitz-blokeen erantzuna">
          <div className="answer-slots">
            {Array.from({ length: targetBlockCount }, (_, index) => {
              const block = selectedBlocks[index]
              return block ? (
                <button
                  className="word-tile selected-tile"
                  key={block.id}
                  type="button"
                  onClick={() => setSelectedBlocks((items) => items.filter((item) => item.id !== block.id))}
                  aria-label={`${block.text} kendu`}
                >
                  {block.text}
                </button>
              ) : (
                <span className="empty-slot" key={`slot-${index}`} aria-hidden="true" />
              )
            })}
          </div>
          <div className="block-bank" aria-label="Aukeratu hitz-bloke bat">
            {availableBlocks.map((block) => (
              <button
                className="word-tile"
                key={block.id}
                type="button"
                onClick={() => setSelectedBlocks((items) => [...items, block])}
              >
                {block.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="number-options" role="group" aria-label="Aukeratu zenbakia">
          {exercise.options.map((option) => (
            <button
              className={`number-option ${selectedNumber === option ? 'is-selected' : ''}`}
              key={option}
              type="button"
              aria-pressed={selectedNumber === option}
              onClick={() => setSelectedNumber(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="exercise-feedback" aria-live="polite">
        {feedback === true && <p className="feedback-correct">Oso ondo! Erantzun zuzena da. ✨</p>}
        {feedback === false && (
          <p className="feedback-wrong">
            {retryOnWrong ? 'Ia-ia! Begiratu blokeak eta saiatu berriro.' : `Erantzun zuzena: ${exercise.number}.`}
          </p>
        )}
      </div>

      <div className="exercise-actions">
        {feedback === null ? (
          <button className="button button-primary" type="button" disabled={!hasAnswer} onClick={submitAnswer}>
            Erantzuna egiaztatu
          </button>
        ) : (
          <button
            className={`button ${feedback ? 'button-primary' : 'button-secondary'}`}
            type="button"
            onClick={moveForward}
          >
            {feedback ? 'Jarraitu' : retryOnWrong ? 'Saiatu berriro' : 'Probako emaitza ikusi'}
          </button>
        )}
      </div>
    </section>
  )
}

function PathScreen({ progress, onStartLesson }) {
  const currentUnitIndex = getCurrentUnit(progress.completedUnitIndexes)
  const allComplete = currentUnitIndex === -1

  return (
    <main className="page-shell path-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ZURE IKASKUNTZA-BIDEA</p>
          <h1>Paisaiaz paisaia, zenbakiz zenbaki</h1>
          <p className="muted-copy">Osatu UNIT bakoitzeko urratsak eta desblokeatu hurrengo geltokia.</p>
        </div>
      </div>

      {allComplete && (
        <div className="completion-banner" role="status">
          <strong>Zenbaki-bidea osatu duzu!</strong>
          <span>Primeran! Errepikatu nahi duzun geltokia hauta dezakezu.</span>
        </div>
      )}

      <div className="path-list">
        {UNITS.map((unit, index) => {
          const completed = progress.completedUnitIndexes.includes(index)
          const locked = !completed && !allComplete && index > currentUnitIndex
          const active = !completed && !locked
          const completedTasks = progress.completedTaskIndexesByUnit[index]
          const nextTaskIndex = getNextTaskIndex(completedTasks)
          const unitComplete = completed || nextTaskIndex === -1
          return (
            <article className={`path-stop scene-${unit.scene} ${active ? 'is-active' : ''} ${completed ? 'is-complete' : ''} ${locked ? 'is-locked' : ''}`} key={unit.id}>
              <div className="path-node-column" aria-hidden="true">
                <span className="path-node">{completed ? '✓' : locked ? '· · ·' : index + 1}</span>
                {index < UNITS.length - 1 && <span className="path-connector" />}
              </div>
              <div className="path-stop-card panel">
                <div className="path-stop-content">
                  <div className="path-stop-heading">
                    <div>
                      <p className="eyebrow">{unit.place.toLocaleUpperCase('eu')}</p>
                      <h2>{unit.title}</h2>
                    </div>
                    <span className={`status-badge ${completed ? 'badge-complete' : locked ? 'badge-locked' : 'badge-current'}`}>
                      {unitComplete ? 'OSATUTA' : locked ? 'ITXITA' : 'ZURE TXANDA'}
                    </span>
                  </div>
                  <p className="muted-copy">{unit.description} · {completedTasks.length}/{LESSON_LENGTH} urrats</p>
                  <div className="unit-task-path" role="group" aria-label={`${unit.title} UNITeko jarduera-bidea`}>
                    {Array.from({ length: LESSON_LENGTH }, (_, taskIndex) => {
                      const taskComplete = completedTasks.includes(taskIndex)
                      const taskActive = !locked && !unitComplete && taskIndex === nextTaskIndex
                      const taskLocked = locked || (!unitComplete && taskIndex > nextTaskIndex)
                      return (
                        <div className="task-node-wrap" key={taskIndex}>
                          <button
                            className={`task-node ${taskComplete ? 'is-complete' : ''} ${taskActive ? 'is-active' : ''}`}
                            type="button"
                            aria-label={`${taskIndex + 1}. urratsa${taskComplete ? ', osatuta' : taskActive ? ', hasi' : ', blokeatuta'}`}
                            aria-current={taskActive ? 'step' : undefined}
                            disabled={taskLocked}
                            onClick={() => onStartLesson(index, taskIndex)}
                          >
                            {taskComplete ? '✓' : taskIndex + 1}
                          </button>
                          {taskActive && <img className="task-node-sheep" src="/img/front.png" alt="" aria-hidden="true" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}

function PlacementResult({ startUnit, correctAnswers, onChoose, onBack }) {
  const unit = UNITS[startUnit]
  return (
    <main className="page-shell centered-screen">
      <section className="result-card panel">
        <div className="result-icon"><img src="/img/front.png" alt="" /></div>
        <p className="eyebrow">MAILA-PROBA AMAITUTA</p>
        <h1>{correctAnswers} / {UNITS.length} erantzun zuzen</h1>
        <p className="result-copy">
          Zure abiapuntu gomendatua <strong>{unit.title}</strong> da ({unit.description}).
          Nahi baduzu, aurreko urratsak ere egin ditzakezu.
        </p>
        <div className="result-actions">
          <button className="button button-primary button-large" type="button" onClick={() => onChoose(startUnit)}>
            Maila honekin hasi
          </button>
          <button className="button button-secondary" type="button" onClick={() => onChoose(0)}>
            Lehen urratsetatik hasi
          </button>
          <button className="text-button" type="button" onClick={onBack}>Hasierara itzuli</button>
        </div>
      </section>
    </main>
  )
}

function TaskComplete({ unit, taskIndex, unitComplete, allUnitsComplete, xpEarned, onContinue }) {
  return (
    <main className="page-shell centered-screen">
      <section className="result-card panel">
        <div className="result-icon"><img src="/img/front.png" alt="" /></div>
        <p className="eyebrow">{allUnitsComplete ? 'BIDEA OSATUTA' : unitComplete ? 'UNITA OSATUTA' : 'URRATSA OSATUTA'}</p>
        <h1>{unitComplete ? `Primeran, ${unit.title} amaitu duzu!` : `${taskIndex + 1}. urratsa osatuta!`}</h1>
        <p className="result-copy">
          {xpEarned > 0 && `+${xpEarned} XP. `}
          {allUnitsComplete
            ? 'Zenbaki-bide osoa osatu duzu!'
            : unitComplete
              ? 'Hurrengo UNITa desblokeatu da!'
              : 'Bideko hurrengo urratsa zabaldu da!'}
        </p>
        <button className="button button-primary button-large" type="button" onClick={onContinue}>
          Bidera itzuli
        </button>
      </section>
    </main>
  )
}

export default function App() {
  const [initialStorage] = useState(loadProgress)
  const [progress, setProgress] = useState(() => initialStorage.progress || DEFAULT_PROGRESS)
  const [storageError, setStorageError] = useState(initialStorage.error)
  const [screen, setScreen] = useState('home')
  const [placementIndex, setPlacementIndex] = useState(0)
  const [placementCorrect, setPlacementCorrect] = useState(0)
  const [placementExercise, setPlacementExercise] = useState(null)
  const [placementStartUnit, setPlacementStartUnit] = useState(0)
  const [lessonUnitIndex, setLessonUnitIndex] = useState(0)
  const [lessonStep, setLessonStep] = useState(0)
  const [lessonExercise, setLessonExercise] = useState(null)
  const [taskCompletion, setTaskCompletion] = useState(null)

  useEffect(() => {
    setStorageError(saveProgress(progress))
  }, [progress])

  function beginPlacement() {
    setPlacementIndex(0)
    setPlacementCorrect(0)
    setPlacementExercise(createPlacementExercise(0))
    setScreen('assessment')
  }

  function finishPlacement(startUnit) {
    setPlacementStartUnit(startUnit)
    setScreen('placement-result')
  }

  function answerPlacement(correct) {
    if (!correct) {
      finishPlacement(getPlacementStartUnit(placementCorrect))
      return
    }

    const nextCorrect = placementCorrect + 1
    setPlacementCorrect(nextCorrect)
    if (nextCorrect >= UNITS.length) {
      finishPlacement(getPlacementStartUnit(nextCorrect))
      return
    }

    setPlacementIndex(nextCorrect)
    setPlacementExercise(createPlacementExercise(nextCorrect))
  }

  function chooseStartingPoint(startUnit) {
    const knownUnits = Array.from({ length: startUnit }, (_, index) => index)
    setProgress((current) => ({
      ...current,
      completedUnitIndexes: [...new Set([...current.completedUnitIndexes, ...knownUnits])].sort((a, b) => a - b),
      completedTaskIndexesByUnit: current.completedTaskIndexesByUnit.map((tasks, index) =>
        knownUnits.includes(index) ? Array.from({ length: LESSON_LENGTH }, (_, taskIndex) => taskIndex) : tasks),
    }))
    setScreen('path')
  }

  function startLesson(unitIndex, taskIndex) {
    setLessonUnitIndex(unitIndex)
    setLessonStep(taskIndex)
    setLessonExercise(createExercise(unitIndex, taskIndex))
    setScreen('lesson')
  }

  function answerLesson(correct) {
    if (!correct) {
      return
    }

    const completion = completeTask(progress, lessonUnitIndex, lessonStep)
    setProgress(completion.progress)
    setTaskCompletion({
      taskIndex: lessonStep,
      unitComplete: completion.unitComplete,
      allUnitsComplete: completion.unitComplete && lessonUnitIndex === UNITS.length - 1,
      xpEarned: completion.xpEarned,
    })
    setScreen('task-complete')
  }

  return (
    <>
      <Header progress={progress} onGoHome={() => setScreen('home')} />
      {storageError && (
        <p className="storage-warning" role="status">{storageError}</p>
      )}
      {screen === 'home' && (
        <HomeScreen
          progress={progress}
          onStartAssessment={beginPlacement}
          onGoToPath={() => setScreen('path')}
        />
      )}
      {screen === 'assessment' && placementExercise && (
        <main className="page-shell centered-screen">
          <button className="back-button" type="button" onClick={() => setScreen('home')}>← Hasierara itzuli</button>
          <ExerciseCard
            exercise={placementExercise}
            onComplete={answerPlacement}
            retryOnWrong={false}
            step={placementIndex + 1}
            total={UNITS.length}
          />
        </main>
      )}
      {screen === 'placement-result' && (
        <PlacementResult
          startUnit={placementStartUnit}
          correctAnswers={placementCorrect}
          onChoose={chooseStartingPoint}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'path' && <PathScreen progress={progress} onStartLesson={startLesson} />}
      {screen === 'lesson' && lessonExercise && (
        <main className={`page-shell centered-screen lesson-screen scene-${UNITS[lessonUnitIndex].scene}`}>
          <button className="back-button" type="button" onClick={() => setScreen('path')}>← Bidera itzuli</button>
          <ExerciseCard
            exercise={lessonExercise}
            onComplete={answerLesson}
            retryOnWrong
            step={lessonStep + 1}
            total={LESSON_LENGTH}
          />
        </main>
      )}
      {screen === 'task-complete' && taskCompletion && (
        <TaskComplete
          unit={UNITS[lessonUnitIndex]}
          {...taskCompletion}
          onContinue={() => setScreen('path')}
        />
      )}
      <footer className="site-footer">Zenbakiak · Euskaraz ikasteko abentura</footer>
    </>
  )
}
