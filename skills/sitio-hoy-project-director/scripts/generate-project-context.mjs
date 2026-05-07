import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const configPath = path.join(root, 'sitiohoy.config.json')
const briefPath = path.join(root, 'brief.md')

if (!existsSync(configPath) || !existsSync(briefPath)) {
  console.error('Faltan sitiohoy.config.json o brief.md')
  process.exit(1)
}

const config = JSON.parse(await readFile(configPath, 'utf8'))
const brief = await readFile(briefPath, 'utf8')

const plan = config.plan ?? 'esencial'
const project = config.project ?? 'SitioHoy'
const integrations = config.integrations ?? {}
const hasCheckout = plan === 'emprendimiento' || plan === 'empresa'
const hasEnvios = integrations.envia || integrations.fixedShipping
const hasResend = Boolean(integrations.resend)
const hasUmami = Boolean(integrations.umami)

const outContext = path.join(root, '.sitiohoy', 'context')
const outDesign = path.join(root, '.sitiohoy', 'design')
await mkdir(outContext, { recursive: true })
await mkdir(outDesign, { recursive: true })

const getBriefValue = (label) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = brief.match(new RegExp(`^- ${escaped}:\\s*(.*)$`, 'mi'))
  return match?.[1]?.trim() ?? ''
}

const industry = getBriefValue('Rubro')
const tone = getBriefValue('Tono')
const desiredFeeling = getBriefValue('Sensacion deseada')
const style = getBriefValue('Estilo')
const photoQuality = getBriefValue('Calidad de fotos')
const primaryDevice = getBriefValue('Dispositivo predominante')
const primaryColor = getBriefValue('Color principal')
const secondaryColor = getBriefValue('Color secundario')
const accentColor = getBriefValue('Color acento')
const categories = getBriefValue('Categorias')

const chooseFonts = () => {
  const text = `${industry} ${style} ${desiredFeeling}`.toLowerCase()
  if (/lujo|premium|moda|sofistic/.test(text)) return ['DM Serif Display', 'DM Sans']
  if (/artesanal|organico|natural|calido/.test(text)) return ['Fraunces', 'Nunito']
  if (/tech|moderno|futur/.test(text)) return ['Syne', 'Inter']
  if (/juvenil|urbano|vibrante/.test(text)) return ['Bricolage Grotesque', 'DM Sans']
  if (/gastronom/.test(text)) return ['Fraunces', 'Nunito']
  return ['Fraunces', 'Inter']
}

const chooseHero = () => {
  const photos = photoQuality.toLowerCase()
  const text = `${industry} ${style} ${desiredFeeling}`.toLowerCase()
  if (/professional|profesional/.test(photos)) return 'Hero full-bleed con imagen real, texto overlay y CTA claro.'
  if (/none|sin fotos/.test(photos)) return 'Hero editorial tipografico con color solido y composicion fuerte, sin stock generico.'
  if (/lujo|premium/.test(text)) return 'Hero editorial con mucho espacio, tipografia display y producto/imagen protagonista.'
  if (/tech|servicio/.test(text)) return 'Hero bento sobrio con beneficio principal y pruebas de confianza.'
  return 'Hero visual con imagen propia, CTA primario y prueba de confianza visible.'
}

const chooseCatalog = () => {
  if (plan === 'empresa') return 'Grid escalable con filtros, productos relacionados y soporte para catalogos grandes.'
  if (plan === 'emprendimiento') return 'Grid 2 columnas mobile, 3/4 desktop, cards con precio, stock y agregar al carrito.'
  return 'Grid visual con CTA WhatsApp por producto y filtros simples por categoria.'
}

const [displayFont, bodyFont] = chooseFonts()
const heroRecipe = chooseHero()
const catalogRecipe = chooseCatalog()

