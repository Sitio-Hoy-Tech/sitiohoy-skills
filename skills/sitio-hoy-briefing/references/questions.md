# Cuestionario SitioHoy

Enviar todo junto. No hacer preguntas separadas salvo que falte un dato bloqueante.

## 1. Plan y alcance técnico

1. ¿Qué plan vas a contratar?
   - Esencial: catálogo + WhatsApp
   - Emprendimiento: tienda con MercadoPago + envíos fijos
   - Empresa: tienda completa con MercadoPago + Envia.com opcional
2. ¿Tenés MercadoPago activo?
3. Para Empresa: ¿cómo vas a gestionar los envíos?
   - **Correo Argentino directo** (cotización en tiempo real + pre-registro automático, sin costo extra — usa la cuenta SitioHoy): el comerciante imprime las etiquetas desde el portal web de MiCorreo
   - **Envia.com** (cotización en tiempo real + etiquetas PDF automáticas, multicarrier): requiere cuenta Envia.com propia del cliente + token API
   - **Precios fijos por zona** (vos definís el costo por provincia o región): más simple, sin integración externa
   - **Sin envíos** (solo retiro en local o producto digital)
4. ¿Necesitás emails automáticos al comprador?
5. ¿Tenés dominio propio? Si sí, ¿cuál?
6. ¿Con qué IA/editor estás trabajando?
7. ¿Tenés MCP de Supabase configurado?
8. ¿Tenés AIDesigner MCP disponible?

## 2. Negocio

1. Nombre del negocio.
2. Rubro.
3. Descripción en 1-2 oraciones.
4. Diferencial frente a la competencia.
5. Referentes o competidores que admire visualmente.

## 3. Cliente ideal

1. Perfil de cliente: edad, género, intereses, nivel socioeconómico.
2. Problema que resuelve.
3. Sensación deseada al entrar al sitio.
4. Tono de comunicación.

## 4. Identidad visual

1. Colores de marca: principal, secundario, acento.
2. Si no hay colores: sensación deseada.
3. Estilo visual: minimalista, colorido, corporativo, vintage, artesanal, tech, lujo.
4. Logo disponible y formato.
5. Calidad de fotos.
6. Dispositivo principal de compra/consulta.

## 5. Catálogo

1. Cantidad inicial de productos/servicios.
2. Categorías.
3. Variantes.
4. Rango de precios.
5. Tipo: físico, digital o servicio.

## 6. Páginas

Marcar las necesarias:
- Sobre nosotros
- FAQ
- Contacto con formulario
- Términos / privacidad / devoluciones
- Blog / novedades

## 7. Contacto y redes

1. WhatsApp.
2. Email público.
3. Redes sociales.
4. Red principal.

## 8. Assets

Confirmar estructura:

```txt
_assets-cliente/
  logo/
  hero/
  productos/
  marca/
  galeria/
```

Reglas:
- nombres en minúsculas con guiones;
- JPG/WebP para fotos;
- PNG/SVG para logo;
- hero mínimo 1200 px;
- productos mínimo 800 px.

## 9. Animaciones

¿Qué nivel de animación querés para el sitio?
- **Muchas**: hero animado, transiciones entre páginas, elementos que aparecen con movimiento
- **Pocas y sutiles**: fade-in al hacer scroll, hover effects, transiciones suaves (recomendado para la mayoría de los rubros)
- **Sin animaciones**: solo CSS estático

## 10. Logo SitioHoy

Para el crédito "Desarrollado por SitioHoy" en el footer, confirmar la ruta del logo:
- ¿Dónde está el archivo `logo-sitiohoy.png`? (ejemplo: `_assets-cliente/logo-sitio-hoy-con-fondo.png`)
- Si no está disponible, pedirlo antes de construir el footer.
