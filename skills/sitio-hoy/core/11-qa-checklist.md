---
skill: qa-checklist
descripcion: Generador de reporte QA al finalizar el proyecto — checklist para validación manual antes del deploy
tipo: core — ejecutar al terminar el último módulo, ANTES del deploy
---

# QA Checklist — Generador de Reporte

Al terminar todos los módulos del plan, usar primero `sitio-hoy-qa`:

```bash
npm run sitiohoy:qa
npm run sitiohoy:qa-report
```

Eso genera un reporte base con hallazgos automáticos. Luego completar o ampliar el
archivo `QA-[nombre-negocio]-[fecha].md` con la matriz manual de este documento.

## Instrucción de generación

Crear o completar el archivo con esta estructura. Completar la columna "IA ✅" con:
- `✅` si `sitio-hoy-qa` o revisión estática lo verificó;
- `⚠️` si requiere credenciales, navegador real o tercero externo;
- vacío si es 100% manual.

La columna "Manual ✅" queda vacía para que el humano la complete.

## Template del archivo QA

```markdown
# QA — [Nombre del Negocio]
**Plan**: [Esencial | Emprendimiento | Empresa]
**Fecha de generación**: [YYYY-MM-DD]
**Generado por**: SitioHoy skill v2.0

> Marcar ✅ en la columna "Manual" después de verificar cada ítem en el navegador.
> No deployar hasta que todos los ítems críticos (🔴) estén ✅ en ambas columnas.

---

## 1. DISEÑO Y RESPONSIVE

| Ítem | IA ✅ | Manual ✅ | Prioridad |
|---|---|---|---|
| El sitio se ve correctamente en 375px (iPhone SE) | [auto] | | 🔴 |
| El sitio se ve correctamente en 390px (iPhone 14) | [auto] | | 🔴 |
| El sitio se ve correctamente en 768px (tablet) | [auto] | | 🔴 |
| El sitio se ve correctamente en 1280px (desktop) | [auto] | | 🔴 |
| El hero es visualmente único y no genérico | [auto] | | 🔴 |
| El layout del catálogo está diferenciado | [auto] | | 🟡 |
| Dark mode funciona correctamente | [auto] | | 🟡 |
| No hay patrones de AI slop detectados | [auto] | | 🔴 |
| Todas las fuentes cargan con next/font | [auto] | | 🔴 |
| Touch targets ≥ 44px en mobile | [auto] | | 🔴 |
| Animaciones respetan prefers-reduced-motion | [auto] | | 🟡 |
| Score diseño ≥ 7/10 en las 10 dimensiones | [auto] | | 🔴 |

---

## 2. FUNCIONALIDAD — CATÁLOGO

| Ítem | IA ✅ | Manual ✅ | Prioridad |
|---|---|---|---|
| Home carga correctamente | [auto] | | 🔴 |
| Catálogo muestra todos los productos activos | [auto] | | 🔴 |
| Filtros por categoría funcionan | [auto] | | 🔴 |
| Página de detalle de producto carga | [auto] | | 🔴 |
| Galería de imágenes funciona | [auto] | | 🔴 |
| Variantes de producto actualizan precio/stock | [auto] | | 🔴 |
| Botón "Consultar por WhatsApp" redirige correctamente | [auto] | | 🔴 |
| Breadcrumbs funcionan | [auto] | | 🟡 |
| Página 404 personalizada funciona | [auto] | | 🟡 |

---

## 3. FUNCIONALIDAD — CHECKOUT (Solo Emprendimiento y Empresa)

| Ítem | IA ✅ | Manual ✅ | Prioridad |
|---|---|---|---|
| Carrito persiste al recargar la página | [auto] | | 🔴 |
| Agregar producto al carrito funciona | [auto] | | 🔴 |
| Eliminar producto del carrito funciona | [auto] | | 🔴 |
| Paso 1 checkout — datos del comprador válida | [auto] | | 🔴 |
| Paso 2 checkout — selección de envío funciona | [auto] | | 🔴 |
| Paso 3 checkout — Payment Brick se renderiza | [auto] | | 🔴 |
| Pago con tarjeta de prueba es aprobado | | ← probar manualmente | 🔴 |
| Redirección a /checkout/success funciona | [auto] | | 🔴 |
| Redirección a /checkout/error funciona | [auto] | | 🔴 |
| Cupón de descuento se aplica correctamente | | ← probar manualmente | 🟡 |
| Página de seguimiento muestra el pedido | | ← probar manualmente | 🟡 |

---

## 4. EMAILS (Solo si Resend está activado)

| Ítem | IA ✅ | Manual ✅ | Prioridad |
|---|---|---|---|
| Email de confirmación llega al comprador | [auto] | ← verificar inbox | 🔴 |
| Email NO cae en spam | | ← verificar inbox | 🔴 |
| El email tiene el nombre y número de pedido correcto | | ← verificar contenido | 🔴 |
| Link "seguir mi pedido" en el email funciona | | ← hacer click en el email | 🟡 |

---

## 5. SEO Y PERFORMANCE

> ⚠️ **Lighthouse siempre sobre build de producción.**
> `npm run build && npm start` — nunca sobre `npm run dev`.
> Dev mode sirve JS sin minificar con HMR activo: los números son falsos y generan trabajo innecesario.
> "Reduce unused JavaScript" de 200+ KiB en páginas con checkout es un falso positivo inevitable — ignorar.

| Ítem | IA ✅ | Manual ✅ | Prioridad |
|---|---|---|---|
| Score Lighthouse ≥ 90 en Home | [auto] | ← correr sobre `npm start` | 🔴 |
| Score Lighthouse ≥ 90 en página de producto | [auto] | ← correr sobre `npm start` | 🔴 |
| LCP < 2.5s | [auto] | | 🔴 |
| CLS < 0.1 | [auto] | | 🔴 |
| /sitemap.xml accesible y sin errores | [auto] | ← abrir en browser | 🔴 |
| /robots.txt correcto | [auto] | ← abrir en browser | 🔴 |
| Schema.org sin errores (Google Rich Results) | [auto] | ← probar en rich-results.google.com | 🟡 |
| Todas las imágenes tienen alt descriptivo | [auto] | | 🔴 |
| URLs canónicas en todas las páginas | [auto] | | 🟡 |
| OG tags correctos (al compartir en redes) | [auto] | ← probar en opengraph.xyz | 🟡 |

---

## 6. SEGURIDAD Y TÉCNICO

| Ítem | IA ✅ | Manual ✅ | Prioridad |
|---|---|---|---|
| TypeScript sin errores (`npm run build`) | [auto] | | 🔴 |
| RLS habilitado en todas las tablas de Supabase | [auto] | | 🔴 |
| SUPABASE_SERVICE_ROLE_KEY no está en NEXT_PUBLIC_ | [auto] | | 🔴 |
| Headers de seguridad configurados | [auto] | | 🟡 |
| Variables de entorno completas en Vercel | | ← verificar en dashboard | 🔴 |

---

## 7. DEPLOY FINAL

| Ítem | IA ✅ | Manual ✅ | Prioridad |
|---|---|---|---|
| `npm run build` sin errores | [auto] | | 🔴 |
| Deploy en Vercel exitoso | | ← verificar logs | 🔴 |
| Dominio con SSL configurado | | ← verificar candado en browser | 🔴 |
| Credenciales MP en PRODUCCIÓN (no TEST) | | ← verificar en MP dashboard | 🔴 |
| Webhook MP apuntando a URL de producción | | ← verificar en MP dashboard | 🔴 |
| Compra de prueba REAL aprobada | | ← hacer compra real | 🔴 |
| Cliente tiene acceso al Vercel Dashboard | | ← enviar invitación | 🔴 |

---

## Issues detectados durante el desarrollo

> La IA completa esta sección con cualquier problema encontrado y su solución aplicada.

| # | Issue | Módulo | Solución aplicada |
|---|---|---|---|
| 1 | [descripción] | [módulo] | [solución] |

---

## Resumen

- 🔴 Críticos completados por IA: X / Y
- 🔴 Críticos pendientes de validación manual: Y
- 🟡 Opcionales completados: X / Y

**Estado**: Listo para validación manual → deploy
```

