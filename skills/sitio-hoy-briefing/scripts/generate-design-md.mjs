/**
 * generate-design-md.mjs
 * Genera un DESIGN.md ultra detallado para Stitch
 * a partir de .sitiohoy/intake.json y sitiohoy.config.json
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

// ── Helpers ─────────────────────────────────────────────────────────────────
const yesNo = (v) => v ? 'sí' : 'no'
const list = (items) => Array.isArray(items) && items.length
  ? items.map(i => typeof i === 'string' ? i : i?.url ? `${i.network}: ${i.url}` : JSON.stringify(i)).join(', ')
  : 'ninguno'

// ── Typography map based on tone ────────────────────────────────────────────
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

const tone = String(audience.tone ?? 'profesional').toLowerCase()
const typo = typoMap[tone] || typoMap.profesional

// ── Color system ──────────────────────────────────────────────────────────────
const isDark = String(visual.style ?? '').toLowerCase().includes('dark') ||
               String(visual.style ?? '').toLowerCase().includes('oscuro')

const primaryColor = visual.colors?.primary || '#16a05d'
const secondaryColor = visual.colors?.secondary || '#1a1a2e'
const accentColor = visual.colors?.accent || '#e8b43f'

// Generate a complete neutral scale
const neutrals = isDark
  ? { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' }
  : { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' }

const bgColor = isDark ? '#0a0a0a' : '#ffffff'
const surfaceColor = isDark ? '#141414' : '#fafafa'
const textColor = isDark ? '#f5f5f5' : '#1a1a1a'
const textMutedColor = isDark ? '#a0a0a0' : '#6b7280'
const borderColor = isDark ? '#2a2a2a' : '#e5e7eb'

// ── Page definitions by plan ────────────────────────────────────────────────
const planPages = {
  esencial: {
    required: ['Home', 'Catálogo', 'Producto', 'Sobre Nosotros', 'FAQ', 'Contacto', 'Términos y Privacidad', '404', 'Error'],
    optional: [],
    checkout: false,
    cart: false,
    tracking: false,
  },
  emprendimiento: {
    required: ['Home', 'Catálogo', 'Producto', 'Carrito', 'Checkout (Datos)', 'Checkout (Envío)', 'Checkout (Pago)', 'Checkout (Confirmación)', 'Seguimiento de Pedido', 'Sobre Nosotros', 'FAQ', 'Contacto', 'Términos y Privacidad', '404', 'Error'],
    optional: [],
    checkout: true,
    cart: true,
    tracking: true,
  },
  empresa: {
    required: ['Home', 'Catálogo', 'Producto', 'Carrito', 'Checkout (Datos)', 'Checkout (Envío)', 'Checkout (Pago)', 'Checkout (Confirmación)', 'Seguimiento de Pedido', 'Sobre Nosotros', 'FAQ', 'Contacto', 'Términos y Privacidad', 'Blog (opcional)', '404', 'Error'],
    optional: ['Blog'],
    checkout: true,
    cart: true,
    tracking: true,
  },
}

const planDef = planPages[plan] || planPages.esencial
const hasCheckout = planDef.checkout

// ── Component definitions ─────────────────────────────────────────────────────
const components = [
  {
    name: 'Header / Navbar',
    description: 'Navegación principal con logo, menú, carrito y CTA',
    specs: [
      'Altura: 64px mobile, 72px desktop',
      'Fondo: transparente en hero, blur + opaco al scrollear',
      'Logo: izquierda, 120px wide desktop, 100px mobile',
      'Links de navegación: centrados desktop, drawer mobile',
      'CTA principal: botón destacado a la derecha',
      'Carrito: ícono con badge de cantidad (solo planes con checkout)',
      'Mobile: hamburguesa + drawer fullscreen desde derecha',
    ],
    mobile: [
      'Altura fija: 56px',
      'Logo centrado o izquierda',
      'Hamburguesa derecha',
      'Drawer: 100vw, animación slide 300ms',
    ],
    desktop: [
      'Altura: 72px',
      'Logo izquierda + nav centrada + CTA derecha',
      'Hover states en links: underline animado',
      'Dropdowns con delay 120ms para evitar cierres accidentales',
    ],
  },
  {
    name: 'Footer',
    description: 'Pie de página con información de contacto, links legales y crédito',
    specs: [
      'Fondo: color surface (#surfaceColor)',
      'Padding: 48px top, 24px bottom',
      'Layout: 4 columnas desktop, 1 columna mobile',
      'Columnas: Marca/Logo, Navegación, Contacto, Legal',
      'Barra inferior: flex justify-between, copyright izquierda, crédito derecha',
      'Crédito: "Desarrollado por SitioHoy" con logo 72x24px + link a sitiohoy.com.ar',
    ],
    mobile: [
      '1 columna, centrado',
      'Links apilados verticalmente',
      'Redes sociales: íconos 44px touch target',
    ],
    desktop: [
      '4 columnas con gap 32px',
      'Links en columnas verticales',
    ],
  },
  {
    name: 'Hero Section',
    description: 'Primera sección de la home — la más importante visualmente',
    specs: [
      'Altura: 100vh desktop, auto mobile (min 600px)',
      'Layout: según objetivo del negocio',
      'Tipografía: h1 48-64px desktop, 32-40px mobile',
      'CTA: botón primario grande (min 48px height) + texto secundario opcional',
      'Imagen: full-bleed o split 50/50 con object-fit: cover',
      'Overlay: gradiente sutil si hay imagen full-bleed',
    ],
    mobile: [
      'Stack vertical: texto arriba, imagen abajo',
      'h1: 32px, line-height 1.1',
      'CTA: ancho completo, 48px height',
      'Padding lateral: 16px',
    ],
    desktop: [
      'Split layout o full-bleed con texto overlay',
      'h1: 56px, line-height 1.05',
      'CTA: auto-width, 56px height',
      'Padding lateral: 64px',
    ],
  },
  {
    name: 'Product Card',
    description: 'Tarjeta de producto en catálogo',
    specs: [
      'Border-radius: 12px',
      'Imagen: aspect-ratio 1/1, object-fit cover',
      'Padding interno: 16px',
      'Sombra: none default, shadow-md en hover',
      'Hover: scale(1.02), transition 250ms',
      'Info: nombre (16px bold), precio (18px primary color), categoría (14px muted)',
      'CTA: botón "Ver más" o "Agregar al carrito"',
      'Badge: "Nuevo", "Oferta", "Últimas unidades" si aplica',
    ],
    mobile: [
      'Grid: 2 columnas, gap 12px',
      'Imagen: 100% width',
    ],
    desktop: [
      'Grid: 3-4 columnas, gap 24px',
      'Imagen: 100% width, hover zoom sutil',
    ],
  },
  {
    name: 'Product Detail Page',
    description: 'Página de detalle de producto',
    specs: [
      'Layout: 2 columnas desktop (galería 60%, info 40%), stack mobile',
      'Galería: imagen principal grande + thumbnails debajo',
      'Info: nombre (28px), precio (24px primary), descripción (16px)',
      'Variantes: selectores visuales (color, tamaño) con estado activo',
      'Stock: indicador visual (verde > 10, amarillo 5-10, rojo < 5)',
      'CTA: botón primario grande "Agregar al carrito" o "Consultar por WhatsApp"',
      'Productos relacionados: grid 4 items debajo',
    ],
    mobile: [
      'Stack: galería arriba (carrusel swipeable), info abajo',
      'Imagen: 100% width, altura 400px',
      'CTA: fixed bottom o ancho completo',
    ],
    desktop: [
      'Split: galería izquierda (55%), info derecha (45%)',
      'Imagen: 600px height, zoom hover',
      'CTA: ancho completo del panel derecho',
    ],
  },
]

if (hasCheckout) {
  components.push({
    name: 'Cart Sidebar / Drawer',
    description: 'Panel lateral del carrito',
    specs: [
      'Ancho: 100vw mobile, 420px desktop',
      'Fondo: surface color con overlay oscuro 50%',
      'Header: "Tu carrito" + ícono cerrar',
      'Items: imagen 80x80px + nombre + cantidad selector + precio + eliminar',
      'Footer: subtotal, envío, descuento (si aplica), total, CTA checkout',
      'Empty state: ilustración + "Tu carrito está vacío" + CTA a catálogo',
    ],
    mobile: [
      'Full width, slide desde derecha',
      'Items apilados verticalmente',
    ],
    desktop: [
      '420px width, slide desde derecha',
      'Overlay oscuro en fondo',
    ],
  })

  components.push({
    name: 'Checkout Flow',
    description: 'Flujo de compra multi-step',
    specs: [
      'Layout: centrado, max-width 600px',
      'Steps: Datos personales → Envío → Pago → Confirmación',
      'Progress bar: visual indicator del paso actual',
      'Formularios: inputs con labels, errores inline, validación visual',
      'Resumen: sidebar sticky desktop, bottom sheet mobile',
      'CTA: botón primario ancho completo por paso',
    ],
    mobile: [
      '1 columna, padding 16px',
      'Resumen: bottom sheet o debajo del formulario',
      'Teclado: no ocultar inputs',
    ],
    desktop: [
      '2 columnas: formulario 60%, resumen 40% sticky',
      'Padding: 32px',
    ],
  })
}

// ── Animations ────────────────────────────────────────────────────────────────
const animLevel = intake.animations ?? 'subtle'
const animSpecs = {
  none: {
    description: 'Sin animaciones. Solo transiciones CSS mínimas para estados.',
    details: [
      'Hover: opacity 0.8, 150ms',
      'Focus: outline 2px solid primary',
      'Sin animaciones de entrada ni scroll',
    ],
  },
  subtle: {
    description: 'Animaciones sutiles y funcionales.',
    details: [
      'Hero: fade-in de texto, 400ms, ease-out',
      'Cards: hover scale(1.02) + shadow, 250ms',
      'Scroll: fade-in de secciones, 300ms, stagger 100ms',
      'Menú mobile: slide + fade, 300ms',
      'Carrito: slide desde derecha, 300ms',
      'Botones: active scale(0.98), 100ms',
      'Loading: skeleton shimmer, 1.5s infinite',
    ],
  },
  full: {
    description: 'Animaciones ricas y expresivas.',
    details: [
      'Hero: entrada escalonada de elementos, 600ms total, stagger 150ms',
      'Parallax sutil en hero, factor 0.1',
      'Cards: hover con imagen zoom 1.05 + shadow-lg, 300ms',
      'Scroll: reveal con translateY(30px) → 0, 400ms, stagger 80ms',
      'Microinteracciones: heart/like pop, cart badge bounce',
      'Menú mobile: morphing hamburger + stagger de items, 400ms',
      'Carrito: slide + items stagger, 400ms',
      'Botones: ripple effect opcional, magnetic hover',
      'Page transitions: fade entre rutas, 200ms',
      'Loading: skeleton shimmer + pulse, 1.5s',
      'Stock indicator: pulse si < 5 unidades',
    ],
  },
}

const anim = animSpecs[animLevel] || animSpecs.subtle

// ── Page structure generator ────────────────────────────────────────────────
function generatePageStructure(pageName) {
  const structures = {
    'Home': {
      sections: [
        { name: 'Hero', content: 'Headline principal, subheadline, CTA, imagen/video de fondo o ilustración', priority: 'CRÍTICA' },
        { name: 'Trust Signals / Badges', content: 'Envíos, pagos seguros, garantía, etc.', priority: 'ALTA' },
        { name: 'Categorías Destacadas', content: 'Grid 3-4 cards de categorías con imagen y nombre', priority: 'ALTA' },
        { name: 'Productos Destacados', content: 'Carousel o grid de productos con "featured = true"', priority: 'ALTA' },
        { name: 'Propuesta de Valor / Beneficios', content: '3-4 bloques con ícono + título + descripción', priority: 'MEDIA' },
        { name: 'Testimonios / Social Proof', content: 'Carousel de testimonios con foto, nombre y texto', priority: 'MEDIA' },
        { name: 'CTA Final', content: 'Banner grande con CTA hacia catálogo o WhatsApp', priority: 'ALTA' },
        ...(hasCheckout ? [] : [{ name: 'WhatsApp CTA', content: 'Banner prominente con botón grande a WhatsApp', priority: 'ALTA' }]),
      ],
      responsive: {
        mobile: 'Stack vertical, todas las secciones full-width, padding 16px lateral',
        tablet: 'Algunas secciones en 2 columnas, padding 24px',
        desktop: 'Hero full-width, secciones con max-width 1280px centrado, padding 64px',
      },
    },
    'Catálogo': {
      sections: [
        { name: 'Header de página', content: 'Título "Nuestros Productos" o similar + breadcrumb', priority: 'MEDIA' },
        { name: 'Filtros y Ordenamiento', content: 'Por categoría, precio, orden. Desktop: sidebar o top bar. Mobile: bottom sheet o drawer', priority: 'ALTA' },
        { name: 'Grid de Productos', content: 'Grid 2-4 columnas con product cards', priority: 'CRÍTICA' },
        { name: 'Paginación / Infinite Scroll', content: 'Navegación entre páginas o scroll infinito', priority: 'MEDIA' },
        { name: 'Empty State', content: 'Mensaje cuando no hay productos con CTA', priority: 'BAJA' },
      ],
      responsive: {
        mobile: 'Filtros en bottom sheet, grid 2 columnas',
        tablet: 'Filtros sidebar collapsible, grid 3 columnas',
        desktop: 'Filtros sidebar fija, grid 4 columnas',
      },
    },
    'Producto': {
      sections: [
        { name: 'Galería de Imágenes', content: 'Imagen principal + thumbnails / carrusel', priority: 'CRÍTICA' },
        { name: 'Info del Producto', content: 'Nombre, precio, descripción, variantes, stock, CTA', priority: 'CRÍTICA' },
        { name: 'Tabs Adicionales', content: 'Descripción, especificaciones, envío, devoluciones', priority: 'MEDIA' },
        { name: 'Productos Relacionados', content: 'Grid 4 productos de la misma categoría', priority: 'MEDIA' },
        { name: 'Reviews (opcional)', content: 'Rating y testimonios del producto', priority: 'BAJA' },
      ],
      responsive: {
        mobile: 'Stack: galería carrusel arriba, info abajo, CTA fixed bottom',
        tablet: 'Galería 60%, info 40%',
        desktop: 'Galería 55%, info 45%, sidebar con info adicional',
      },
    },
    'Carrito': {
      sections: [
        { name: 'Lista de Items', content: 'Imagen, nombre, variantes, cantidad, precio, eliminar', priority: 'CRÍTICA' },
        { name: 'Cupón', content: 'Input de código de descuento + aplicar', priority: 'MEDIA' },
        { name: 'Resumen', content: 'Subtotal, envío, descuento, total', priority: 'CRÍTICA' },
        { name: 'CTA Checkout', content: 'Botón grande "Proceder al pago"', priority: 'CRÍTICA' },
        { name: 'Seguir comprando', content: 'Link secundario a catálogo', priority: 'BAJA' },
      ],
      responsive: {
        mobile: 'Stack vertical, CTA fixed bottom',
        tablet: 'Items + resumen en columnas',
        desktop: 'Items 60% + resumen 40% sticky',
      },
    },
    'Checkout (Datos)': {
      sections: [
        { name: 'Progress Bar', content: 'Paso 1 de 4: Datos personales', priority: 'MEDIA' },
        { name: 'Formulario', content: 'Nombre, email, teléfono, dirección (si envío)', priority: 'CRÍTICA' },
        { name: 'Resumen del Pedido', content: 'Productos, subtotal, sidebar sticky', priority: 'ALTA' },
        { name: 'CTA', content: 'Continuar al envío', priority: 'CRÍTICA' },
      ],
      responsive: {
        mobile: '1 columna, formulario full-width, resumen debajo',
        desktop: 'Formulario 60% + resumen 40% sticky',
      },
    },
    'Checkout (Envío)': {
      sections: [
        { name: 'Progress Bar', content: 'Paso 2 de 4: Envío', priority: 'MEDIA' },
        { name: 'Métodos de Envío', content: 'Opciones: delivery, retiro, zonas fijas, Envia.com', priority: 'CRÍTICA' },
        { name: 'Cotización', content: 'Precio de envío según método seleccionado', priority: 'CRÍTICA' },
        { name: 'Resumen', content: 'Productos + envío, total actualizado', priority: 'ALTA' },
      ],
      responsive: {
        mobile: '1 columna, métodos apilados',
        desktop: 'Métodos 60% + resumen 40% sticky',
      },
    },
    'Checkout (Pago)': {
      sections: [
        { name: 'Progress Bar', content: 'Paso 3 de 4: Pago', priority: 'MEDIA' },
        { name: 'MercadoPago Brick', content: 'Componente de pago integrado', priority: 'CRÍTICA' },
        { name: 'Resumen Final', content: 'Total a pagar, items', priority: 'ALTA' },
        { name: 'Seguridad', content: 'Badges de seguridad, SSL, encriptación', priority: 'MEDIA' },
      ],
      responsive: {
        mobile: 'Brick adaptativo de MP, centrado',
        desktop: 'Brick centrado, max-width 600px, resumen lateral',
      },
    },
    'Checkout (Confirmación)': {
      sections: [
        { name: 'Mensaje de Éxito', content: 'Check grande + "¡Gracias por tu compra!"', priority: 'CRÍTICA' },
        { name: 'Detalles del Pedido', content: 'Número de pedido, productos, total, tracking_token', priority: 'CRÍTICA' },
        { name: 'Próximos Pasos', content: 'Email de confirmación, seguimiento, WhatsApp de soporte', priority: 'ALTA' },
        { name: 'CTA', content: 'Seguir comprando o ir a seguimiento', priority: 'MEDIA' },
      ],
      responsive: {
        mobile: 'Centrado, padding 24px',
        desktop: 'Centrado, max-width 600px',
      },
    },
    'Seguimiento de Pedido': {
      sections: [
        { name: 'Estado del Pedido', content: 'Timeline visual: Confirmado → Preparando → Enviado → Entregado', priority: 'CRÍTICA' },
        { name: 'Detalles', content: 'Productos, dirección, método de envío, tracking number', priority: 'ALTA' },
        { name: 'Acciones', content: 'Contactar soporte, descargar comprobante', priority: 'BAJA' },
      ],
      responsive: {
        mobile: 'Timeline vertical, items apilados',
        desktop: 'Timeline horizontal o vertical con layout 2 columnas',
      },
    },
    'Sobre Nosotros': {
      sections: [
        { name: 'Hero', content: 'Título + imagen de equipo o local', priority: 'MEDIA' },
        { name: 'Historia', content: 'Texto largo con historia del negocio', priority: 'MEDIA' },
        { name: 'Equipo / Valores', content: 'Fotos de equipo o valores del negocio', priority: 'BAJA' },
        { name: 'CTA', content: 'Contacto o visitar catálogo', priority: 'MEDIA' },
      ],
      responsive: {
        mobile: 'Stack, padding 16px',
        tablet: 'Algunas secciones 2 columnas',
        desktop: 'Hero full-width, contenido max-width 800px centrado',
      },
    },
    'FAQ': {
      sections: [
        { name: 'Título', content: '"Preguntas Frecuentes"', priority: 'MEDIA' },
        { name: 'Lista de Preguntas', content: 'Accordion con preguntas y respuestas', priority: 'CRÍTICA' },
        { name: 'CTA', content: '¿No encontraste tu respuesta? Contactanos', priority: 'MEDIA' },
      ],
      responsive: {
        mobile: 'Accordion full-width, padding 16px',
        desktop: 'Max-width 800px centrado',
      },
    },
    'Contacto': {
      sections: [
        { name: 'Info de Contacto', content: 'Dirección, WhatsApp, email, horarios, mapa', priority: 'CRÍTICA' },
        { name: 'Formulario', content: 'Nombre, email, mensaje, enviar', priority: 'ALTA' },
        { name: 'Redes Sociales', content: 'Íconos con links', priority: 'MEDIA' },
      ],
      responsive: {
        mobile: 'Stack, info arriba, formulario abajo',
        desktop: 'Info 40% + formulario 60% en 2 columnas',
      },
    },
    'Blog (opcional)': {
      sections: [
        { name: 'Lista de Posts', content: 'Grid de cards con imagen, título, fecha, excerpt', priority: 'CRÍTICA' },
        { name: 'Sidebar', content: 'Categorías, tags, posts populares', priority: 'BAJA' },
      ],
      responsive: {
        mobile: 'Grid 1 columna',
        tablet: 'Grid 2 columnas',
        desktop: 'Grid 3 columnas + sidebar',
      },
    },
    '404': {
      sections: [
        { name: 'Mensaje', content: 'Ilustración + "Página no encontrada"', priority: 'CRÍTICA' },
        { name: 'Sugerencias', content: 'Links a home, catálogo, contacto', priority: 'MEDIA' },
      ],
      responsive: {
        mobile: 'Centrado, padding 24px',
        desktop: 'Centrado, max-width 600px',
      },
    },
    'Error': {
      sections: [
        { name: 'Mensaje', content: '"Algo salió mal" + mensaje técnico si aplica', priority: 'CRÍTICA' },
        { name: 'Acciones', content: 'Reintentar, volver al inicio, contactar soporte', priority: 'ALTA' },
      ],
      responsive: {
        mobile: 'Centrado, padding 24px',
        desktop: 'Centrado, max-width 600px',
      },
    },
    'Términos y Privacidad': {
      sections: [
        { name: 'Título', content: '"Términos y Condiciones" o "Política de Privacidad"', priority: 'MEDIA' },
        { name: 'Contenido Legal', content: 'Texto largo con secciones numeradas', priority: 'CRÍTICA' },
        { name: 'Fecha de Actualización', content: 'Última actualización', priority: 'BAJA' },
      ],
      responsive: {
        mobile: 'Padding 16px, texto legible',
        desktop: 'Max-width 800px centrado, padding 64px',
      },
    },
  }

  return structures[pageName] || {
    sections: [{ name: 'Contenido', content: 'Página estándar', priority: 'MEDIA' }],
    responsive: { mobile: 'Stack', tablet: 'Stack', desktop: 'Centrado' },
  }
}

// ── Build the DESIGN.md ───────────────────────────────────────────────────────
function buildDesignMd() {
  const pageList = planDef.required

  const lines = []

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(`# DESIGN.md — ${business.name || 'Proyecto'}`, '')
  lines.push(`> Documento de diseño completo generado automáticamente por SitioHoy Briefing`)
  lines.push(`> Fecha: ${new Date().toISOString().split('T')[0]}`)
  lines.push(`> Plan: ${plan.toUpperCase()}`)
  lines.push(`> Versión: 1.0`, '')

  // ── 1. Información del Proyecto ───────────────────────────────────────────
  lines.push('## 1. Información del Proyecto', '')
  lines.push(`| Campo | Valor |`)
  lines.push(`|---|---|`)
  lines.push(`| **Nombre** | ${business.name || 'Sin definir'} |`)
  lines.push(`| **Slug** | ${business.slug || 'Sin definir'} |`)
  lines.push(`| **Rubro / Industria** | ${business.industry || 'Sin definir'} |`)
  lines.push(`| **Plan** | ${plan.toUpperCase()} |`)
  lines.push(`| **Descripción** | ${business.description || 'Sin definir'} |`)
  lines.push(`| **Diferenciador** | ${business.differentiator || 'Sin definir'} |`)
  lines.push(`| **Objetivo Principal** | ${business.primaryGoal || 'Sin definir'} |`)
  lines.push(`| **Estilo Visual** | ${visual.style || 'Sin definir'} |`)
  lines.push(`| **Mood / Sensación** | ${visual.desiredMood || audience.desiredFeeling || 'Sin definir'} |`)
  lines.push(`| **Nivel de Animaciones** | ${animLevel.toUpperCase()} |`)
  lines.push('')

  // ── 2. Audiencia Objetivo ─────────────────────────────────────────────────
  lines.push('## 2. Audiencia Objetivo', '')
  lines.push(`| Campo | Valor |`)
  lines.push(`|---|---|`)
  lines.push(`| **Perfil** | ${audience.profile || 'Sin definir'} |`)
  lines.push(`| **Problema que resuelve** | ${audience.problem || 'Sin definir'} |`)
  lines.push(`| **Sensación deseada** | ${audience.desiredFeeling || 'Sin definir'} |`)
  lines.push(`| **Tono de comunicación** | ${tone.toUpperCase()} |`)
  lines.push(`| **Dispositivo principal** | ${audience.primaryDevice || 'mixed'} |`)
  lines.push('')
  lines.push('### Lenguaje y Comunicación')
  lines.push('')
  lines.push(`- **Tono general:** ${tone}`)
  lines.push(`- **Tratamiento:** ${tone === 'cercano' || tone === 'juvenil' || tone === 'informal' ? 'Tuteo (vos)' : 'Ustedeo o neutro'}`)
  lines.push(`- **Longitud de frases:** ${tone === 'exclusivo' ? 'Largas, elaboradas' : tone === 'juvenil' ? 'Cortas, dinámicas' : 'Medianas, directas'}`)
  lines.push(`- **Uso de emojis:** ${tone === 'juvenil' ? 'Moderado, con propósito' : 'Mínimo o nulo'}`)
  lines.push(`- **Estilo de CTAs:** ${tone === 'juvenil' ? 'Energéticos, imperativos' : tone === 'exclusivo' ? 'Elegantes, invitativos' : 'Claros, accionables'}`)
  lines.push(`- **Evitar:** ${tone === 'profesional' ? 'jerga excesiva, tuteo forzado' : tone === 'cercano' ? 'lenguaje corporativo frío, anglicismos' : 'lenguaje genérico, frases vacías'}`)
  lines.push('')

  // ── 3. Paleta de Colores ──────────────────────────────────────────────────
  lines.push('## 3. Paleta de Colores Completa', '')
  lines.push('### Colores de Marca')
  lines.push('')
  lines.push(`| Rol | Color | Hex | Uso |`)
  lines.push(`|---|---|---|---|`)
  lines.push(`| **Primario** | Color principal | ${primaryColor} | CTAs, botones principales, enlaces activos, acentos importantes |`)
  lines.push(`| **Secundario** | Color secundario | ${secondaryColor} | Headers, fondos oscuros, contraste con primario |`)
  lines.push(`| **Acento** | Color de acento | ${accentColor} | Badges, etiquetas, hover states, elementos destacados |`)
  lines.push('')
  lines.push('### Neutros')
  lines.push('')
  lines.push(`| Escala | Hex | Uso |`)
  lines.push(`|---|---|---|`)
  Object.entries(neutrals).forEach(([scale, hex]) => {
    lines.push(`| **${scale}** | ${hex} | ${scale === '50' ? 'Fondos claros' : scale === '100' ? 'Hover de fondos' : scale === '200' ? 'Bordes sutiles' : scale === '300' ? 'Bordes' : scale === '400' ? 'Texto desactivado' : scale === '500' ? 'Texto secundario' : scale === '600' ? 'Texto body' : scale === '700' ? 'Texto headings' : scale === '800' ? 'Fondos oscuros' : 'Backgrounds oscuros profundos'} |`)
  })
  lines.push('')
  lines.push('### Fondos y Superficies')
  lines.push('')
  lines.push(`| Rol | Hex | Uso |`)
  lines.push(`|---|---|---|`)
  lines.push(`| **Background** | ${bgColor} | Fondo principal de todas las páginas |`)
  lines.push(`| **Surface** | ${surfaceColor} | Cards, modales, drawers, secciones alternadas |`)
  lines.push(`| **Texto Principal** | ${textColor} | Títulos, body text |`)
  lines.push(`| **Texto Secundario** | ${textMutedColor} | Descripciones, metadatos, placeholders |`)
  lines.push(`| **Bordes** | ${borderColor} | Divisores, inputs, cards outline |`)
  lines.push('')
  lines.push('### Estados Semánticos')
  lines.push('')
  lines.push(`| Estado | Hex | Uso |`)
  lines.push(`|---|---|---|`)
  lines.push(`| **Éxito** | #22c55e | Confirmaciones, stock disponible, mensajes positivos |`)
  lines.push(`| **Advertencia** | #f59e0b | Stock bajo, alertas suaves |`)
  lines.push(`| **Error** | #ef4444 | Formularios inválidos, errores, stock agotado |`)
  lines.push(`| **Información** | #3b82f6 | Tips, ayuda, links informativos |`)
  lines.push('')
  lines.push('### Dark Mode (si aplica)')
  lines.push('')
  lines.push(`El sitio ${isDark ? '**sí**' : '**no**'} tiene estilo oscuro por defecto. ${!isDark ? 'Se debe implementar `@media (prefers-color-scheme: dark)` con los siguientes overrides:' : 'Los valores arriba ya reflejan el modo oscuro.'}`)
  if (!isDark) {
    lines.push('')
    lines.push(`| Variable | Valor |`)
    lines.push(`|---|---|`)
    lines.push(`| --color-bg | #0a0a0a |`)
    lines.push(`| --color-surface | #141414 |`)
    lines.push(`| --color-text | #f5f5f5 |`)
    lines.push(`| --color-text-muted | #a0a0a0 |`)
    lines.push(`| --color-border | #2a2a2a |`)
  }
  lines.push('')

  // ── 4. Tipografía ─────────────────────────────────────────────────────────
  lines.push('## 4. Sistema Tipográfico', '')
  lines.push('### Familias de Fuentes')
  lines.push('')
  lines.push(`| Rol | Fuente Principal | Fallback | Peso | Estilo |`)
  lines.push(`|---|---|---|---|---|`)
  lines.push(`| **Display / Headings** | ${typo.display.family} | ${typo.display.fallback} | ${typo.display.weight} | ${typo.display.style} |`)
  lines.push(`| **Body / Texto** | ${typo.body.family} | ${typo.body.fallback} | ${typo.body.weight} | ${typo.body.style} |`)
  lines.push('')
  lines.push('### Escala Tipográfica')
  lines.push('')
  lines.push(`| Elemento | Mobile | Tablet | Desktop | Line-height | Weight | Letter-spacing |`)
  lines.push(`|---|---|---|---|---|---|---|`)
  lines.push(`| **H1 (Hero)** | 32px | 40px | 56px | 1.1 | 700 | -0.02em |`)
  lines.push(`| **H2 (Sección)** | 28px | 32px | 40px | 1.2 | 700 | -0.01em |`)
  lines.push(`| **H3 (Subsección)** | 22px | 24px | 28px | 1.3 | 600 | -0.01em |`)
  lines.push(`| **H4 (Card title)** | 18px | 18px | 20px | 1.4 | 600 | 0 |`)
  lines.push(`| **Body Large** | 16px | 16px | 18px | 1.6 | 400 | 0 |`)
  lines.push(`| **Body** | 14px | 14px | 16px | 1.6 | 400 | 0 |`)
  lines.push(`| **Small / Caption** | 12px | 12px | 14px | 1.5 | 400 | 0.01em |`)
  lines.push(`| **Button** | 14px | 14px | 16px | 1 | 600 | 0.02em |`)
  lines.push(`| **Nav Link** | 14px | 14px | 15px | 1 | 500 | 0.01em |`)
  lines.push('')
  lines.push('### Reglas Tipográficas')
  lines.push('')
  lines.push('- Nunca usar más de 2 familias de fuentes en el sitio')
  lines.push('- Headings siempre en weight 600-700')
  lines.push('- Body siempre en weight 400 para legibilidad')
  lines.push('- Texto en ALL CAPS solo para CTAs pequeños o badges')
  lines.push('- Underline solo en links hover, nunca en headings')
  lines.push('- `next/font/google` obligatorio, nunca `<link>` externo')
  lines.push('')

  // ── 5. Layout y Grid ────────────────────────────────────────────────────────
  lines.push('## 5. Sistema de Layout y Grid', '')
  lines.push('### Breakpoints')
  lines.push('')
  lines.push(`| Nombre | Ancho | Uso Principal |`)
  lines.push(`|---|---|---|`)
  lines.push(`| **Mobile** | 375px | Base design. iPhone SE. Todo se apila verticalmente. |`)
  lines.push(`| **Mobile L** | 390px | iPhone 14/15. Ligeramente más espacio. |`)
  lines.push(`| **Tablet** | 768px | iPad. Algunos layouts de 2 columnas. Sidebar colapsable. |`)
  lines.push(`| **Desktop** | 1280px | Laptop. Layout completo. Multi-columnas. |`)
  lines.push(`| **Wide** | 1920px | Desktop grande. Más aire, más columnas. |`)
  lines.push('')
  lines.push('### Espaciado')
  lines.push('')
  lines.push(`| Token | Valor | Uso |`)
  lines.push(`|---|---|---|`)
  lines.push(`| **space-1** | 4px | Micro ajustes, icon gaps |`)
  lines.push(`| **space-2** | 8px | Tight gaps, button padding |`)
  lines.push(`| **space-3** | 12px | Card internal padding (mobile) |`)
  lines.push(`| **space-4** | 16px | Default gap, section padding mobile |`)
  lines.push(`| **space-6** | 24px | Section padding tablet, card gap |`)
  lines.push(`| **space-8** | 32px | Section padding desktop |`)
  lines.push(`| **space-12** | 48px | Large section padding |`)
  lines.push(`| **space-16** | 64px | Hero padding, major sections |`)
  lines.push(`| **space-24** | 96px | Section separation desktop |`)
  lines.push('')
  lines.push('### Container')
  lines.push('')
  lines.push(`| Breakpoint | Max-width | Padding |`)
  lines.push(`|---|---|---|`)
  lines.push(`| Mobile | 100% | 16px |`)
  lines.push(`| Tablet | 100% | 24px |`)
  lines.push(`| Desktop | 1280px | 64px |`)
  lines.push(`| Wide | 1440px | 80px |`)
  lines.push('')

  // ── 6. Componentes Clave ────────────────────────────────────────────────────
  lines.push('## 6. Componentes Clave — Especificaciones Detalladas', '')
  components.forEach((comp, idx) => {
    lines.push(`### 6.${idx + 1}. ${comp.name}`, '')
    lines.push(`**Descripción:** ${comp.description}`, '')
    lines.push('**Especificaciones generales:**')
    comp.specs.forEach(spec => lines.push(`- ${spec}`))
    lines.push('')
    lines.push('**Mobile (375px):**')
    comp.mobile.forEach(spec => lines.push(`- ${spec}`))
    lines.push('')
    lines.push('**Desktop (1280px):**')
    comp.desktop.forEach(spec => lines.push(`- ${spec}`))
    lines.push('')
  })

  // ── 7. Páginas y Estructura ───────────────────────────────────────────────
  lines.push('## 7. Páginas y Estructura Detallada', '')
  lines.push(`Este plan **${plan.toUpperCase()}** requiere las siguientes páginas:`, '')
  lines.push(`**Total de páginas:** ${pageList.length}`)
  lines.push(`**Checkout:** ${hasCheckout ? 'Sí (multi-step)' : 'No'}`)
  lines.push(`**Carrito:** ${planDef.cart ? 'Sí' : 'No'}`)
  lines.push('')

  pageList.forEach((pageName, idx) => {
    const structure = generatePageStructure(pageName)
    lines.push(`### 7.${idx + 1}. ${pageName}`, '')
    lines.push('**Secciones:**')
    lines.push('')
    lines.push(`| # | Sección | Contenido | Prioridad |`)
    lines.push(`|---|---|---|---|`)
    structure.sections.forEach((section, sIdx) => {
      lines.push(`| ${sIdx + 1} | ${section.name} | ${section.content} | ${section.priority} |`)
    })
    lines.push('')
    lines.push('**Responsive:**')
    lines.push('')
    lines.push(`| Dispositivo | Layout |`)
    lines.push(`|---|---|`)
    lines.push(`| **Mobile (375px)** | ${structure.responsive.mobile} |`)
    lines.push(`| **Tablet (768px)** | ${structure.responsive.tablet} |`)
    lines.push(`| **Desktop (1280px)** | ${structure.responsive.desktop} |`)
    lines.push('')
  })

  // ── 8. Animaciones y Microinteracciones ─────────────────────────────────
  lines.push('## 8. Animaciones y Microinteracciones', '')
  lines.push(`**Nivel:** ${animLevel.toUpperCase()}`)
  lines.push(`**Descripción:** ${anim.description}`, '')
  lines.push('**Detalles:**')
  anim.details.forEach(detail => lines.push(`- ${detail}`))
  lines.push('')
  lines.push('### Timing Reference')
  lines.push('')
  lines.push(`| Interacción | Duración | Easing |`)
  lines.push(`|---|---|---|`)
  lines.push(`| Hover de botón | 150ms | ease |`)
  lines.push(`| Hover de card | 250ms | ease-out |`)
  lines.push(`| Menú mobile | 300ms | ease-in-out |`)
  lines.push(`| Drawer / Sidebar | 300ms | ease-out |`)
  lines.push(`| Hero entrance | ${animLevel === 'full' ? '600ms' : '400ms'} | ease-out |`)
  lines.push(`| Scroll reveal | ${animLevel === 'full' ? '400ms' : '300ms'} | ease-out |`)
  lines.push(`| Page transition | ${animLevel === 'full' ? '200ms' : 'none'} | ease |`)
  lines.push(`| Loading skeleton | 1.5s | linear infinite |`)
  lines.push('')
  lines.push('### Accesibilidad')
  lines.push('')
  lines.push('- Respetar `prefers-reduced-motion: reduce` — desactivar todas las animaciones')
  lines.push('- Nunca animar `width`, `height`, `top`, `left` — usar `transform` y `opacity`')
  lines.push('- Focus visible siempre: `outline: 2px solid primary; outline-offset: 2px`')
  lines.push('')

  // ── 9. Assets Disponibles ─────────────────────────────────────────────────
  lines.push('## 9. Assets y Recursos Visuales', '')
  lines.push('')
  lines.push(`| Recurso | Disponible | Formato | Notas |`)
  lines.push(`|---|---|---|---|`)
  lines.push(`| **Logo** | ${yesNo(visual.logo?.available)} | ${visual.logo?.format || 'N/A'} | ${visual.logo?.available ? 'Usar en header y footer' : 'Generar o solicitar al cliente'} |`)
  lines.push(`| **Hero** | ${yesNo(assets.folderReady && !assets.missing?.includes('hero'))} | Imagen | ${assets.missing?.includes('hero') ? 'Usar Unsplash relacionado al rubro' : 'Usar imagen del cliente'} |`)
  lines.push(`| **Productos** | ${yesNo(assets.folderReady && !assets.missing?.includes('productos'))} | Imagen | ${assets.missing?.includes('productos') ? 'Usar Unsplash relacionado al rubro/categoría/producto' : 'Usar fotos del cliente'} |`)
  lines.push(`| **Favicon** | ${yesNo(visual.logo?.available)} | ${visual.logo?.format || 'N/A'} | Derivar del logo |`)
  lines.push(`| **OG Image** | ${yesNo(assets.folderReady)} | 1200x630px | Usar hero o composición con logo |`)
  lines.push('')
  lines.push('### Referencias Visuales del Cliente')
  lines.push('')
  if (Array.isArray(business.visualReferences) && business.visualReferences.length) {
    business.visualReferences.forEach(ref => {
      lines.push(`- ${ref}`)
    })
  } else {
    lines.push('- Sin referencias visuales proporcionadas')
  }
  lines.push('')

  // ── 10. Copy y Textos ──────────────────────────────────────────────────────
  lines.push('## 10. Guía de Copy y Textos', '')
  lines.push('### Textos Principales')
  lines.push('')
  lines.push(`| Elemento | Texto Sugerido |`)
  lines.push(`|---|---|`)
  lines.push(`| **Headline Hero** | ${business.primaryGoal ? `${business.primaryGoal.charAt(0).toUpperCase() + business.primaryGoal.slice(1)} con ${business.name}` : 'Descubrí lo mejor de [nombre]'} |`)
  lines.push(`| **Subheadline Hero** | ${business.differentiator || 'Calidad y servicio garantizados'} |`)
  lines.push(`| **CTA Principal** | ${hasCheckout ? 'Comprar ahora' : 'Consultar por WhatsApp'} |`)
  lines.push(`| **CTA Secundario** | ${hasCheckout ? 'Ver catálogo' : 'Ver productos'} |`)
  lines.push(`| **Título Catálogo** | Nuestros Productos |`)
  lines.push(`| **Título Contacto** | Contactanos |`)
  lines.push(`| **WhatsApp CTA** | ${contact.whatsapp ? `Escribinos por WhatsApp` : 'Contactanos por WhatsApp'} |`)
  lines.push('')
  lines.push('### Meta Tags (SEO)')
  lines.push('')
  lines.push(`| Tag | Contenido |`)
  lines.push(`|---|---|`)
  lines.push(`| **Title** | ${business.name} — ${business.industry || 'Productos y servicios'} |`)
  lines.push(`| **Description** | ${business.description ? business.description.slice(0, 155) : `${business.name} — ${business.differentiator || 'Encontrá lo que buscás'}`} |`)
  lines.push(`| **Keywords** | ${business.industry || ''}, ${(catalog.categories || []).slice(0, 3).join(', ')}, compra online |`)
  lines.push('')

  // ── 11. Accesibilidad ─────────────────────────────────────────────────────
  lines.push('## 11. Requisitos de Accesibilidad', '')
  lines.push('')
  lines.push('- **Contraste:** Ratio mínimo 4.5:1 para texto body, 3:1 para texto grande')
  lines.push('- **Touch targets:** Mínimo 44x44px para todos los elementos interactivos')
  lines.push('- **Focus states:** Visible y claro en TODOS los elementos interactivos')
  lines.push('- **ARIA labels:** En íconos sin texto, botones ambiguos, y formularios')
  lines.push('- **Alt text:** En todas las imágenes — descriptivo y contextual')
  lines.push('- **Skip link:** Para saltar navegación y llegar al contenido principal')
  lines.push('- **Formularios:** Labels asociados, errores inline, validación visual')
  lines.push('- **Reducción de movimiento:** Respetar `prefers-reduced-motion`')
  lines.push('')

  // ── 12. Integraciones Visuales ─────────────────────────────────────────────
  lines.push('## 12. Integraciones Visuales', '')
  lines.push('')
  lines.push(`| Integración | Elemento Visual | Ubicación |`)
  lines.push(`|---|---|---|`)
  if (hasCheckout) {
    lines.push(`| **MercadoPago** | Badge "Pagá con MercadoPago" | Footer, checkout, producto |`)
  }
  if (plan === 'empresa' && technical.correoArgentinoRequested) {
    lines.push(`| **Correo Argentino** | Badge de envío | Producto, checkout, footer |`)
  }
  if (plan === 'empresa' && technical.enviaRequested) {
    lines.push(`| **Envia.com** | Badge de envío multicarrier | Producto, checkout, footer |`)
  }
  if (plan === 'emprendimiento') {
    lines.push(`| **Envíos** | Badge "Envíos a todo el país" | Producto, checkout, footer |`)
  }
  lines.push(`| **WhatsApp** | Botón flotante verde | Esquina inferior derecha, siempre visible |`)
  if (hasCheckout && technical.resendRequested) {
    lines.push(`| **Email** | Ícono de email | Footer, contacto |`)
  }
  lines.push(`| **Redes Sociales** | Íconos (Instagram, Facebook, etc.) | Footer, contacto |`)
  lines.push('')

  // ── 13. Notas para Stitch ─────────────────────────────────────────────────
  lines.push('## 13. Notas Especiales para Stitch', '')
  lines.push('')
  lines.push('### Prioridades de Diseño')
  lines.push('')
  lines.push('1. **Mobile-first:** Diseñar primero para 375px, luego escalar hacia arriba')
  lines.push('2. **Conversión:** Cada página debe tener un CTA claro y visible')
  lines.push('3. **Confianza:** Badges de seguridad, testimonios, señales de confianza visibles')
  lines.push('4. **Velocidad:** Diseño ligero, sin elementos pesados que afecten LCP')
  lines.push('5. **Consistencia:** Todos los componentes deben seguir los tokens definidos arriba')
  lines.push('')
  lines.push('### Qué evitar')
  lines.push('')
  lines.push('- ❌ Gradiente violeta/azul genérico sin relación con la marca')
  lines.push('- ❌ Glassmorphism sin propósito funcional')
  lines.push('- ❌ Bordes redondeados > 20px en contenedores grandes')
  lines.push('- ❌ Animaciones de scroll-reveal en TODOS los elementos')
  lines.push('- ❌ Hero genérico: texto centrado + subtítulo + botón sobre stock photo')
  lines.push('- ❌ Inter/Roboto/Lato por defecto sin justificación')
  lines.push('- ❌ Íconos flotantes decorativos sin función')
  lines.push('- ❌ Cards con sombras excesivas o bordes múltiples')
  lines.push('- ❌ Texto dentro de botones que se corta o pisa otros elementos')
  lines.push('- ❌ UI dominada por un solo color sin contraste real')
  lines.push('')
  lines.push('### Qué incluir en cada pantalla')
  lines.push('')
  lines.push('- ✅ Header con navegación y logo')
  lines.push('- ✅ Footer completo con información de contacto y crédito SitioHoy')
  lines.push('- ✅ Estados de hover y active en todos los elementos interactivos')
  lines.push('- ✅ Estados de loading y empty')
  lines.push('- ✅ Tooltips o hints donde sea necesario')
  lines.push('- ✅ Indicadores de progreso en flujos multi-step')
  lines.push('- ✅ Badges y etiquetas para estados (nuevo, oferta, agotado)')
  lines.push('')
  lines.push('### Flujo de Trabajo Sugerido')
  lines.push('')
  lines.push('1. Crear el sistema de diseño base (colores, tipografía, componentes atómicos)')
  lines.push('2. Diseñar el Header y Footer como componentes reutilizables')
  lines.push('3. Diseñar la Home completa con todas las secciones')
  lines.push('4. Diseñar el Catálogo y Producto')
  ...(hasCheckout ? [
    '5. Diseñar el Carrito y Checkout completo (4 pasos)',
    '6. Diseñar el Seguimiento de Pedido',
  ] : []),
  lines.push(`${hasCheckout ? '7' : '5'}. Diseñar páginas opcionales (Sobre Nosotros, FAQ, Contacto)`)
  lines.push(`${hasCheckout ? '8' : '6'}. Diseñar estados de error (404, Error general)`)
  lines.push(`${hasCheckout ? '9' : '7'}. Revisar responsive en todos los breakpoints`)
  lines.push(`${hasCheckout ? '10' : '8'}. Exportar assets y documentar tokens`)
  lines.push('')

  // ── Footer ────────────────────────────────────────────────────────────────
  lines.push('---', '')
  lines.push(`**Documento generado por SitioHoy v2.0**`)
  lines.push(`**Para uso exclusivo con Stitch — Herramienta de Diseño**`)
  lines.push(`**Instrucciones:** Copiar este documento completo en Stitch para generar el diseño.`)
  lines.push(`**ID del proyecto Stitch:** [COMPLETAR DESPUÉS DE GENERAR EN STITCH]`)
  lines.push('')

  return lines.join('\n')
}

// ── Write file ──────────────────────────────────────────────────────────────
const designDir = path.join(root, '.sitiohoy', 'design')
await mkdir(designDir, { recursive: true })
const designPath = path.join(designDir, 'DESIGN.md')
await writeFile(designPath, buildDesignMd())

console.log(`DESIGN.md generado: ${designPath}`)
console.log(`Páginas: ${planPages[plan]?.required.length || 0}`)
console.log(`Plan: ${plan}`)
