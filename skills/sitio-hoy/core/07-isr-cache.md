---
skill: isr-cache
descripcion: ISR on-demand con unstable_cache y revalidateTag — invalidación quirúrgica
tipo: core — Módulos 2-3 al crear fetches públicos
---

# ISR On-Demand con Cache Tags

Todos los datos públicos se sirven desde caché estático e invalidan quirúrgicamente. **Nunca `revalidatePath('/')` global.**

## Tags

```typescript
// lib/cache-tags.ts
export const TAGS = {
  PRODUCTS:    'products',
  PRODUCT:     (slug: string) => `product-${slug}`,
  CATEGORIES:  'categories',
  ORDERS:      'orders',
  ORDER:       (id: string) => `order-${id}`,
  COUPONS:     'coupons',
  SITE_CONFIG: 'site-config',
  HOMEPAGE:    'homepage',
  SHIPPING:    'shipping-zones',
  TENANT:      'tenant-config',   // ← getTenantConfig() en lib/supabase/tenant.ts
} as const
```

## Fetches cacheados

```typescript
// lib/data/products.ts
import { unstable_cache } from 'next/cache'
import { TAGS } from '@/lib/cache-tags'
import { createServiceClient } from '@/lib/supabase/server'

const tenantId = process.env.NEXT_PUBLIC_TENANT_ID!

export const getAllProducts = unstable_cache(
  async () => {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, compare_at_price, featured,
        product_images!product_images_product_id_fkey(url, alt, position),
        categories(name, slug)
      `)
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('created_at', { ascending: false })
    return data ?? []
  },
  ['all-products'],
  { tags: [TAGS.PRODUCTS] },
)

export const getProductBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('products')
        .select(`
          id, name, slug, price, compare_at_price, description,
          product_images!product_images_product_id_fkey(url, alt, position),
          product_variants!product_variants_product_id_fkey(id, name, stock, price, price_modifier),
          categories(name, slug)
        `)
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .single()
      return data
    },
    [`product-${slug}`],
    { tags: [TAGS.PRODUCTS, TAGS.PRODUCT(slug)] },
  )()

export const getCategories = unstable_cache(
  async () => {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, position')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('position')
    return data ?? []
  },
  ['categories'],
  { tags: [TAGS.CATEGORIES] },
)
```

## Invalidación desde webhooks externos

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  if (req.headers.get('x-revalidate-secret') !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tag, tags } = await req.json()
  const toRevalidate: string[] = tags ?? (tag ? [tag] : [])

  if (toRevalidate.length === 0) {
    return NextResponse.json({ error: 'Missing tag or tags' }, { status: 400 })
  }

  toRevalidate.forEach(revalidateTag)
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() })
}
```

## Tabla de invalidaciones por evento — granular

Regla: invalidar solo lo mínimo necesario. El tag granular primero, el colectivo solo cuando la lista también cambió.

| Evento | Tags a invalidar | Motivo |
|---|---|---|
| Producto: solo precio o stock | `product-{slug}` | No afecta la lista general |
| Producto: nombre, slug, imagen, categoría | `product-{slug}`, `products`, `homepage` | Puede afectar grids y home |
| Producto activado/desactivado | `products`, `homepage` | Cambia lo que se muestra en lista |
| Producto: toggle featured | `products`, `homepage` | Sección destacados en home |
| Producto eliminado | `products`, `homepage` | Ya no existe en lista |
| Categoría: nombre o posición | `categories` | No afecta productos directamente |
| Categoría eliminada | `categories`, `products` | Productos quedan sin categoría |
| Imagen de producto subida/eliminada | `product-{slug}` | Solo afecta página de detalle |
| Zona de envío modificada | `shipping-zones` | No afecta catálogo |
| Cupón creado/editado/eliminado | `coupons` | Checkout only |
| Config del sitio (nombre, logo, redes) | `tenant-config`, `site-config`, `homepage` | Afecta layout global |
| Pedido cambia de estado (admin) | `order-{id}`, `orders` | Dashboard y tracking |
| Pago aprobado (webhook MP) | `order-{id}`, `orders` | Mismo que arriba |

## Helper de invalidación recomendado

```typescript
// lib/cache/invalidate.ts
import { revalidateTag } from 'next/cache'
import { TAGS } from '@/lib/cache-tags'

export const invalidateProduct = (slug: string, { listChanged = false, featuredChanged = false } = {}) => {
  revalidateTag(TAGS.PRODUCT(slug))
  if (listChanged || featuredChanged) revalidateTag(TAGS.PRODUCTS)
  if (featuredChanged) revalidateTag(TAGS.HOMEPAGE)
}

export const invalidateOrder = (orderId: string) => {
  revalidateTag(TAGS.ORDER(orderId))
  revalidateTag(TAGS.ORDERS)
}

export const invalidateTenantConfig = () => {
  revalidateTag(TAGS.TENANT)
  revalidateTag(TAGS.HOMEPAGE)
}
```

## Reglas de oro

1. Tag granular primero (`product-{slug}`), luego colectivo (`products`) solo si la lista cambió
2. **Nunca `revalidatePath('/')`** — usar `revalidateTag(TAGS.HOMEPAGE)`
3. Sin `export const revalidate = N` en páginas de catálogo — solo ISR on-demand
4. Páginas estáticas puras (Sobre nosotros, FAQ): `export const revalidate = 86400`
5. `getTenantConfig()` **sin** `revalidate` — solo se invalida con `revalidateTag(TAGS.TENANT)`
