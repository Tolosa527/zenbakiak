# Changelog

Changes that affect the learner experience are recorded here as features are implemented.

## Unreleased

- Project initialized as a React + Vite frontend MVP.
- Added the 1–9999 Basque number reference, five-step placement assessment, and progressive learning path.
- Added word-block and word-to-number lesson exercises with immediate feedback, retries, lesson completion, and XP.
- Added responsive Euskara-first styling, static character/landscape placeholders, reduced-motion support, and browser-local progress.
- Refreshed the visual palette with stronger Ikurriña-inspired red and green accents on bright, soft backgrounds.
- Added tests for the complete number range and core exercise/placement logic.
- Upgraded Vite, Vitest, and the React Vite plugin to audited versions; `npm audit` now reports no vulnerabilities.
- Added shared session notes in `project-sessions/PROJECT-STATUS.md`.
- Added the sheep character image (`public/img/main_character.gif`) to the home hero and the placement/lesson result screens.
- Restructured each UNIT into 10 tasks with 5 lessons each; a task completes (and awards 10 XP) after its 5 lessons are answered correctly. Legacy 5-task saves are migrated to the 10-task layout.
