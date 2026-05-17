/**
 * generate-design-md.mjs
 * Genera un DESIGN.md como brief creativo abierto para Stitch.
 * No prescribe layouts ni componentes exactos — da contexto del negocio
 * y deja la creatividad a Stitch.
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const intakePath = path.join(root, '.sitiohoy', 'intake.json')
const configPath = path.join(root, 'sitiohoy.config.json')

if (!existsSync(intakePath)) {
  console.error(`No existe .sitiohoy/intake.json — correr briefing primero`)
  process.exit(1)
}

const intake = JSON.parse(await readFile(intakePath, 'utf8'))
const config = existsSync(configPath)
  ? JSON.parse(await readFile(configPath, 'utf8'))
  : {}

const plan = String(intake.plan ?? config.plan ?? 'esencial').toLowerCase()
const business = intake.business ?? {}
const audience = intake.audience ?? {}
const visual = intake.visualIdentity ?? {}
const catalog = intake.catalog ?? {}
const pages = intake.pages ?? {}
const contact = intake.contact ?? {}
const assets = intake.assets ?? {}
const technical = intake.technical ?? {}

// ── Plan definitions ────────────────────────────────────────────────────────
const planInfo = {
  esencial: {
    name: 'Esencial',
    description: 'Catálogo sin checkout. CTA principal: WhatsApp.',
    hasCheckout: false,
    hasCart: false,
    hasTracking: false,
  },
  emprendimiento: {
    name: 'Emprendimiento',
    description: 'Tienda con checkout, MercadoPago, envíos por zona fija.',
    hasCheckout: true,
    hasCart: true,
    hasTracking: true,
  },
  empresa: {
    name: 'Empresa',
    description: 'Tienda completa con checkout, MercadoPago, envíos avanzados (Correo Argentino o Envia.com), analítica avanzada.',
    hasCheckout: true,
    hasCart: true,
    hasTracking: true,
  },
}

const p = planInfo[plan] || planInfo.esencial

// ── Tone description ────────────────────────────────────────────────────────
const toneDescriptions = {
  cercano: 'Cercano, amigable, como hablar con un amigo. Tuteo. Frases cortas y directas.',
  profesional: 'Profesional, confiable, directo. Neutro o ustedeo. Sin jerga excesiva.',
  juvenil: 'Joven, dinámico, divertido. Tuteo. Emojis moderados. Energético.',
  exclusivo: 'Elegante, sobrio, refinado. Ustedeo. Lenguaje cuidado y selecto.',
  informal: 'Informal, relajado, sin pretensiones. Tuteo. Como una charla de café.',
}

const tone = String(audience.tone ?? 'profesional').toLowerCase()
const toneDesc = toneDescriptions[tone] || toneDescriptions.profesional

// ── Style suggestions (open-ended for Stitch) ───────────────────────────────
const styleHints = {
  moderno: 'Moderno y limpio. Sin exceso de decoración.',
  vintage: 'Vintage o retro. Puede incluir texturas, tipografía clásica, colores nostálgicos.',
  minimalista: 'Minimalista. Mucho espacio en blanco, pocos elementos, tipografía cuidada.',
  elegante: 'Elegante y sofisticado. Detalles refinados, paleta cromática sobria.',
  jugueton: 'Juguetón y colorido. Formas orgánicas, colores vivos, energía positiva.',
  industrial: 'Industrial o urbano. Texturas de concreto/metal, tipografía bold, alto contraste.',
  organico: 'Orgánico y natural. Colores tierra, formas suaves, tipografía artesanal.',
  tecnologico: 'Tecnológico. Líneas limpias, acentos neón, tipografía monoespaciada o geométrica.',
  oscuro: 'Dark mode como estilo principal. Alto contraste, acentos brillantes.',
}

const style = String(visual.style ?? 'moderno').toLowerCase()
const styleHint = styleHints[style] || styleHints.moderno

// ── Helper: list ──────────────────────────────────────────────────────────────
const list = (items) => Array.isArray(items) && items.length
  ? items.map(i => typeof i === 'string' ? i : i?.url ? `${i.network}: ${i.url}` : JSON.stringify(i)).join(', ')
  : 'ninguno'

// ── Device priorities ───────────────────────────────────────────────────────
const primaryDevice = audience.primaryDevice ?? 'mobile'
const devicePriority = primaryDevice === 'mobile'
  ? 'Mobile-first. Diseñá primero para celular y luego escalá a desktop.'
  : primaryDevice === 'desktop'
    ? 'Desktop-priority. El público principal usa computadora, pero el sitio debe verse bien en mobile igual.'
    : 'Diseño equilibrado mobile/desktop. Ambos son importantes.'

// ── Pages by plan (open list, not rigid structure) ──────────────────────────
function getPagesForPlan() {
  const base = ['Home']

  if (plan === 'esencial') {
    base.push('Catálogo', 'Detalle de Producto')
    if (pages.about) base.push('Sobre Nosotros')
    if (pages.faq) base.push('FAQ / Preguntas Frecuentes')
    if (pages.contact) base.push('Contacto')
    if (pages.legal) base.push('Términos y Privacidad')
    base.push('404 / Error')
  } else if (plan === 'emprendimiento') {
    base.push('Catálogo', 'Detalle de Producto', 'Carrito', 'Checkout multi-step', 'Seguimiento de Pedido')
    if (pages.about) base.push('Sobre Nosotros')
    if (pages.faq) base.push('FAQ / Preguntos Frecuentes')
    if (pages.contact) base.push('Contacto')
    if (pages.legal) base.push('Términos y Privacidad')
    base.push('404 / Error')
  } else {
    base.push('Catálogo', 'Detalle de Producto', 'Carrito', 'Checkout multi-step', 'Seguimiento de Pedido')
    if (pages.about) base.push('Sobre Nosotros')
    if (pages.faq) base.push('FAQ / Preguntas Frecuentes')
    if (pages.contact) base.push('Contacto')
    if (pages.legal) base.push('Términos y Privacidad')
    if (pages.blog) base.push('Blog')
    base.push('404 / Error')
  }

  return base
}

const pagesList = getPagesForPlan()

// ── Primary CTA by plan ─────────────────────────────────────────────────────
const primaryCTA = !p.hasCheckout
  ? 'Consultar por WhatsApp / Ver catálogo'
  : 'Comprar ahora / Ver catálogo'

// ── Shipping description ────────────────────────────────────────────────────
let shippingDesc = 'Sin envíos automatizados. El cliente coordina por WhatsApp.'
if (plan === 'emprendimiento') shippingDesc = 'Envíos por zonas fijas (CABA, GBA, Interior). El precio se calcula según la zona.'
if (plan === 'empresa' && technical.correoArgentinoRequested) shippingDesc = 'Envíos con Correo Argentino (MiCorreo). Cotización en tiempo real.'
if (plan === 'empresa' && technical.enviaRequested) shippingDesc = 'Envíos con Envia.com (multicarrier). Etiquetas PDF, múltiples carriers.'

// ── Build DESIGN.md ──────────────────────────────────────────────────────────
function buildDesignMd() {
  const lines = []

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`# DESIGN.md — Brief Creativo para Stitch`)
  lines.push(``)
  lines.push(`> **Proyecto:** ${business.name || 'Sin definir'}`)
  lines.push(`> **Plan:** ${p.name}`)
  lines.push(`> **Rubro:** ${business.industry || 'Sin definir'}`)
  lines.push(`> **Fecha:** ${new Date().toISOString().split('T')[0]}`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EL NEGOCIO — Contexto para Stitch
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 1. Sobre el Negocio`)
  lines.push(``)
  lines.push(`**Nombre:** ${business.name || 'Sin definir'}`)
  lines.push(``)
  lines.push(`**Descripción:**`)
  lines.push(`${business.description || 'Sin definir'}`)
  lines.push(``)
  lines.push(`**Diferenciador / Por qué elegirlos:**`)
  lines.push(`${business.differentiator || 'Sin definir'}`)
  lines.push(``)
  lines.push(`**Objetivo del sitio web:**`)
  lines.push(`${business.primaryGoal || 'Mostrar productos y generar contactos/ventas'}`)
  lines.push(``)
  lines.push(`**Plan contratado:** ${p.name} — ${p.description}`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PÚBLICO OBJETIVO — A quién va dirigido
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 2. Público Objetivo`)
  lines.push(``)
  lines.push(`**Perfil:**`)
  lines.push(`${audience.profile || 'Sin definir'}`)
  lines.push(``)
  lines.push(`**Problema que resuelve el negocio:**`)
  lines.push(`${audience.problem || 'Sin definir'}`)
  lines.push(``)
  lines.push(`**Sensación que debe transmitir el sitio:**`)
  lines.push(`${audience.desiredFeeling || 'Sin definir'}`)
  lines.push(``)
  lines.push(`**Dispositivo principal:**`)
  lines.push(`${devicePriority}`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. IDENTIDAD VISUAL — Lo que el cliente pidió
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 3. Identidad Visual`)
  lines.push(``)

  if (visual.colors?.primary) {
    lines.push(`**Color principal:** ${visual.colors.primary}`)
    lines.push(`- Este es el color de marca. Usalo como guía para la paleta general.`)
  } else {
    lines.push(`**Color principal:** No definido — Stitch, proponé una paleta que vaya con el rubro y el estilo.`)
  }

  if (visual.colors?.secondary) {
    lines.push(``)
    lines.push(`**Color secundario:** ${visual.colors.secondary}`)
  }

  if (visual.colors?.accent) {
    lines.push(``)
    lines.push(`**Color de acento:** ${visual.colors.accent}`)
  }

  lines.push(``)
  lines.push(`**Estilo visual deseado:** ${style}`)
  lines.push(`${styleHint}`)

  if (visual.desiredMood) {
    lines.push(``)
    lines.push(`**Mood / Sensación visual:** ${visual.desiredMood}`)
  }

  if (Array.isArray(business.visualReferences) && business.visualReferences.length) {
    lines.push(``)
    lines.push(`**Referencias visuales del cliente:**`)
    business.visualReferences.forEach(ref => {
      lines.push(`- ${ref}`)
    })
    lines.push(`- Tomá estas referencias como inspiración, no como algo a copiar exactamente.`)
  }

  lines.push(``)
  lines.push(`**Nivel de animaciones:** ${intake.animations || 'sutiles'}`)
  lines.push(`- sutiles = hover suaves, fade-ins básicos`)
  lines.push(`- completas = parallax, microinteracciones, entradas escalonadas`)
  lines.push(`- ninguna = solo transiciones CSS mínimas`)
  lines.push(``)

  if (visual.logo?.available) {
    lines.push(`**Logo:** Sí, el cliente tiene logo (${visual.logo.format || 'formato no especificado'}).`)
    lines.push(`- Respetalo como elemento principal de marca. Adaptá el diseño a su estilo.`)
  } else {
    lines.push(`**Logo:** No — el cliente no tiene logo todavía.`)
    lines.push(`- El sitio debe funcionar sin logo o con un wordmark tipográfico.`)
  }

  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. COMUNICACIÓN — Tono y lenguaje
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 4. Comunicación — Tono y Lenguaje`)
  lines.push(``)
  lines.push(`**Tono general:** ${toneDesc}`)
  lines.push(``)
  lines.push(`**Reglas de comunicación:**`)
  lines.push(`- Español argentino.`)
  lines.push(`- Sin anglicismos innecesarios.`)
  lines.push(`- CTAs claros y accionables.`)
  lines.push(`- Las descripciones de producto deben comunicar el beneficio primero, la característica después.`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. PÁGINAS A DISEÑAR — Lista sin estructura rígida
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 5. Páginas a Diseñar`)
  lines.push(``)
  lines.push(`**Plan:** ${p.name}`)
  lines.push(`**Total de páginas:** ${pagesList.length}`)
  lines.push(``)
  lines.push(`**Lista de páginas:**`)
  pagesList.forEach((page, idx) => {
    lines.push(`${idx + 1}. ${page}`)
  })
  lines.push(``)

  if (p.hasCheckout) {
    lines.push(`**Checkout multi-step (4 pasos):**`)
    lines.push(`1. Datos del comprador`)
    lines.push(`2. Envío y cotización`)
    lines.push(`3. Pago (MercadoPago)`)
    lines.push(`4. Confirmación de compra`)
    lines.push(``)
  }

  lines.push(`**Dispositivos a diseñar:**`)
  lines.push(`- Mobile: 375px (iPhone SE) — ${primaryDevice === 'mobile' ? '**PRIORIDAD**' : 'Importante'}`)
  lines.push(`- Tablet: 768px (iPad)`)
  lines.push(`- Desktop: 1280px (laptop) — ${primaryDevice === 'desktop' ? '**PRIORIDAD**' : 'Importante'}`)
  lines.push(`- Wide: 1440px+ (desktop grande)`)
  lines.push(``)
  lines.push(`**Nota:** Mobile-first. Empezá por mobile y escalá hacia arriba.`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. CATÁLOGO — Qué vende el negocio
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 6. Catálogo de Productos`)
  lines.push(``)
  lines.push(`**Cantidad inicial:** ${catalog.initialCount || 'Sin definir'} productos`)
  lines.push(`**Categorías:** ${list(catalog.categories)}`)
  lines.push(`**Tiene variantes:** ${catalog.hasVariants ? 'Sí (color, tamaño, sabor, etc.)' : 'No'}`)
  lines.push(`**Rango de precios:** ${catalog.priceRange || 'Sin definir'}`)
  lines.push(`**Tipo:** ${catalog.type || 'Sin definir'}`)
  lines.push(``)
  if (!p.hasCheckout) {
    lines.push(`**Importante:** Este plan NO tiene checkout. El botón principal de cada producto debe ser "Consultar por WhatsApp", no "Comprar".`)
    lines.push(``)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. INTEGRACIONES VISUALES — Qué se debe mostrar
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 7. Integraciones Visuales`)
  lines.push(``)
  lines.push(`**Qué integraciones activas debe reflejar el diseño:**`)
  if (p.hasCheckout) {
    lines.push(`- ✅ MercadoPago — badge de "Pagá con MercadoPago" en footer, checkout, producto`)
  } else {
    lines.push(`- ❌ MercadoPago — no aplica este plan`)
  }
  if (plan === 'emprendimiento') {
    lines.push(`- ✅ Envíos — badge "Envíos a todo el país" en producto, checkout, footer`)
  } else if (plan === 'empresa' && technical.correoArgentinoRequested) {
    lines.push(`- ✅ Correo Argentino — badge de envío en producto, checkout, footer`)
  } else if (plan === 'empresa' && technical.enviaRequested) {
    lines.push(`- ✅ Envia.com — badge de envío multicarrier en producto, checkout, footer`)
  } else if (plan === 'empresa') {
    lines.push(`- ✅ Envíos — según el método elegido`)
  } else {
    lines.push(`- ❌ Envíos automatizados — no aplica este plan`)
  }
  lines.push(`- ✅ WhatsApp — botón flotante verde en esquina inferior derecha, siempre visible`)
  if (p.hasCheckout && technical.resendRequested) {
    lines.push(`- ✅ Email — icono de email en footer y contacto`)
  }
  if (Array.isArray(contact.socials) && contact.socials.length) {
    lines.push(`- ✅ Redes sociales: ${list(contact.socials)}`)
  }
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. CONTACTO — Cómo contactar al negocio
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 8. Información de Contacto`)
  lines.push(``)
  if (contact.whatsapp) lines.push(`**WhatsApp:** ${contact.whatsapp}`)
  if (contact.email) lines.push(`**Email:** ${contact.email}`)
  if (Array.isArray(contact.socials) && contact.socials.length) {
    lines.push(`**Redes sociales:**`)
    contact.socials.forEach(s => {
      if (typeof s === 'object' && s.network && s.url) {
        lines.push(`- ${s.network}: ${s.url}`)
      }
    })
  }
  if (contact.primarySocial) lines.push(`**Red principal:** ${contact.primarySocial}`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ASSETS — Qué tiene el cliente
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 9. Assets del Cliente`)
  lines.push(``)
  if (visual.logo?.available) {
    lines.push(`✅ **Logo disponible** (${visual.logo.format || 'formato no especificado'})`)
  } else {
    lines.push(`❌ **Logo no disponible** — El sitio debe funcionar con un wordmark tipográfico.`)
  }
  if (assets.folderReady) {
    lines.push(`✅ **Carpeta de assets lista**`)
  } else {
    lines.push(`❌ **Carpeta de assets no lista** — El sitio debe funcionar con imágenes de reemplazo hasta que el cliente envíe las suyas.`)
  }
  if (Array.isArray(assets.missing) && assets.missing.length) {
    lines.push(`**Faltan:** ${assets.missing.join(', ')}`)
  }
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. DIRECTRICES CREATIVAS — Lo que Stitch debe considerar
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 10. Directrices Creativas para Stitch`)
  lines.push(``)
  lines.push(`**Stitch, esto es lo que necesito que tengas en cuenta al diseñar:**`)
  lines.push(``)
  lines.push(`### Prioridades generales`)
  lines.push(`1. **Mobile-first** — El diseño debe funcionar perfecto en celular.`)
  lines.push(`2. **Conversión** — Cada página debe tener un objetivo claro y un CTA visible.`)
  lines.push(`3. **Confianza** — Señales de confianza: pagos seguros, envíos, garantía, testimonios.`)
  lines.push(`4. **Identidad única** — El diseño debe sentirse propio de ${business.name || 'este negocio'}, no genérico.`)
  lines.push(`5. **Velocidad** — Diseño ligero, sin elementos que ralenticen la carga.`)
  lines.push(``)

  lines.push(`### Header`)
  lines.push(`- Logo a la izquierda`)
  lines.push(`- Navegación principal centrada o a la derecha`)
  if (p.hasCart) {
    lines.push(`- Carrito con badge de cantidad`)
  }
  lines.push(`- Mobile: menú hamburguesa`)
  lines.push(`- Al scrollear: el header puede volverse opaco con blur (no obligatorio, a criterio creativo)`)
  lines.push(``)

  lines.push(`### Footer`)
  lines.push(`- Información de contacto`)
  lines.push(`- Links de navegación`)
  lines.push(`- Links legales (Términos, Privacidad)`)
  lines.push(`- Redes sociales`)
  lines.push(`- En la parte inferior: copyright + crédito "Desarrollado por SitioHoy" con link a sitiohoy.com.ar`)
  lines.push(``)

  lines.push(`### Home`)
  lines.push(`- Hero principal que transmita la esencia del negocio`)
  lines.push(`- ${!p.hasCheckout ? 'CTA principal a WhatsApp o catálogo' : 'CTA principal a comprar o ver catálogo'}`)
  lines.push(`- Sección de productos o categorías destacadas`)
  lines.push(`- Señales de confianza`)
  if (!p.hasCheckout) {
    lines.push(`- Banner prominente de WhatsApp (canal principal de contacto)`)
  }
  lines.push(`- **NO usar** hero genérico con gente sonriendo a cámara sobre fondo blanco`)
  lines.push(``)

  lines.push(`### Catálogo`)
  lines.push(`- Grid de productos`)
  lines.push(`- Filtros por categoría`)
  lines.push(`- Foto del producto clara`)
  lines.push(`- Precio visible`)
  lines.push(`- CTA: "${!p.hasCheckout ? 'Consultar' : 'Ver más'}"`)
  lines.push(``)

  lines.push(`### Detalle de Producto`)
  lines.push(`- Galería de imágenes`)
  lines.push(`- Nombre, descripción, precio`)
  if (catalog.hasVariants) {
    lines.push(`- Selector de variantes (color, tamaño, sabor, etc.)`)
  }
  lines.push(`- Botón: "${!p.hasCheckout ? 'Consultar por WhatsApp' : 'Agregar al carrito'}"`)
  if (p.hasCheckout) {
    lines.push(`- Indicador de stock`)
  }
  lines.push(``)

  if (p.hasCheckout) {
    lines.push(`### Carrito`)
    lines.push(`- Lista de productos agregados`)
    lines.push(`- Control de cantidades`)
    lines.push(`- Cupón de descuento`)
    lines.push(`- Resumen: subtotal, envío, total`)
    lines.push(`- Botón: "Proceder al pago"`)
    lines.push(``)

    lines.push(`### Checkout (4 pasos)`)
    lines.push(`- Paso 1: Datos del comprador (nombre, email, teléfono, dirección)`)
    lines.push(`- Paso 2: Envío (seleccionar método, cotización)`)
    lines.push(`- Paso 3: Pago (integración con MercadoPago — el componente de pago es de MercadoPago, no lo diseñes vos)`)
    lines.push(`- Paso 4: Confirmación (gracias, número de pedido, próximos pasos)`)
    lines.push(`- Barra de progreso indicando en qué paso está`)
    lines.push(``)

    lines.push(`### Seguimiento de Pedido`)
    lines.push(`- Timeline visual del estado del pedido`)
    lines.push(`- Detalles: productos, dirección, método de envío`)
    lines.push(``)
  }

  lines.push(`### Sobre Nosotros`)
  lines.push(`- Historia del negocio`)
  lines.push(`- Valores o equipo`)
  lines.push(`- CTA a contacto o catálogo`)
  lines.push(``)

  lines.push(`### Contacto`)
  lines.push(`- Información de contacto (dirección, teléfono, email, horarios)`)
  lines.push(`- Mapa si hay dirección física`)
  lines.push(`- Formulario de contacto`)
  lines.push(`- Redes sociales`)
  lines.push(``)

  lines.push(`### FAQ / Preguntas Frecuentes`)
  lines.push(`- Lista de preguntas y respuestas`)
  lines.push(`- Diseño claro y legible`)
  lines.push(`- CTA a contacto si no encuentra respuesta`)
  lines.push(``)

  lines.push(`### 404 / Error`)
  lines.push(`- Mensaje amigable`)
  lines.push(`- Links útiles (home, catálogo, contacto)`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. ACCESIBILIDAD — Requisitos técnicos
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 11. Requisitos de Accesibilidad`)
  lines.push(``)
  lines.push(`- Contraste mínimo 4.5:1 para texto body`)
  lines.push(`- Touch targets mínimo 44x44px`)
  lines.push(`- Focus states visibles en todos los elementos interactivos`)
  lines.push(`- Alt text en todas las imágenes`)
  lines.push(`- Labels asociados a todos los inputs de formularios`)
  lines.push(`- Respetar \_prefers-reduced-motion_ — sin animaciones para quienes las desactiven`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. LO QUE SE DEBE EVITAR — Anti-patterns
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 12. Lo que se debe evitar`)
  lines.push(``)
  lines.push(`- ❌ Gradientes violeta/azul/rosa genéricos sin relación con la marca`)
  lines.push(`- ❌ Glassmorphism sin propósito funcional`)
  lines.push(`- ❌ Bordes redondeados excesivos (> 20px) en contenedores grandes`)
  lines.push(`- ❌ Animaciones de scroll-reveal en TODOS los elementos sin criterio`)
  lines.push(`- ❌ Hero genérico: gente sonriendo + subtítulo + botón sobre stock photo`)
  lines.push(`- ❌ Inter / Roboto / Lato por defecto sin justificación`)
  lines.push(`- ❌ Íconos flotantes decorativos sin función`)
  lines.push(`- ❌ Cards con sombras excesivas o bordes múltiples`)
  lines.push(`- ❌ Texto que se corta o pisa otros elementos`)
  lines.push(`- ❌ UI dominada por un solo color sin contraste real`)
  lines.push(`- ❌ Mismo diseño genérico que cualquier otra tienda`)
  lines.push(``)

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. INSTRUCCIONES FINALES — Para Stitch
  // ═══════════════════════════════════════════════════════════════════════════
  lines.push(`## 13. Instrucciones Finales para Stitch`)
  lines.push(``)
  lines.push(`**Stitch, este es tu brief. Ahora te toca a vos:**`)
  lines.push(``)
  lines.push(`1. Diseñá un sitio web único y memorable para **${business.name || 'este negocio'}**.`)
  lines.push(`2. Usá los colores de marca como guía, pero proponé una paleta completa que funcione.`)
  lines.push(`3. Elegí tipografías que reflejen el tono **${tone}** y el estilo **${style}**.`)
  lines.push(`4. Diseñá mobile-first: empezá por 375px y escalá a desktop.`)
  lines.push(`5. Cada página debe tener un propósito claro y un CTA visible.`)
  lines.push(`6. El sitio debe transmitir **${audience.desiredFeeling || 'confianza y profesionalismo'}**.`)
  lines.push(`7. No copies templates genéricos — hacé algo que sea propio de este negocio.`)
  lines.push(`8. Recordá: el público es **${audience.profile || 'variado'}**, así que pensá en ellos al diseñar.`)
  lines.push(``)
  lines.push(`**Cuando termines, avisame para que revise el diseño y después implemente el código.**`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)
  lines.push(`**Documento generado por SitioHoy**`)
  lines.push(`**ID del proyecto Stitch:** [COMPLETAR DESPUÉS DE CREAR EN STITCH]`)
  lines.push(``)

  return lines.join('\n')
}

// ── Write file ──────────────────────────────────────────────────────────────
const designDir = path.join(root, '.sitiohoy', 'design')
await mkdir(designDir, { recursive: true })
const designPath = path.join(designDir, 'DESIGN.md')
await writeFile(designPath, buildDesignMd())

console.log(`✓ DESIGN.md generado: ${designPath}`)
console.log(`  Plan: ${p.name}`)
console.log(`  Páginas: ${pagesList.length}`)
console.log(`  Tono: ${tone}`)
console.log(`  Estilo: ${style}`)
