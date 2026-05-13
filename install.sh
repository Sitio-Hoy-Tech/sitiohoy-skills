#!/usr/bin/env bash
# SitioHoy AI Context Installer
# Instala el contexto del sistema en la carpeta donde estás parado.
#
# Uso:
#   ./install.sh                    # versión más reciente (main)
#   ./install.sh --version v1.2.0   # versión específica
#   ./install.sh --rollback         # menú para elegir versión anterior
#   ./install.sh --list-versions    # listar versiones disponibles
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(pwd)"
CREDS_FILE="$HOME/.sitiohoy/credentials.env"
GITHUB_REPO="Sitio-Hoy-Tech/sitiohoy-skills"
INSTALL_VERSION=""
TEMP_CLONE=""

# ── Parsear flags ─────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --version=*) INSTALL_VERSION="${arg#*=}" ;;
    --version)   shift; INSTALL_VERSION="$1" ;;
    --rollback)  INSTALL_VERSION="__pick__" ;;
    --list-versions)
      echo ""
      echo "  Versiones disponibles en GitHub:"
      curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/tags" 2>/dev/null \
        | grep '"name"' | sed 's/.*"name": "\(.*\)".*/    \1/' \
        || echo "  (no se pudo conectar a GitHub)"
      echo ""
      exit 0
      ;;
  esac
  shift 2>/dev/null || true
done

# ── Colores ───────────────────────────────────────────────────────────────────
CY=$'\033[38;2;34;163;91m'
GY=$'\033[38;2;120;120;120m'
BD=$'\033[1m'
RS=$'\033[0m'
HL=$'\033[48;2;34;163;91m\033[38;2;255;255;255m'
NM=$'\033[38;2;180;180;180m'
YELLOW=$'\033[1;33m'

info()    { printf "  %s→%s %s\n" "$CY" "$RS" "$1"; }
success() { printf "  %s✓%s %s\n" "$CY" "$RS" "$1"; }
warn()    { printf "  %s⚠%s  %s\n" "$YELLOW" "$RS" "$1"; }

# ── Logo ──────────────────────────────────────────────────────────────────────
print_logo() {
  local g=$'\033[48;2;34;163;91m'
  local w=$'\033[38;2;255;255;255m'
  local t=$'\033[38;2;34;163;91m'
  local r=$'\033[0m'
  printf "\n"
  printf "  %s%s                   %s\n" "$g" "$w" "$r"
  printf "  %s%s   ██████████       %s\n" "$g" "$w" "$r"
  printf "  %s%s   ██      ██       %s\n" "$g" "$w" "$r"
  printf "  %s%s   ██               %s\n" "$g" "$w" "$r"
  printf "  %s%s   ████████         %s\n" "$g" "$w" "$r"
  printf "  %s%s          ██        %s\n" "$g" "$w" "$r"
  printf "  %s%s   ██      ██       %s\n" "$g" "$w" "$r"
  printf "  %s%s   ██████████       %s\n" "$g" "$w" "$r"
  printf "  %s%s                   %s\n" "$g" "$w" "$r"
  printf "\n  %s%sSitioHoy%s  AI Context Installer\n\n" "$t" "$BD" "$r"
}

print_logo
printf "  %s📁 Destino:%s %s%s%s\n\n" "$GY" "$RS" "$BD" "$TARGET_DIR" "$RS"

# ── read_key — compatible Linux / macOS / WSL ─────────────────────────────────
# Lee una tecla y devuelve: UP / DOWN / ENTER / ESC
# FIX Linux: leer la secuencia de escape en un solo read de 2 bytes
# en lugar de dos reads separados con timeout, que en algunos sistemas
# Linux corta la ejecución al presionar flechas.
read_key() {
  local ch seq
  IFS= read -rsn1 ch
  if [[ "$ch" == $'\x1b' ]]; then
    # Leer los 2 bytes siguientes de la secuencia ANSI en un solo read
    # -t 0.15 evita bloqueo si fue un ESC solo (sin secuencia)
    IFS= read -rsn2 -t 0.15 seq 2>/dev/null || seq=""
    case "$seq" in
      '[A') printf 'UP'    ;;
      '[B') printf 'DOWN'  ;;
      *)    printf 'ESC'   ;;
    esac
  elif [[ "$ch" == "" ]]; then
    printf 'ENTER'
  fi
}

