---
skill: plan-empresa-index
descripcion: Plan Empresa — archivos a importar y orden de ejecución
tipo: plan — cargar después del onboarding técnico cuando plan = empresa
---

# Plan Empresa — Índice

**$65.000/mes** · Productos ilimitados · MercadoPago · Envia.com · Analítica avanzada

## Archivos a cargar (en este orden)

```
core/00-rol-identidad.md
core/03-stack-base.md
core/04-design-system.md
core/05-base-datos.md
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
plans/empresa/modulos.md
```

Si Envia.com fue activado en onboarding:
```
integraciones/envia.md          ← cargar junto al Módulo 4
```

Si Resend fue activado en onboarding:
```
integraciones/resend.md         ← cargar junto al Módulo 4
```

```
integraciones/umami-avanzado.md ← cargar en Módulo 6
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
| Envia.com (Correo Argentino) | ✅ (si activado en onboarding) |
| Envíos zona fija | ❌ |
| Resend emails | ✅ (si activado) |
| Umami Analytics avanzado | ✅ (conversiones, e-commerce) |
| Cupones de descuento | ✅ |
| WhatsApp redirect | ✅ |

## Lo que incluye este plan

- Todo lo del Plan Emprendimiento
- Productos ilimitados
- Envíos automatizados con Envia.com (cotización en tiempo real + generación de guías)
- Umami con tracking de conversiones y eventos de e-commerce
- Schema.org avanzado con Review y FAQPage
- SEO para AI Overviews completo

## Lo que NO incluye

- Panel de administración (es un repo separado)
