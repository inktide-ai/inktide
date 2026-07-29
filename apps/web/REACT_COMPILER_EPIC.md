# Epic: React Compiler compatibility

Tracks the removal of `eslint-suppressions.json`. See
[eslint-suppressions.README.md](./eslint-suppressions.README.md) for how the baseline
mechanism itself works.

**Status:** open — 67 of 67 suppressions remaining.

## Goal

Delete `eslint-suppressions.json` and the machinery around it, with all five React
Compiler rules still set to `error` and `eslint .` passing on its own.

## Problem

`eslint-plugin-react-hooks` v6 ships the React Compiler rule family. Those rules landed
on a codebase that had never been linted with them: the frontend's `.eslintrc.cjs` was a
leftover Vite/React template that required a plugin absent from `devDependencies`, and
`eslint-config-next` was not installed at all, so `npm run lint` failed before checking
anything.

When lint was migrated to an ESLint 9 flat config it reported 87 errors on first run.
Twenty were defects and were fixed outright — including nine `rules-of-hooks` violations
where components called hooks after an early return, which makes React throw
"rendered more hooks than during the previous render" as soon as the guard flips.

The remaining 67 are not latent crashes. They describe patterns that prevent React
Compiler from memoising a component, and in the `set-state-in-effect` case cost an extra
render pass per update. They were not fixed in the same change because the frontend had a
single test file: rewriting 42 effects at once could not have been verified.

Until this Epic closes, React Compiler cannot be enabled — the rules exist to gate
exactly that.

## Scope

67 violations across 48 files.

| Rule | Count | Files | Shape |
| --- | --- | --- | --- |
| `react-hooks/set-state-in-effect` | 42 | 38 | `useEffect(() => setX(dep), [dep])` — state that should be derived during render |
| `react-hooks/refs` | 18 | 6 | props written into a ref during render (the "latest ref" idiom) |
| `react-hooks/purity` | 3 | 3 | `Date.now()` / `Math.random()` called in the render body |
| `react-hooks/preserve-manual-memoization` | 3 | 1 | `useMemo` whose dependencies do not cover what it reads |
| `react-hooks/immutability` | 1 | 1 | a variable reassigned after render completes |

By layer:

| Layer | Violations |
| --- | --- |
| `features/` | 51 |
| `entities/` | 7 |
| `shared/` | 5 |
| `app/` | 3 |
| `widgets/` | 1 |

## Tasks

Ordered by leverage. T1 clears 27% of the debt with one shared hook.

| # | Task | Clears | Size | Risk |
| --- | --- | --- | --- | --- |
| T1 | Add `useLatestRef` and adopt it in 6 files | 18 | M | low |
| T2 | Move `Date.now` / `Math.random` out of render | 3 | S | low |
| T3 | Fix reassignment in `activity-feed` | 1 | S | low |
| T4 | Derive state in `AuthContext` | 5 | L | **high** |
| T5 | `set-state-in-effect` in `features/character-editor` | 8 | M | medium |
| T6 | `set-state-in-effect` in `features/projects` | 5 | M | medium |
| T7 | `set-state-in-effect` in `features/soul` | 5 | M | medium |
| T8 | `set-state-in-effect` in `features/account` | 4 | S | low |
| T9 | `set-state-in-effect` in `app/`, `entities/`, `widgets/` | 7 | M | medium |
| T10 | `set-state-in-effect` in the remaining slices | 11 | M | low |
| T11 | Retire the baseline | 0 | S | low |

Sizes are relative effort, not dates: S is a sitting, M is a focused day, L needs the
component understood before anything is touched.

Every task must leave `eslint-suppressions.json` smaller, lower the number in
`eslint-suppressions.max`, and add tests for any stateful component it rewrites.

---

### T1 — Add `useLatestRef` and adopt it in 6 files

Clears all 18 `react-hooks/refs`.

Six files assign props into refs in the render body so an imperative loop can read the
freshest value without re-subscribing. `features/avatar/renderers/vrm-renderer.tsx:85-90`
and `:101-102` is the densest instance, feeding a three.js animation loop.

Add `shared/hooks/useLatestRef.ts` that performs the write inside an effect with no
dependency array, export it from `shared/hooks/index.ts`, and replace the render-time
assignments.

| File | Violations |
| --- | --- |
| `features/avatar/renderers/vrm-renderer.tsx` | 8 |
| `entities/character/hooks/useCharacters.ts` | 4 |
| `features/brain/hooks/useOllamaCredentials.ts` | 3 |
| `features/avatar/renderers/glb-renderer.tsx` | 1 |
| `features/brain/components/remote-provider-panel.tsx` | 1 |
| `features/projects/hooks/useProjectSnapshotCapture.ts` | 1 |

Tests: `useCharacters.ts` and `vrm-renderer.tsx`.

Watch for: the ref must still hold the latest value by the time the imperative callback
runs. Moving the write to an effect delays it until after commit, which is correct for a
loop started in an effect but wrong for anything reading the ref during the same render.

### T2 — Move `Date.now` / `Math.random` out of render

| File | Call |
| --- | --- |
| `features/projects/project-grid-card-connected.tsx:20` | `Date.now` |
| `features/projects/project-list-row-connected.tsx:20` | `Date.now` |
| `features/workspace-home/tetris-background.tsx:80` | `Math.random` |

