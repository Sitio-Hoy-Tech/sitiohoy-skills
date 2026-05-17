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
const TENANT_SELECT = [
  'id',
  'name',
  'slug',
  'plan',
  'status',
  'max_products',
  'url',
  'contact_email',
  'mp_access_token',
  'mp_public_key',
  'resend_api_key',
  'envia_access_token',
  'correo_argentino_customer_id',
  'umami_url',
  'umami_website_id',
  'origin_name',
  'origin_phone',
  'origin_address',
  'origin_city',
  'origin_state',
  'origin_postal_code',
  'subscription_status',
  'current_period_end',
  'created_at',
].join(',')
const ALLOWED_PLANS = new Set(['esencial', 'emprendimiento', 'empresa'])

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
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      if (port > 65535) {
        reject(new Error(`No se encontró un puerto libre desde ${start} hasta 65535`))
        return
      }
      const server = http.createServer()
      server.once('error', () => tryPort(port + 1))
      server.once('listening', () => { server.close(() => resolve(port)) })
      server.listen(port, '127.0.0.1')
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

function parseEnvValue(value) {
  return String(value ?? '').trim().replace(/^['"]|['"]$/g, '')
}

function loadLocalCredentials() {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  const candidates = [
    path.join(CWD, '.env.local'),
    path.join(CWD, '.env'),
    path.join(CWD, 'credentials.env'),
    home ? path.join(home, '.sitiohoy', 'credentials.env') : '',
  ].filter(Boolean)

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    const content = fs.readFileSync(file, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const clean = line.trim()
      if (!clean || clean.startsWith('#') || !clean.includes('=')) continue
      const [key, ...rest] = clean.split('=')
      const name = key.trim().replace(/^export\s+/, '')
      if (!name || process.env[name]) continue
      process.env[name] = parseEnvValue(rest.join('='))
    }
  }
}

function getSupabaseCredentials() {
  loadLocalCredentials()
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return { url: String(url).replace(/\/$/, ''), serviceRoleKey }
}

function supabaseHeaders(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extra,
  }
}

async function fetchTenantRow(credentials, tenantId) {
  const url = new URL(`${credentials.url}/rest/v1/tenants`)
  url.searchParams.set('id', `eq.${tenantId}`)
  url.searchParams.set('select', TENANT_SELECT)
  url.searchParams.set('limit', '1')

  const response = await fetch(url, { headers: supabaseHeaders(credentials.serviceRoleKey) })
  const text = await response.text()
  if (!response.ok) throw new Error(`Supabase tenants ${response.status}: ${text}`)
  const rows = text ? JSON.parse(text) : []
  return Array.isArray(rows) ? rows[0] : null
}

async function countTenantRows(credentials, table, tenantId) {
  const url = new URL(`${credentials.url}/rest/v1/${table}`)
  url.searchParams.set('tenant_id', `eq.${tenantId}`)
  url.searchParams.set('select', 'id')

  const response = await fetch(url, {
    headers: supabaseHeaders(credentials.serviceRoleKey, { Prefer: 'count=exact', Range: '0-0' }),
  })
  if (!response.ok) return { count: null, error: `${table}: ${response.status}` }
  const range = response.headers.get('content-range') || ''
  const count = Number(range.split('/').pop())
  return { count: Number.isFinite(count) ? count : null }
}

function publicTenantSnapshot(row, related = {}) {
  return {
    id: row.id,
    name: row.name ?? '',
    slug: row.slug ?? '',
    plan: row.plan ?? '',
    status: row.status ?? '',
    maxProducts: row.max_products ?? null,
    url: row.url ?? '',
    contactEmail: row.contact_email ?? '',
    mercadoPagoConfigured: Boolean(row.mp_access_token && row.mp_public_key),
    resendConfigured: Boolean(row.resend_api_key),
    enviaConfigured: Boolean(row.envia_access_token),
    correoArgentinoConfigured: Boolean(row.correo_argentino_customer_id),
    umamiConfigured: Boolean(row.umami_url || row.umami_website_id),
    origin: {
      name: row.origin_name ?? '',
      phone: row.origin_phone ?? '',
      address: row.origin_address ?? '',
      city: row.origin_city ?? '',
      state: row.origin_state ?? '',
      postalCode: row.origin_postal_code ?? '',
    },
    subscription: {
      status: row.subscription_status ?? '',
      currentPeriodEnd: row.current_period_end ?? '',
    },
    createdAt: row.created_at ?? '',
    related,
  }
}