# ── Menú genérico ─────────────────────────────────────────────────────────────
# Uso: run_menu "Título" item1 item2 ...
# Devuelve el índice en MENU_RESULT
MENU_RESULT=0
run_menu() {
  local title="$1"; shift
  local options=("$@")
  local total=${#options[@]}
  local cur=0

  draw() {
    printf "  %s╭─────────────────────────────────────╮%s\n" "$CY" "$RS"
    printf "  %s│%s  %-37s%s│%s\n" "$CY" "$RS" "$title" "$CY" "$RS"
    printf "  %s├─────────────────────────────────────┤%s\n" "$CY" "$RS"
    for i in "${!options[@]}"; do
      if [ "$i" -eq "$cur" ]; then
        printf "  %s│%s  %s❯ %-34s%s%s│%s\n" "$CY" "$RS" "$HL" "${options[$i]}" "$RS" "$CY" "$RS"
      else
        printf "  %s│%s  %s● %-34s%s%s│%s\n" "$CY" "$RS" "$NM" "${options[$i]}" "$RS" "$CY" "$RS"
      fi
    done
    printf "  %s╰─────────────────────────────────────╯%s\n" "$CY" "$RS"
    printf "  %s↑↓ mover · Enter confirmar%s\n\n" "$GY" "$RS"
  }

  local lines=$((total + 6))
  printf '\033[?25l'
  draw
  while true; do
    local k; k=$(read_key)
    case "$k" in
      UP)    [ "$cur" -gt 0 ] && ((cur--));           printf '\033[%dA\033[J' "$lines"; draw ;;
      DOWN)  [ "$cur" -lt $((total - 1)) ] && ((cur++)); printf '\033[%dA\033[J' "$lines"; draw ;;
      ENTER) break ;;
    esac
  done
  printf '\033[?25h'

  MENU_RESULT=$cur
  printf "  %s✓%s %s%s%s\n\n" "$CY" "$RS" "$BD" "${options[$cur]}" "$RS"
}

# ── Versión ───────────────────────────────────────────────────────────────────
cleanup_temp() { [ -n "$TEMP_CLONE" ] && rm -rf "$TEMP_CLONE"; }
trap 'printf "\033[?25h"; cleanup_temp' EXIT

