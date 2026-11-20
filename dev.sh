#!/usr/bin/env bash
#
# Menjalankan Laravel API (booking-api) dan Vite dev server (booking-web)
# sekaligus. Ctrl-C menghentikan keduanya.
#
# Pemakaian:
#   ./dev.sh
#   npm run dev
#
# Variabel opsional:
#   API_HOST=127.0.0.1 API_PORT=8000 WEB_PORT=20081 ./dev.sh

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT_DIR/booking-api"
WEB_DIR="$ROOT_DIR/booking-web"

API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-20081}"

API_LOG="$API_DIR/storage/logs/laravel.log"
ROUTER="$API_DIR/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php"
VITE_BIN="$WEB_DIR/node_modules/.bin/vite"
WEB_BASE_PATH="/peminjaman-ruang/"

API_PID=""
WEB_PID=""

log() { printf '\033[1;34m[dev]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[dev]\033[0m %s\n' "$*" >&2; }
die() {
  printf '\033[1;31m[dev]\033[0m %s\n' "$*" >&2
  exit 1
}

stop_pid() {
  local pid="$1"
  [[ -z "$pid" ]] && return 0
  kill -0 "$pid" 2>/dev/null || return 0
  kill -TERM "$pid" 2>/dev/null || return 0
  local i
  for i in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 0.2
  done
  kill -KILL "$pid" 2>/dev/null || true
}

cleanup() {
  trap - INT TERM EXIT
  stop_pid "$WEB_PID"
  stop_pid "$API_PID"
  wait 2>/dev/null || true
}

trap 'log "Menghentikan server..."; cleanup; exit 0' INT TERM
trap cleanup EXIT

env_get() {
  local file="$1" key="$2"
  [[ -f "$file" ]] || return 0
  sed -n "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*//p" "$file" | tail -n 1 |
    sed -e 's/[[:space:]]*#.*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//"
}

port_in_use() {
  ss -ltn 2>/dev/null | awk -v suffix=":$1" '$4 ~ (suffix "$") { found = 1 } END { exit !found }'
}

tcp_open() {
  (exec 3<>"/dev/tcp/$1/$2") >/dev/null 2>&1
}

# --- Prasyarat ---------------------------------------------------------------

command -v php >/dev/null 2>&1 || die "php tidak ditemukan. Pasang PHP 8.2+ lebih dulu."
command -v curl >/dev/null 2>&1 || die "curl tidak ditemukan. Pasang curl lebih dulu."

[[ -f "$API_DIR/artisan" ]] || die "Folder booking-api tidak lengkap (artisan tidak ada)."
[[ -d "$API_DIR/vendor" ]] || die "Dependensi API belum terpasang. Jalankan: (cd booking-api && composer install)"
[[ -f "$ROUTER" ]] || die "Router Laravel tidak ditemukan di $ROUTER. Jalankan: (cd booking-api && composer install)"

command -v ss >/dev/null 2>&1 || warn "Perintah 'ss' tidak tersedia; pemeriksaan porta dilewati."

for port in "$API_PORT" "$WEB_PORT"; do
  if command -v ss >/dev/null 2>&1 && port_in_use "$port"; then
    die "Porta $port sudah dipakai proses lain. Hentikan proses itu atau pakai API_PORT/WEB_PORT lain."
  fi
done

[[ -d "$WEB_DIR/node_modules" ]] || die "Dependensi web belum terpasang. Jalankan: (cd booking-web && npm install)"
[[ -x "$VITE_BIN" ]] || die "Vite tidak ditemukan di $VITE_BIN. Jalankan: (cd booking-web && npm install)"

[[ -f "$API_DIR/.env" ]] || warn "booking-api/.env belum ada. Salin dari .env.example lalu isi kredensial."
[[ -f "$WEB_DIR/.env" ]] || warn "booking-web/.env belum ada. Salin dari .env.example lalu isi VITE_API_URL."

# Peringatan saja: API tetap menyala, tetapi login/query akan gagal tanpa database.
DB_HOST="$(env_get "$API_DIR/.env" DB_HOST)"
DB_PORT="$(env_get "$API_DIR/.env" DB_PORT)"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
if ! tcp_open "$DB_HOST" "$DB_PORT"; then
  warn "Database $DB_HOST:$DB_PORT tidak merespons. Nyalakan MySQL/MariaDB untuk database yang dipakai booking-api/.env, lalu ulangi."
fi

WEB_API_URL="$(env_get "$WEB_DIR/.env" VITE_API_URL)"
WEB_API_PORT="$(printf '%s' "$WEB_API_URL" | sed -n 's|^[a-zA-Z][a-zA-Z0-9+.-]*://[^:/]*:\([0-9]\{1,\}\).*|\1|p')"
if [[ -n "$WEB_API_PORT" && "$WEB_API_PORT" != "$API_PORT" ]]; then
  warn "VITE_API_URL menunjuk ke port $WEB_API_PORT, sedangkan API berjalan di $API_PORT."
  warn "Perbaiki VITE_API_URL di booking-web/.env atau jalankan dengan API_PORT=$WEB_API_PORT."
fi

# --- Jalankan API ------------------------------------------------------------

log "Menyalakan API di http://$API_HOST:$API_PORT ..."
(
  cd "$API_DIR/public"
  exec php \
    -d upload_max_filesize=50M \
    -d post_max_size=100M \
    -d max_execution_time=300 \
    -S "$API_HOST:$API_PORT" \
    "$ROUTER"
) > >(sed -u 's/^/[api] /') 2>&1 &
API_PID=$!

PROBE_HOST="$API_HOST"
[[ "$PROBE_HOST" == "0.0.0.0" || "$PROBE_HOST" == "::" ]] && PROBE_HOST="127.0.0.1"

api_ready=0
for _ in {1..30}; do
  if ! kill -0 "$API_PID" 2>/dev/null; then
    break
  fi
  if curl -fs -o /dev/null --max-time 2 "http://$PROBE_HOST:$API_PORT/up"; then
    api_ready=1
    break
  fi
  sleep 0.5
done

if [[ "$api_ready" -ne 1 ]]; then
  warn "API tidak siap dalam 15 detik. 20 baris terakhir $API_LOG:"
  if [[ -f "$API_LOG" ]]; then
    tail -n 20 "$API_LOG" >&2
  fi
  die "Gagal menyalakan API."
fi

# --- Jalankan web ------------------------------------------------------------

log "Menyalakan web di http://localhost:$WEB_PORT$WEB_BASE_PATH ..."
(
  cd "$WEB_DIR"
  exec "$VITE_BIN" --port "$WEB_PORT" --strictPort
) > >(sed -u 's/^/[web] /') 2>&1 &
WEB_PID=$!

log "API : http://$API_HOST:$API_PORT"
log "Web : http://localhost:$WEB_PORT$WEB_BASE_PATH"
log "Tekan Ctrl-C untuk menghentikan keduanya."

set +e
wait -n "$API_PID" "$WEB_PID"
status=$?
set -e

if [[ "$status" -ne 0 ]]; then
  warn "Salah satu proses berhenti dengan kode $status."
else
  log "Salah satu proses berhenti. Mematikan yang lain."
fi
exit "$status"
