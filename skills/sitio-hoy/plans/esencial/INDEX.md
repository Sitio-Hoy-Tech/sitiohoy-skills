---
skill: plan-esencial-index
descripcion: Plan Esencial — archivos a importar y orden de ejecución
tipo: plan — cargar después del onboarding técnico cuando plan = esencial
---

# Plan Esencial — Índice

**$25.000/mes** · Hasta 50 productos · Sin pagos online · Contacto por WhatsApp

## Archivos a cargar (en este orden)

```
core/00-rol-identidad.md        ← identidad y mentalidad
core/03-stack-base.md           ← stack Next.js + Supabase base
core/04-design-system.md        ← design system ANTES de código
core/05-base-datos.md           ← schema — leer ANTES de cualquier query
core/06-supabase-rls.md         ← configurar RLS completo (para admin futuro)
core/07-isr-cache.md            ← caché ISR
core/08-seo.md                  ← SEO y metadata
core/09-arquitectura-base.md    ← estructura de carpetas
core/10-modo-silencioso.md      ← comportamiento
core/12-env-vars.md             ← variables de entorno — leer en Módulo 0
core/16-tracking-proyecto.md   ← crear proyecto-tracking.json en Módulo 0, actualizar en cada módulo
core/13-typescript-types.md     ← types del schema — copiar a types/database.ts en Módulo 0
core/14-copy-textos.md          ← copy en español argentino — consultar en Módulos 1-3
core/17-manejo-errores.md       ← error.tsx, not-found.tsx, loading.tsx — implementar en Módulos 1 y 3
integraciones/whatsapp.md       ← CTA principal de este plan
integraciones/formulario-contacto.md ← si "página de contacto" fue seleccionada en briefing
plans/esencial/modulos.md       ← módulos específicos de este plan
```

Al terminar todos los módulos:
```
core/11-qa-checklist.md         ← generar reporte QA
core/15-deploy-vercel.md        ← pasos de deploy antes de entregar
```

## Integraciones activas

| Integración | Activa |
|---|---|
| MercadoPago | ❌ |
| Envíos | ❌ |
| Resend | ❌ |
| Umami Analytics | ❌ |
| Cupones | ❌ |
| WhatsApp redirect | ✅ (botón en productos) |

## Lo que incluye este plan

- Home con hero + secciones de conversión + CTA hacia WhatsApp
- Catálogo hasta 50 productos con filtros por categoría
- Página de detalle de producto con galería y botón "Consultar por WhatsApp"
- Páginas opcionales: Sobre nosotros, FAQ, Contacto, etc.
- SEO completo (metadata, Schema.org, sitemap, robots)
- Design system único con AIDesigner MCP
- Responsive mobile-first

## Lo que NO incluye

- Carrito de compras
- Checkout
- Pasarela de pagos
- Tracking de pedidos
- Panel de administración (es un repo separado)
