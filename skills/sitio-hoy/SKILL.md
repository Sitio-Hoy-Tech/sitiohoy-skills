---
name: sitio-hoy
description: >
  Genera sitios web completos bajo los planes de SitioHoy (Esencial, Emprendimiento, Empresa).
  Next.js 15+ App Router, Supabase multitenant con RLS, MercadoPago Bricks, Resend, Envia.com,
  Umami Analytics. ISR on-demand con cache tags quirúrgicos. SEO optimizado para IA y buscadores.
  Compatible con Claude Code, Cursor, Windsurf, VS Code + Copilot y cualquier IA del mercado.
  Usar cuando el cliente diga: "comenzar", "crear sitio", "nuevo proyecto", "arrancar",
  "nuevo sitio web", "iniciar desarrollo", "quiero un sitio".
user-invokable: true
argument-hint: "[nombre del negocio o plan]"
metadata:
  author: SitioHoy
  version: "2.0.0"
  category: web-development
---

# SitioHoy — Sistema de Generación de Sitios Web

## Activación

Al invocar este skill:
1. Cargar `core/10-modo-silencioso.md` — activar inmediatamente
2. Cargar `core/00-rol-identidad.md` — establecer identidad y mentalidad
3. Cargar `core/18-skills-especializadas.md` — mapa de skills auxiliares
4. Ejecutar el **Protocolo de Inicio** a continuación

---

## Protocolo de Inicio

### Paso 1 — Briefing y Config del Proyecto (PRIMERO)

Usar `sitio-hoy-briefing`.

1. Enviar onboarding técnico + briefing de negocio/diseño.
2. No continuar hasta recibir respuestas.
3. Normalizar respuestas en `.sitiohoy/intake.json`.
4. Generar:
   - `sitiohoy.config.json`
   - `brief.md`
5. Usar `sitio-hoy-project-director` para generar context packs y dirección visual:
   - `.sitiohoy/context/`
   - `.sitiohoy/design/`
6. Con `sitiohoy.config.json`, determinar qué plan importar.

Fallback: si la skill especializada no está disponible, leer `core/01-onboarding-tecnico.md`
y `core/02-briefing.md`, pero igual generar `sitiohoy.config.json` y `brief.md`.
Luego generar context packs con `sitio-hoy-project-director`.

### Paso 2 — Importar archivos del plan

Según el plan detectado en el onboarding:

```
Plan Esencial      → leer plans/esencial/INDEX.md
Plan Emprendimiento → leer plans/emprendimiento/INDEX.md
Plan Empresa       → leer plans/empresa/INDEX.md
```

El INDEX.md de cada plan lista exactamente qué archivos cargar y en qué orden.
**Cargar solo los archivos del plan activo — no cargar integraciones innecesarias.**

### Paso 3 — Scaffold y base técnica

Si el proyecto arranca desde cero:

1. Leer `.sitiohoy/context/module-0.md`.
2. Usar `sitio-hoy-scaffold` para crear la base Next.js + Supabase + QA scripts.
3. Usar `sitio-hoy-database` para generar migración inicial, RLS, storage y seeds.
4. Ejecutar `npm run build` y `npm run sitiohoy:validate` antes de escribir UI.

Si el proyecto ya existe, inspeccionar primero y aplicar solo los faltantes.

### Paso 4 — Confirmar Brief y Diseño

Leer `brief.md`, confirmar que tiene:
- negocio, audiencia y tono;
- identidad visual;
- catálogo;
- páginas;
- contacto y redes;
- assets faltantes.

Con ese brief, derivar las decisiones de diseño en `core/04-design-system.md`.
Para ahorrar tokens, preferir cargar `.sitiohoy/design/design-direction.md` y
`.sitiohoy/design/layout-recipe.md` antes que todo `core/04-design-system.md`.

### Paso 5 — Confirmar assets y ejecutar módulos

Verificar que `_assets-cliente/` tiene las imágenes antes de Módulo 1.
Ejecutar los módulos del plan secuencialmente según el archivo `modulos.md` correspondiente.
No avanzar al siguiente módulo sin checklist ✅ completo y sin pasar `sitio-hoy-qa`.

### Paso 6 — Reporte QA

Al terminar todos los módulos, usar `sitio-hoy-qa` para ejecutar los gates automáticos
y generar `QA-[nombre-negocio]-[YYYY-MM-DD].md` en la raíz del proyecto. Luego leer
`core/11-qa-checklist.md` para completar los pendientes manuales.

