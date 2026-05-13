/**
 * briefing-server.mjs
 * Pure Node.js — no npm dependencies.
 * Serves briefing-form.html and handles intake submission.
 */

import http from 'node:http'
import fs from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FORM_HTML = path.resolve(__dirname, '../assets/briefing-form.html')
const START_PORT = 3456
const CWD = process.cwd()

// ── ANSI COLORS ─────────────────────────────────────────────────────────────
const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  green:   '\x1b[32m',
  cyan:    '\x1b[36m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  gray:    '\x1b[90m',
  white:   '\x1b[97m',
  bgGreen: '\x1b[42m',
}

const clr = (color, str) => `${color}${str}${c.reset}`
const log  = (...a) => console.log(...a)

// ── FIND FREE PORT ───────────────────────────────────────────────────────────
async function findFreePort(start) {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      const server = http.createServer()
      server.once('error', () => tryPort(port + 1))
      server.once('listening', () => { server.close(() => resolve(port)) })
      server.listen(port)
    }
    tryPort(start)
  })
}

// ── OPEN BROWSER ─────────────────────────────────────────────────────────────
function openBrowser(url) {
  try {
    const platform = process.platform
    if (platform === 'darwin') execSync(`open "${url}"`, { stdio: 'ignore' })
    else if (platform === 'win32') execSync(`start "" "${url}"`, { stdio: 'ignore', shell: true })
    else execSync(`xdg-open "${url}"`, { stdio: 'ignore' })
  } catch {
    log(clr(c.yellow, `  → Abrí manualmente: ${url}`))
  }
}

// ── MULTIPART PARSER ─────────────────────────────────────────────────────────
/**
 * Minimal multipart/form-data parser — no dependencies.
 * Returns: { fields: { name: string }, files: [{ fieldname, filename, data: Buffer }] }
 */
function parseMultipart(body, boundary) {
  const fields = {}
  const files = []
  const boundaryBuf = Buffer.from('--' + boundary)
  const CRLF = Buffer.from('\r\n')
  const CRLFx2 = Buffer.from('\r\n\r\n')

  let pos = 0
  // Find first boundary
  while (pos < body.length) {
    const boundStart = indexOf(body, boundaryBuf, pos)
    if (boundStart === -1) break
    pos = boundStart + boundaryBuf.length

    // Check for terminal boundary (--boundary--)
    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break

    // Skip CRLF after boundary
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2

    // Find header/body separator
    const headerEnd = indexOf(body, CRLFx2, pos)
    if (headerEnd === -1) break

    const headersBuf = body.slice(pos, headerEnd)
    const headers = headersBuf.toString('utf8')
    pos = headerEnd + 4 // skip \r\n\r\n

    // Find next boundary (marks end of this part's data)
    const nextBound = indexOf(body, Buffer.from('\r\n--' + boundary), pos)
    const dataEnd = nextBound === -1 ? body.length : nextBound
    const data = body.slice(pos, dataEnd)
    pos = dataEnd

    // Parse Content-Disposition
    const dispMatch = headers.match(/Content-Disposition:\s*form-data;(.+?)(?:\r\n|$)/i)
    if (!dispMatch) continue
    const disp = dispMatch[1]

    const nameMatch = disp.match(/name="([^"]*)"/)
    const filenameMatch = disp.match(/filename="([^"]*)"/)

    if (!nameMatch) continue
    const fieldname = nameMatch[1]

    if (filenameMatch) {
      const filename = filenameMatch[1]
      if (filename) {
        files.push({ fieldname, filename, data: Buffer.from(data) })
      }
    } else {
      fields[fieldname] = data.toString('utf8')
    }
  }

  return { fields, files }
}

function indexOf(buf, search, start = 0) {
  for (let i = start; i <= buf.length - search.length; i++) {
    let found = true
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break }
    }
    if (found) return i
  }
  return -1
}

