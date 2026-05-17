# Workflow de Diseño con Stitch

## Qué es Stitch
Stitch es la herramienta de diseño integrada via MCP (pencil tools). Genera diseños visuales
en archivos .pen que luego se implementan pixel-perfect en código.

## Herramientas MCP disponibles

| Tool | Uso |
|---|---|
| `get_editor_state` | Ver estado actual del editor, documentos abiertos |
| `open_document` | Abrir un archivo .pen |
| `get_guidelines` | Obtener guías de diseño del documento |
| `batch_get` | Leer propiedades de múltiples nodos |
| `batch_design` | Crear/modificar diseño en batch |
| `snapshot_layout` | Capturar estructura de layout |
| `get_screenshot` | Screenshot de un nodo o canvas |
| `get_variables` | Obtener variables de diseño (tokens) |
| `set_variables` | Establecer variables de diseño |
| `find_empty_space_on_canvas` | Encontrar espacio libre para nuevos frames |
| `search_all_unique_properties` | Buscar propiedades únicas en el diseño |
| `replace_all_matching_properties` | Reemplazar propiedades en batch |
| `export_nodes` | Exportar nodos como imágenes |

## Flujo completo

### 1. Preparación
- Verificar que `.sitiohoy/design/design-brief-stitch.md` existe
- Leer el brief para entender requisitos de diseño

### 2. Creación del Diseño
```
mcp__pencil__batch_design → Crear frames para cada página:
  - Home (mobile + desktop)
  - Catálogo (mobile + desktop)
  - Producto (mobile + desktop)
  - Checkout (si aplica, mobile + desktop)
  - About/Contact (mobile + desktop)
```

### 3. Variables de Diseño
```
mcp__pencil__set_variables → Establecer tokens:
  - Colors: primary, secondary, accent, background, text
  - Typography: font-family, sizes, weights
  - Spacing: base unit, scale
  - Radius: small, medium, large
```

### 4. Revisión
```
mcp__pencil__get_screenshot → Capturar cada frame
Verificar contra design-brief-stitch.md
```

### 5. Extracción para Código
```
mcp__pencil__get_variables → Tokens → styles/tokens.css
mcp__pencil__snapshot_layout → Estructura → componentes
mcp__pencil__get_screenshot → Referencia visual
```

### 6. Iteración
Si el diseño necesita ajustes:
```
mcp__pencil__replace_all_matching_properties → Cambios globales (ej: color)
mcp__pencil__set_variables → Actualizar tokens
```

## Verificación de conexión con Stitch

**Stitch es OBLIGATORIO. No existe fallback manual.**

Antes de cualquier operación de diseño, verificar que Stitch está conectado:

```
mcp__pencil__get_editor_state → Si responde: Stitch disponible ✅
                              → Si falla/timeout: Stitch NO disponible ❌
```

### Si Stitch NO está disponible:

1. **BLOQUEAR el avance** — No continuar con módulos de UI (1-6)
2. **Comunicar al usuario inmediatamente:**
   ```
   ⚠️ Stitch no está conectado. El diseño es obligatorio antes de implementar UI.
   
   Para conectar Stitch:
   - Verificar que el MCP server "pencil" está configurado y corriendo
   - Reiniciar el MCP server si es necesario
   - Confirmar que Stitch está abierto y disponible
   
   No puedo continuar con la implementación visual hasta que Stitch responda.
   ```
3. **No intentar diseñar manualmente** — El diseño DEBE salir de Stitch
4. **No saltar el paso** — Sin diseño no hay implementación
5. **Reintentar** cuando el usuario confirme que conectó Stitch:
   ```
   mcp__pencil__get_editor_state → Verificar nuevamente
   ```

### Si Stitch falla DURANTE el diseño:

1. Guardar progreso: anotar qué páginas/frames ya se diseñaron
2. Comunicar el error exacto al usuario
3. Pedir reconexión
4. Al reconectar, continuar desde donde se quedó (no empezar de cero)

### Verificación periódica

Antes de cada módulo visual, hacer un health check:
```
mcp__pencil__get_editor_state → Confirmar que sigue conectado
```

Si se perdió conexión entre módulos, bloquear y pedir reconexión.

## Reglas

1. **Nunca implementar UI sin diseño previo en Stitch** (excepto Módulo 0) — SIN EXCEPCIONES
2. **Si Stitch no responde, PARAR y pedir conexión** — no buscar alternativas
3. **Siempre mobile-first** — diseñar mobile antes que desktop
4. **Tokens over hardcoding** — usar variables, no valores directos
5. **Fidelidad** — implementar exactamente lo que se diseñó
6. **Iteración** — si durante implementación se necesita un cambio, actualizar Stitch primero
7. **Health check por módulo** — verificar conexión antes de cada módulo visual