const planModules = {
  esencial: [
    ['0', 'Scaffold, base tecnica e identidad visual'],
    ['1', 'Layout global'],
    ['2', 'Home'],
    ['3', 'Catalogo y detalle'],
    ['4', 'Paginas opcionales'],
    ['5', 'SEO, QA y deploy'],
  ],
  emprendimiento: [
    ['0', 'Scaffold, base tecnica e identidad visual'],
    ['1', 'Layout global con carrito'],
    ['2', 'Home orientada a compra'],
    ['3', 'Catalogo con carrito y variantes'],
    ['4', 'Carrito y checkout'],
    ['5', 'Paginas opcionales'],
    ['6', 'SEO, Umami y deploy'],
  ],
  empresa: [
    ['0', 'Scaffold, base tecnica e identidad visual'],
    ['1', 'Layout global con carrito'],
    ['2', 'Home con confianza y testimonios'],
    ['3', 'Catalogo avanzado'],
    ['4', 'Checkout con MercadoPago y envios'],
    ['5', 'Paginas opcionales y E-E-A-T'],
    ['6', 'SEO tecnico y performance'],
    ['7', 'Umami avanzado y deploy'],
  ],
}

const modules = planModules[plan] ?? planModules.esencial

const commonRules = [
  '- Usar Server Components por defecto.',
  "- Usar 'use client' solo para estado, efectos o eventos.",
  '- Usar next/image, nunca <img>.',
  '- Usar next/font, nunca links externos de fuentes.',
  '- Usar revalidateTag, nunca revalidatePath global.',
  '- Ejecutar npm run sitiohoy:validate antes de cerrar.',
]

const write = async (file, content) => {
  await writeFile(file, `${content.trim()}\n`)
}

await write(path.join(outContext, 'project-context.md'), `
# Project Context - ${project}

- Plan: ${plan}
- Industria: ${industry || 'sin definir'}
- Dominio: ${config.siteUrl || config.domain?.status || 'pendiente'}
- Checkout: ${hasCheckout ? 'si' : 'no'}
- MercadoPago: ${integrations.mercadopago ? 'si' : 'no'}
- Envia.com: ${integrations.envia ? 'si' : 'no'}
- Envios fijos: ${integrations.fixedShipping ? 'si' : 'no'}
- Resend: ${hasResend ? 'si' : 'no'}
- Umami: ${hasUmami ? 'si' : 'no'}
- WhatsApp: ${integrations.whatsapp ? 'si' : 'no'}

## Cargar siempre

- \`sitiohoy.config.json\`
- \`brief.md\`
- pack del modulo actual en \`.sitiohoy/context/\`

## No cargar salvo duda concreta

- Archivos core completos
- Integraciones no activas
- Modulos de otros planes

## Reglas permanentes

${commonRules.join('\n')}
`)

const moduleDetails = {
  '0': {
    read: ['sitio-hoy-scaffold', 'sitio-hoy-database', 'core/04-design-system.md si falta criterio visual'],
    build: ['base Next/Supabase', 'sitiohoy.config.json validado', 'migracion inicial', 'tokens css', 'DESIGN.md'],
    gates: ['npm run build', 'npm run sitiohoy:validate'],
  },
  '1': {
    read: ['.sitiohoy/design/design-direction.md', 'core/17-manejo-errores.md si falta template'],
    build: ['layout', 'header', 'footer', 'navegacion responsive', hasCheckout ? 'carrito/drawer base' : 'CTA WhatsApp'],
    gates: ['npm run sitiohoy:validate'],
  },
  '2': {
    read: ['.sitiohoy/design/layout-recipe.md', 'core/08-seo.md si falta metadata'],
    build: ['home', 'hero', 'categorias', 'destacados', 'propuesta de valor', 'CTA final'],
    gates: ['npm run sitiohoy:validate'],
  },
  '3': {
    read: ['core/07-isr-cache.md si faltan queries', 'core/08-seo.md si falta Schema.org'],
    build: [hasCheckout ? 'catalogo con agregar al carrito' : 'catalogo con WhatsApp', 'detalle producto', 'galeria', 'variantes', 'metadata'],
    gates: ['npm run build', 'npm run sitiohoy:validate'],
  },
  '4': {
    read: hasCheckout ? ['.sitiohoy/context/checkout-context.md'] : ['integraciones/formulario-contacto.md si hay pagina contacto'],
    build: hasCheckout ? ['cart store', 'checkout multi-step', 'pedido', 'MercadoPago', hasEnvios ? 'envios' : 'coordinar envio', 'seguimiento'] : ['paginas opcionales', 'formulario si aplica'],
    gates: ['npm run build', 'npm run sitiohoy:validate', hasCheckout ? 'pago de prueba documentado' : ''],
  },
  '5': {
    read: plan === 'esencial' ? ['.sitiohoy/context/deploy-context.md'] : ['core/08-seo.md', 'integraciones/formulario-contacto.md si aplica'],
    build: plan === 'esencial' ? ['sitemap', 'robots', 'QA report', 'deploy'] : ['paginas opcionales', 'legales', 'E-E-A-T si Empresa'],
    gates: plan === 'esencial' ? ['npm run sitiohoy:qa', 'npm run sitiohoy:qa-report'] : ['npm run sitiohoy:validate'],
  },
  '6': {
    read: plan === 'empresa' ? ['core/08-seo.md'] : ['.sitiohoy/context/deploy-context.md'],
    build: plan === 'empresa' ? ['SEO tecnico', 'Schema.org completo', 'Lighthouse'] : ['sitemap', 'robots', 'Umami', 'deploy'],
    gates: ['npm run sitiohoy:qa', 'npm run sitiohoy:qa-report'],
  },
  '7': {
    read: ['.sitiohoy/context/deploy-context.md', 'integraciones/umami-avanzado.md'],
    build: ['Umami avanzado', 'eventos ecommerce', 'deploy', 'webhooks', 'compra real'],
    gates: ['npm run sitiohoy:qa', 'npm run sitiohoy:qa-report'],
  },
}