// ── READ REQUEST BODY ────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// ── SLUGIFY ───────────────────────────────────────────────────────────────────
function slugify(str) {
  return String(str ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── HANDLE SUBMIT ────────────────────────────────────────────────────────────
async function handleSubmit(req, res) {
  const contentType = req.headers['content-type'] || ''
  const boundaryMatch = contentType.match(/boundary=(.+)/)

  let intake = null
  const savedFiles = []

  if (boundaryMatch) {
    // Multipart form data
    const boundary = boundaryMatch[1].trim()
    const body = await readBody(req)
    const { fields, files } = parseMultipart(body, boundary)

    // Parse the JSON "data" field
    if (fields.data) {
      try { intake = JSON.parse(fields.data) } catch {
        sendJSON(res, 400, { ok: false, error: 'Invalid JSON in data field' })
        return
      }
    }

    // Save uploaded files
    for (const { fieldname, filename, data } of files) {
      const folder = sanitizeFolderName(fieldname)
      const destDir = path.join(CWD, '_assets-cliente', folder)
      await mkdir(destDir, { recursive: true })
      const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._\-]/g, '-')
      const destPath = path.join(destDir, safeName)
      await writeFile(destPath, data)
      savedFiles.push(`_assets-cliente/${folder}/${safeName}`)
      log(clr(c.cyan, `  ↑ archivo guardado: _assets-cliente/${folder}/${safeName}`))
    }
  } else if (contentType.includes('application/json')) {
    // Plain JSON body
    const body = await readBody(req)
    try { intake = JSON.parse(body.toString('utf8')) } catch {
      sendJSON(res, 400, { ok: false, error: 'Invalid JSON body' })
      return
    }
  } else {
    sendJSON(res, 400, { ok: false, error: 'Unsupported content type' })
    return
  }

  if (!intake) {
    sendJSON(res, 400, { ok: false, error: 'Missing intake data' })
    return
  }

  // Write .sitiohoy/intake.json
  const sitiohoyDir = path.join(CWD, '.sitiohoy')
  await mkdir(sitiohoyDir, { recursive: true })
  const intakePath = path.join(sitiohoyDir, 'intake.json')
  await writeFile(intakePath, JSON.stringify(intake, null, 2) + '\n')
  log(clr(c.green, `  ✓ .sitiohoy/intake.json escrito`))

  // Write sitiohoy.config.json — update integrations if exists, create if not
  const configPath = path.join(CWD, 'sitiohoy.config.json')
  const plan = String(intake.plan ?? 'esencial').toLowerCase()
  const tech = intake.technical ?? {}
  const hasCheckout = plan === 'emprendimiento' || plan === 'empresa'

  const caRequested = plan === 'empresa' && Boolean(tech.correoArgentinoRequested)
  const enviaRequested = plan === 'empresa' && Boolean(tech.enviaRequested) && !caRequested
  const fixedShipping = plan === 'emprendimiento' || (plan === 'empresa' && !caRequested && !enviaRequested)

  const newIntegrations = {
    mercadopago: hasCheckout,
    correoArgentino: caRequested,
    fixedShipping,
    envia: enviaRequested,
    resend: hasCheckout && Boolean(tech.resendRequested),
    umami: hasCheckout,
    whatsapp: true,
  }

  let config = {}
  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      config = { ...existing, integrations: newIntegrations }
    } catch {
      config = buildNewConfig(intake, newIntegrations)
    }
  } else {
    config = buildNewConfig(intake, newIntegrations)
  }

  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
  log(clr(c.green, `  ✓ sitiohoy.config.json escrito`))

  // Summary
  log('')
  log(clr(c.bold, clr(c.white, '  Archivos generados:')))
  log(clr(c.gray, '  .sitiohoy/intake.json'))
  log(clr(c.gray, '  sitiohoy.config.json'))
  savedFiles.forEach(f => log(clr(c.gray, `  ${f}`)))
  log('')

  sendJSON(res, 200, { ok: true, intake: intakePath, config: configPath, files: savedFiles })

  // Graceful shutdown after 2s
  setTimeout(() => {
    log(clr(c.yellow, '\n  Briefing recibido. Cerrando servidor...\n'))
    process.exit(0)
  }, 2000)
}

