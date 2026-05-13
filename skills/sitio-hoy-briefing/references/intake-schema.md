# Intake Schema

La IA debe convertir respuestas del cliente a este JSON y guardarlo en
`.sitiohoy/intake.json`.

```json
{
  "business": {
    "name": "Nombre del negocio",
    "slug": "nombre-del-negocio",
    "industry": "indumentaria",
    "description": "",
    "differentiator": "",
    "visualReferences": []
  },
  "plan": "esencial",
  "technical": {
    "mercadoPagoActive": false,
    "correoArgentinoRequested": false,
    "enviaRequested": false,
    "resendRequested": false,
    "domain": {
      "status": "owned",
      "value": "https://www.ejemplo.com"
    },
    "editor": "claude-code",
    "supabaseMcp": false,
    "aiDesignerMcp": false
  },
  "audience": {
    "profile": "",
    "problem": "",
    "desiredFeeling": "",
    "tone": "",
    "primaryDevice": "mobile"
  },
  "visualIdentity": {
    "colors": {
      "primary": "",
      "secondary": "",
      "accent": ""
    },
    "desiredMood": "",
    "style": "",
    "logo": {
      "available": false,
      "format": ""
    },
    "photoQuality": "professional"
  },
  "catalog": {
    "initialCount": 0,
    "categories": [],
    "hasVariants": false,
    "priceRange": "",
    "type": "physical"
  },
  "pages": {
    "about": false,
    "faq": false,
    "contact": false,
    "legal": false,
    "blog": false
  },
  "contact": {
    "whatsapp": "",
    "email": "",
    "socials": [],
    "primarySocial": ""
  },
  "assets": {
    "folderReady": false,
    "missing": []
  },
  "notes": []
}
```

## Valores permitidos

- `plan`: `esencial`, `emprendimiento`, `empresa`
- `domain.status`: `owned`, `pending_purchase`, `temporary`
- `editor`: `claude-code`, `cursor`, `windsurf`, `copilot`, `opencode`, `gemini`, `codex`, `other`
- `primaryDevice`: `mobile`, `desktop`, `mixed`
- `photoQuality`: `professional`, `phone`, `supplier`, `none`
- `catalog.type`: `physical`, `digital`, `service`, `mixed`
- `correoArgentinoRequested` y `enviaRequested` son mutuamente exclusivos — no pueden ser ambos `true`
