#!/usr/bin/env bash
# SitioHoy AI Context Installer
# Crea los archivos de contexto en la carpeta donde estás parado,
# para la IA que elijas.
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
INSTALL_VERSION=""   # vacío = main
TEMP_CLONE=""        # se llena si se clona una versión específica

# ── Parsear flags de versión ──────────────────────────────────────────────────
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

# ── Resolver versión ──────────────────────────────────────────────────────────
resolve_version() {
  # Obtener tags de GitHub
  local tags_json
  tags_json=$(curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/tags" 2>/dev/null || echo "[]")
  local tags=()
  while IFS= read -r line; do
    [[ "$line" =~ \"name\":\ *\"([^\"]+)\" ]] && tags+=("${BASH_REMATCH[1]}")
  done <<< "$tags_json"

  if [ ${#tags[@]} -eq 0 ]; then
    warn "No se encontraron versiones publicadas. Usando main."
    INSTALL_VERSION=""
    return
  fi

  # Menú de selección de versión
  local ver_selected=0
  local ver_options=("${tags[@]}" "main (última)")
  local VER_TOTAL=${#ver_options[@]}

  draw_version_menu() {
    printf "  %s╭─────────────────────────────────────╮%s\n" "$CY" "$RS"
    printf "  %s│%s  ¿Qué versión instalamos?             %s│%s\n" "$CY" "$RS" "$CY" "$RS"
    printf "  %s├─────────────────────────────────────┤%s\n" "$CY" "$RS"
    for i in "${!ver_options[@]}"; do
      if [ "$i" -eq "$ver_selected" ]; then
        printf "  %s│%s  %s❯ %-34s%s%s│%s\n" "$CY" "$RS" "$HL" "${ver_options[$i]}" "$RS" "$CY" "$RS"
      else
        printf "  %s│%s  %s● %-34s%s%s│%s\n" "$CY" "$RS" "$NM" "${ver_options[$i]}" "$RS" "$CY" "$RS"
      fi
    done
    printf "  %s╰─────────────────────────────────────╯%s\n" "$CY" "$RS"
    printf "  %s↑↓ mover · Enter confirmar%s\n\n" "$GY" "$RS"
  }

  local VER_MENU_LINES=$((VER_TOTAL + 6))

  printf '\033[?25l'
  draw_version_menu
  while true; do
    k=$(read_key)
    case "$k" in
      UP)    [ "$ver_selected" -gt 0 ] && ((ver_selected--)); printf '\033[%dA\033[J' "$VER_MENU_LINES"; draw_version_menu ;;
      DOWN)  [ "$ver_selected" -lt $((VER_TOTAL - 1)) ] && ((ver_selected++)); printf '\033[%dA\033[J' "$VER_MENU_LINES"; draw_version_menu ;;
      ENTER) break ;;
    esac
  done
  printf '\033[?25h'

  local chosen="${ver_options[$ver_selected]}"
  printf "  %s✓%s Versión: %s%s%s\n\n" "$CY" "$RS" "$BD" "$chosen" "$RS"

  if [[ "$chosen" == "main (última)" ]]; then
    INSTALL_VERSION=""
  else
    INSTALL_VERSION="$chosen"
  fi
}

# ── Clonar versión específica ─────────────────────────────────────────────────
clone_version() {
  local version="$1"
  TEMP_CLONE="$(mktemp -d)"
  info "Descargando versión ${version}..."
  if ! git clone --quiet --depth 1 --branch "$version" \
       "https://github.com/${GITHUB_REPO}.git" "$TEMP_CLONE" 2>/dev/null; then
    warn "No se pudo clonar la versión ${version}. Usando instalación local."
    rm -rf "$TEMP_CLONE"
    TEMP_CLONE=""
  else
    REPO_DIR="$TEMP_CLONE"
    success "Versión ${version} lista."
  fi
}

# cleanup al salir
cleanup_temp() {
  [ -n "$TEMP_CLONE" ] && rm -rf "$TEMP_CLONE"
}

GR='\033[38;2;34;163;91m'    # SitioHoy green (text)
BG='\033[48;2;34;163;91m'    # SitioHoy green (background)
WH='\033[38;2;255;255;255m'  # white text
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${GR}→${NC} $1"; }
success() { echo -e "${GR}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $1"; }

print_logo() {
  # S logo — fondo verde SitioHoy (#22A35B) con S blanca en bloques Unicode
  local g=$'\033[48;2;34;163;91m'   # green bg
  local w=$'\033[38;2;255;255;255m' # white fg
  local t=$'\033[38;2;34;163;91m'   # green text
  local b=$'\033[1m'
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
  printf "\n  %s%sSitioHoy%s  AI Context Installer\n\n" "$t" "$b" "$r"
}

print_logo

# ─── Elegir IA ────────────────────────────────────────────────────────────────
DIM=$'\033[2m'
CY=$'\033[38;2;34;163;91m'
WH=$'\033[38;2;255;255;255m'
GY=$'\033[38;2;120;120;120m'
BD=$'\033[1m'
RS=$'\033[0m'

printf "  %s📁 Destino:%s %s%s%s\n\n" "$GY" "$RS" "$BD" "$TARGET_DIR" "$RS"

OPTIONS=(
  "Claude Code"
  "Gemini CLI"
  "OpenAI Codex"
  "DeepSeek"
  "Cursor"
  "Windsurf"
  "Genérico (system prompt)"
  "Todas"
)
TOTAL=${#OPTIONS[@]}
selected=0

# Colores para el menú
HL=$'\033[48;2;34;163;91m\033[38;2;255;255;255m'  # highlight: fondo verde, texto blanco
NM=$'\033[38;2;180;180;180m'                        # normal: gris
CY=$'\033[38;2;34;163;91m'
GY=$'\033[38;2;120;120;120m'
BD=$'\033[1m'
RS=$'\033[0m'

draw_menu() {
  printf "  %s╭─────────────────────────────────────╮%s\n" "$CY" "$RS"
  printf "  %s│%s  ¿Para qué IA instalamos?            %s│%s\n" "$CY" "$RS" "$CY" "$RS"
  printf "  %s├─────────────────────────────────────┤%s\n" "$CY" "$RS"
  for i in "${!OPTIONS[@]}"; do
    if [ "$i" -eq "$selected" ]; then
      printf "  %s│%s  %s❯ %-34s%s%s│%s\n" "$CY" "$RS" "$HL" "${OPTIONS[$i]}" "$RS" "$CY" "$RS"
    else
      if [ "$i" -eq 7 ]; then
        printf "  %s│%s  %s◆ %-34s%s%s│%s\n" "$CY" "$RS" "$NM" "${OPTIONS[$i]}" "$RS" "$CY" "$RS"
      else
        printf "  %s│%s  %s● %-34s%s%s│%s\n" "$CY" "$RS" "$NM" "${OPTIONS[$i]}" "$RS" "$CY" "$RS"
      fi
    fi
  done
  printf "  %s╰─────────────────────────────────────╯%s\n" "$CY" "$RS"
  printf "  %s↑↓ mover · Enter confirmar%s\n\n" "$GY" "$RS"
}

# Captura teclas de flecha
read_key() {
  local key
  IFS= read -rsn1 key
  if [[ "$key" == $'\x1b' ]]; then
    read -rsn2 key
    case "$key" in
      '[A') echo "UP"   ;;
      '[B') echo "DOWN" ;;
    esac
  elif [[ "$key" == "" ]]; then
    echo "ENTER"
  fi
}

# Líneas que ocupa el menú: 3 header + TOTAL opciones + 1 footer + 1 hint + 1 blank
MENU_LINES=$((TOTAL + 6))

redraw_menu() {
  printf '\033[%dA\033[J' "$MENU_LINES"
  draw_menu
}

# ─── Versión a instalar ────────────────────────────────────────────────────────
# Si se pidió rollback, mostrar menú de versiones ahora que read_key está listo
if [ "$INSTALL_VERSION" = "__pick__" ]; then
  resolve_version
fi
# Si se eligió una versión específica, clonarla antes de copiar archivos
if [ -n "$INSTALL_VERSION" ]; then
  clone_version "$INSTALL_VERSION"
fi

# ─── Menú de IA ───────────────────────────────────────────────────────────────
# Ocultar cursor
printf '\033[?25l'
trap 'printf "\033[?25h"; cleanup_temp' EXIT

draw_menu
while true; do
  k=$(read_key)
  case "$k" in
    UP)
      [ "$selected" -gt 0 ] && ((selected--))
      redraw_menu
      ;;
    DOWN)
      [ "$selected" -lt $((TOTAL - 1)) ] && ((selected++))
      redraw_menu
      ;;
    ENTER)
      break
      ;;
  esac