### Paso 7 — Launch, Tenant y Deploy

Usar `sitio-hoy-launch-automation` solo cuando QA esté aprobado o documentado.

1. Generar `.sitiohoy/launch/` con plan, comandos, env vars, provisioning y demo data.
2. Crear repo GitHub en la organización indicada y hacer push inicial.
3. Aplicar migraciones Supabase.
4. Crear/actualizar fila `tenants`, usuario admin y relación `user_tenants`.
5. Cargar productos demo si todavía no hay catálogo real.
6. Importar en Vercel, cargar env vars, deploy preview y deploy production.
7. Completar `core/15-deploy-vercel.md` antes del go-live.

---

## Reglas permanentes

**Comportamiento:**
- Modo silencioso activo en todo momento
- Una pregunta → nunca volver a pedir lo ya dado
- Solo hablar ante: error crítico / dato faltante / fin de módulo / bloqueo externo
- Formato de fin de módulo: `Módulo N ✅ · Listo para N+1`
- Al finalizar cada módulo: ejecutar `npm run sitiohoy:tracking -- --modulo N --nombre "Nombre"` para actualizar `proyecto-tracking.json` automáticamente
- Al finalizar cada módulo: ejecutar `npm run sitiohoy:validate` o justificar por qué no aplica
- Al finalizar cada módulo: actualizar `README.md` si el módulo agrega una integración, patrón clave, variable de entorno o página nueva que no esté documentada. No reescribir secciones que no cambiaron.

**Técnicas (aplicar siempre sin excepción):**
- Server Components por defecto — `'use client'` solo para estado/efectos/eventos
- Server Actions para mutaciones — no crear API routes innecesarias
- `next/image` siempre — nunca `<img>` nativo
- `next/font` siempre — nunca `<link>` externo para fuentes
- `@supabase/ssr` en server — `createBrowserClient` solo en client
- `unstable_cache` + `revalidateTag()` — nunca `revalidatePath('/')` global
- `error.tsx` y `not-found.tsx` en cada segmento de ruta importante
- `loading.tsx` con skeleton en rutas de datos pesados
- Mobile-first siempre — diseñar desde 375px

**El admin NO se construye en este skill.** El admin es un repositorio separado.
La BD y RLS se configuran completos para que el admin futuro funcione sin modificaciones.

---

## Estructura de archivos

```
core/
  00-rol-identidad.md      — identidad y mentalidad
  01-onboarding-tecnico.md — fallback si no está sitio-hoy-briefing
  02-briefing.md           — fallback si no está sitio-hoy-briefing
  03-stack-base.md         — stack Next.js + Supabase
  04-design-system.md      — design system, UX/UI, responsive
  05-base-datos.md         — schema BD (FUENTE ÚNICA DE VERDAD)
  06-supabase-rls.md       — RLS multitenant
  07-isr-cache.md          — ISR on-demand
  08-seo.md                — SEO y metadata
  09-arquitectura-base.md  — estructura de carpetas
  10-modo-silencioso.md    — directiva de comportamiento
  11-qa-checklist.md       — reporte QA al final
  12-env-vars.md           — variables de entorno (.env vs BD)
  13-typescript-types.md   — interfaces TypeScript del schema
  14-copy-textos.md        — copy en español argentino por rubro
  15-deploy-vercel.md      — deploy, dominio, MP producción, go-live
  16-tracking-proyecto.md  — registro interno tokens/tiempo/costo por módulo
  17-manejo-errores.md     — error.tsx, not-found.tsx, loading.tsx por segmento
  18-skills-especializadas.md — cuándo delegar briefing, scaffold, database, QA y launch

integraciones/
  ...
  formulario-contacto.md   — todos los planes (si activado en briefing)

plans/
  esencial/
    INDEX.md               — archivos a cargar para este plan
    modulos.md             — Módulos 0-5
  emprendimiento/
    INDEX.md
    modulos.md             — Módulos 0-6
  empresa/
    INDEX.md
    modulos.md             — Módulos 0-7

integraciones/
  mercadopago.md           — Emprendimiento + Empresa
  envios-fijos.md          — solo Emprendimiento
  envia.md                 — solo Empresa
  resend.md                — Emprendimiento + Empresa (opcional)
  umami-avanzado.md        — solo Empresa
  whatsapp.md              — todos los planes
```

---

## Paralelización

### Qué es estrictamente secuencial

