#!/usr/bin/env node
// Fails when eslint-suppressions.json holds more violations than
// eslint-suppressions.max allows.
//
// `eslint --prune-suppressions` already catches entries left behind after a fix,
// but nothing stops someone re-running `--suppress-rule` and burying a fresh
// violation in the baseline. This is the other half: the total may only go down.
//
// See eslint-suppressions.README.md and REACT_COMPILER_EPIC.md.

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const suppressionsPath = join(webRoot, 'eslint-suppressions.json')
const maxPath = join(webRoot, 'eslint-suppressions.max')

// Both files disappear together when the Epic closes; that is a pass, not an error.
if (!existsSync(suppressionsPath) && !existsSync(maxPath)) {
  console.log('No suppressions baseline present - nothing to ratchet.')
  process.exit(0)
}

if (existsSync(suppressionsPath) !== existsSync(maxPath)) {
  console.error(
    'eslint-suppressions.json and eslint-suppressions.max must be added and removed ' +
      'together; found only one of them.',
  )
  process.exit(1)
}

const limit = Number.parseInt(readFileSync(maxPath, 'utf8').trim(), 10)
if (!Number.isInteger(limit) || limit < 0) {
  console.error(`eslint-suppressions.max must contain a non-negative integer, got: ${limit}`)
  process.exit(1)
}

const baseline = JSON.parse(readFileSync(suppressionsPath, 'utf8'))
const perRule = new Map()
let total = 0

for (const rules of Object.values(baseline)) {
  for (const [rule, entry] of Object.entries(rules)) {
    total += entry.count
    perRule.set(rule, (perRule.get(rule) ?? 0) + entry.count)
  }
}

const files = Object.keys(baseline).length

if (total > limit) {
  console.error(
    `Suppressions grew: ${total} recorded, ${limit} allowed by eslint-suppressions.max.\n` +
      'The baseline may only shrink. Fix the violation instead of suppressing it - see ' +
      'REACT_COMPILER_EPIC.md.',
  )
  process.exit(1)
}

if (total < limit) {
  console.error(
    `Suppressions dropped to ${total} but eslint-suppressions.max still says ${limit}.\n` +
      `Lower it to ${total} in the same change, so the ratchet keeps holding.`,
  )
  process.exit(1)
}

const breakdown = [...perRule.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([rule, count]) => `  ${String(count).padStart(3)}  ${rule}`)
  .join('\n')

console.log(`Suppressions at limit: ${total} across ${files} files.\n${breakdown}`)
