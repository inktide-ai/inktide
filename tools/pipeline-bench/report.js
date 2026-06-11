#!/usr/bin/env node
'use strict'

const fs   = require('fs')
const path = require('path')

const file = process.argv[2]
const CI   = process.argv.includes('--ci')

if (!file) {
  console.error('Usage: node report.js <results/file.jsonl> [--ci]')
  process.exit(1)
}

const lines   = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean)
const results = lines.map(l => JSON.parse(l))

const errors  = results.filter(r => r.error)
const success = results.filter(r => !r.error)

if (success.length === 0) {
  console.error(`No successful runs in ${path.basename(file)} (${errors.length} errors).`)
  process.exit(1)
}

const totalMs = success.map(r => r.totalMs).sort((a, b) => a - b)
const firstMs = success.map(r => r.firstByteMs).sort((a, b) => a - b)

function pct(arr, p) {
  return arr[Math.max(0, Math.ceil((p / 100) * arr.length) - 1)]
}

const SLO        = success[0]?.sloThresholdMs ?? 4000
const violations = success.filter(r => r.sloViolation).length

if (CI) {
  console.log(`p50=${pct(totalMs, 50)}ms`)
  console.log(`p95=${pct(totalMs, 95)}ms`)
  console.log(`p99=${pct(totalMs, 99)}ms`)
  console.log(`first_byte_p50=${pct(firstMs, 50)}ms`)
  console.log(`first_byte_p95=${pct(firstMs, 95)}ms`)
  console.log(`violations=${violations}/${success.length}`)
  console.log(`status=${violations === 0 ? 'PASS' : 'FAIL'}`)
} else {
  console.log('')
  console.log('══════════════════════════════════════')
  console.log('  Pipeline Latency Report')
  console.log('══════════════════════════════════════')
  console.log(`  File       : ${path.basename(file)}`)
  console.log(`  Iterations : ${results.length}  (${errors.length} errors)`)
  console.log(`  SLO        : < ${SLO}ms`)
  console.log('')
  console.log('  Total latency (message → last audio byte):')
  console.log(`    p50  : ${pct(totalMs, 50)}ms`)
  console.log(`    p95  : ${pct(totalMs, 95)}ms`)
  console.log(`    p99  : ${pct(totalMs, 99)}ms`)
  console.log(`    max  : ${Math.max(...totalMs)}ms`)
  console.log('')
  console.log('  First-byte latency (message → first audio chunk):')
  console.log(`    p50  : ${pct(firstMs, 50)}ms`)
  console.log(`    p95  : ${pct(firstMs, 95)}ms`)
  console.log('')
  console.log(`  SLO violations : ${violations}/${success.length} (${((violations / success.length) * 100).toFixed(1)}%)`)
  console.log(violations === 0 ? '  Status : ✅ PASS' : '  Status : ❌ FAIL')
  console.log('══════════════════════════════════════')
  console.log('')
}

const violationRate = success.length > 0 ? violations / success.length : 1
if (violationRate > 0.05) {
  process.exit(1)
}
