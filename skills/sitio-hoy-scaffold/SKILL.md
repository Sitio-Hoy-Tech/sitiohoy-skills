---
name: sitio-hoy-scaffold
description: >
  Crear el proyecto base de un sitio SitioHoy desde cero con Next.js App Router,
  Supabase, tokens de diseño, estructura de carpetas, env validation, cache tags
  y scripts de validacion inicial. Usar despues del briefing cuando ya existe
  plan activo y brief del negocio.
---

# SitioHoy Scaffold

Usar esta skill para iniciar un sitio nuevo despues de definir:
- plan: `esencial`, `emprendimiento` o `empresa`
- nombre del negocio
- dominio o URL temporal
- tenant id
- integraciones activas

## Resultado esperado

Crear una base consistente antes de escribir UI:
- Next.js 15+ App Router con TypeScript strict
- Supabase clients server/service
- `lib/cache-tags.ts`
- `lib/config/env.ts`
- `styles/tokens.css`
- `sitiohoy.config.json`
- `.env.example`
- scripts de QA base

## Workflow

1. Si el proyecto esta vacio, crear Next con:
   ```bash
   npx create-next-app@latest ./ --typescript --app --tailwind --src-dir=false --import-alias="@/*"
   ```
2. Copiar el contenido de `assets/template-next-supabase/` en la raiz del proyecto.
3. Instalar dependencias base:
   ```bash
   npm install @supabase/ssr @supabase/supabase-js lucide-react browser-image-compression zod
   ```
4. Si plan es `emprendimiento` o `empresa`, instalar:
   ```bash
   npm install mercadopago @mercadopago/sdk-react react-hook-form @hookform/resolvers zustand
   ```
5. Si Resend esta activo:
   ```bash
   npm install resend
   ```
6. Crear `sitiohoy.config.json` con plan, negocio e integraciones.
7. Completar `.env.local` desde `.env.example`.
8. Ejecutar:
   ```bash
   npm run build
   npm run sitiohoy:validate
   ```

## Reglas

- No escribir componentes visuales antes de tener `styles/tokens.css`.
- No poner credenciales de MercadoPago, Resend o Envia.com en `.env`.
- No commitear `.env.local` ni `proyecto-tracking.json`.
- Si el proyecto no esta vacio, inspeccionar primero y copiar solo archivos faltantes.

## Configuración base obligatoria en app/layout.tsx

- Agregar `suppressHydrationWarning` al `<body>` para evitar falsos errores de hidratación causados por extensiones del browser (ej: ColorZilla, LastPass):
  ```tsx
  <body className="..." suppressHydrationWarning>
  ```

## Configuración base obligatoria en package.json

- Agregar `browserslist` apuntando a browsers modernos para reducir polyfills innecesarios:
  ```json
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Firefox versions",
    "last 2 Safari versions",
    "last 2 Edge versions"
  ]
  ```

## README inicial

Al terminar el scaffold, generar `README.md` en la raíz con esta estructura mínima:

```markdown
# {Nombre del negocio} — Sitio Web

> {descripción en una línea del negocio y plan}

**Live:** {URL Vercel} · **Repo:** {org/repo}

## Stack
(tabla: Framework / BD / Pagos / Envíos / Emails / Analytics / Deploy)

## Arquitectura
(árbol de carpetas con descripción de cada sección)

## Variables de entorno
(bloque bash con todas las vars del .env.example comentadas)

## Desarrollo local
(comandos: install, cp .env, dev, build, validate)

## Integraciones
(sección por cada integración activa: dónde van las credenciales, qué hace)

## Deploy
(comando vercel + checklist de go-live pendiente)

## Desarrollado por
[SitioHoy](https://sitiohoy.com.ar) — Plan {plan} · {año}
```

## Paralelización

Estas tareas son independientes y pueden ejecutarse simultáneamente:

**Grupo A — instalación de dependencias** (una vez creado el proyecto base):
- Dependencias base (`@supabase/ssr`, `lucide-react`, `zod`, etc.)
- Dependencias de plan (`mercadopago`, `react-hook-form`, `zustand`) — solo si aplica
- Dependencias de Resend — solo si aplica

Las instalaciones pueden resolverse en paralelo si el package manager lo soporta.
Si no, ejecutarlas en el orden del workflow para evitar conflictos de lockfile.

**Grupo B — generación de archivos de configuración** (independientes entre sí):
- `sitiohoy.config.json`
- `.env.example`
- `styles/tokens.css`
- `lib/cache-tags.ts`
- `lib/config/env.ts`
- `app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`
- `README.md`

El Grupo B puede generarse en paralelo mientras el Grupo A instala dependencias,
ya que los archivos no requieren que las dependencias estén instaladas para crearse.

## Handoff

Despues del scaffold:
1. usar `sitio-hoy-database` para migraciones, RLS y seeds;
2. usar la skill principal `sitio-hoy` para ejecutar modulos del plan;
3. usar `sitio-hoy-qa` antes de marcar cada modulo como terminado.