done

printf '\033[?25h'
ai_choice=$((selected + 1))
printf "  %s✓%s %s%s%s\n\n" "$CY" "$RS" "$BD" "${OPTIONS[$selected]}" "$RS"

# ─── Credenciales ─────────────────────────────────────────────────────────────
echo -e "${BLUE}── Credenciales de Supabase${NC}"

if [ -f "$CREDS_FILE" ]; then
  source "$CREDS_FILE"
  echo "   Credenciales guardadas encontradas:"
  echo "   URL: $SUPABASE_URL"
  echo "   Anon Key: ${SUPABASE_ANON_KEY:0:20}..."
  echo ""
  read -p "¿Usar estas credenciales? (S/n): " use_saved
  use_saved="${use_saved:-S}"
fi

if [ ! -f "$CREDS_FILE" ] || [[ "$use_saved" =~ ^[nN]$ ]]; then
  echo ""
  read -p "  SUPABASE_URL (ej: https://xxx.supabase.co): " SUPABASE_URL
  read -p "  ANON_KEY: " SUPABASE_ANON_KEY
  read -s -p "  SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
  echo ""

  mkdir -p "$HOME/.sitiohoy"
  cat > "$CREDS_FILE" <<ENVFILE
# SitioHoy — Credenciales Supabase
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENVFILE
  chmod 600 "$CREDS_FILE"
  success "Credenciales guardadas en ~/.sitiohoy/credentials.env"
