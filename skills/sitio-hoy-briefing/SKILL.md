---
name: sitio-hoy-briefing
description: >
  Ejecutar onboarding tecnico y briefing de negocio/diseño para SitioHoy,
  detectar plan e integraciones, normalizar respuestas y generar automaticamente
  sitiohoy.config.json y brief.md antes del scaffold. Usar al iniciar un nuevo
  sitio o cuando haya que rehacer el alcance del proyecto.
---

# SitioHoy Briefing

Esta skill separa la etapa comercial/estrategica del desarrollo. Su objetivo es
convertir respuestas del cliente en artefactos concretos:

- `sitiohoy.config.json`
- `brief.md`
- opcional: `.sitiohoy/intake.json` como fuente normalizada

## Cuándo usar

Usar antes de `sitio-hoy-scaffold` cuando:
- el cliente pide crear un sitio nuevo;
- cambia el plan;
- cambia el alcance de pagos, envíos, emails, dominio o assets;
- hace falta regenerar el brief para diseño/SEO/copy.

## Workflow

1. Enviar el cuestionario de `references/questions.md`.
2. Esperar respuestas del cliente.
3. Normalizar internamente las respuestas al contrato `references/intake-schema.md`.
4. Guardar el JSON normalizado en `.sitiohoy/intake.json`.
5. Ejecutar:
   ```bash
   node scripts/generate-briefing-artifacts.mjs .sitiohoy/intake.json
   ```
6. Revisar que los artefactos generados sean coherentes.
7. Continuar con `sitio-hoy-scaffold`.

## Reglas de normalización

- Plan permitido: `esencial`, `emprendimiento`, `empresa`.
- `mercadopago` es `true` para Emprendimiento y Empresa.
- `fixedShipping` es `true` para Emprendimiento, y también para Empresa si eligió "precios fijos por zona".
- `envia` es `true` solo para Empresa si el cliente eligió explícitamente "Envia.com" — no activarlo por defecto.
- Si el cliente eligió "solo retiro" o "sin envíos", ambos quedan en `false` y el checkout no muestra paso de envío.
- **Nunca asumir Envia.com en Plan Empresa** — preguntar siempre. Genera integración con API externa que requiere cuenta y token.
- `resend` depende de onboarding.
- `umami` es `true` para Emprendimiento y Empresa.
- `whatsapp` siempre es `true`.
- Si falta dominio, usar `domain.status = "pending_purchase"`.
- Si falta logo o hero, marcarlo en `assets.missing`.

## Criterio de salida

No pasar a scaffold hasta tener:
- [ ] `sitiohoy.config.json`
- [ ] `brief.md`
- [ ] plan detectado
- [ ] integraciones calculadas
- [ ] assets faltantes listados
- [ ] páginas opcionales listadas
- [ ] tono y dirección visual resumidos

## Handoff

Después de esta skill:
1. `sitio-hoy-project-director` genera context packs y dirección visual;
2. `sitio-hoy` importa el INDEX del plan detectado;
3. `sitio-hoy-scaffold` crea la base;
4. `sitio-hoy-database` genera schema/RLS;
5. los módulos usan `brief.md` y `.sitiohoy/context/module-N.md` como fuente mínima.