function buildNewConfig(intake, integrations) {
  const business = intake.business ?? {}
  const tech = intake.technical ?? {}
  const domain = tech.domain ?? {}
  const plan = String(intake.plan ?? 'esencial').toLowerCase()
  const siteUrl = domain.status === 'owned' && domain.value
    ? String(domain.value).replace(/\/$/, '')
    : ''

  return {
    project: business.name ?? 'SitioHoy',
    slug: business.slug || slugify(business.name ?? 'sitiohoy'),
    plan,
    tenantId: randomUUID(),
    siteUrl,
    domain,
    integrations,
    technical: {
      editor: tech.editor ?? 'other',
      supabaseMcp: Boolean(tech.supabaseMcp),
      aiDesignerMcp: Boolean(tech.aiDesignerMcp),
      mercadoPagoActive: Boolean(tech.mercadoPagoActive),
    },
    limits: {
      maxProducts: plan === 'esencial' ? 50 : plan === 'emprendimiento' ? 200 : null,
    },
    qualityGates: {
      build: true,
      staticValidation: true,
      qaReport: true,
      checkoutManualTest: plan !== 'esencial',
      lighthouse: true,
    },
  }
}

function sanitizeFolderName(name) {
  const allowed = ['logo', 'hero', 'productos', 'marca', 'galeria']
  const clean = name.toLowerCase().replace(/[^a-z]/g, '')
  return allowed.includes(clean) ? clean : 'galeria'
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  })
  res.end(body)
}

// ── REQUEST HANDLER ──────────────────────────────────────────────────────────
async function handleRequest(req, res) {
  const url = req.url?.split('?')[0] ?? '/'

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' })
    res.end()
    return
  }

  if (req.method === 'GET' && url === '/') {
    try {
      const html = await readFile(FORM_HTML, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html) })
      res.end(html)
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end(`No se pudo leer el formulario: ${err.message}\nRuta esperada: ${FORM_HTML}`)
    }
    return
  }

  if (req.method === 'POST' && url === '/submit') {
    try {
      await handleSubmit(req, res)
    } catch (err) {
      log(clr(c.red, `  ERROR en /submit: ${err.message}`))
      log(err.stack)
      sendJSON(res, 500, { ok: false, error: err.message })
    }
    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
}

// ── STARTUP ──────────────────────────────────────────────────────────────────
const port = await findFreePort(START_PORT)
const server = http.createServer(handleRequest)

server.listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}`

  console.clear()
  log('')
  log(clr(c.bold, clr(c.green, '  ●  SitioHoy Briefing')))
  log(clr(c.gray, '  ─────────────────────────────────────'))
  log(`  ${clr(c.bold, 'URL:')}    ${clr(c.cyan, url)}`)
  log(`  ${clr(c.bold, 'CWD:')}    ${clr(c.gray, CWD)}`)
  log(`  ${clr(c.bold, 'Form:')}   ${clr(c.gray, FORM_HTML)}`)
  log(clr(c.gray, '  ─────────────────────────────────────'))
  log(`  ${clr(c.yellow, 'Ctrl+C')} para cancelar`)
  log('')

  // Verify form exists
  if (!fs.existsSync(FORM_HTML)) {
    log(clr(c.red, `  ADVERTENCIA: No se encontró el formulario en:`))
    log(clr(c.red, `  ${FORM_HTML}`))
    log('')
  }

  // Open browser
  setTimeout(() => openBrowser(url), 300)
})

server.on('error', (err) => {
  log(clr(c.red, `\n  Error del servidor: ${err.message}\n`))
  process.exit(1)
})

// ── GRACEFUL SHUTDOWN ─────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  log(clr(c.yellow, '\n  Cerrando servidor...\n'))
  server.close(() => process.exit(0))
})
process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})
