# Repository Guidelines

## Project Structure & Module Organization
This repository is a small Vite-based map tool for placing and exporting geographic circles. Vite uses `src/` as the app root. Main files are `src/index.html`, `src/index.js`, and `src/index.scss`. Static assets live in `public/`, including the world dataset at `public/data/world.geojson`. Built output goes to `dist/`. The `third_party/d3-thematika/` directory contains a vendored mapping library and type definitions; treat it as external code unless a task explicitly requires changing it.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server from `src/` and open a browser.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the built app locally for a final check.
- `npm run deploy`: publish `dist/` to GitHub Pages with `gh-pages`.

## Coding Style & Naming Conventions
Use ES modules and 2-space indentation, matching the current JS, SCSS, and Vite config. Prefer descriptive camelCase names for variables and functions such as `createGeoCircle` and `updateCircleList`. Keep DOM references near the top of `src/index.js`, group state in the shared `state` object, and keep rendering helpers focused on one responsibility. Write comments sparingly and keep them short. Repository notes in `CLAUDE.md` specify Japanese for code comments, commit messages, and docs; follow that convention when editing existing project text. Contributor-facing responses and agent output should also be written in Japanese because the primary developer is Japanese.

## Testing Guidelines
There is no automated test suite or lint configuration yet. For now, verify changes with `npm run build` and a manual pass in `npm run dev` or `npm run preview`. When adding tests later, place them beside the related module or under a dedicated `tests/` folder, and use file names ending in `.test.js`.

## Commit & Pull Request Guidelines
Git history is minimal and currently uses a short summary style (`first commit`). Keep commit messages brief, imperative, and in Japanese when possible. Pull requests should include the purpose, the files or behaviors changed, manual verification steps, and screenshots or exported output when UI behavior changes.

## Configuration Notes
`vite.config.js` sets `base: "./"`, `root: "src"`, and `publicDir: "../public"`. Preserve these paths unless the deployment model changes.
