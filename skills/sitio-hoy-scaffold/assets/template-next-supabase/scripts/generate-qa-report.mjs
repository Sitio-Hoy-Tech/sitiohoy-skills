import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const staticReportPath = path.join(root, '.sitiohoy', 'qa', 'static-report.json')
const staticReport = existsSync(staticReportPath)
  ? JSON.parse(await readFile(staticReportPath, 'utf8'))
  : { ok: false, findings: [{ severity: 'warning', message: 'No se encontro static-report.json' }] }

const configPath = path.join(root, 'sitiohoy.config.json')
const config = existsSync(configPath)
  ? JSON.parse(await readFile(configPath, 'utf8'))
  : { project: 'SitioHoy', plan: 'sin-definir' }

const date = new Date().toISOString().slice(0, 10)
const safeProject = String(config.project ?? 'sitiohoy').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const fileName = `QA-${safeProject || 'sitiohoy'}-${date}.md`

const lines = [
  `# QA - ${config.project ?? 'SitioHoy'}`,
  '',
  `Plan: ${config.plan ?? 'sin-definir'}`,
  `Fecha: ${date}`,
  `Estado automatico: ${staticReport.ok ? 'OK' : 'REVISAR'}`,
  '',
  '## Validacion estatica',
  '',
  '| Severidad | Archivo | Hallazgo |',
  '|---|---|---|',
  ...(staticReport.findings.length
    ? staticReport.findings.map(f => `| ${f.severity} | ${f.file ?? ''} | ${f.message} |`)
    : ['| ok | | Sin hallazgos |']),
  '',
  '## Pendientes manuales',
  '',
  '- [ ] Revisar responsive en 375, 390, 768, 1280 y 1920 px.',
  '- [ ] Verificar compra real si el plan usa MercadoPago.',
  '- [ ] Verificar dominio, SSL y webhooks en produccion.',
  '- [ ] Verificar email transaccional si Resend esta activo.',
]

await mkdir(root, { recursive: true })
await writeFile(path.join(root, fileName), `${lines.join('\n')}\n`)
console.log(fileName)