El flujo principal es secuencial por dependencia de datos:
Briefing → Scaffold → Database → Módulos → QA → Launch.
No saltear ni paralelizar estos pasos mayores.

### Qué puede ejecutarse en paralelo dentro de cada paso

**Durante el desarrollo de módulos** — los módulos de UI sin dependencia de estado
compartido pueden desarrollarse en simultáneo:

| Se puede parallelizar | Condición |
|---|---|
| Páginas estáticas independientes (About, Contacto, FAQ) | No comparten estado entre sí |
| Componentes de UI del mismo módulo (Hero + FeaturedGrid + Footer) | Cada componente es un archivo separado |
| Generación de datos demo + configuración de tokens de diseño | Son archivos independientes |
| Auditoría Lighthouse de múltiples páginas | Cada página es un check independiente |

**Lo que NO puede paralelizarse:**
- Módulo de catálogo antes de tener el schema de productos en Supabase
- Módulo de checkout antes de tener el carrito
- Deploy antes de QA aprobado
- Cualquier módulo antes de tener `styles/tokens.css` (regla de diseño)

### Hint para la IA

Cuando detectes tareas del mismo módulo que no comparten estado,
podés ejecutarlas en paralelo usando los mecanismos disponibles
en tu plataforma (subagentes, tool calls simultáneas, etc.).
Indicar explícitamente en el plan qué se lanza en paralelo y esperar
a que todas terminen antes de marcar el módulo como completo.

---

## Compatibilidad con IAs — Guía de rutas por entorno

Este skill genera **exactamente el mismo código** en cualquier IA.
Lo que cambia es cómo se ejecutan ciertos pasos de setup. Seguir la ruta correspondiente:

### Operaciones críticas — rutas por entorno

| Operación | Claude Code | Cursor / Windsurf | OpenCode | GPT-4 / Gemini / Codex |
|---|---|---|---|---|
| Aplicar migraciones SQL | Supabase MCP (automático) o `supabase db push` | `supabase db push` en terminal | `supabase db push` en terminal | SQL Editor en Dashboard de Supabase |
| Crear repo GitHub | `gh repo create` vía shell | `gh repo create` en terminal | `gh repo create` en terminal | UI de GitHub + `git remote add origin` |
| Deploy a Vercel | `vercel` CLI o Vercel MCP | `vercel` CLI en terminal | `vercel` CLI en terminal | `vercel` CLI en terminal o UI de Vercel |
| Leer `/cost` de tokens | Comando `/cost` en Claude Code | No disponible — estimar | No disponible — estimar | No disponible — estimar |
| Skills especializadas | Delegación automática | Leer SKILL.md manualmente | Leer SKILL.md manualmente | Leer SKILL.md e instrucciones manualmente |

### Instrucción para cualquier IA — sin MCP

Si tu entorno **no tiene MCP de Supabase**:
1. Ejecutar `node scripts/generate-supabase-migration.mjs` → genera `supabase/migrations/001_initial_schema.sql` y `002_seed_admin.sql`
2. Abrir Supabase Dashboard → SQL Editor → pegar y ejecutar en orden
3. Credenciales del admin en `credentials.local.json`

Si tu entorno **no soporta skill delegation**:
- Leer directamente el archivo SKILL.md de la skill indicada y seguir su Workflow
- Todas las skills tienen fallback de ejecución manual explícito

### Skills → archivos equivalentes para IAs sin skill system

| Skill | Archivo equivalente a leer |
|---|---|
| `sitio-hoy-briefing` | `core/01-onboarding-tecnico.md` + `core/02-briefing.md` |
| `sitio-hoy-scaffold` | `sitio-hoy-scaffold/SKILL.md` + copiar `assets/template-next-supabase/` |
| `sitio-hoy-database` | `sitio-hoy-database/SKILL.md` + `scripts/generate-supabase-migration.mjs` |
| `sitio-hoy-qa` | `core/11-qa-checklist.md` + `npm run sitiohoy:validate` |
| `sitio-hoy-launch-automation` | `core/15-deploy-vercel.md` |
| `sitio-hoy-project-director` | `core/04-design-system.md` |

---

## Planes disponibles

| Plan | Precio | Productos | Pagos | Envíos |
|---|---|---|---|---|
| Esencial | $25.000/mes | Hasta 50 | No (WhatsApp) | No |
| Emprendimiento | $37.000/mes | Hasta 200 | MercadoPago | Zonas fijas |
| Empresa | $65.000/mes | Ilimitados | MercadoPago | Envia.com |
