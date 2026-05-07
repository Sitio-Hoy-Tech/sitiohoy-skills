import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const pkg = existsSync('package.json') ? JSON.parse(await BunLikeRead('package.json')) : { scripts: {} }
const scripts = pkg.scripts ?? {}

function run(name, command) {
  console.log(`\n== ${name} ==`)
  const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit', shell: false })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

async function BunLikeRead(file) {
  const { readFile } = await import('node:fs/promises')
  return readFile(file, 'utf8')
}

if (scripts.lint) run('lint', ['npm', 'run', 'lint'])
if (scripts.build) run('build', ['npm', 'run', 'build'])
run('sitiohoy static validation', ['node', 'scripts/validate-sitiohoy.mjs'])
if (scripts['test:e2e']) run('e2e', ['npm', 'run', 'test:e2e'])
if (scripts.lighthouse) run('lighthouse', ['npm', 'run', 'lighthouse'])
