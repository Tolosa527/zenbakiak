# Project status

## Current state

- **Product:** Zenbakiak, an Euskara-first numbers-learning game for children.
- **Delivery scope:** React + Vite frontend MVP; no accounts or backend.
- **Learning content:** Cardinal numbers 1–9999 sourced from `docs/zenbakiak.md`.
- **Progress:** Assessment-based starting point and per-task progress stored in browser local storage; completed task nodes unlock sequentially within each UNIT.
- **Visual assets:** Sheep character (`public/img/front.png`) shown on the home hero, result screens, and active UNIT task node; each UNIT has its own illustrated landscape and coordinated color theme.
- **Visual style:** Stronger Ikurriña-inspired red and green accents on bright, soft backgrounds.
- **Dependencies:** Vite 8, Vitest 5, and React plugin 6; `npm audit` reports zero vulnerabilities.

## Features

- [x] React + Vite project scaffold
- [x] Shared changelog and session status files
- [x] Placement assessment and number content (1–9999)
- [x] Basque landscape learning path and both lesson exercise types
- [x] UNIT-internal task paths with sequential unlocking and persistent progress
- [x] Distinct illustrated scenery and color palette for every UNIT
- [x] Responsive styling, accessibility, placeholders, and local progress
- [x] Regional red-and-green visual palette
- [x] Tests, production build, and development-server smoke test verified

## Next steps

Replace the character illustration when final assets are available. Backend, account features, and cross-device synchronization remain outside the MVP scope.
