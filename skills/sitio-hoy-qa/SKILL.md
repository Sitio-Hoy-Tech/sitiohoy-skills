---
name: sitio-hoy-qa
description: >
  Ejecutar y automatizar QA de sitios SitioHoy: validacion estatica de reglas
  tecnicas, build, e2e, accesibilidad, Lighthouse y reporte QA. Usar antes de
  cerrar cada modulo y siempre antes de deploy.
---

# SitioHoy QA

Esta skill convierte los checklists de SitioHoy en gates automaticos. Usarla:
- al finalizar cada modulo;
- antes de mostrar avances al cliente;
- antes de deploy;
- cuando haya dudas sobre regresiones tecnicas o visuales.

## Instalacion en un proyecto

Copiar `scripts/` a la raiz del proyecto y agregar al `package.json`:

```json
{
  "scripts": {
    "sitiohoy:validate": "node scripts/validate-sitiohoy.mjs",
    "sitiohoy:qa": "node scripts/run-qa.mjs",
    "sitiohoy:qa-report": "node scripts/generate-qa-report.mjs"
  }
}
```

Si Playwright o Lighthouse ya existen, `run-qa.mjs` los ejecuta via scripts del proyecto:
- `test:e2e`
- `lighthouse`

## Gates minimos

1. `npm run build`
2. `npm run sitiohoy:validate`
3. `npm run test:e2e` si existe
4. `npm run lighthouse` si existe
5. `npm run sitiohoy:qa-report`

## Que valida automaticamente

- no usar `<img>` nativo;
- no usar `revalidatePath('/')`;
- no exponer service role key como publica;
- no usar `createServiceClient` en componentes client;
- `styles/tokens.css` presente;
- `app/layout.tsx` con `next/font`;
- `app/error.tsx` y `app/not-found.tsx` presentes;
- `.env.example` presente;
- reporte JSON en `.sitiohoy/qa/static-report.json`.

## Paralelización

Estas validaciones no dependen entre sí y pueden ejecutarse simultáneamente:

**Grupo A — validaciones estáticas** (análisis de código, sin servidor):
- Verificar uso de `<img>` nativo vs `next/image`
- Verificar `revalidatePath('/')` global
- Verificar que `SUPABASE_SERVICE_ROLE_KEY` no tenga prefijo `NEXT_PUBLIC_`
- Verificar `createServiceClient` no usado en componentes client
- Verificar presencia de `styles/tokens.css`, `app/error.tsx`, `app/not-found.tsx`, `.env.example`

**Grupo B — validaciones de build** (requiere que el proyecto compile):
- `npm run build`

**Grupo C — validaciones de runtime** (requieren que el build esté listo):
- `npm run test:e2e`
- `npm run lighthouse`

**Grupo D — reporte** (requiere que A, B y C estén completos):
- `npm run sitiohoy:qa-report`

Orden recomendado: lanzar Grupo A en paralelo con Grupo B.
Cuando B termine, lanzar Grupo C.
Cuando A y C terminen, generar el reporte D.

Si hay múltiples páginas para validar (home, catálogo, detalle, checkout),
cada página puede auditarse con Lighthouse en paralelo.

## Como marcar un modulo como terminado

Un modulo solo esta listo si:
- los errores automaticos son 0;
- los warnings tienen decision explicita;
- el reporte QA queda generado;
- los puntos manuales criticos estan listados.

Formato sugerido:

```txt
Modulo N OK
Build: OK
SitioHoy QA: OK
Warnings: 0
Reporte: QA-[negocio]-[fecha].md
```