function mergeTenantIntoIntake(intake, tenant) {
  const plan = ALLOWED_PLANS.has(String(tenant.plan ?? '').toLowerCase())
    ? String(tenant.plan).toLowerCase()
    : String(intake.plan ?? 'esencial').toLowerCase()
  const hasCheckout = plan === 'emprendimiento' || plan === 'empresa'

  intake.plan = plan
  intake.business = {
    ...(intake.business ?? {}),
    name: tenant.name || intake.business?.name || 'SitioHoy',
    slug: tenant.slug || intake.business?.slug || slugify(tenant.name || 'sitiohoy'),
  }

  intake.technical = {
    ...(intake.technical ?? {}),
    mercadoPagoActive: Boolean(tenant.mp_access_token && tenant.mp_public_key) || Boolean(intake.technical?.mercadoPagoActive),
    correoArgentinoRequested: plan === 'empresa' && Boolean(tenant.correo_argentino_customer_id),
    enviaRequested: plan === 'empresa' && Boolean(tenant.envia_access_token) && !tenant.correo_argentino_customer_id,
    resendRequested: hasCheckout && (Boolean(tenant.resend_api_key) || Boolean(intake.technical?.resendRequested)),
    domain: {
      ...(intake.technical?.domain ?? {}),
      status: tenant.url ? 'owned' : (intake.technical?.domain?.status ?? 'pending_purchase'),
      value: tenant.url || intake.technical?.domain?.value || '',
    },
  }

  intake.contact = {
    ...(intake.contact ?? {}),
    email: tenant.contact_email || intake.contact?.email || '',
  }

  // Track corrections
  const corrections = []
  if (intake._formPlan && intake._formPlan !== plan) {
    corrections.push({ field: 'plan', from: intake._formPlan, to: plan, reason: 'El tenant en Supabase tiene un plan diferente' })
  }
  if (intake._formBusinessName && tenant.name && intake._formBusinessName !== tenant.name) {
    corrections.push({ field: 'business.name', from: intake._formBusinessName, to: tenant.name, reason: 'Nombre del tenant en Supabase difiere' })
  }
  if (corrections.length) {
    intake.corrections = corrections
    corrections.forEach(c => log(clr(c.yellow, `  ⚠ Corrección: ${c.field} "${c.from}" → "${c.to}" (${c.reason})`)))
  }
}

async function lookupExistingTenant(intake) {
  const tenantId = intake.clientStatus === 'existente' ? String(intake.existingTenantId ?? '').trim() : ''
  if (!tenantId) return null

  const checkedAt = new Date().toISOString()
  if (typeof fetch !== 'function') {
    return {
      status: 'skipped',
      checkedAt,
      tenantId,
      warnings: ['Node no tiene fetch disponible. Revisar el tenant manualmente en Supabase.'],
    }
  }

  const credentials = getSupabaseCredentials()
  if (!credentials) {
    return {
      status: 'skipped',
      checkedAt,
      tenantId,
      warnings: ['Faltan SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. No se pudo consultar el tenant existente.'],
    }
  }

  try {
    const row = await fetchTenantRow(credentials, tenantId)
    if (!row) {
      return {
        status: 'not_found',
        checkedAt,
        tenantId,
        warnings: ['No existe una fila en public.tenants para ese tenant ID.'],
      }
    }

    const relatedTables = ['products', 'categories', 'shipping_zones', 'orders', 'user_tenants']
    const relatedEntries = await Promise.all(relatedTables.map(async table => [table, await countTenantRows(credentials, table, tenantId)]))
    const related = Object.fromEntries(relatedEntries.map(([table, result]) => [table, result.count]))
    const relatedWarnings = relatedEntries.filter(([, result]) => result.error).map(([, result]) => result.error)
    mergeTenantIntoIntake(intake, row)

    return {
      status: 'found',
      checkedAt,
      tenantId,
      source: 'supabase-rest',
      tenant: publicTenantSnapshot(row, related),
      warnings: relatedWarnings,
    }
  } catch (err) {
    return {
      status: 'error',
      checkedAt,
      tenantId,
      warnings: [`No se pudo consultar Supabase: ${err.message}`],
    }
  }
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

  // Save original form values for correction tracking
  if (intake.clientStatus === 'existente') {
    intake._formPlan = intake.plan
    intake._formBusinessName = intake.business?.name
  }

  const existingTenantLookup = await lookupExistingTenant(intake)
  if (existingTenantLookup) {
    intake.existingTenantLookup = existingTenantLookup
    delete intake._formPlan
    delete intake._formBusinessName
    if (existingTenantLookup.status !== 'found') {
      intake.notes = [
        ...(Array.isArray(intake.notes) ? intake.notes : []),
        'Cliente existente: revisar la fila public.tenants antes de definir plan, integraciones y datos de empresa.',
      ]
    }
  }

  // Write .sitiohoy/intake.json
  const sitiohoyDir = path.join(CWD, '.sitiohoy')
  await mkdir(sitiohoyDir, { recursive: true })
  const intakePath = path.join(sitiohoyDir, 'intake.json')
  await writeFile(intakePath, JSON.stringify(intake, null, 2) + '\n')
  log(clr(c.green, `  ✓ .sitiohoy/intake.json escrito`))

  let tenantLookupPath = null
  if (existingTenantLookup) {
    tenantLookupPath = path.join(sitiohoyDir, 'existing-tenant-check.json')
    await writeFile(tenantLookupPath, JSON.stringify(existingTenantLookup, null, 2) + '\n')
    const statusColor = existingTenantLookup.status === 'found' ? c.green : c.yellow
    log(clr(statusColor, `  ✓ .sitiohoy/existing-tenant-check.json escrito (${existingTenantLookup.status})`))
  }

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
  const generatedConfig = buildNewConfig(intake, newIntegrations)
  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      const isExistingClient = generatedConfig.clientStatus === 'existente' && generatedConfig.tenantId
      config = {
        ...existing,
        ...generatedConfig,
        tenantId: isExistingClient ? generatedConfig.tenantId : (existing.tenantId ?? generatedConfig.tenantId),
        integrations: newIntegrations
      }
    } catch {
      config = generatedConfig
    }
  } else {
    config = generatedConfig
  }

  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
  log(clr(c.green, `  ✓ sitiohoy.config.json escrito`))

  const briefPath = path.join(CWD, 'brief.md')
  await writeFile(briefPath, buildBrief(intake, newIntegrations))
  log(clr(c.green, `  ✓ brief.md escrito`))

  // Generate DESIGN.md for Stitch
  const designDir = path.join(CWD, '.sitiohoy', 'design')
  await mkdir(designDir, { recursive: true })

  // Write the ultra-detailed DESIGN.md
  const designMdPath = path.join(designDir, 'DESIGN.md')
  await writeFile(designMdPath, buildDesignMd(intake, newIntegrations))
  log(clr(c.green, `  ✓ .sitiohoy/design/DESIGN.md escrito`))
  log(clr(c.cyan, `    → Este archivo se debe enviar manualmente a Stitch`))

  // Write copy guide
  const copyGuidePath = path.join(sitiohoyDir, 'copy-guide.md')
  await writeFile(copyGuidePath, buildCopyGuide(intake, newIntegrations))
  log(clr(c.green, `  ✓ .sitiohoy/copy-guide.md escrito`))

  // Summary
  log('')
  log(clr(c.bold, clr(c.white, '  Archivos generados:')))
  log(clr(c.gray, '  .sitiohoy/intake.json'))
  if (tenantLookupPath) log(clr(c.gray, '  .sitiohoy/existing-tenant-check.json'))
  log(clr(c.gray, '  sitiohoy.config.json'))
  log(clr(c.gray, '  brief.md'))
  log(clr(c.gray, '  .sitiohoy/design/DESIGN.md'))
  log(clr(c.cyan, '    → Enviar DESIGN.md manualmente a Stitch para generar el diseño'))
  log(clr(c.gray, '  .sitiohoy/copy-guide.md'))
  savedFiles.forEach(f => log(clr(c.gray, `  ${f}`)))
  log('')

  sendJSON(res, 200, { ok: true, intake: intakePath, config: configPath, brief: briefPath, tenantLookup: tenantLookupPath, files: savedFiles })

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
  const isExisting = intake.clientStatus === 'existente' && intake.existingTenantId

  return {
    project: business.name ?? 'SitioHoy',
    business: {
      name: business.name ?? 'SitioHoy',
      slug: business.slug || slugify(business.name ?? 'sitiohoy'),
      industry: business.industry ?? '',
      description: business.description ?? '',
    },
    slug: business.slug || slugify(business.name ?? 'sitiohoy'),
    plan,
    clientStatus: intake.clientStatus ?? 'nuevo',
    tenantId: isExisting ? intake.existingTenantId : randomUUID(),
    siteUrl,
    domain,
    integrations,
    technical: {
      editor: tech.editor ?? 'other',
      supabaseMcp: Boolean(tech.supabaseMcp),
      aiDesignerMcp: Boolean(tech.aiDesignerMcp),
      mercadoPagoActive: Boolean(tech.mercadoPagoActive),
    },
    catalog: intake.catalog ?? {},
    assets: intake.assets ?? {},
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
    performanceBudget: {
      lcp: plan === 'empresa' ? 1800 : 2500,       // ms
      fid: 100,                                     // ms
      cls: 0.1,
      ttfb: plan === 'empresa' ? 600 : 800,        // ms
      bundleSizeKb: plan === 'esencial' ? 200 : plan === 'emprendimiento' ? 350 : 500,
      lighthouseMobile: plan === 'empresa' ? 90 : 80,
      lighthouseDesktop: 90,
    },
  }
}