else
  source "$CREDS_FILE"
fi

# ─── Generar bloque de contexto ───────────────────────────────────────────────
generate_context_block() {
cat <<CONTEXTMD
# SitioHoy — Contexto del sistema

Sos el AI developer de SitioHoy. Generás sitios web completos para clientes
bajo tres planes usando el stack definido aquí. Seguís el protocolo de módulos
en orden. Respondés en español.

---

## Infraestructura Supabase (instancia única — multitenant)

Estas credenciales aplican a **todos** los proyectos SitioHoy. Usarlas
directamente, sin pedirlas al usuario.

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
\`\`\`

> ⚠️ SERVICE_ROLE_KEY nunca con prefijo NEXT_PUBLIC_.
> Variables adicionales por proyecto: NEXT_PUBLIC_TENANT_ID, NEXT_PUBLIC_SITE_NAME,
> NEXT_PUBLIC_URL, y según plan: MP_WEBHOOK_SECRET, ENVIA_API_URL.

---

## Stack

- **Framework**: Next.js 15+ App Router (Server Components por defecto)
- **Base de datos**: Supabase (PostgreSQL + RLS multitenant)
- **Pagos**: MercadoPago Bricks
- **Emails**: Resend
- **Envíos**: Envia.com (Plan Empresa)
- **Analytics**: Umami
- **Deploy**: Vercel

Reglas no negociables:
- \`next/image\` siempre (nunca \`<img>\` nativo)
- \`next/font\` siempre (nunca \`<link>\` externo)
- \`unstable_cache\` + \`revalidateTag()\` (nunca \`revalidatePath('/')\` global)
- \`'use client'\` solo para estado/efectos/eventos
- Server Actions para mutaciones
- Mobile-first desde 375px

---

## Planes

| Plan | Precio | Productos | Pagos | Envíos |
|---|---|---|---|---|
| Esencial | \$25.000/mo | ≤50 | WhatsApp | No |
| Emprendimiento | \$37.000/mo | ≤200 | MercadoPago | Zonas fijas |
| Empresa | \$65.000/mo | Ilimitado | MercadoPago | Envia.com |

---

## Protocolo de módulos

1. Briefing → genera sitiohoy.config.json
2. Scaffold → proyecto Next.js base
3. Database → migraciones Supabase + RLS
4. Módulos de negocio (según plan, en orden)
5. QA (después de cada módulo)
6. Launch (solo con QA aprobado)

Una pregunta por dato. Formato de cierre: \`Módulo N ✅ · Listo para N+1\`
CONTEXTMD
}

# ─── Instalar por IA ──────────────────────────────────────────────────────────
install_claude() {
  local skills_dir="$TARGET_DIR/.claude/skills"
  local claude_md="$TARGET_DIR/CLAUDE.md"

  mkdir -p "$skills_dir"
  rsync -a "$REPO_DIR/skills/" "$skills_dir/"

  touch "$claude_md"
  if ! grep -q "SITIOHOY-CONTEXT" "$claude_md" 2>/dev/null; then
    cat >> "$claude_md" <<CLAUDEMD

<!-- SITIOHOY-CONTEXT-START -->
$(generate_context_block)
<!-- SITIOHOY-CONTEXT-END -->
CLAUDEMD
  fi
  success "Claude Code → CLAUDE.md + .claude/skills/ creados en $TARGET_DIR"
}

install_gemini() {
  local skills_dir="$TARGET_DIR/.gemini/skills"
  local gemini_md="$TARGET_DIR/GEMINI.md"
  mkdir -p "$skills_dir"
  rsync -a "$REPO_DIR/skills/" "$skills_dir/"
  generate_context_block > "$gemini_md"
  success "Gemini CLI → GEMINI.md + .gemini/skills/ creados en $TARGET_DIR"
}

install_codex() {
  local skills_dir="$TARGET_DIR/.agents/skills"
  local agents_md="$TARGET_DIR/AGENTS.md"
  mkdir -p "$skills_dir"
  rsync -a "$REPO_DIR/skills/" "$skills_dir/"
  generate_context_block > "$agents_md"
  success "OpenAI Codex → AGENTS.md + .agents/skills/ creados en $TARGET_DIR"
}

install_deepseek() {
  local skills_dir="$TARGET_DIR/.agents/skills"
  local ds_md="$TARGET_DIR/AGENTS.md"
  mkdir -p "$skills_dir"
  rsync -a "$REPO_DIR/skills/" "$skills_dir/"
  generate_context_block > "$ds_md"
  success "DeepSeek → AGENTS.md + .agents/skills/ creados en $TARGET_DIR"
}

install_cursor() {
  local rules="$TARGET_DIR/.cursorrules"
  generate_context_block > "$rules"
  success "Cursor → .cursorrules creado en $TARGET_DIR"
}

install_windsurf() {
  local rules="$TARGET_DIR/.windsurfrules"
  generate_context_block > "$rules"
  success "Windsurf → .windsurfrules creado en $TARGET_DIR"
}

install_generic() {
  local ctx="$TARGET_DIR/context.md"
  generate_context_block > "$ctx"
  success "Genérico → context.md creado en $TARGET_DIR"
  info "Pegá el contenido de context.md como system prompt en tu IA"
}

# Logo — descarga desde el repo o copia local como fallback
copy_logo() {
  local logo_url="https://raw.githubusercontent.com/Sitio-Hoy-Tech/sitiohoy-skills/main/assets/logo-sitiohoy.png"
  local dest="$TARGET_DIR/logo-sitiohoy.png"
  if curl -fsSL "$logo_url" -o "$dest" 2>/dev/null; then
    success "Logo → logo-sitiohoy.png descargado"
  elif [ -f "$REPO_DIR/assets/logo-sitiohoy.png" ]; then
    cp "$REPO_DIR/assets/logo-sitiohoy.png" "$dest"
    success "Logo → logo-sitiohoy.png copiado (local)"
  else
    warn "No se pudo obtener el logo"
  fi
}

echo -e "${BLUE}── Instalando...${NC}"
echo ""

case "$ai_choice" in
  1) install_claude   ;;
  2) install_gemini   ;;
  3) install_codex    ;;
  4) install_deepseek ;;
  5) install_cursor   ;;
  6) install_windsurf ;;
  7) install_generic  ;;
  8)
    install_claude
    install_gemini
    install_codex
    install_deepseek
    install_cursor
    install_windsurf
    ;;
  *)
    echo "Opción inválida. Usá 1-8."
    exit 1
    ;;
esac

copy_logo

echo ""
echo -e "${GREEN}${BOLD}Instalación completa.${NC}"
echo ""
echo "Archivos creados en: $TARGET_DIR"
