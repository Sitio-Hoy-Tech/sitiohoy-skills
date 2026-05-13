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

### Formulario web (SIEMPRE usar esto — no hacer preguntas por consola)

El servidor no tiene dependencias npm. Correrlo con `node` directamente:

```bash
# Localizar el script (usar la ruta donde están instaladas las skills)
node ~/.claude/skills/sitio-hoy-briefing/scripts/briefing-server.mjs
# Si está en .claude/skills/:
node .claude/skills/sitio-hoy-briefing/scripts/briefing-server.mjs
# Si está en .agents/skills/:
node .agents/skills/sitio-hoy-briefing/scripts/briefing-server.mjs
# Si está en .opencode/skills/:
node .opencode/skills/sitio-hoy-briefing/scripts/briefing-server.mjs
```

**Pasos:**
1. Encontrar la ruta correcta del script buscando `briefing-server.mjs` en las carpetas de skills del proyecto.
2. Correr `node <ruta>/briefing-server.mjs` desde la raíz del proyecto.
3. Abrir `http://localhost:3456` en el navegador (el servidor lo hace automáticamente).
4. Esperar a que el cliente complete y envíe el formulario.
5. El servidor genera automáticamente: `.sitiohoy/intake.json` + `sitiohoy.config.json` + `_assets-cliente/`
6. Una vez generados los archivos, continuar con el workflow.

**No hacer preguntas por consola.** Si `node` no está disponible, informar al cliente y pedir que instale Node.js.

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
