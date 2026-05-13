---
skill: design-system
descripcion: Sistema de diseño completo — generación, tokens, UX/UI, responsive, anti-slop, imágenes
tipo: core — cargar en Módulo 0 (generación) y Módulo 1 (implementación)
---

# Design System — Sistema Completo

> El diseño es la primera impresión del negocio. Cada sitio debe ser visualmente único.
> Ejecutar la generación del design system ANTES de escribir cualquier componente visual.

---

## 1. Generación del Design System

### Con AIDesigner MCP (Claude Code / Cursor / Windsurf)

```bash
npx -y @aidesigner/agent-skills init          # Claude Code
npx -y @aidesigner/agent-skills init cursor   # Cursor
```

1. Proporcionar contexto del brief: rubro, personalidad de marca, colores (si los hay), referentes visuales
2. Solicitar: *"Genera un design system completo para una tienda [rubro] con paleta cromática única, tipografía variable, espaciado, radios y componentes de alta conversión. Quiero 3 variantes."*
3. Elegir la variante más diferenciada respecto a competidores del rubro
4. Volcar todos los tokens generados en `styles/tokens.css`

### Sin MCP (cualquier IA)

1. Leer el brief: estilo deseado, colores de marca (si existen), rubro, audiencia
2. Generar 3 propuestas de paleta y presentarlas al cliente con descripción del mood
3. Cliente elige → generar `styles/tokens.css` con esa paleta
4. Crear `DESIGN.md` con el rationale de cada decisión

### Template de `styles/tokens.css`

```css
:root {
  /* Colores de marca */
  --color-primary: #____;
  --color-primary-hover: #____;
  --color-primary-hsl: ___ ___ ___;   /* Para usar con opacity: hsl(var(--color-primary-hsl) / 0.15) */
  --color-secondary: #____;
  --color-accent: #____;

  /* Neutros (9 pasos) */
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-300: #d1d5db;
  --neutral-400: #9ca3af;
  --neutral-500: #6b7280;
  --neutral-600: #4b5563;
  --neutral-700: #374151;
  --neutral-800: #1f2937;
  --neutral-900: #111827;

  /* Tipografía */
  --font-display: 'NombreFuente', sans-serif;
  --font-body: 'NombreFuente', sans-serif;

  /* Escala tipográfica */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  --text-6xl: 3.75rem;   /* 60px */

  /* Espaciado (escala 4px) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */

  /* Radios */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--neutral-900);
    --color-surface: var(--neutral-800);
    --color-text: var(--neutral-50);
    --color-text-muted: var(--neutral-400);
    --color-border: var(--neutral-700);
  }
}
```

---

## 2. Tipografías — Pares por Estilo de Negocio

Siempre usar `next/font/google`. Nunca `<link>` externo.

| Estilo del negocio | Display | Body |
|---|---|---|
| Moda / Lujo | `DM Serif Display` | `DM Sans` |
| Artesanal / Orgánico | `Playfair Display` | `Lora` |
| Tech / Moderno | `Syne` | `Inter` |
| Juvenil / Urban | `Bricolage Grotesque` | `DM Sans` |
| Minimalista / Clean | `Cormorant Garamond` | `Geist` |
| Bold / Impactante | `Cabinet Grotesk` | `General Sans` |
| Gastronomía / Calidez | `Fraunces` | `Nunito` |
| Servicios / Corporativo | `Plus Jakarta Sans` | `Inter` |

Nunca usar `Roboto`, `Lato` o `Open Sans` por defecto — son señal de diseño genérico.

---

## 3. Estructuras de Hero (rotar por proyecto — nunca repetir)

| Opción | Descripción | Ideal para |
|---|---|---|
| A | Bento grid: imagen hero izquierda + grid de características derecha | Tech, servicios |
| B | Full-bleed imagen/video con texto overlay y CTA flotante | Moda, gastronomía |
| C | Split-screen 50/50: imagen + texto vertical centrado | Servicios, lujo |
| D | Tipografía XL en primer plano + imagen de fondo con blur/parallax | Cualquiera sin fotos |
| E | Carrusel de productos featured con animación de entrada | E-commerce masivo |
| F | Marquee horizontal de productos + texto central minimal + badge de confianza | Ropa, accesorios |
| G | Grid asimétrico de 6 imágenes (collage) + CTA lateral | Fotografía, gastronomía |
| H | Layout editorial — tipografía XL 2/3 pantalla + producto flotante derecha | Premium, diseño |

**Regla**: Elegir la opción según el brief. Si hay fotos profesionales → B, C, G. Si no hay fotos → D, H.

---

## 4. Layouts de Catálogo (rotar por proyecto)

- **Masonry grid** con alturas variables según imagen del producto
- **Grid asimétrico 3-col** con primer producto featured en tamaño doble
- **Lista horizontal** con imagen izquierda y detalles expandibles
- **Cards estilo revista** con tipografía grande y precio superpuesto en hover
- **Grid + filtros laterales**: sidebar fija (desktop) / drawer (mobile)
- **Infinite scroll con skeleton** sin paginación visible

---

## 5. Responsive — Breakpoints y Grids

