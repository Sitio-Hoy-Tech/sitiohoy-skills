import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const reportPath = path.join(root, '.sitiohoy', 'qa', 'static-report.json')
const staticReport = existsSync(reportPath)
  ? JSON.parse(await readFile(reportPath, 'utf8'))
  : { ok: false, counts: { errors: 0, warnings: 1 }, findings: [{ severity: 'warning', message: 'No se encontro static-report.json' }] }

const configPath = path.join(root, 'sitiohoy.config.json')
const config = existsSync(configPath)
  ? JSON.parse(await readFile(configPath, 'utf8'))
  : { project: process.env.NEXT_PUBLIC_SITE_NAME ?? 'SitioHoy', plan: 'sin-definir' }

const date = new Date().toISOString().slice(0, 10)
const safeProject = String(config.project ?? 'sitiohoy').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const fileName = `QA-${safeProject || 'sitiohoy'}-${date}.md`

const findingRows = staticReport.findings.length
  ? staticReport.findings.map(f => `| ${f.severity} | ${f.file ?? ''} | ${f.message} |`)
  : ['| ok | | Sin hallazgos automaticos |']

const lines = [
  `# QA - ${config.project ?? 'SitioHoy'}`,
  '',
  `Plan: ${config.plan ?? 'sin-definir'}`,
  `Fecha: ${date}`,
  `Estado automatico: ${staticReport.ok ? 'OK' : 'REVISAR'}`,
  '',
  '## Resumen automatico',
  '',
  `- Errores: ${staticReport.counts?.errors ?? 0}`,
  `- Warnings: ${staticReport.counts?.warnings ?? 0}`,
  '',
  '## Hallazgos',
  '',
  '| Severidad | Archivo | Hallazgo |',
  '|---|---|---|',
  ...findingRows,
  '',
  '## Pendientes manuales criticos',
  '',
  '- [ ] Responsive verificado en 375, 390, 768, 1280 y 1920 px.',
  '- [ ] Formulario o WhatsApp probado manualmente.',
  '- [ ] Sitemap y robots abiertos en navegador.',
  '- [ ] Compra de prueba realizada si aplica MercadoPago.',
  '- [ ] Webhook de MercadoPago validado en produccion si aplica.',
  '- [ ] Email transaccional recibido si aplica Resend.',
  '- [ ] Dominio, SSL y variables Vercel revisados antes del deploy final.',
]

await mkdir(root, { recursive: true })
await writeFile(path.join(root, fileName), `${lines.join('\n')}\n`)
console.log(fileName)