---

## Cómo completar la columna "IA ✅"

Al generar el reporte, la IA debe:

1. Leer `.sitiohoy/qa/static-report.json` si existe.
2. Revisar el código generado y marcar `✅` en los ítems que puede verificar estáticamente.
3. Marcar `⚠️` en ítems que no pudo verificar (credenciales de terceros, pruebas de pago, inbox, dashboards).
4. Dejar en blanco los ítems que requieren interacción manual del humano.
5. Completar la sección "Issues detectados" con problemas reales encontrados.
6. No marcar como `✅` pagos, webhooks, emails o dominio si no fueron probados realmente.

## Gates automáticos mínimos

| Gate | Comando | Bloquea entrega |
|---|---|---|
| Build TypeScript | `npm run build` | Sí |
| Reglas SitioHoy | `npm run sitiohoy:validate` | Sí |
| QA completo | `npm run sitiohoy:qa` | Sí antes de deploy |
| Reporte | `npm run sitiohoy:qa-report` | Sí antes de deploy |
| E2E | `npm run test:e2e` si existe | Sí si checkout está activo |
| Lighthouse | `npm run lighthouse` si existe | Sí antes de deploy |

## Leyenda de prioridades

- 🔴 **Crítico** — No deployar sin este ítem resuelto
- 🟡 **Importante** — Resolver antes de mostrar al cliente, pero no bloquea el deploy