```css
/* Mobile-first SIEMPRE */
/* Base: 375px — diseño base para celular */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */

/* Grid de catálogo */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);  /* mobile: 2 col */
  gap: var(--space-3);
}
@media (min-width: 768px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
}
@media (min-width: 1280px) {
  .product-grid { grid-template-columns: repeat(4, 1fr); gap: var(--space-6); }
}

/* Touch targets — mínimo 44px */
.btn, .nav-link, .product-card__action {
  min-height: 44px;
  min-width: 44px;
}
```

### Validación responsive obligatoria en cada módulo

Antes de marcar un módulo como ✅, verificar en estos viewports:
- **375px** (iPhone SE) — el más restrictivo
- **390px** (iPhone 14)
- **768px** (tablet)
- **1280px** (desktop)
- **1920px** (desktop grande)

---

## 6. Estados de Componentes (obligatorio en todos)

| Estado | Implementación |
|---|---|
| Default | — |
| Hover | `transition: var(--transition-fast)` mínimo |
| Active/Pressed | `transform: scale(0.98)` |
| Focus | `outline: 2px solid var(--color-primary); outline-offset: 2px` |
| Loading | Skeleton shimmer (ver abajo) |
| Empty | Mensaje + ícono SVG simple |
| Error | Mensaje descriptivo + botón retry |
| Disabled | `opacity: 0.5; cursor: not-allowed; pointer-events: none` |

### Skeleton loader

> CSS de shimmer definido en `core/17-manejo-errores.md` — sección `loading.tsx`. Copiar desde allí.

### `prefers-reduced-motion` — obligatorio

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Optimización de Imágenes

### Compresión client-side antes de upload

```typescript
// lib/images/compress.ts
import imageCompression from 'browser-image-compression'

export async function compressProductImage(file: File): Promise<File> {
  if (file.size > 50 * 1024 * 1024) throw new Error('El archivo supera 50MB')

  const compressed = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 2000,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  })

  return new File([compressed], file.name.replace(/\.[^/.]+$/, '.webp'), {
    type: 'image/webp',
  })
}

export function validateImage(file: File) {
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  if (!ALLOWED.includes(file.type)) throw new Error('Formato no permitido. Usar JPG, PNG, WebP o AVIF.')
  if (file.size > 50 * 1024 * 1024) throw new Error('El archivo supera 50MB.')
}
```

### Uso de `next/image` — siempre

```tsx
// Producto — proporciones fijas
<Image
  src={product.imageUrl}
  alt={`${product.name} — ${siteName}`}   // Nunca vacío, nunca genérico
  width={800}
  height={800}
  className="object-cover"
  priority={isAboveFold}                   // true solo para LCP
  placeholder="blur"
  blurDataURL={product.blurHash ?? DEFAULT_BLUR}
/>

// Hero — full-bleed responsive
<Image
  src={heroImage}
  alt={heroAlt}
  fill
  className="object-cover"
  priority={true}
  sizes="100vw"
/>

// Producto en grid
<Image
  src={product.imageUrl}
  alt={`${product.name}`}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
/>
```

---

## 8. Detección de AI Slop — Patrones Prohibidos

Verificar que el sitio NO tenga ninguno de estos patrones antes de entregar:

- Gradiente violeta/azul genérico en el hero sin relación con la marca
- Cards con glassmorphism sin propósito funcional
- Bordes redondeados > 20px en contenedores grandes
- Animaciones de scroll-reveal en TODOS los elementos sin criterio
- Hero genérico: texto centrado + subtítulo + botón sobre stock photo de laptops/personas sonriendo
- Tipografía sin personalidad: Inter/Roboto/Lato por defecto sin justificación
- Gradiente diagonal `from-purple-500 to-pink-500` sin relación con la marca
- Íconos flotantes decorativos sin función
- Sección "Features" con 6 cards idénticas con íconos de Heroicons y texto placeholder

---

## 9. Auditoría de Diseño — 10 Dimensiones

Antes de terminar Módulo 1 y Módulo 2, puntuar 0-10:

1. **Consistencia de color** — ¿Se usan los tokens o valores hex random?
2. **Jerarquía tipográfica** — ¿h1 > h2 > h3 > body claramente diferenciados?
3. **Ritmo de espaciado** — ¿Escala 4px/8px/16px/24px/32px/48px/64px?
4. **Consistencia de componentes** — ¿Elementos similares lucen similares?
5. **Responsive** — ¿Fluido en 375/768/1280/1920px?
6. **Dark mode** — ¿Completo o roto?
7. **Animaciones** — ¿Con propósito o decorativas?
8. **Accesibilidad** — Contraste ≥ 4.5:1, focus visible, touch targets ≥ 44px
9. **Densidad** — ¿Congestionado o respira bien?
10. **Polish** — ¿Hover, loaders, empty states, error states implementados?

**Score < 7 en cualquier dimensión = bloquear entrega del módulo.**

---

## 10. Logos — Si el cliente no tiene

Generar con AIDesigner MCP o describir en detalle para generación manual:

- Nombre del negocio + rubro + estilo buscado + paleta ya definida
- Siempre generar: variante horizontal + variante cuadrada (ícono)
- Formatos: PNG fondo transparente + SVG
- Verificar legibilidad en 32px (favicon) y 200px (header)
