# Schema Contract SitioHoy

## Decisiones

- Schema completo en todos los planes para permitir upgrades.
- `tenants` guarda credenciales por cliente: MercadoPago, Resend, Envia.com y Umami.
- `.env` solo guarda infraestructura, tenant activo y secrets de webhooks.
- `contact_messages` conserva leads aunque Resend no este activo.
- `order_events` y `payment_events` son auditoria, no UI principal.

## Campos que no deben renombrarse

- `products.compare_at_price`, no `compare_price`.
- `orders.total`, no `total_amount`.
- `orders.payer_email`, no `customer_email`.
- `orders.mp_payment_id`, no `payment_id`.
- `tenants.umami_url` es URL del script.
- `tenants.umami_website_id` es el website id.

## FKs duplicadas — problema conocido

Supabase a veces crea FKs adicionales con nombres como `fk_images_product` o
`fk_variants_product` además de las que genera el `REFERENCES` inline en el
`CREATE TABLE`. Esto hace que PostgREST no pueda resolver la relación y devuelva
error `PGRST201`.

Solución al detectar este error:
1. Consultar FKs duplicadas:
```sql
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid::regclass::text IN ('products', 'product_images', 'product_variants')
ORDER BY conrelid::regclass::text;
```
2. Eliminar la FK extra (la que no sigue el patrón `tabla_columna_fkey`):
```sql
ALTER TABLE public.product_images DROP CONSTRAINT IF EXISTS fk_images_product;
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS fk_variants_product;
```

Para prevenir el problema, no usar `ADD CONSTRAINT ... FOREIGN KEY` separado si
la FK ya está declarada con `REFERENCES` inline en el `CREATE TABLE`.

## Tracking de pedidos

No exponer la tabla `orders` directamente a anon por RLS con claims especiales.
Implementar una funcion server-side que reciba `tracking_token`, filtre tambien
por `tenant_id` y devuelva solo los campos seguros para el comprador.
