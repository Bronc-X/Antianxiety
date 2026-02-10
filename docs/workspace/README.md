# Workspace Guide

This repo now follows a two-layer workflow inspired by Codex Threads.

## Layer 1: Stable Core (big files)
Use these for long-lived architecture, product rules, and implementation truth.

- `docs/project/`: project constitution, deployment, env setup, long-term docs.
- `antianxietynew/`: active iOS product code.
- `supabase/`: schema and SQL assets.
- `README.md`: top-level system overview.

## Layer 2: Threads (small work tasks)
Use `docs/workspace/threads/` for short, scoped task files.

- One thread file per task.
- Keep thread docs focused and disposable.
- Reuse context from core docs, but avoid polluting stable architecture docs.
- Close thread files with clear outcome and follow-ups.

## Naming

- `YYYY-MM-DD-<short-topic>.md`
- Example: `2026-02-10-remove-antios-and-cleanup.md`

## Lifecycle

1. Create thread from template.
2. Work in small iterations.
3. Record decisions and file changes.
4. Mark status as `done`.
5. Keep core docs updated only when changes are long-term.