for (const [number, name] of modules) {
  const detail = moduleDetails[number] ?? moduleDetails['0']
  await write(path.join(outContext, `module-${number}.md`), `
# Module ${number} - ${name}

## Objetivo

${name} para ${project}, plan ${plan}.

## Contexto minimo

- \`sitiohoy.config.json\`
- \`brief.md\`
- \`.sitiohoy/context/project-context.md\`
- \`.sitiohoy/context/module-${number}.md\`
${Number(number) >= 1 && Number(number) <= 3 ? '- `.sitiohoy/design/design-direction.md`' : ''}

## Leer solo si hace falta

${detail.read.filter(Boolean).map((item) => `- ${item}`).join('\n')}

## Construir

${detail.build.filter(Boolean).map((item) => `- ${item}`).join('\n')}

## Reglas

${commonRules.join('\n')}

## Gates

${detail.gates.filter(Boolean).map((item) => `- ${item}`).join('\n')}
`)
}

if (hasCheckout) {
  await write(path.join(outContext, 'checkout-context.md'), `
# Checkout Context - ${project}

## Integraciones

- MercadoPago: ${integrations.mercadopago ? 'activo' : 'inactivo'}
- Envia.com: ${integrations.envia ? 'activo' : 'inactivo'}
- Envios fijos: ${integrations.fixedShipping ? 'activo' : 'inactivo'}
- Resend: ${hasResend ? 'activo' : 'inactivo'}

## Reglas criticas

- Recalcular subtotal, envio, descuentos y total en server.
- No confiar en precios del carrito cliente.
- Crear pedidos con \`tenant_id\`.
- Webhook MercadoPago debe filtrar por \`id\` y \`tenant_id\`.
- Registrar payload en \`payment_events\`.
- Tracking de pedido por Server Action/RPC con \`tracking_token\`.
- Idempotency key estable por pedido/intento, nunca \`Date.now()\`.

## Leer solo si hace falta

- \`integraciones/mercadopago.md\`
- ${integrations.fixedShipping ? '`integraciones/envios-fijos.md`' : integrations.envia ? '`integraciones/envia.md`' : 'shipping fallback en plan'}
- ${hasResend ? '`integraciones/resend.md`' : 'Resend no activo'}
`)
}