function buildBrief(intake, integrations) {
  const business = intake.business ?? {}
  const tech = intake.technical ?? {}
  const audience = intake.audience ?? {}
  const visual = intake.visualIdentity ?? {}
  const catalog = intake.catalog ?? {}
  const pages = intake.pages ?? {}
  const contact = intake.contact ?? {}
  const assets = intake.assets ?? {}
  const plan = String(intake.plan ?? 'esencial').toLowerCase()
  const pageList = Object.entries(pages).filter(([, enabled]) => enabled).map(([name]) => name)
  const shipping = integrations.correoArgentino
    ? 'Correo Argentino directo'
    : integrations.envia
      ? 'Envia.com'
      : integrations.fixedShipping
        ? 'precios fijos por zona'
        : 'sin envíos automatizados'

  const yesNo = (value) => value ? 'sí' : 'no'
  const list = (items) => Array.isArray(items) && items.length ? items.map(item => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object') return [item.network, item.url].filter(Boolean).join(': ')
    return ''
  }).filter(Boolean).join(', ') : 'sin datos'

  const isExisting = intake.clientStatus === 'existente' && intake.existingTenantId
  const lookup = intake.existingTenantLookup
  const tenant = lookup?.tenant
  const tenantLookupLines = isExisting
    ? [
        `- Consulta tenant: ${lookup?.status ?? 'no realizada'}`,
        ...(lookup?.checkedAt ? [`- Consultado en: ${lookup.checkedAt}`] : []),
        ...(tenant ? [
          `- Tenant cargado: ${tenant.name || 'sin nombre'} (${tenant.slug || 'sin slug'})`,
          `- Estado tenant: ${tenant.status || 'sin datos'}`,
          `- Plan tenant: ${tenant.plan || 'sin datos'}`,
          `- URL tenant: ${tenant.url || 'sin datos'}`,
          `- Contact email tenant: ${tenant.contactEmail || 'sin datos'}`,
          `- MercadoPago configurado: ${yesNo(tenant.mercadoPagoConfigured)}`,
          `- Resend configurado: ${yesNo(tenant.resendConfigured)}`,
          `- Envia configurado: ${yesNo(tenant.enviaConfigured)}`,
          `- Correo Argentino configurado: ${yesNo(tenant.correoArgentinoConfigured)}`,
          `- Umami configurado: ${yesNo(tenant.umamiConfigured)}`,
          `- Origen envios: ${[tenant.origin?.address, tenant.origin?.city, tenant.origin?.state, tenant.origin?.postalCode].filter(Boolean).join(', ') || 'sin datos'}`,
          `- Datos relacionados: productos ${tenant.related?.products ?? 'n/d'}, categorias ${tenant.related?.categories ?? 'n/d'}, zonas envio ${tenant.related?.shipping_zones ?? 'n/d'}, pedidos ${tenant.related?.orders ?? 'n/d'}, usuarios ${tenant.related?.user_tenants ?? 'n/d'}`,
        ] : []),
        ...(lookup?.warnings?.length ? lookup.warnings.map(warning => `- Advertencia tenant: ${warning}`) : []),
        '',
      ]
    : []

  const lines = [
    `# Brief SitioHoy - ${business.name ?? 'Proyecto'}`,
    '',
    '## Estado del Cliente',
    '',
    `- Tipo: ${isExisting ? 'Cliente existente' : 'Cliente nuevo'}`,
    isExisting ? `- Tenant ID: ${intake.existingTenantId}` : '- Se debe crear tenant nuevo en Supabase',
    ...tenantLookupLines,
    '',
    '## Negocio',
    '',
    `- Nombre: ${business.name ?? 'sin datos'}`,
    `- Slug: ${business.slug ?? 'sin datos'}`,
    `- Rubro: ${business.industry ?? 'sin datos'}`,
    `- Objetivo principal: ${business.primaryGoal ?? 'sin datos'}`,
    `- Descripción: ${business.description ?? 'sin datos'}`,
    `- Diferencial: ${business.differentiator ?? 'sin datos'}`,
    `- Referentes visuales: ${list(business.visualReferences)}`,
    '',
    '## Alcance Técnico',
    '',
    `- Plan: ${plan}`,
    `- MercadoPago: ${yesNo(integrations.mercadopago)}`,
    `- MercadoPago activo del cliente: ${yesNo(tech.mercadoPagoActive)}`,
    `- Envíos: ${shipping}`,
    `- Resend: ${yesNo(integrations.resend)}`,
    `- Umami: ${yesNo(integrations.umami)}`,
    `- Dominio: ${tech.domain?.value || tech.domain?.status || 'sin datos'}`,
    `- Editor/IA: ${tech.editor ?? 'sin datos'}`,
    `- Supabase MCP: ${yesNo(tech.supabaseMcp)}`,
    `- AIDesigner MCP: ${yesNo(tech.aiDesignerMcp)}`,
    '',
    '## Audiencia y Tono',
    '',
    `- Perfil: ${audience.profile ?? 'sin datos'}`,
    `- Problema: ${audience.problem ?? 'sin datos'}`,
    `- Sensación deseada: ${audience.desiredFeeling ?? 'sin datos'}`,
    `- Tono: ${audience.tone ?? 'sin datos'}`,
    `- Dispositivo principal: ${audience.primaryDevice ?? 'sin datos'}`,
    '',
    '## Identidad Visual',
    '',
    `- Colores definidos: ${yesNo(visual.colors?.defined)}`,
    `- Primario: ${visual.colors?.primary || visual.colors?.hints || 'derivar del brief/logo'}`,
    `- Secundario: ${visual.colors?.secondary || 'derivar del brief/logo'}`,
    `- Acento: ${visual.colors?.accent || 'derivar del brief/logo'}`,
    `- Mood: ${visual.desiredMood ?? 'sin datos'}`,
    `- Estilo: ${visual.style ?? 'sin datos'}`,
    `- Logo disponible: ${yesNo(visual.logo?.available)} ${visual.logo?.format ? `(${visual.logo.format})` : ''}`.trim(),
    `- Calidad de fotos: ${visual.photoQuality ?? 'sin datos'}`,
    `- Animaciones: ${intake.animations ?? 'subtle'}`,
    '',
    '## Catálogo',
    '',
    `- Cantidad inicial: ${catalog.initialCount ?? 0}`,
    `- Categorías: ${list(catalog.categories)}`,
    `- Variantes: ${yesNo(catalog.hasVariants)}`,
    `- Rango de precios: ${catalog.priceRange || 'sin datos'}`,
    `- Tipo: ${catalog.type ?? 'sin datos'}`,
    `- Peso default: ${catalog.defaultWeightGrams ?? 'no aplica'} g`,
    `- Peso estimado: ${yesNo(catalog.weightEstimated)}`,
    `- Dimensiones default: ${catalog.defaultDimensionsCm ? `${catalog.defaultDimensionsCm.length} x ${catalog.defaultDimensionsCm.width} x ${catalog.defaultDimensionsCm.height} cm` : 'sin datos'}`,
    '',
    '## Páginas',
    '',
    `- Páginas solicitadas: ${list(pageList)}`,
    '',
    '## Contacto',
    '',
    `- WhatsApp: ${contact.whatsapp || 'sin datos'}`,
    `- Email: ${contact.email || 'sin datos'}`,
    `- Redes: ${list(contact.socials)}`,
    `- Red principal: ${contact.primarySocial || 'sin datos'}`,
    '',
    '## Assets',
    '',
    `- Carpeta lista: ${yesNo(assets.folderReady)}`,
    `- Faltantes: ${list(assets.missing)}`,
    assets.missing?.includes('productos')
      ? '- Regla: usar imágenes Unsplash relacionadas al rubro/categoría/producto hasta recibir fotos reales.'
      : '- Regla: usar imágenes provistas por el cliente.',
    '',
    '## Riesgos y Pendientes',
    '',
    ...(intake.notes?.length ? intake.notes.map(note => `- ${note}`) : ['- Sin notas adicionales.']),
    '',
  ]

  return `${lines.join('\n')}\n`
}