if [ "$INSTALL_VERSION" = "__pick__" ]; then
  TAGS_JSON=$(curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/tags" 2>/dev/null || echo "[]")
  TAGS=()
  while IFS= read -r line; do
    [[ "$line" =~ \"name\":\ *\"([^\"]+)\" ]] && TAGS+=("${BASH_REMATCH[1]}")
  done <<< "$TAGS_JSON"

  if [ ${#TAGS[@]} -eq 0 ]; then
    warn "No se encontraron versiones publicadas. Usando main."
    INSTALL_VERSION=""
  else
    run_menu "¿Qué versión instalamos?" "${TAGS[@]}" "main (última)"
    chosen="${TAGS[$MENU_RESULT]:-main}"
    [[ "$chosen" == main* ]] && INSTALL_VERSION="" || INSTALL_VERSION="$chosen"
  fi
fi

if [ -n "$INSTALL_VERSION" ]; then
  TEMP_CLONE="$(mktemp -d)"
  info "Descargando versión ${INSTALL_VERSION}..."
  URL="https://github.com/${GITHUB_REPO}/archive/refs/tags/${INSTALL_VERSION}.tar.gz"
  if curl -fsSL "$URL" | tar -xz -C "$TEMP_CLONE" --strip-components=1 2>/dev/null; then
    REPO_DIR="$TEMP_CLONE"
    success "Versión ${INSTALL_VERSION} lista."
  else
    warn "No se pudo clonar la versión ${INSTALL_VERSION}. Usando instalación local."
    rm -rf "$TEMP_CLONE"; TEMP_CLONE=""
  fi
fi

# ── Elegir IA — solo las soportadas actualmente ───────────────────────────────
AI_OPTIONS=(
  "Claude Code   (.claude/skills/ + CLAUDE.md)"
  "OpenAI Codex  (AGENTS.md + .agents/skills/)"
  "OpenCode      (AGENTS.md + .opencode/skills/)"
  "Todas"
)

run_menu "¿Para qué IA instalamos?" "${AI_OPTIONS[@]}"
ai_choice=$MENU_RESULT   # 0=Claude 1=Codex 2=OpenCode 3=Todas

# ── Credenciales Supabase ─────────────────────────────────────────────────────
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

if [ -f "$CREDS_FILE" ]; then
  # shellcheck source=/dev/null
  source "$CREDS_FILE"
  printf "  %sCreds guardadas encontradas:%s\n" "$GY" "$RS"
  printf "  URL: %s\n" "$SUPABASE_URL"
  printf "  Anon Key: %s...\n\n" "${SUPABASE_ANON_KEY:0:20}"
  printf "  ¿Usar estas credenciales? [S/n]: "
  read -r use_saved; use_saved="${use_saved:-S}"
fi

if [ ! -f "$CREDS_FILE" ] || [[ "$use_saved" =~ ^[nN]$ ]]; then
  printf "\n"
  printf "  SUPABASE_URL: "; read -r SUPABASE_URL
  printf "  ANON_KEY: ";     read -r SUPABASE_ANON_KEY
  printf "  SERVICE_ROLE_KEY (oculto): "; read -rs SUPABASE_SERVICE_ROLE_KEY; printf "\n\n"

  mkdir -p "$HOME/.sitiohoy"
  cat > "$CREDS_FILE" <<ENVFILE
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENVFILE
  chmod 600 "$CREDS_FILE"
  success "Credenciales guardadas en ~/.sitiohoy/credentials.env"
fi

# ── Bloque de contexto ────────────────────────────────────────────────────────
generate_context_block() {
cat <<CONTEXTMD
# SitioHoy — Contexto del sistema

Sos el AI developer de SitioHoy. Generás sitios web completos para clientes
bajo tres planes usando el stack definido aquí. Seguís el protocolo de módulos
en orden. Respondés en español.

## Infraestructura Supabase (instancia única — multitenant)

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
\`\`\`

> SERVICE_ROLE_KEY nunca con prefijo NEXT_PUBLIC_.

## Stack

- Next.js 15+ App Router (Server Components por defecto)
- Supabase (PostgreSQL + RLS multitenant)
- MercadoPago Bricks
- Resend
- Envia.com (Plan Empresa)
- Umami Analytics
- Vercel (región gru1 — São Paulo)

Reglas no negociables:
- \`next/image\` siempre — nunca \`<img>\` nativo
- \`next/font\` siempre — nunca \`<link>\` externo
- \`unstable_cache\` + \`revalidateTag()\` — nunca \`revalidatePath('/')\` global ni \`revalidate: N\`
- \`'use client'\` solo para estado/efectos/eventos
- Server Actions para mutaciones (no API routes innecesarias)
- Mobile-first desde 375px

## Planes

| Plan | Productos | Pagos | Envíos |
|---|---|---|---|
| Esencial | ≤50 | WhatsApp | No |
| Emprendimiento | ≤200 | MercadoPago | Zonas fijas |
| Empresa | Ilimitado | MercadoPago | Envia.com |

## Protocolo de módulos

1. Briefing → \`sitiohoy.config.json\` + \`brief.md\`
2. Scaffold → base Next.js + scripts QA
3. Database → migración SQL + seed admin
4. Módulos de negocio (según plan, en orden estricto)
5. QA tras cada módulo
6. Launch (solo con QA aprobado)

Modo silencioso: ejecutar sin pedir confirmación. Solo hablar ante error crítico o dato faltante sin placeholder posible.
Al finalizar módulo: \`Módulo N ✅ · Listo para N+1\`
CONTEXTMD
}

# ── Instaladores por IA ───────────────────────────────────────────────────────

install_claude() {
  local skills_dir="$TARGET_DIR/.claude/skills"
  local claude_md="$TARGET_DIR/CLAUDE.md"

  mkdir -p "$skills_dir"
  rsync -a --delete "$REPO_DIR/skills/" "$skills_dir/"

  # Crear CLAUDE.md si no existe, o agregar bloque si falta
  touch "$claude_md"
  if ! grep -q "SITIOHOY-CONTEXT-START" "$claude_md" 2>/dev/null; then
    cat >> "$claude_md" <<CLAUDEMD

<!-- SITIOHOY-CONTEXT-START -->
$(generate_context_block)
<!-- SITIOHOY-CONTEXT-END -->
CLAUDEMD
  fi

  success "Claude Code → CLAUDE.md + .claude/skills/ (${skills_dir})"
  printf "  %sLas skills se cargan por proyecto, no globalmente.%s\n" "$GY" "$RS"
}

install_codex() {
  # OpenAI Codex lee AGENTS.md y directorio .agents/
  # Skills se copian para referencia interna — Codex no las ejecuta como Claude,
  # pero el agente puede leerlas como contexto adicional.
  local skills_dir="$TARGET_DIR/.agents/skills"
  local agents_md="$TARGET_DIR/AGENTS.md"

  mkdir -p "$skills_dir"
  rsync -a --delete "$REPO_DIR/skills/" "$skills_dir/"
  generate_context_block > "$agents_md"

  # Agregar índice de skills al final de AGENTS.md para que Codex las descubra
  cat >> "$agents_md" <<'SKILLINDEX'

## Skills disponibles

Las siguientes skills están en `.agents/skills/`. Para usar una skill,
leer el archivo `.agents/skills/<nombre>/SKILL.md` correspondiente.

Skills SitioHoy:
- `sitio-hoy` — Orquestador principal
- `sitio-hoy-briefing` — Onboarding + config
- `sitio-hoy-scaffold` — Base Next.js + Supabase
- `sitio-hoy-database` — Migraciones + RLS + seed admin
- `sitio-hoy-qa` — Validación automática
- `sitio-hoy-launch-automation` — Deploy GitHub + Vercel + Supabase
- `sitio-hoy-project-director` — Context packs + dirección visual
SKILLINDEX

  success "OpenAI Codex → AGENTS.md + .agents/skills/ (${skills_dir})"
}

install_opencode() {
  # OpenCode lee AGENTS.md como contexto de proyecto.
  # También soporta carpeta .opencode/ para configuración local.
  local skills_dir="$TARGET_DIR/.opencode/skills"
  local agents_md="$TARGET_DIR/AGENTS.md"

  mkdir -p "$skills_dir"
  rsync -a --delete "$REPO_DIR/skills/" "$skills_dir/"
  generate_context_block > "$agents_md"

  # Agregar índice de skills al final
  cat >> "$agents_md" <<'SKILLINDEX'

## Skills disponibles

Las siguientes skills están en `.opencode/skills/`. Para usar una skill,
leer el archivo `.opencode/skills/<nombre>/SKILL.md` correspondiente.

Skills SitioHoy:
- `sitio-hoy` — Orquestador principal
- `sitio-hoy-briefing` — Onboarding + config
- `sitio-hoy-scaffold` — Base Next.js + Supabase
- `sitio-hoy-database` — Migraciones + RLS + seed admin
- `sitio-hoy-qa` — Validación automática
- `sitio-hoy-launch-automation` — Deploy GitHub + Vercel + Supabase
- `sitio-hoy-project-director` — Context packs + dirección visual
SKILLINDEX

  success "OpenCode → AGENTS.md + .opencode/skills/ (${skills_dir})"
}

# ── Copiar logo ───────────────────────────────────────────────────────────────
copy_logo() {
  local dest="$TARGET_DIR/logo-sitiohoy.png"
  local logo_url="https://raw.githubusercontent.com/Sitio-Hoy-Tech/sitiohoy-skills/main/assets/logo-sitiohoy.png"
  if curl -fsSL "$logo_url" -o "$dest" 2>/dev/null; then
    success "Logo → logo-sitiohoy.png"
  elif [ -f "$REPO_DIR/assets/logo-sitiohoy.png" ]; then
    cp "$REPO_DIR/assets/logo-sitiohoy.png" "$dest"
    success "Logo → logo-sitiohoy.png (local)"
  fi
}

# ── Ejecutar ──────────────────────────────────────────────────────────────────
printf "  %s── Instalando...%s\n\n" "$GY" "$RS"

case "$ai_choice" in
  0) install_claude   ;;
  1) install_codex    ;;
  2) install_opencode ;;
  3)
    install_claude
    install_codex
    install_opencode
    ;;
esac

copy_logo

printf "\n  %s%s✓ Instalación completa%s\n\n" "$CY" "$BD" "$RS"
printf "  Archivos en: %s%s%s\n\n" "$BD" "$TARGET_DIR" "$RS"
