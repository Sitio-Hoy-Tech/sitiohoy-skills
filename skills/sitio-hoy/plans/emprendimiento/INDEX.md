---
skill: plan-emprendimiento-index
descripcion: Plan Emprendimiento — archivos a importar y orden de ejecución
tipo: plan — cargar después del onboarding técnico cuando plan = emprendimiento
---

# Plan Emprendimiento — Índice

**$37.000/mes** · Hasta 200 productos · MercadoPago · Envíos con zonas fijas · Analytics básico

## Archivos a cargar (en este orden)

```
core/00-rol-identidad.md
core/03-stack-base.md
core/04-design-system.md
core/05-base-datos.md           ← incluye tabla shipping_zones
core/06-supabase-rls.md
core/07-isr-cache.md
core/08-seo.md
core/09-arquitectura-base.md
core/10-modo-silencioso.md
core/12-env-vars.md             ← variables de entorno — leer en Módulo 0
core/16-tracking-proyecto.md   ← crear proyecto-tracking.json en Módulo 0, actualizar en cada módulo
core/13-typescript-types.md     ← types del schema — copiar a types/database.ts en Módulo 0
core/14-copy-textos.md          ← copy en español argentino — consultar en Módulos 1-3
core/17-manejo-errores.md       ← error.tsx, not-found.tsx, loading.tsx — implementar en Módulos 1 y 3
integraciones/whatsapp.md       ← botón flotante + CTA de soporte
integraciones/formulario-contacto.md ← si "página de contacto" fue seleccionada en briefing
integraciones/mercadopago.md    ← cargar antes del Módulo 4
integraciones/envios-fijos.md   ← cargar antes del Módulo 4
plans/emprendimiento/modulos.md
```

Si Resend fue activado en onboarding:
```
integraciones/resend.md         ← cargar junto al Módulo 4
```

Al terminar todos los módulos:
```
core/11-qa-checklist.md
core/15-deploy-vercel.md        ← pasos de deploy antes de entregar
```

## Integraciones activas

| Integración | Activa |
|---|---|
| MercadoPago Bricks | ✅ |
| Envíos por zona fija | ✅ |
| Envia.com | ❌ |
| Resend emails | ✅ (si activado en onboarding) |
| Umami Analytics | ✅ (básico — visitas y tráfico) |
| Cupones de descuento | ✅ |
| WhatsApp redirect | ✅ |

## Lo que incluye este plan

- Todo lo del Plan Esencial
- Carrito de compras persistente (localStorage)
- Checkout multi-step: datos → envío (zonas fijas) → pago (MercadoPago Bricks)
- Webhook MercadoPago para actualizar estado de pedidos
- Página de seguimiento de pedido por tracking_token
- Cupones de descuento en el checkout
- Umami Analytics básico (visitas, páginas más vistas)
- Hasta 200 productos

## Lo que NO incluye

- Envíos automatizados con Correo Argentino (eso es Plan Empresa)
- Panel de administración (es un repo separado)
