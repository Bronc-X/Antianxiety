# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and API routes (feature folders like `landing/`, `assistant/`, `plans/`).
- `components/`, `hooks/`, `lib/`, `types/`: shared UI, hooks, business logic, and TypeScript types.
- `public/`: static assets.
- `__tests__/`: unit and property-based tests (Vitest + fast-check).
- `supabase/`: SQL and database assets.
- `scripts/`: development/build helpers.
- `android/`, `ios/`, `nomoreanxiousandroid/`, `nomoreanxiousios/`: mobile builds and wrappers.

## Build, Test, and Development Commands
- `npm run dev`: start local Next.js dev server.
- `npm run build`: production build.
- `npm run start`: run production server.
- `npm run lint`: ESLint (Next.js + TypeScript rules).
- `npm test`: run Vitest in CI mode.
- `npm run test:watch`: watch mode.
- `npm run test:coverage`: coverage report.
- `npm run check-env`: validate required environment variables.
- `npm run build:cap` / `npm run cap:sync`: build/sync Capacitor targets.

## Coding Style & Naming Conventions
- TypeScript/React with 2-space indentation and single quotes (follow existing files).
- Prefer named exports for shared utilities in `lib/` and type definitions in `types/`.
- File naming: kebab-case or feature folders under `app/` (e.g., `app/analysis-preview/page.tsx`).
- Linting via `eslint.config.mjs`; keep new code clean and resolve `warn` issues before merge.

## Testing Guidelines
- Frameworks: Vitest + fast-check.
- Test naming: `*.test.ts`, `*.spec.ts`, or `*.property.test.ts` (per `vitest.config.ts`).
- Place tests in `__tests__/` or alongside modules if that is the existing pattern for that area.

## Commit & Pull Request Guidelines
- Commit messages commonly use a loose conventional style: `feat: ...`, `docs: ...`, `sync: ...`, and occasional `feat(ui): ...` or Chinese descriptions. Keep subject lines short and descriptive.
- PRs should include: summary of changes, linked issues (if any), and screenshots for UI changes.
- Call out any schema or environment changes and update relevant docs (e.g., `docs/project/ENV_SETUP.md`, `docs/project/ENV_VARIABLES_QUICK_REFERENCE.md`).

## Security & Configuration Tips
- Store secrets in `.env.local` and never commit it.
- Supabase setup and SQL scripts live in `supabase/`; document schema changes in PRs.
