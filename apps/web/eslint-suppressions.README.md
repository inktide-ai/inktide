# Lint suppressions baseline

**This is a temporary measure.** It exists to stop a known, counted set of
pre-existing violations from blocking every other change, and it is deleted when
[REACT_COMPILER_EPIC.md](./REACT_COMPILER_EPIC.md) closes. That Epic owns the
paydown plan; nothing here should outlive it.

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

Two guards keep the baseline honest, both enforced in CI.

Fixing a file and leaving its entry behind is caught by:

```bash
npm run lint -- --prune-suppressions
```

The baseline shrinking is the only direction allowed. `eslint-suppressions.max`
holds the current total and `scripts/check-suppressions-ratchet.mjs` fails when
the file exceeds it, so re-running `--suppress-rule` to bury a fresh violation
cannot pass review unnoticed:

```bash
node scripts/check-suppressions-ratchet.mjs
```

Lower the number in `eslint-suppressions.max` as part of the change that removes
the suppressions. Never raise it.

Regenerating the file — for instance after moving a file that still carries a
suppression. The ratchet still applies afterwards, so this cannot be used to
absorb a new violation:

```bash
npx eslint . --suppress-rule react-hooks/set-state-in-effect \
             --suppress-rule react-hooks/refs \
             --suppress-rule react-hooks/purity \
             --suppress-rule react-hooks/preserve-manual-memoization \
             --suppress-rule react-hooks/immutability
```

## Burning it down

The plan lives in [REACT_COMPILER_EPIC.md](./REACT_COMPILER_EPIC.md): eleven
tasks, ordered by leverage, with the files each one covers and the exit criteria
for deleting this file. It is kept there rather than duplicated here so the two
documents cannot drift apart.
