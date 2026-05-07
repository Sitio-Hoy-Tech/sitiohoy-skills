# sitiohoy-skills

Installer de contexto y skills de SitioHoy para cualquier AI CLI.
Compatible con: Claude Code, Gemini CLI, OpenAI Codex, DeepSeek, Cursor, Windsurf.

## Instalación

```bash
curl -fsSL https://raw.githubusercontent.com/Sitio-Hoy-Tech/sitiohoy-skills/main/bootstrap.sh -o /tmp/sitiohoy.sh && bash /tmp/sitiohoy.sh
```

Descarga todo, mostrá el menú interactivo, instalá y no deja el repo en tu computadora.

## Actualizar skills

Cuando modifiques las skills localmente, sincronizá al repo:

```bash
cd ~/Desktop/sitiohoy-skills
bash update.sh
git add skills/ && git commit -m "feat: actualizar skills" && git push
```

## Estructura

```
sitiohoy-skills/
├── bootstrap.sh                ← punto de entrada (curl)
├── install.sh                  ← installer con menú interactivo
├── update.sh                   ← sincronizar skills locales → repo
├── credentials.env.example     ← template de credenciales
├── assets/
│   └── logo-sitiohoy.png
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
