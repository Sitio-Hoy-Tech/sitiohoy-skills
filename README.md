# sitiohoy-skills

Installer de contexto y skills de SitioHoy para cualquier AI CLI.

Compatible con: Claude Code, Gemini CLI, OpenAI Codex, Cursor, Windsurf, y más.

## Instalación

```bash
git clone git@github.com:TU_ORG/sitiohoy-skills.git
cd sitiohoy-skills
bash install.sh
```

El script:
1. Copia las skills/docs a `~/.sitiohoy/`
2. Pide las credenciales de Supabase (solo la primera vez)
3. Genera `~/.sitiohoy/context.md` — un markdown unificado con todo el contexto
4. Detecta qué IAs tenés instaladas y configura cada una automáticamente

Para IAs no soportadas: usá `~/.sitiohoy/context.md` como system prompt.

## Actualizar skills

Cuando modifiques las skills localmente:

```bash
bash update.sh
git add skills/ && git commit -m "feat: actualizar skills" && git push
```

En otra máquina:

```bash
git pull && bash install.sh
```

## Agregar logo

```bash
cp /ruta/al/logo.png assets/logo.png
git add assets/logo.png && git commit -m "assets: logo SitioHoy"
```

## Estructura

```
sitiohoy-skills/
├── install.sh                  ← installer universal
├── update.sh                   ← sincronizar skills locales → repo
├── credentials.env.example     ← template de credenciales
├── assets/
│   └── logo.png
└── skills/
    ├── sitio-hoy/
    ├── sitio-hoy-briefing/
    ├── sitio-hoy-database/
    ├── sitio-hoy-launch-automation/
    ├── sitio-hoy-project-director/
    ├── sitio-hoy-qa/
    ├── sitio-hoy-scaffold/
    ├── seo/
    └── ...
```
