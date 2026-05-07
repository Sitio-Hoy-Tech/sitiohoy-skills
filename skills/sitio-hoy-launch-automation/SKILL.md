---
name: sitio-hoy-launch-automation
description: >
  Automatiza la ultima milla de un proyecto SitioHoy: preparar repo GitHub en una organizacion,
  deploy en Vercel, variables de entorno, migraciones Supabase, provisioning de tenant/admin,
  seeds de productos demo y checklist de go-live. Usar despues de sitio-hoy-qa y antes de
  entregar o publicar un sitio.
user-invokable: true
argument-hint: "[--org ORG] [--repo REPO] [--domain dominio] [--admin-email email]"
metadata:
  author: SitioHoy
  version: "1.0.0"
  category: launch-automation
---

# SitioHoy Launch Automation

## Cuándo usar

Usar esta skill cuando el sitio ya tiene:
- `sitiohoy.config.json`
- `brief.md`
- migración Supabase generada
- `npm run build` y `sitiohoy-qa` aprobados o documentados

No ejecutar deploy real si faltan QA, env vars o credenciales. Primero generar el plan.

## Flujo

1. Leer `sitiohoy.config.json`, `brief.md` y `.env.example`.
2. Ejecutar el generador:
   ```bash
   node /ruta/a/sitio-hoy-launch-automation/scripts/generate-launch-plan.mjs --org ORG --repo REPO --domain dominio.com --admin-email admin@cliente.com
   ```
3. Revisar `sitiohoy.config.json`: el generador completa `tenantId` y `siteUrl`.
4. Revisar los artefactos en `.sitiohoy/launch/`.
5. Ejecutar comandos por bloques:
   - GitHub: crear repo y push inicial.
   - Supabase: aplicar migraciones, crear tenant, crear admin, asociar `user_tenants`.
   - Demo data: insertar categorias/productos de prueba para validar diseño.
   - Vercel: link/import, cargar env vars, deploy preview y production.
6. Completar `launch-plan.md` antes de go-live.

## Artefactos generados

- `.sitiohoy/launch/launch-plan.md`
- `.sitiohoy/launch/commands.sh`
- `.sitiohoy/launch/vercel-env.example`
- `.sitiohoy/launch/provision-supabase.mjs`
- `.sitiohoy/launch/demo-products.json`
- `.sitiohoy/launch/seed-demo-data.sql`

## Reglas

- Nunca commitear secretos reales.
- `SUPABASE_SERVICE_ROLE_KEY`, tokens MercadoPago, Resend y Envia van en env vars o tabla `tenants`, no en Git.
- El usuario admin se crea con Supabase Admin API, no insertando directo en `auth.users`.
- La fila `tenants` y la fila `user_tenants` deben existir antes de entregar el proyecto.
- Los productos demo deben poder borrarse o reemplazarse sin romper diseño.
- Si faltan CLIs (`gh`, `vercel`, `supabase`), dejar comandos alternativos manuales en el plan.

## Referencias

- Para checklist completo, leer `references/launch-checklist.md`.