await write(path.join(outContext, 'deploy-context.md'), `
# Deploy Context - ${project}

## Antes de deploy

- \`npm run build\`
- \`npm run sitiohoy:qa\`
- \`npm run sitiohoy:qa-report\`
- Revisar variables en Vercel.
- Confirmar dominio y SSL.
${hasCheckout ? '- Probar MercadoPago en produccion y webhook final.' : '- Probar CTA WhatsApp y formulario si existe.'}
${integrations.envia ? '- Verificar Envia.com en ambiente correcto.' : ''}
${hasUmami ? '- Verificar Umami pageviews/eventos.' : ''}

## Leer si hace falta

- \`core/15-deploy-vercel.md\`
- \`core/11-qa-checklist.md\`
`)

await write(path.join(outContext, 'context-index.md'), `
# Context Index - ${project}

## Plan

${plan}

## Packs disponibles

- \`.sitiohoy/context/project-context.md\`
${modules.map(([number, name]) => `- \`.sitiohoy/context/module-${number}.md\` - ${name}`).join('\n')}
${hasCheckout ? '- `.sitiohoy/context/checkout-context.md`' : ''}
- \`.sitiohoy/context/deploy-context.md\`

## Diseño

- \`.sitiohoy/design/design-direction.md\`
- \`.sitiohoy/design/layout-recipe.md\`
- \`.sitiohoy/design/design-tokens.seed.json\`
- \`.sitiohoy/design/anti-slop-checklist.md\`
`)

await write(path.join(outDesign, 'design-direction.md'), `
# Design Direction - ${project}

## Personalidad

- Industria: ${industry || 'sin definir'}
- Tono: ${tone || 'sin definir'}
- Sensacion deseada: ${desiredFeeling || 'sin definir'}
- Estilo: ${style || 'sin definir'}
- Dispositivo principal: ${primaryDevice || 'mixed'}

## Tipografia

- Display: ${displayFont}
- Body: ${bodyFont}

## Color

- Primary: ${primaryColor || 'definir desde brief'}
- Secondary: ${secondaryColor || 'definir desde brief'}
- Accent: ${accentColor || 'definir desde brief'}

## Hero

${heroRecipe}

## Catalogo

${catalogRecipe}

## No negociar

- Nada de hero generico centrado con gradiente violeta/azul.
- No usar stock photos genericas si el brief tiene imagenes propias.
- No usar cards con glassmorphism decorativo.
- No usar tipografia por defecto sin intencion.
- No meter texto visible explicando la UI.
`)

await write(path.join(outDesign, 'layout-recipe.md'), `
# Layout Recipe - ${project}

## Mobile first

- Base 375px.
- Touch targets minimo 44px.
- Header compacto y CTA visible.
- Evitar overflow horizontal.

## Hero recomendado

${heroRecipe}

## Catalogo recomendado

${catalogRecipe}

## Categorias iniciales

${categories || 'Definir desde catalogo.'}

## Componentes esperados

- Header
- Footer
- CTA principal
- ProductCard
- Empty state
- Loading skeleton
- Error state
${hasCheckout ? '- Cart drawer\n- Checkout steps\n- Payment state' : '- WhatsApp CTA por producto'}
`)

const tokenSeed = {
  color: {
    primary: primaryColor || '',
    secondary: secondaryColor || '',
    accent: accentColor || '',
  },
  font: {
    display: displayFont,
    body: bodyFont,
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
  layout: {
    primaryDevice: primaryDevice || 'mixed',
    hero: heroRecipe,
    catalog: catalogRecipe,
  },
}

await writeFile(path.join(outDesign, 'design-tokens.seed.json'), `${JSON.stringify(tokenSeed, null, 2)}\n`)

await write(path.join(outDesign, 'anti-slop-checklist.md'), `
# Anti Slop Checklist - ${project}

- [ ] Hero específico del rubro y brief.
- [ ] Paleta sale del brief, no de defaults violetas/azules.
- [ ] Tipografias elegidas por personalidad.
- [ ] Imagenes propias priorizadas.
- [ ] Cards con funcion real.
- [ ] Estados hover/focus/loading/empty/error.
- [ ] Mobile 375px sin overflow.
- [ ] CTA principal coincide con plan: ${hasCheckout ? 'compra' : 'WhatsApp'}.
- [ ] Schema y metadata no usan copy generico.
`)

console.log('.sitiohoy/context/project-context.md')
console.log('.sitiohoy/context/context-index.md')
console.log('.sitiohoy/design/design-direction.md')
