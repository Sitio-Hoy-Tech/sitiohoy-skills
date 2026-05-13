/**
 * run-qa.mjs
 * Ejecuta el pipeline de QA de SitioHoy en orden:
 *   lint → build → sitiohoy:validate → test:e2e → lighthouse
 *
 * Uso: node scripts/run-qa.mjs
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

// Leer scripts del package.json de forma segura
const pkgPath = 'package.json'
const scripts = existsSync(pkgPath)
  ? (JSON.parse(await readFile(pkgPath, 'utf8')).scripts ?? {})
  : {}

function run(label, command) {
  console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 40 - label.length))}`)
  const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit', shell: false })
  if (result.status !== 0) {
    console.error(`\n✗ "${label}" falló con código ${result.status ?? 1}`)
    process.exit(result.status ?? 1)
  }
  console.log(`✓ ${label}`)
}

// Orden de ejecución: fallar rápido en lint/build antes de tests más lentos
if (scripts.lint)       run('lint',                  ['npm', 'run', 'lint'])
if (scripts.build)      run('build',                 ['npm', 'run', 'build'])
                        run('sitiohoy:validate',     ['node', 'scripts/validate-sitiohoy.mjs'])
if (scripts['test:e2e']) run('e2e',                  ['npm', 'run', 'test:e2e'])
if (scripts.lighthouse)  run('lighthouse',            ['npm', 'run', 'lighthouse'])

console.log('\n✅ QA pipeline completo\n')