function buildDesignMd(intake, integrations) {
  const business = intake.business ?? {}
  const audience = intake.audience ?? {}
  const visual = intake.visualIdentity ?? {}
  const catalog = intake.catalog ?? {}
  const pages = intake.pages ?? {}
  const assets = intake.assets ?? {}
  const technical = intake.technical ?? {}
  const plan = String(intake.plan ?? 'esencial').toLowerCase()
  const hasCheckout = plan === 'emprendimiento' || plan === 'empresa'

  const tone = String(audience.tone ?? 'profesional').toLowerCase()
  const style = String(visual.style ?? 'moderno').toLowerCase()

  const typoMap = {
    cercano: {
      display: { family: 'Nunito', fallback: 'Quicksand', weight: 700, style: 'rounded, friendly' },
      body: { family: 'Inter', fallback: 'Source Sans 3', weight: 400, style: 'legible, warm' },
    },
    profesional: {
      display: { family: 'Outfit', fallback: 'Manrope', weight: 700, style: 'geometric, clean' },
      body: { family: 'Inter', fallback: 'IBM Plex Sans', weight: 400, style: 'neutral, precise' },
    },
    juvenil: {
      display: { family: 'Space Grotesk', fallback: 'Sora', weight: 700, style: 'bold, playful' },
      body: { family: 'DM Sans', fallback: 'Rubik', weight: 400, style: 'modern, energetic' },
    },
    exclusivo: {
      display: { family: 'Playfair Display', fallback: 'Cormorant', weight: 700, style: 'serif, elegant' },
      body: { family: 'Lora', fallback: 'Source Serif 4', weight: 400, style: 'refined, readable' },
    },
    informal: {
      display: { family: 'Poppins', fallback: 'Comfortaa', weight: 700, style: 'rounded, casual' },
      body: { family: 'Nunito Sans', fallback: 'Karla', weight: 400, style: 'friendly, legible' },
    },
  }

  const typo = typoMap[tone] || typoMap.profesional
  const isDark = style.includes('dark') || style.includes('oscuro')

  const primaryColor = visual.colors?.primary || '#16a05d'
  const secondaryColor = visual.colors?.secondary || '#1a1a2e'
  const accentColor = visual.colors?.accent || '#e8b43f'

  const bgColor = isDark ? '#0a0a0a' : '#ffffff'
  const surfaceColor = isDark ? '#141414' : '#fafafa'
  const textColor = isDark ? '#f5f5f5' : '#1a1a1a'
  const textMutedColor = isDark ? '#a0a0a0' : '#6b7280'

  const animLevel = intake.animations ?? 'subtle'

  // Plan page definitions
  const planPages = {
    esencial: {
      required: ['Home', 'Catálogo', 'Producto', 'Sobre Nosotros', 'FAQ', 'Contacto', 'Términos y Privacidad', '404', 'Error'],
      checkout: false,
    },
    emprendimiento: {
      required: ['Home', 'Catálogo', 'Producto', 'Carrito', 'Checkout (Datos)', 'Checkout (Envío)', 'Checkout (Pago)', 'Checkout (Confirmación)', 'Seguimiento de Pedido', 'Sobre Nosotros', 'FAQ', 'Contacto', 'Términos y Privacidad', '404', 'Error'],
      checkout: true,
    },
    empresa: {
      required: ['Home', 'Catálogo', 'Producto', 'Carrito', 'Checkout (Datos)', 'Checkout (Envío)', 'Checkout (Pago)', 'Checkout (Confirmación)', 'Seguimiento de Pedido', 'Sobre Nosotros', 'FAQ', 'Contacto', 'Términos y Privacidad', 'Blog (opcional)', '404', 'Error'],
      checkout: true,
    },
  }

  const pageList = planPages[plan]?.required || planPages.esencial.required

  const lines = []

  // Header
  lines.push(`# DESIGN.md — ${business.name || 'Proyecto'}`, '')
  lines.push(`> Documento de diseño completo generado automáticamente por SitioHoy Briefing`)
  lines.push(`> Fecha: ${new Date().toISOString().split('T')[0]}`)
  lines.push(`> Plan: ${plan.toUpperCase()}`)
  lines.push(`> Versión: 1.0`, '')

  // 1. Project Info
  lines.push('## 1. Información del Proyecto', '')
  lines.push(`| Campo | Valor |`)
  lines.push(`|---|---|`)
  lines.push(`| **Nombre** | ${business.name || 'Sin definir'} |`)
  lines.push(`| **Slug** | ${business.slug || 'Sin definir'} |`)
  lines.push(`| **Rubro** | ${business.industry || 'Sin definir'} |`)
  lines.push(`| **Plan** | ${plan.toUpperCase()} |`)
  lines.push(`| **Descripción** | ${business.description || 'Sin definir'} |`)
  lines.push(`| **Diferenciador** | ${business.differentiator || 'Sin definir'} |`)
  lines.push(`| **Objetivo Principal** | ${business.primaryGoal || 'Sin definir'} |`)
  lines.push(`| **Estilo Visual** | ${visual.style || 'Sin definir'} |`)
  lines.push(`| **Mood** | ${visual.desiredMood || audience.desiredFeeling || 'Sin definir'} |`)
  lines.push(`| **Animaciones** | ${animLevel.toUpperCase()} |`)
  lines.push('')

  // 2. Audience
  lines.push('## 2. Audiencia Objetivo', '')
  lines.push(`| Campo | Valor |`)
  lines.push(`|---|---|`)
  lines.push(`| **Perfil** | ${audience.profile || 'Sin definir'} |`)
  lines.push(`| **Problema** | ${audience.problem || 'Sin definir'} |`)
  lines.push(`| **Sensación** | ${audience.desiredFeeling || 'Sin definir'} |`)
  lines.push(`| **Tono** | ${tone.toUpperCase()} |`)
  lines.push(`| **Dispositivo** | ${audience.primaryDevice || 'mixed'} |`)
  lines.push('')
  lines.push('### Lenguaje y Comunicación')
  lines.push('')
  lines.push(`- **Tono:** ${tone}`)
  lines.push(`- **Tratamiento:** ${tone === 'cercano' || tone === 'juvenil' || tone === 'informal' ? 'Tuteo (vos)' : 'Ustedeo o neutro'}`)
  lines.push(`- **CTAs:** ${tone === 'juvenil' ? 'Energéticos, imperativos' : tone === 'exclusivo' ? 'Elegantes, invitativos' : 'Claros, accionables'}`)
  lines.push('')

  // 3. Colors
  lines.push('## 3. Paleta de Colores', '')
  lines.push('### Marca')
  lines.push(`| Rol | Hex | Uso |`)
  lines.push(`|---|---|---|`)
  lines.push(`| **Primario** | ${primaryColor} | CTAs, botones, acentos |`)
  lines.push(`| **Secundario** | ${secondaryColor} | Headers, fondos oscuros |`)
  lines.push(`| **Acento** | ${accentColor} | Badges, etiquetas |`)
  lines.push('')
  lines.push('### Fondos')
  lines.push(`| Rol | Hex |`)
  lines.push(`|---|---|`)
  lines.push(`| **Background** | ${bgColor} |`)
  lines.push(`| **Surface** | ${surfaceColor} |`)
  lines.push(`| **Texto** | ${textColor} |`)
  lines.push(`| **Texto Secundario** | ${textMutedColor} |`)
  lines.push('')

  // 4. Typography
  lines.push('## 4. Tipografía', '')
  lines.push(`| Rol | Fuente | Fallback | Weight |`)
  lines.push(`|---|---|---|---|`)
  lines.push(`| **Display** | ${typo.display.family} | ${typo.display.fallback} | ${typo.display.weight} |`)
  lines.push(`| **Body** | ${typo.body.family} | ${typo.body.fallback} | ${typo.body.weight} |`)
  lines.push('')
  lines.push('### Escala')
  lines.push(`| Elemento | Mobile | Desktop | Line-height |`)
  lines.push(`|---|---|---|---|`)
  lines.push(`| H1 | 32px | 56px | 1.1 |`)
  lines.push(`| H2 | 28px | 40px | 1.2 |`)
  lines.push(`| H3 | 22px | 28px | 1.3 |`)
  lines.push(`| Body | 14px | 16px | 1.6 |`)
  lines.push(`| Small | 12px | 14px | 1.5 |`)
  lines.push('')

  // 5. Layout
  lines.push('## 5. Layout y Grid', '')
  lines.push(`| Breakpoint | Ancho | Uso |`)
  lines.push(`|---|---|---|`)
  lines.push(`| Mobile | 375px | Base design |`)
  lines.push(`| Tablet | 768px | 2 columnas |`)
  lines.push(`| Desktop | 1280px | Layout completo |`)
  lines.push(`| Wide | 1920px | Desktop grande |`)
  lines.push('')

  // 6. Components
  lines.push('## 6. Componentes Clave', '')
  lines.push('### Header')
  lines.push('- Altura: 64px mobile, 72px desktop')
  lines.push('- Fondo: transparente en hero, blur al scrollear')
  lines.push('- Logo izquierda, nav centrada, CTA derecha')
  lines.push('- Mobile: hamburguesa + drawer desde derecha')
  lines.push('')
  lines.push('### Footer')
  lines.push('- 4 columnas desktop, 1 columna mobile')
  lines.push('- Copyright izquierda, crédito SitioHoy derecha')
  lines.push('- Logo SitioHoy: 72x24px con link a sitiohoy.com.ar')
  lines.push('')
  lines.push('### Product Card')
  lines.push('- Border-radius: 12px, aspect-ratio 1/1')
  lines.push('- Hover: scale(1.02) + shadow-md, 250ms')
  lines.push('- Badge: "Nuevo", "Oferta", "Últimas unidades"')
  lines.push('')

  if (hasCheckout) {
    lines.push('### Cart Drawer')
    lines.push('- Ancho: 100vw mobile, 420px desktop')
    lines.push('- Overlay oscuro 50%')
    lines.push('- Items: imagen 80x80 + info + eliminar')
    lines.push('')
    lines.push('### Checkout')
    lines.push('- Max-width: 600px centrado')
    lines.push('- Steps: Datos → Envío → Pago → Confirmación')
    lines.push('- Progress bar visible')
    lines.push('')
  }

  // 7. Pages
  lines.push('## 7. Páginas a Diseñar', '')
  lines.push(`**Total: ${pageList.length} páginas**`)
  lines.push(`**Plan: ${plan.toUpperCase()}**`)
  lines.push('')
  pageList.forEach((page, idx) => {
    lines.push(`### ${idx + 1}. ${page}`)
    if (page === 'Home') {
      lines.push('- Hero: headline + CTA + imagen')
      lines.push('- Categorías destacadas (grid 3-4)')
      lines.push('- Productos destacados')
      lines.push('- Trust signals')
      lines.push('- Testimonios (si aplica)')
      lines.push('- CTA final')
      if (!hasCheckout) lines.push('- WhatsApp banner prominente')
    } else if (page === 'Catálogo') {
      lines.push('- Header con título y breadcrumb')
      lines.push('- Filtros (sidebar desktop, drawer mobile)')
      lines.push('- Grid productos 2-4 columnas')
      lines.push('- Paginación o infinite scroll')
    } else if (page === 'Producto') {
      lines.push('- Galería: imagen principal + thumbnails')
      lines.push('- Info: nombre, precio, descripción')
      lines.push('- Variantes (selector visual)')
      lines.push('- Stock indicator')
      lines.push('- CTA: "Agregar al carrito" o "Consultar por WhatsApp"')
      lines.push('- Productos relacionados')
    } else if (page.includes('Checkout')) {
      lines.push('- Progress bar del paso actual')
      lines.push('- Formulario del paso')
      lines.push('- Resumen sticky (desktop)')
      lines.push('- CTA principal ancho completo')
    } else if (page === 'Carrito') {
      lines.push('- Lista items con imagen, cantidad, precio')
      lines.push('- Cupón de descuento')
      lines.push('- Resumen: subtotal, envío, total')
      lines.push('- CTA checkout')
    } else if (page === 'Seguimiento de Pedido') {
      lines.push('- Timeline visual de estados')
      lines.push('- Detalles del pedido')
      lines.push('- Info de tracking')
    } else if (page === 'Sobre Nosotros') {
      lines.push('- Hero con imagen de equipo/local')
      lines.push('- Historia del negocio')
      lines.push('- Equipo o valores')
      lines.push('- CTA contacto')
    } else if (page === 'FAQ') {
      lines.push('- Título "Preguntas Frecuentes"')
      lines.push('- Accordion con preguntas/respuestas')
      lines.push('- CTA contacto si no encuentra respuesta')
    } else if (page === 'Contacto') {
      lines.push('- Info: dirección, teléfono, email, horarios')
      lines.push('- Mapa (si aplica)')
      lines.push('- Formulario de contacto')
      lines.push('- Redes sociales')
    } else if (page.includes('404')) {
      lines.push('- Ilustración o ícono grande')
      lines.push('- "Página no encontrada"')
      lines.push('- Links a home, catálogo, contacto')
    } else if (page.includes('Error')) {
      lines.push('- Mensaje de error')
      lines.push('- Botón reintentar')
      lines.push('- Link a home')
    } else if (page.includes('Términos')) {
      lines.push('- Título')
      lines.push('- Texto legal en secciones')
      lines.push('- Fecha de actualización')
    }
    lines.push('')
  })

  // 8. Animations
  lines.push('## 8. Animaciones', '')
  const animSpecs = {
    none: 'Sin animaciones. Solo transiciones CSS mínimas.',
    subtle: 'Fade-in scroll, hover cards scale(1.02), menú slide 300ms, botones active scale(0.98)',
    full: 'Entrada escalonada hero, parallax sutil, microinteracciones, magnetic hover, page transitions',
  }
  lines.push(`${animSpecs[animLevel] || animSpecs.subtle}`)
  lines.push('')

  // 9. Assets
  lines.push('## 9. Assets', '')
  lines.push(`| Recurso | Estado |`)
  lines.push(`|---|---|`)
  lines.push(`| Logo | ${visual.logo?.available ? `Sí (${visual.logo.format})` : 'No — generar o solicitar'} |`)
  lines.push(`| Hero | ${assets.missing?.includes('hero') ? 'No — usar Unsplash' : 'Sí'} |`)
  lines.push(`| Productos | ${assets.missing?.includes('productos') ? 'No — usar Unsplash' : 'Sí'} |`)
  lines.push('')

  // 10. Integrations
  lines.push('## 10. Integraciones Visuales', '')
  if (hasCheckout) lines.push('- MercadoPago badge: footer, checkout, producto')
  if (plan === 'empresa' && technical.correoArgentinoRequested) lines.push('- Correo Argentino badge')
  if (plan === 'empresa' && technical.enviaRequested) lines.push('- Envia.com badge')
  if (plan === 'emprendimiento') lines.push('- Envíos badge')
  lines.push('- WhatsApp botón flotante verde')
  if (hasCheckout && technical.resendRequested) lines.push('- Email ícono footer')
  lines.push('')

  // 11. Notes for Stitch
  lines.push('## 11. Notas para Stitch', '')
  lines.push('')
  lines.push('### Prioridades')
  lines.push('1. Mobile-first: diseñar 375px primero')
  lines.push('2. Conversión: CTA claro en cada página')
  lines.push('3. Confianza: badges de seguridad visibles')
  lines.push('4. Consistencia: seguir tokens definidos')
  lines.push('')
  lines.push('### Evitar')
  lines.push('- ❌ Gradientes genéricos sin relación marca')
  lines.push('- ❌ Glassmorphism sin propósito')
  lines.push('- ❌ Bordes > 20px en contenedores')
  lines.push('- ❌ Animaciones en todos los elementos')
  lines.push('- ❌ Hero genérico sobre stock photo')
  lines.push('- ❌ Inter/Roboto/Lato por defecto')
  lines.push('')
  lines.push('### Incluir siempre')
  lines.push('- ✅ Header + Footer en todas las pantallas')
  lines.push('- ✅ Estados hover y active')
  lines.push('- ✅ Estados loading y empty')
  lines.push('- ✅ Badges para estados (nuevo, oferta, agotado)')
  lines.push('')
  lines.push('### Flujo de trabajo')
  lines.push('1. Sistema de diseño base (colores, tipografía)')
  lines.push('2. Header y Footer')
  lines.push('3. Home completa')
  lines.push('4. Catálogo y Producto')
  if (hasCheckout) {
    lines.push('5. Carrito y Checkout (4 pasos)')
    lines.push('6. Seguimiento')
    lines.push('7. Páginas opcionales')
    lines.push('8. Estados de error')
    lines.push('9. Revisar responsive')
    lines.push('10. Exportar assets')
  } else {
    lines.push('5. Páginas opcionales')
    lines.push('6. Estados de error')
    lines.push('7. Revisar responsive')
    lines.push('8. Exportar assets')
  }
  lines.push('')

  // Footer
  lines.push('---', '')
  lines.push('**Documento generado por SitioHoy v2.0**')
  lines.push('**Para uso exclusivo con Stitch**')
  lines.push('**Instrucciones:** Copiar este documento completo en Stitch para generar el diseño.')
  lines.push('**ID del proyecto Stitch:** [COMPLETAR DESPUÉS DE GENERAR EN STITCH]')
  lines.push('')

  return lines.join('\n')
}

