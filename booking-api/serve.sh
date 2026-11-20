#!/usr/bin/env bash
# Server API untuk deployment sederhana di balik reverse proxy.
# Port dan host bisa diatur lewat environment:
#   SERVE_PORT=20082 SERVE_HOST=0.0.0.0 ./serve.sh
set -Eeuo pipefail

API_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PORT="${SERVE_PORT:-20082}"
HOST="${SERVE_HOST:-0.0.0.0}"
ROUTER="$API_DIR/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php"

[[ -f "$ROUTER" ]] || {
  echo "Router Laravel tidak ditemukan. Jalankan: composer install" >&2
  exit 1
}

cd "$API_DIR/public"
exec php \
  -d upload_max_filesize=50M \
  -d post_max_size=100M \
  -d max_execution_time=300 \
  -S "$HOST:$PORT" \
  "$ROUTER"
