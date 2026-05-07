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

## Tabla de invalidaciones por evento

| Evento | Tags a invalidar |
|---|---|
| Producto creado/editado/eliminado | `products`, `product-{slug}`, `homepage` |
| Categoría creada/editada/eliminada | `categories`, `products` |
| Pedido cambia de estado | `order-{id}`, `orders` |
| Cupón creado/editado/eliminado | `coupons` |
| Config del sitio actualizada | `site-config`, `homepage` |
| Imagen de producto subida/eliminada | `product-{slug}`, `products` |
| Zona de envío modificada | `shipping-zones` |
| Pago aprobado (webhook MP) | `order-{id}`, `orders` |

## Reglas de oro

1. Tag granular primero (`product-{slug}`), luego colectivo (`products`)
2. **Nunca `revalidatePath('/')`** — usar `revalidateTag(TAGS.HOMEPAGE)`
3. Sin `export const revalidate = N` en páginas de catálogo
4. Páginas estáticas puras (Sobre nosotros, FAQ): `export const revalidate = 86400`
