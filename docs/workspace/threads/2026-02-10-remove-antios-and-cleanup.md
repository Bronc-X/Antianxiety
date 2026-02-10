# Remove antios and repo cleanup

- Status: done
- Owner: codex
- Date: 2026-02-10

## Context

`antios/` is deprecated. Active iOS project is `antianxietynew/`.

## Goal

- Remove deprecated `antios/` from repository.
- Keep branch strategy to two branches on GitHub.
- Introduce threads-style work organization in docs.

## Plan

1. Remove `antios/` from tracked files.
2. Add `docs/workspace/threads` structure.
3. Commit and push to `main`.
4. Delete deprecated remote branch.

## Execution Log

- Moved deprecated `antios/` out of working tree, resulting in full repo deletion tracking for `antios/`.
- Added:
  - `docs/workspace/README.md`
  - `docs/workspace/threads/README.md`
  - `docs/workspace/threads/TEMPLATE.md`
  - `docs/workspace/threads/2026-02-10-remove-antios-and-cleanup.md`

## Result

Repository now has one active iOS app path (`antianxietynew/`) and a threads-style task doc area.

## Next Actions

1. Keep only active branch set on remote.
2. Create future tasks under `docs/workspace/threads/`.
