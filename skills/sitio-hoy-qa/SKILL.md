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
