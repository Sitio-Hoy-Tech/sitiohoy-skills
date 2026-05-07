#!/usr/bin/env bash
# SitioHoy AI Context Installer
# Crea los archivos de contexto en la carpeta donde estás parado,
# para la IA que elijas.
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(pwd)"
CREDS_FILE="$HOME/.sitiohoy/credentials.env"

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
echo ""
echo -e "Directorio destino: ${BOLD}$TARGET_DIR${NC}"
echo ""

# ─── Elegir IA ────────────────────────────────────────────────────────────────
echo -e "${BLUE}── ¿Para qué IA querés instalar el contexto?${NC}"
echo ""
echo "  1) Claude Code    → crea CLAUDE.md e instala skills en .claude/skills/"
echo "  2) Gemini CLI     → crea GEMINI.md"
echo "  3) OpenAI Codex   → crea AGENTS.md (formato Codex)"
echo "  4) DeepSeek       → crea DEEPSEEK.md"
echo "  5) Cursor         → crea .cursorrules"
echo "  6) Windsurf       → crea .windsurfrules"
echo "  7) Genérico       → crea context.md (para pegar como system prompt)"
echo "  8) Todas las anteriores"
echo ""
read -p "Opción (1-8): " ai_choice
echo ""

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
  local gemini_md="$TARGET_DIR/GEMINI.md"
  generate_context_block > "$gemini_md"
  success "Gemini CLI → GEMINI.md creado en $TARGET_DIR"
}

install_codex() {
  local agents_md="$TARGET_DIR/AGENTS.md"
  generate_context_block > "$agents_md"
  success "OpenAI Codex → AGENTS.md creado en $TARGET_DIR"
}

install_deepseek() {
  local ds_md="$TARGET_DIR/DEEPSEEK.md"
  generate_context_block > "$ds_md"
  success "DeepSeek → DEEPSEEK.md creado en $TARGET_DIR"
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

# Logo (siempre, si está disponible)
copy_logo() {
  if [ -f "$REPO_DIR/assets/logo.png" ]; then
    cp "$REPO_DIR/assets/logo.png" "$TARGET_DIR/logo-sitiohoy.png"
    success "Logo → logo-sitiohoy.png copiado"
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