function buildCopyGuide(intake, integrations) {
  const business = intake.business ?? {}
  const audience = intake.audience ?? {}
  const tone = audience.tone ?? 'profesional'
  const plan = String(intake.plan ?? 'esencial').toLowerCase()
  const catalog = intake.catalog ?? {}
  const pages = intake.pages ?? {}
  const contact = intake.contact ?? {}

  const toneGuides = {
    cercano: 'Usar tuteo, frases cortas, empático. Ej: "Te ayudamos a encontrar lo que buscás"',
    profesional: 'Ustedeo o neutro, directo, claro. Ej: "Soluciones diseñadas para su negocio"',
    juvenil: 'Informal, dinámico, emojis con moderación. Ej: "Descubrí lo nuevo que te va a encantar"',
    exclusivo: 'Elegante, sobrio, sin exceso. Ej: "Una experiencia diseñada para quienes valoran la diferencia"',
  }

  const lines = [
    `# Guía de Copy — ${business.name ?? 'Proyecto'}`,
    '',
    '## Tono y Voz',
    '',
    `- Tono definido: **${tone}**`,
    `- Guía: ${toneGuides[tone] || toneGuides.profesional}`,
    `- Audiencia: ${audience.profile ?? 'sin definir'}`,
    `- Problema que resuelven: ${audience.problem ?? 'sin definir'}`,
    `- Sensación deseada: ${audience.desiredFeeling ?? 'sin definir'}`,
    '',
    '## Textos Obligatorios por Sección',
    '',
    '### Header',
    `- Nombre: ${business.name ?? 'definir'}`,
    '- Navegación: Inicio, Catálogo/Productos, ' + (pages.about ? 'Nosotros, ' : '') + (pages.contact ? 'Contacto, ' : '') + (pages.faq ? 'FAQ, ' : '') + (plan !== 'esencial' ? 'Carrito' : ''),
    '',
    '### Hero',
    `- Headline: debe comunicar "${business.primaryGoal ?? 'valor principal'}" en ≤8 palabras`,
    `- Subheadline: expandir con diferencial "${business.differentiator ?? ''}"`,
    `- CTA principal: ${plan !== 'esencial' ? '"Comprar ahora" o "Ver catálogo"' : '"Consultar por WhatsApp" o "Ver productos"'}`,
    '',
    '### Catálogo',
    `- Categorías: ${(catalog.categories ?? []).join(', ') || 'por definir'}`,
    `- Cantidad de productos: ${catalog.initialCount ?? 'por definir'}`,
    '- Cada producto: nombre, descripción corta (≤120 chars), precio, CTA',
    '',
    '### Footer',
    `- WhatsApp: ${contact.whatsapp ?? 'por definir'}`,
    `- Email: ${contact.email ?? 'por definir'}`,
    '- Links legales: Términos y Condiciones, Política de Privacidad',
    integrations.mercadopago ? '- Badge: "Pagá con MercadoPago"' : '',
    '',
    '## Reglas de Copy',
    '',
    '- Español argentino (vos/tuteo si tono cercano o juvenil)',
    '- Sin anglicismos innecesarios',
    '- CTAs claros y accionables',
    '- Descripciones de producto: beneficio primero, feature después',
    '- SEO: incluir keywords del rubro en H1, meta title, meta description',
    `- Keywords sugeridas: ${business.industry ?? ''}, ${(catalog.categories ?? []).slice(0, 3).join(', ')}`,
    '',
    '## Meta Tags (SEO)',
    '',
    `- Title: "${business.name} — ${business.description?.slice(0, 50) ?? business.industry ?? ''}"`,
    `- Description: ≤155 chars, incluir CTA y diferencial`,
    `- OG Image: hero del sitio o logo sobre fondo de marca`,
    '',
  ].filter(line => line !== undefined)

  return lines.join('\n') + '\n'
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

  // Open browser unless disabled for CI/sandbox checks.
  if (process.env.SITIOHOY_NO_OPEN !== '1') {
    setTimeout(() => openBrowser(url), 300)
  }
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
