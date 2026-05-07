---
name: sitio-hoy-project-director
description: >
  Generar context packs minimos y direccion visual para proyectos SitioHoy a
  partir de sitiohoy.config.json y brief.md. Usar despues de sitio-hoy-briefing
  y antes de scaffold/modulos para ahorrar tokens, mejorar consistencia de diseño
  y hacer el flujo portable a cualquier IA.
---

# SitioHoy Project Director

Esta skill reduce tokens y mejora diseño creando paquetes de contexto pequeños
por etapa. En vez de cargar todo `core/`, `plans/` e `integraciones/`, cada IA
carga solo el pack del módulo que está por ejecutar.

## Entradas

En la raíz del proyecto:
- `sitiohoy.config.json`
- `brief.md`

## Salidas

```txt
.sitiohoy/context/
  project-context.md
  module-0.md
  module-1.md
  ...
  checkout-context.md        # si el plan tiene checkout
  deploy-context.md
  context-index.md

.sitiohoy/design/
  design-direction.md
  design-tokens.seed.json
  layout-recipe.md
  anti-slop-checklist.md
```

## Workflow

1. Confirmar que existen `sitiohoy.config.json` y `brief.md`.
2. Ejecutar:
   ```bash
   node scripts/generate-project-context.mjs
   ```
3. Para cada módulo, cargar solo:
   - `brief.md`
   - `sitiohoy.config.json`
   - `.sitiohoy/context/module-N.md`
   - `.sitiohoy/design/design-direction.md`
   - `.sitiohoy/design/layout-recipe.md` si se escribe UI
4. Si el módulo es checkout, cargar también `.sitiohoy/context/checkout-context.md`.
5. Si es deploy, cargar `.sitiohoy/context/deploy-context.md`.

## Reglas

- No duplicar documentación extensa de skills core.
- Los packs deben ser resúmenes operativos, no manuales largos.
- Cada pack debe decir qué archivos leer si hace falta más detalle.
- Cada pack debe incluir sus gates QA.
- La dirección visual es contrato de diseño: no improvisar UI fuera de ella sin actualizarla.

## Portabilidad

Funciona en cualquier IA porque usa Markdown, JSON y Node estándar sin dependencias.
Si una IA no soporta skills, se copia al contexto solo el pack correspondiente.