The two `Date.now` calls compute relative timestamps; pass the reference time in as a
prop or take it from a `useState` initialiser so a re-render cannot change it. The
`Math.random` seeds a background animation — move the seed into a `useState` initialiser.

### T3 — Fix reassignment in `activity-feed`

`features/soul/activity/components/activity-feed.tsx:43` reassigns `runningIndex` after
render. Compute the indices with a `reduce` or `map` over the source list instead of
mutating a variable across iterations.

### T4 — Derive state in `AuthContext`

Clears 2 `set-state-in-effect` and 3 `preserve-manual-memoization`.

`shared/services/auth/AuthContext.tsx` is the session provider the whole app consumes, so
this is the riskiest task in the Epic. Do it on its own branch.

- `:74` copies the nickname from the session or `localStorage` into state.
- `:108` copies the avatar URL from a `useQuery` result into state.
- `:111` the `useMemo` that builds `UserInfo` reports three
  `preserve-manual-memoization` violations.

Both values should be computed during render from the session and the query result. The
three memoisation violations disappear once `pictureUrl` and `nickname` stop being state.
For the `localStorage` fallback, reuse `shared/hooks/useLocalStorage.ts`, or move it to
`useSyncExternalStore` if the current implementation cannot express a read-only fallback.

Tests: sign-in, sign-out, server nickname taking precedence over the stored one, and an
avatar override replacing the fetched URL.

### T5-T10 — `set-state-in-effect` by slice

Same treatment throughout: the value the effect pushed into state is computed directly
during render from the prop or query result, and the `useState` is deleted.

Before rewriting, check what the effect actually does. Some of these effects also write to
an external system — `localStorage`, the DOM, an analytics call. That part is legitimate
and stays; only the `setState` moves.

**T5 — `features/character-editor`, 8 in 7 files**

`account-avatar-panel.tsx`, `banner-color-picker.tsx`, `hooks/useSceneSettings.ts`,
`hooks/useVoiceSandbox.ts` (2), `tabs/channel-tab.tsx`, `tabs/emotion-panel.tsx`,
`tabs/useModelTab.ts`

**T6 — `features/projects`, 5 in 5 files**

`project-background-page.tsx`, `project-overview-page.tsx`, `setup-checklist.tsx`,
`soul-project-overview-page.tsx`, `soul-projects-page.tsx`

**T7 — `features/soul`, 5 in 5 files**

`components/soul-card.tsx`, `hooks/useVoiceProvider.ts`, `scenes/create-preset-modal.tsx`,
`scenes/scenes-page.tsx`, `scenes/soul-scenes-page.tsx`

`hooks/useVoiceProvider.ts` is consumed by five voice panels; changing its contract
touches all of them.

**T8 — `features/account`, 4 in 4 files**

`edit-profile-modal.tsx`, `panels/profile-panel.tsx`, `panels/sessions-panel.tsx`,
`protected-route.tsx`

`protected-route.tsx` gates authenticated routes — verify redirect behaviour.

**T9 — `app/`, `entities/`, `widgets/`, 7 in 7 files**

`app/(authenticated)/(developer)/developer/layout.tsx`,
`app/(authenticated)/edit/sandbox/_sandbox-layout-client.tsx`,
`app/oauth/authorize/page.tsx`,
`entities/character/hooks/characters/useCharacterMutations.ts`,
`entities/soul/hooks/use-card-model.ts`, `entities/soul/hooks/use-card-scene.ts`,
`widgets/workspace-sidebar/ui/WorkspaceSidebar.tsx`

`app/oauth/authorize/page.tsx` is part of the OAuth consent flow and is covered by the
existing test in `features/soul/channels/__tests__/` — extend it rather than starting over.

**T10 — remaining slices, 11 in 9 files**

`brain/provider-settings-page.tsx` (2), `checkout/checkout-page.tsx` (2),
`invite/invite-page.tsx`, `landing/hero-inktide.tsx`, `landing/navigation-actions.tsx`,
`obs/obs-scene-page.tsx`, `organization/invite-members-modal.tsx`,
`workspace-home/hooks/useSearch.ts`,
`workspace-home/soul-creation-wizard/wizard-discord-config.tsx`

`checkout-page.tsx` handles payment state — test before touching.

### T11 — Retire the baseline

Only after T1-T10 leave the suppressions file empty.

Delete `eslint-suppressions.json`, `eslint-suppressions.max`,
`eslint-suppressions.README.md`, `scripts/check-suppressions-ratchet.mjs`, the ratchet
step in `.github/workflows/ci.yml`, and the now-pointless `--prune-suppressions` flag on
the lint step. Mark this Epic closed.

## Exit criteria

The Epic is done when all of the following hold:

- `eslint-suppressions.json` does not exist
- `eslint-suppressions.max` and the ratchet script do not exist
- `eslint-suppressions.README.md` does not exist
- all five rules are still configured, still at `error`, and none is disabled anywhere
- `npx eslint .` exits 0 with no suppressions file present
- `npm run lint` in CI passes without `--prune-suppressions`

Partial completion is not a pass. A suppression removed by weakening a rule does not
count.

## Progress

| Date | Task | Remaining |
| --- | --- | --- |
| 2026-07-29 | baseline recorded | 67 |
