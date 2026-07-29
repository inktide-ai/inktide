# Lint suppressions baseline

`eslint-suppressions.json` records violations that already existed when the
ESLint 9 flat config was introduced. It is ESLint's own bulk-suppression
mechanism (`--suppress-rule`), not a rule downgrade: every rule below is still
`error`, and any **new** violation fails the build immediately.

## What is in the baseline

67 violations across 48 files, all from the React Compiler rule family that
`eslint-plugin-react-hooks` v6 introduced:

| Rule | Count |
| --- | --- |
| `react-hooks/set-state-in-effect` | 42 |
| `react-hooks/refs` | 18 |
| `react-hooks/purity` | 3 |
| `react-hooks/preserve-manual-memoization` | 3 |
| `react-hooks/immutability` | 1 |

These report patterns that block React Compiler optimisation. They are not
latent crashes, unlike `react-hooks/rules-of-hooks`, which was fixed outright
rather than suppressed.

The baseline is deliberately scoped to those five rules. Any violation of any
other rule is not suppressed and fails straight away.

## Working with it

Fixing a file and leaving its entry behind is caught by:

```bash
npm run lint -- --prune-suppressions
```

Re-baselining after a deliberate change:

```bash
npx eslint . --suppress-rule react-hooks/set-state-in-effect \
             --suppress-rule react-hooks/refs \
             --suppress-rule react-hooks/purity \
             --suppress-rule react-hooks/preserve-manual-memoization \
             --suppress-rule react-hooks/immutability
```

## Burning it down

Each entry is an independent refactor, so the file count only shrinks. Most of
`set-state-in-effect` is the `useEffect(() => setX(...), [dep])` shape, which
usually becomes derived state computed during render. Do it per component with
the component's own tests in place — a bulk rewrite of 42 effects cannot be
verified by the current suite.
