---
name: sitio-hoy-database
description: >
  Crear y validar la base de datos Supabase para sitios SitioHoy: migracion
  inicial, RLS multitenant, storage, seeds, eventos de pedidos/pagos y contrato
  de columnas. Usar despues del scaffold y antes de escribir queries.
---

# SitioHoy Database

Usar esta skill para que la base deje de ser copiada a mano y pase a ser un
contrato repetible.

## Principio

El schema debe ser estable para todos los planes. Las features se apagan por
configuracion, no por columnas faltantes. Esto permite upgrades de Esencial a
Emprendimiento o Empresa sin rehacer migraciones base.

## Workflow

1. Leer `sitiohoy.config.json` si existe.
2. Generar migracion y seed admin:
   ```bash
   node scripts/generate-supabase-migration.mjs --plan esencial
   ```
   El script genera:
   - `supabase/migrations/001_initial_schema.sql` — schema completo
   - `supabase/migrations/002_seed_admin.sql` — tenant inicial + usuario admin
   - `credentials.local.json` — email y password del admin (gitignoreado automáticamente)
3. Crear el usuario admin en Supabase Auth **antes** de ejecutar el seed:
   - Con Supabase MCP: `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
   - O manualmente en el Dashboard → Authentication → Users → Add user
   - Las credenciales están en `credentials.local.json`
4. Aplicar las migraciones con Supabase MCP o en Dashboard (en orden: 001 → 002).
5. Crear o revisar:
   - `types/database.ts` si el proyecto ya usa tipos manuales
6. Validar que:
   - todas las tablas tengan `tenant_id` cuando corresponde;
   - RLS este habilitado;
   - service role solo se use en server;
   - queries publicas filtren por `tenant_id`;
   - contact forms no pierdan mensajes.

## Contrato base

Tablas base siempre presentes:
- `tenants`
- `user_tenants`
- `categories`
- `subcategories`
- `products`
- `product_images`
- `product_variants`
- `orders`
- `order_items`
- `coupons`
- `shipping_zones`
- `contact_messages`
- `order_events`
- `payment_events`

`shipping_zones` queda sin uso en Empresa si se usa Envia.com, pero existe para
fallback y upgrades.

## Mejoras incluidas respecto al schema anterior

- `umami_website_id` en `tenants` para evitar ambiguedad entre script URL e ID.
- `contact_messages` para que un formulario sin Resend no pierda leads.
- `order_events` y `payment_events` para auditoria de checkout y webhooks.
- RLS consistente en tablas multitenant.
- Indices por `tenant_id`, `slug`, `created_at` y relaciones frecuentes.

## Reglas de seguridad

- Nunca confiar en precios, stock, envio o descuentos del cliente.
- Recalcular totales server-side antes de crear pagos.
- En webhooks, actualizar por `id` y `tenant_id`.
- Guardar payloads de pagos en `payment_events` antes de mutar estado.
- La pagina de seguimiento debe usar Server Action o RPC filtrada por
  `tenant_id` + `tracking_token`, no una policy anon basada en JWT inventado.

## Seguridad de credenciales

- `credentials.local.json` contiene email y password del admin, generado con contraseña aleatoria segura.
- El script agrega automáticamente `credentials.local.json` a `.gitignore`.
- Nunca commitear ese archivo. Compartir credenciales por canal seguro (Bitwarden, 1Password, etc).

## Recursos

- `scripts/generate-supabase-migration.mjs`: genera la migracion inicial + seed admin.
- `references/schema-contract.md`: resumen de tablas y decisiones.
