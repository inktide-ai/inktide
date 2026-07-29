#!/usr/bin/env bash
# Turns REACT_COMPILER_EPIC.md into GitHub issues: one epic plus eleven tasks.
#
# The repository had no remote when the Epic was written, so the plan lives in
# markdown. Run this once a remote exists; the markdown stays the source of
# truth for detail, and each issue links back to it.
#
# Idempotent: an issue whose title already exists is skipped, so re-running
# after adding a task creates only what is missing.
#
# Usage:  ./scripts/create-epic-issues.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

LABEL="react-compiler"
EPIC_DOC="apps/web/REACT_COMPILER_EPIC.md"
EPIC_TITLE="Epic: React Compiler compatibility"

cd "$(dirname "${BASH_SOURCE[0]}")/../../.."

# --- preflight -------------------------------------------------------------

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh is not installed - https://cli.github.com" >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "error: no 'origin' remote. Push the repository to GitHub first;" >&2
  echo "       until then $EPIC_DOC is the plan of record." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh is not authenticated - run 'gh auth login'" >&2
  exit 1
fi

if [[ ! -f "$EPIC_DOC" ]]; then
  echo "error: $EPIC_DOC not found (run from anywhere inside the repo)" >&2
  exit 1
fi

run() {
  if $DRY_RUN; then
    printf 'would run:'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

# Titles are the idempotency key, so they must match the ones below exactly.
issue_exists() {
  gh issue list --search "$1 in:title" --state all --limit 100 \
    --json title --jq '.[].title' 2>/dev/null | grep -Fxq "$1"
}

create_issue() {
  local title="$1" body="$2"
  if issue_exists "$title"; then
    echo "skip (exists): $title"
    return
  fi
  echo "create: $title"
  run gh issue create --title "$title" --body "$body" --label "$LABEL"
}

# --- label -----------------------------------------------------------------

if ! gh label list --limit 200 --json name --jq '.[].name' 2>/dev/null | grep -Fxq "$LABEL"; then
  echo "create label: $LABEL"
  run gh label create "$LABEL" \
    --description "Removing the ESLint suppressions baseline" \
    --color "1D76DB"
fi

# --- epic ------------------------------------------------------------------

create_issue "$EPIC_TITLE" "$(cat <<EOF
Remove \`apps/web/eslint-suppressions.json\` with all five React Compiler rules
still set to \`error\`.

67 pre-existing violations were recorded when the ESLint 9 flat config was
introduced, because the frontend had never been linted with these rules and a
single test file could not verify rewriting 42 effects at once.

Full scope, per-task file lists and exit criteria: [\`$EPIC_DOC\`](../blob/main/$EPIC_DOC)

Exit criteria:

- [ ] \`eslint-suppressions.json\` deleted
- [ ] \`eslint-suppressions.max\` and \`scripts/check-suppressions-ratchet.mjs\` deleted
- [ ] \`eslint-suppressions.README.md\` deleted
- [ ] all five rules still configured at \`error\`
- [ ] \`npx eslint .\` exits 0 with no suppressions file
- [ ] CI lint step no longer needs \`--prune-suppressions\`

Tasks are tracked as separate issues under the \`$LABEL\` label.
EOF
)"

# --- tasks -----------------------------------------------------------------
# Each entry: title | clears | size | risk | body
# Keep in step with the Tasks table in $EPIC_DOC.

task() {
  local id="$1" title="$2" clears="$3" size="$4" risk="$5" detail="$6"
  create_issue "[$id] $title" "$(cat <<EOF
Part of $EPIC_TITLE.

**Clears:** $clears suppressions | **Size:** $size | **Risk:** $risk

$detail

Definition of done:

- [ ] the listed suppressions are gone from \`eslint-suppressions.json\`
- [ ] \`eslint-suppressions.max\` lowered by $clears in the same change
- [ ] tests added for any stateful component rewritten here
- [ ] \`npm run lint -- --prune-suppressions\` and \`npm run test -- --run\` pass

Detail: [\`$EPIC_DOC\`](../blob/main/$EPIC_DOC)
EOF
)"
}

task T1 "Add useLatestRef and adopt it in 6 files" 18 M low \
"Six files assign props into refs during render so an imperative loop reads the
freshest value. Add \`shared/hooks/useLatestRef.ts\` writing inside an effect,
export from \`shared/hooks/index.ts\`, replace the render-time assignments.

Files: \`features/avatar/renderers/vrm-renderer.tsx\` (8),
\`entities/character/hooks/useCharacters.ts\` (4),
\`features/brain/hooks/useOllamaCredentials.ts\` (3),
\`features/avatar/renderers/glb-renderer.tsx\`,
\`features/brain/components/remote-provider-panel.tsx\`,
\`features/projects/hooks/useProjectSnapshotCapture.ts\`.

Watch for: moving the write into an effect delays it until after commit. Correct
for a loop started in an effect, wrong for anything reading the ref during the
same render."

task T2 "Move Date.now / Math.random out of render" 3 S low \
"\`features/projects/project-grid-card-connected.tsx:20\` and
\`features/projects/project-list-row-connected.tsx:20\` call \`Date.now\` during
render; pass the reference time in or hold it in a \`useState\` initialiser.
\`features/workspace-home/tetris-background.tsx:80\` seeds an animation with
\`Math.random\` - move the seed into a \`useState\` initialiser."

task T3 "Fix reassignment in activity-feed" 1 S low \
"\`features/soul/activity/components/activity-feed.tsx:43\` reassigns
\`runningIndex\` after render. Compute indices with \`reduce\`/\`map\` over the
source list instead of mutating across iterations."

task T4 "Derive state in AuthContext" 5 L high \
"\`shared/services/auth/AuthContext.tsx\` is the session provider the whole app
consumes - do this on its own branch.

\`:74\` copies the nickname from session/localStorage into state, \`:108\` copies
the avatar URL from a query result. Both should be derived during render; the
three \`preserve-manual-memoization\` reports at \`:111\` disappear once
\`pictureUrl\` and \`nickname\` stop being state. Reuse
\`shared/hooks/useLocalStorage.ts\` for the fallback.

Tests required: sign-in, sign-out, server nickname beating the stored one,
avatar override replacing the fetched URL."

task T5 "set-state-in-effect in features/character-editor" 8 M medium \
"\`account-avatar-panel.tsx\`, \`banner-color-picker.tsx\`,
\`hooks/useSceneSettings.ts\`, \`hooks/useVoiceSandbox.ts\` (2),
\`tabs/channel-tab.tsx\`, \`tabs/emotion-panel.tsx\`, \`tabs/useModelTab.ts\`.

Derive the value during render and drop the \`useState\`. Where the effect also
writes to an external system, that part stays - only the \`setState\` moves."

task T6 "set-state-in-effect in features/projects" 5 M medium \
"\`project-background-page.tsx\`, \`project-overview-page.tsx\`,
\`setup-checklist.tsx\`, \`soul-project-overview-page.tsx\`,
\`soul-projects-page.tsx\`."

task T7 "set-state-in-effect in features/soul" 5 M medium \
"\`components/soul-card.tsx\`, \`hooks/useVoiceProvider.ts\`,
\`scenes/create-preset-modal.tsx\`, \`scenes/scenes-page.tsx\`,
\`scenes/soul-scenes-page.tsx\`.

\`hooks/useVoiceProvider.ts\` is consumed by five voice panels; changing its
contract touches all of them."

task T8 "set-state-in-effect in features/account" 4 S low \
"\`edit-profile-modal.tsx\`, \`panels/profile-panel.tsx\`,
\`panels/sessions-panel.tsx\`, \`protected-route.tsx\`.

\`protected-route.tsx\` gates authenticated routes - verify redirect behaviour."

task T9 "set-state-in-effect in app, entities and widgets" 7 M medium \
"\`app/(authenticated)/(developer)/developer/layout.tsx\`,
\`app/(authenticated)/edit/sandbox/_sandbox-layout-client.tsx\`,
\`app/oauth/authorize/page.tsx\`,
\`entities/character/hooks/characters/useCharacterMutations.ts\`,
\`entities/soul/hooks/use-card-model.ts\`,
\`entities/soul/hooks/use-card-scene.ts\`,
\`widgets/workspace-sidebar/ui/WorkspaceSidebar.tsx\`.

\`app/oauth/authorize/page.tsx\` is covered by the existing test in
\`features/soul/channels/__tests__/\` - extend it rather than starting over."

task T10 "set-state-in-effect in the remaining slices" 11 M low \
"\`brain/provider-settings-page.tsx\` (2), \`checkout/checkout-page.tsx\` (2),
\`invite/invite-page.tsx\`, \`landing/hero-inktide.tsx\`,
\`landing/navigation-actions.tsx\`, \`obs/obs-scene-page.tsx\`,
\`organization/invite-members-modal.tsx\`, \`workspace-home/hooks/useSearch.ts\`,
\`workspace-home/soul-creation-wizard/wizard-discord-config.tsx\`.

\`checkout-page.tsx\` handles payment state - test before touching."

task T11 "Retire the suppressions baseline" 0 S low \
"Only after T1-T10 leave the suppressions file empty.

Delete \`eslint-suppressions.json\`, \`eslint-suppressions.max\`,
\`eslint-suppressions.README.md\`, \`scripts/check-suppressions-ratchet.mjs\`,
the ratchet step in \`.github/workflows/ci.yml\` and the \`--prune-suppressions\`
flag on the lint step. Close the Epic."

echo
$DRY_RUN && echo "Dry run - nothing was created." || echo "Done."
