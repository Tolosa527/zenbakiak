import { useEffect, useState } from 'react'
import {
  checkExercise,
  completeTask,
  createExercise,
  createPlacementExercise,
  getCurrentUnit,
  getNextTaskIndex,
  getPlacementStartUnit,
  LESSONS_PER_TASK,
  TASKS_PER_UNIT,
  UNITS,
} from './game/logic.js'
import { DEFAULT_PROGRESS, loadPlayerSession, savePlayerProgress } from './game/storage.js'

function PlayerIdentity({ lastUser, onSelect }) {
  const [mode, setMode] = useState(lastUser ? 'confirm' : 'name')
  const [name, setName] = useState('')

  function submit(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName) {
      onSelect(trimmedName)
    }
  }

  return (
    <div className="identity-overlay">
      <section className="identity-card panel" role="dialog" aria-modal="true" aria-labelledby="identity-title">
        <p className="eyebrow">ZENBAKIAK</p>
        {mode === 'confirm' ? (
          <>
            <h1 id="identity-title">{lastUser} zara?</h1>
            <p className="identity-copy">Nabigatzaile honetan gordetako zure aurrerapena berreskuratuko dugu.</p>
            <div className="identity-actions">
              <button className="button button-primary" type="button" onClick={() => onSelect(lastUser)}>
                Bai, ni naiz
              </button>
              <button className="button button-secondary" type="button" onClick={() => setMode('name')}>
                Ez, beste norbait naiz
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1 id="identity-title">{lastUser ? 'Nor ari da jolasten?' : 'Nola duzu izena?'}</h1>
            <p className="identity-copy">
              {lastUser
                ? 'Idatzi zure izena aurrerapena berreskuratzeko edo berri bat hasteko.'
                : 'Zure aurrerapena gordeko dugu, hurrengoan jarraitu ahal izan dezazun.'}
            </p>
            <label className="identity-label" htmlFor="player-name">Izena</label>
            <input
              id="player-name"
              className="identity-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              maxLength={40}
              required
            />
            <div className="identity-actions">
              <button className="button button-primary" type="submit">Hasi</button>
              {lastUser && (
                <button className="text-button" type="button" onClick={() => setMode('confirm')}>
                  Itzuli
                </button>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

function Header({ playerName, progress, onGoHome }) {
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={onGoHome} aria-label="Hasierara joan">
        <span className="brand-mark" aria-hidden="true">Z</span>
        <span>ZENBAKIAK</span>
      </button>
      <div className="header-stats" aria-label="Ikaskuntza-aurrerapena">
        {playerName && <span className="header-player">Kaixo, {playerName}!</span>}
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

function HomeScreen({ playerName, progress, onStartAssessment, onGoToPath }) {
  const currentUnitIndex = getCurrentUnit(progress.completedUnitIndexes)
  const hasProgress = progress.xp > 0 || progress.completedTaskIndexesByUnit.some((tasks) => tasks.length > 0)
  const hasPlayerName = Boolean(playerName)

  return (
    <main className="page-shell home-screen">
      <section className="hero panel">
        <div className="hero-copy">
          <p className="eyebrow">
            {hasPlayerName ? `KAIXO, ${playerName.toLocaleUpperCase('eu')}!` : 'EUSKARAZ IKASI, JOLASTUZ'}
          </p>
          <h1>
            {hasPlayerName
              ? `${playerName}, zenbakiak ikasi Euskal Herrian barrena!`
              : 'Zenbakiak ikasi Euskal Herrian barrena!'}
          </h1>
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

function ExerciseCard({ playerName, exercise, onComplete, retryOnWrong = true, step, total, showWaitingCharacter = false }) {
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
  const characterImage = feedback === true
    ? '/img/smiling.png'
    : feedback === false
      ? '/img/sorprise.png'
      : '/img/character_wating.gif'
  const characterAlt = feedback === true
    ? 'Pertsonaia pozik zure erantzunarekin'
    : feedback === false
      ? 'Pertsonaia harrituta dago erantzunarekin'
      : 'Pertsonaia zure erantzunaren zain'

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
    <div className={`exercise-card-frame ${showWaitingCharacter ? 'has-waiting-character' : ''}`}>
      <section className="exercise-card panel" aria-labelledby="exercise-title">
      <div className="exercise-topline">
        <span className="eyebrow">{step ? `IKASGAIA · ${step}/${total}` : 'MAILA-PROBA'}</span>
        {step && <span className="exercise-count">{step} / {total}</span>}
      </div>
      <ProgressBar current={step ? step - 1 : 0} total={total} label="Ikasgaiaren aurrerapena" />
      <h1 id="exercise-title">
        {isBuildTask
          ? `${playerName}, osatu hitza zenbakiarekin`
          : `${playerName}, aurkitu zenbakia hitzetik abiatuta`}
      </h1>
      <p className="exercise-instruction">
        {isBuildTask
          ? `${playerName}, sakatu blokeak hitza osatzeko.`
          : `${playerName}, zein zenbaki da hitz honen esanahia?`}
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
        {feedback === true && <p className="feedback-correct">Oso ondo, {playerName}! Erantzun zuzena da. ✨</p>}
        {feedback === false && (
          <p className="feedback-wrong">
            {retryOnWrong
              ? `${playerName}, ia-ia! Begiratu blokeak eta saiatu berriro.`
              : `${playerName}, erantzun zuzena: ${exercise.number}.`}
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
      {showWaitingCharacter && (
        <img
          className="exercise-waiting-character"
          src={characterImage}
          alt={characterAlt}
        />
      )}
    </div>
  )
}

function PathScreen({ playerName, progress, onStartLesson }) {
  const currentUnitIndex = getCurrentUnit(progress.completedUnitIndexes)
  const allComplete = currentUnitIndex === -1

  return (
    <main className="page-shell path-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ZURE IKASKUNTZA-BIDEA</p>
          <h1>{playerName}, paisaiaz paisaia, zenbakiz zenbaki</h1>
          <p className="muted-copy">{playerName}, osatu UNIT bakoitzeko urratsak eta desblokeatu hurrengo geltokia.</p>
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
                  <p className="muted-copy">{unit.description} · {completedTasks.length}/{TASKS_PER_UNIT} urrats</p>
                  <div className="unit-task-path" role="group" aria-label={`${unit.title} UNITeko jarduera-bidea`}>
                    {Array.from({ length: TASKS_PER_UNIT }, (_, taskIndex) => {
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
                          {taskActive && <img className="task-node-sheep" src="/img/main_character.gif" alt="" aria-hidden="true" />}
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

function PlacementResult({ playerName, startUnit, correctAnswers, onChoose, onBack }) {
  const unit = UNITS[startUnit]
  return (
    <main className="page-shell centered-screen">
      <section className="result-card panel">
        <div className="result-icon"><img src="/img/main_character.gif" alt="" /></div>
        <p className="eyebrow">MAILA-PROBA AMAITUTA</p>
        <h1>{playerName}, {correctAnswers} / {UNITS.length} erantzun zuzen</h1>
        <p className="result-copy">
          {playerName}, zure abiapuntu gomendatua <strong>{unit.title}</strong> da ({unit.description}).
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

function TaskComplete({ playerName, unit, taskIndex, unitComplete, allUnitsComplete, xpEarned, onContinue }) {
  return (
    <main className="page-shell centered-screen">
      <section className="result-card panel">
        <div className="result-icon"><img src="/img/main_character.gif" alt="" /></div>
        <p className="eyebrow">{allUnitsComplete ? 'BIDEA OSATUTA' : unitComplete ? 'UNITA OSATUTA' : 'URRATSA OSATUTA'}</p>
        <h1>
          {unitComplete
            ? `Primeran, ${playerName}! ${unit.title} amaitu duzu!`
            : `${playerName}, ${taskIndex + 1}. urratsa osatuta!`}
        </h1>
        <p className="result-copy">
          {xpEarned > 0 && `${playerName}, +${xpEarned} XP. `}
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
  const [initialStorage] = useState(loadPlayerSession)
  const [activePlayer, setActivePlayer] = useState(null)
  const [identityReady, setIdentityReady] = useState(false)
  const [progress, setProgress] = useState(() => initialStorage.currentProgress || initialStorage.legacyProgress || DEFAULT_PROGRESS)
  const [storageError, setStorageError] = useState(initialStorage.error)
  const [screen, setScreen] = useState('home')
  const [placementIndex, setPlacementIndex] = useState(0)
  const [placementCorrect, setPlacementCorrect] = useState(0)
  const [placementExercise, setPlacementExercise] = useState(null)
  const [placementStartUnit, setPlacementStartUnit] = useState(0)
  const [lessonUnitIndex, setLessonUnitIndex] = useState(0)
  const [lessonTaskIndex, setLessonTaskIndex] = useState(0)
  const [lessonStep, setLessonStep] = useState(0)
  const [lessonExercise, setLessonExercise] = useState(null)
  const [taskCompletion, setTaskCompletion] = useState(null)

  useEffect(() => {
    if (identityReady && activePlayer) {
      setStorageError(savePlayerProgress(activePlayer, progress))
    }
  }, [activePlayer, identityReady, progress])

  function selectPlayer(name) {
    const normalizedName = name.trim().replace(/\s+/g, ' ')
    const existingPlayer = initialStorage.players.find((player) =>
      player.name.toLocaleLowerCase('eu') === normalizedName.toLocaleLowerCase('eu'))
    const nextProgress = existingPlayer
      ? existingPlayer.progress
      : initialStorage.players.length === 0 && initialStorage.hasLegacyProgress
        ? initialStorage.legacyProgress
        : DEFAULT_PROGRESS

    setActivePlayer(normalizedName)
    setProgress(nextProgress)
    setIdentityReady(true)
    setStorageError(savePlayerProgress(normalizedName, nextProgress))
  }

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
        knownUnits.includes(index) ? Array.from({ length: TASKS_PER_UNIT }, (_, taskIndex) => taskIndex) : tasks),
    }))
    setScreen('path')
  }

  function startLesson(unitIndex, taskIndex) {
    setLessonUnitIndex(unitIndex)
    setLessonTaskIndex(taskIndex)
    setLessonStep(0)
    setLessonExercise(createExercise(unitIndex, 0))
    setScreen('lesson')
  }

  function answerLesson(correct) {
    if (!correct) {
      return
    }

    if (lessonStep + 1 < LESSONS_PER_TASK) {
      const nextStep = lessonStep + 1
      setLessonStep(nextStep)
      setLessonExercise(createExercise(lessonUnitIndex, nextStep))
      return
    }

    const completion = completeTask(progress, lessonUnitIndex, lessonTaskIndex)
    setProgress(completion.progress)
    setTaskCompletion({
      taskIndex: lessonTaskIndex,
      unitComplete: completion.unitComplete,
      allUnitsComplete: completion.unitComplete && lessonUnitIndex === UNITS.length - 1,
      xpEarned: completion.xpEarned,
    })
    setScreen('task-complete')
  }

  return (
    <>
      <Header playerName={activePlayer || ''} progress={progress} onGoHome={() => setScreen('home')} />
      {storageError && (
        <p className="storage-warning" role="status">{storageError}</p>
      )}
      {!identityReady && <PlayerIdentity lastUser={initialStorage.lastUser} onSelect={selectPlayer} />}
      {screen === 'home' && (
        <HomeScreen
          playerName={activePlayer}
          progress={progress}
          onStartAssessment={beginPlacement}
          onGoToPath={() => setScreen('path')}
        />
      )}
      {screen === 'assessment' && placementExercise && (
        <main className="page-shell centered-screen">
          <button className="back-button" type="button" onClick={() => setScreen('home')}>← Hasierara itzuli</button>
          <ExerciseCard
            playerName={activePlayer}
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
          playerName={activePlayer}
          startUnit={placementStartUnit}
          correctAnswers={placementCorrect}
          onChoose={chooseStartingPoint}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'path' && (
        <PathScreen playerName={activePlayer} progress={progress} onStartLesson={startLesson} />
      )}
      {screen === 'lesson' && lessonExercise && (
        <main className={`page-shell centered-screen lesson-screen scene-${UNITS[lessonUnitIndex].scene}`}>
          <button className="back-button" type="button" onClick={() => setScreen('path')}>← Bidera itzuli</button>
          <ExerciseCard
            playerName={activePlayer}
            exercise={lessonExercise}
            onComplete={answerLesson}
            retryOnWrong
            step={lessonStep + 1}
            total={LESSONS_PER_TASK}
            showWaitingCharacter
          />
        </main>
      )}
      {screen === 'task-complete' && taskCompletion && (
        <TaskComplete
          playerName={activePlayer}
          unit={UNITS[lessonUnitIndex]}
          {...taskCompletion}
          onContinue={() => setScreen('path')}
        />
      )}
      <footer className="site-footer">Zenbakiak · Euskaraz ikasteko abentura</footer>
    </>
  )
}
