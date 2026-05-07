#!/usr/bin/env bash
# SitioHoy Bootstrap — descarga el installer y lo ejecuta, sin dejar rastro
set -e

TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "Descargando SitioHoy Skills..."
git clone --quiet https://github.com/Sitio-Hoy-Tech/sitiohoy-skills.git "$TMP_DIR"

bash "$TMP_DIR/install.sh"
