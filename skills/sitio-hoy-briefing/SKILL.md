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

### Opción A — Formulario web (recomendado)

```bash
npm run sitiohoy:briefing
# Abre http://localhost:3456 en el navegador
# El cliente completa el formulario, sube assets y envía
# Se generan automáticamente: .sitiohoy/intake.json + sitiohoy.config.json + _assets-cliente/
```

El formulario web (`assets/briefing-form.html`) está pre-construido. No requiere generación por IA.

### Opción B — Conversacional (fallback si no hay npm/Node)

1. Enviar el cuestionario de `references/questions.md`.
2. Esperar respuestas del cliente. **No continuar hasta recibirlas.**
3. Normalizar internamente las respuestas al contrato `references/intake-schema.md`.
4. Crear carpeta `.sitiohoy/` en la raíz si no existe.
5. Guardar el JSON normalizado en `.sitiohoy/intake.json`.
6. Generar `sitiohoy.config.json` desde el intake (ver estructura en `references/intake-schema.md`).
7. Generar `brief.md` con: negocio, audiencia, tono, identidad visual, catálogo, páginas, contacto, redes, assets faltantes.
8. Validar la config:
   ```bash
   node scripts/validate-config.mjs    # si el script existe en el proyecto
   ```
   Si el script no existe aún, validar manualmente que `sitiohoy.config.json` cumpla los campos requeridos.
9. Continuar con `sitio-hoy-scaffold`.

## Fallback sin skill system (cualquier IA)

Si tu entorno no soporta delegación a skills:
1. Leer `references/questions.md` y enviar las preguntas al cliente
2. Con las respuestas, construir `intake.json` siguiendo `references/intake-schema.md`
3. Crear `sitiohoy.config.json` y `brief.md` manualmente
4. No se requiere ejecutar ningún script — los artefactos son archivos JSON y Markdown

## Reglas de normalización

- Plan permitido: `esencial`, `emprendimiento`, `empresa`.
- `mercadopago` es `true` para Emprendimiento y Empresa.
- `fixedShipping` es `true` para Emprendimiento, y también para Empresa si eligió "precios fijos por zona".
- `correoArgentino` es `true` solo para Empresa si eligió "Correo Argentino directo" — cuenta compartida SitioHoy, sin costo extra.
- `envia` es `true` solo para Empresa si eligió "Envia.com" — requiere cuenta propia del cliente + token API.
- `correoArgentino` y `envia` son mutuamente exclusivos — nunca ambos `true`.
- Si eligió "precios fijos por zona", `fixedShipping = true` y ambos quedan en `false`.
- Si el cliente eligió "solo retiro" o "sin envíos", todos quedan en `false` y el checkout no muestra paso de envío.
- **Nunca asumir proveedor de envíos en Plan Empresa** — preguntar siempre.
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
