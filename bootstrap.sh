#!/usr/bin/env bash
# SitioHoy Bootstrap — descarga el installer y lo ejecuta, sin dejar rastro
set -e

REPO="Sitio-Hoy-Tech/sitiohoy-skills"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# ── Colores ───────────────────────────────────────────────────────────────────
CY=$'\033[38;2;34;163;91m'
GY=$'\033[38;2;120;120;120m'
BD=$'\033[1m'
RS=$'\033[0m'
HL=$'\033[48;2;34;163;91m\033[38;2;255;255;255m'
NM=$'\033[38;2;180;180;180m'

# ── Obtener versiones disponibles ─────────────────────────────────────────────
printf "\n  %sBuscando versiones disponibles...%s\n" "$GY" "$RS"

TAGS_JSON=$(curl -fsSL "https://api.github.com/repos/${REPO}/tags" 2>/dev/null || echo "[]")
TAGS=()
while IFS= read -r line; do
  [[ "$line" =~ \"name\":\ *\"([^\"]+)\" ]] && TAGS+=("${BASH_REMATCH[1]}")
done <<< "$TAGS_JSON"

# ── Menú de versiones ─────────────────────────────────────────────────────────
OPTIONS=("${TAGS[@]}" "main (última, puede ser inestable)")
TOTAL=${#OPTIONS[@]}
selected=0

read_key() {
  local key
  IFS= read -rsn1 key
  if [[ "$key" == $'\x1b' ]]; then
    read -rsn2 key
    case "$key" in
      '[A') echo "UP" ;;
      '[B') echo "DOWN" ;;
    esac
  elif [[ "$key" == "" ]]; then
    echo "ENTER"
  fi
}

draw_menu() {
  printf "  %s╭─────────────────────────────────────╮%s\n" "$CY" "$RS"
  printf "  %s│%s  ¿Qué versión instalamos?             %s│%s\n" "$CY" "$RS" "$CY" "$RS"
  printf "  %s├─────────────────────────────────────┤%s\n" "$CY" "$RS"
  for i in "${!OPTIONS[@]}"; do
    if [ "$i" -eq "$selected" ]; then
      printf "  %s│%s  %s❯ %-34s%s%s│%s\n" "$CY" "$RS" "$HL" "${OPTIONS[$i]}" "$RS" "$CY" "$RS"
    else
      printf "  %s│%s  %s● %-34s%s%s│%s\n" "$CY" "$RS" "$NM" "${OPTIONS[$i]}" "$RS" "$CY" "$RS"
    fi
  done
  printf "  %s╰─────────────────────────────────────╯%s\n" "$CY" "$RS"
  printf "  %s↑↓ mover · Enter confirmar%s\n\n" "$GY" "$RS"
}

MENU_LINES=$((TOTAL + 6))

printf '\033[?25l'
trap 'printf "\033[?25h"' EXIT

# Si no hay tags, saltar directo a main
if [ ${#TAGS[@]} -eq 0 ]; then
  printf "  %s→%s Sin versiones publicadas aún — instalando main.\n\n" "$CY" "$RS"
  CHOSEN_REF="main"
else
  draw_menu
  while true; do
    k=$(read_key)
    case "$k" in
      UP)    [ "$selected" -gt 0 ] && ((selected--)); printf '\033[%dA\033[J' "$MENU_LINES"; draw_menu ;;
      DOWN)  [ "$selected" -lt $((TOTAL-1)) ] && ((selected++)); printf '\033[%dA\033[J' "$MENU_LINES"; draw_menu ;;
      ENTER) break ;;
    esac
  done
  printf '\033[?25h'

  CHOSEN="${OPTIONS[$selected]}"
  printf "  %s✓%s Versión: %s%s%s\n\n" "$CY" "$RS" "$BD" "$CHOSEN" "$RS"

  if [[ "$CHOSEN" == main* ]]; then
    CHOSEN_REF="main"
  else
    CHOSEN_REF="$CHOSEN"
  fi
fi

# ── Clonar la versión elegida ─────────────────────────────────────────────────
printf "  %s→%s Descargando %s%s%s...\n\n" "$CY" "$RS" "$BD" "$CHOSEN_REF" "$RS"

if [ "$CHOSEN_REF" = "main" ]; then
  if ! git clone --quiet --depth 1 \
    "https://github.com/${REPO}.git" "$TMP_DIR" > /dev/null 2>&1; then
    printf "  %s✗%s No se pudo descargar. Verificá tu conexión.\n\n" "$CY" "$RS"
    exit 1
  fi
else
  if ! git -c advice.detachedHead=false clone --quiet --depth 1 \
    --branch "$CHOSEN_REF" \
    "https://github.com/${REPO}.git" "$TMP_DIR" > /dev/null 2>&1; then
    printf "  %s✗%s No se pudo descargar la versión %s.\n\n" "$CY" "$RS" "$CHOSEN_REF"
    exit 1
  fi
fi

bash "$TMP_DIR/install.sh"
