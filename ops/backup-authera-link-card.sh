#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${AUTHERA_LINK_CARD_DATA_DIR:-/srv/nilson/data/authera-link-card}"
DB_FILE="${AUTHERA_LINK_CARD_DB_FILE:-authera-link-card.db}"
DEST_ROOT="${1:-/srv/nilson/backups/authera-link-card}"
STAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
DEST="${DEST_ROOT}/backup-${STAMP}"

DB_PATH="${DATA_DIR}/${DB_FILE}"
UPLOADS_DIR="${DATA_DIR}/uploads"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "ERRO: sqlite3 não está instalado no host." >&2
  exit 1
fi

if [[ ! -f "${DB_PATH}" ]]; then
  echo "ERRO: banco não encontrado em ${DB_PATH}" >&2
  exit 1
fi

mkdir -p "${DEST}"

# Backup consistente mesmo com o aplicativo em uso/WAL ativo.
sqlite3 "${DB_PATH}" ".backup '${DEST}/authera-link-card.db'"

INTEGRITY="$(sqlite3 "${DEST}/authera-link-card.db" 'PRAGMA integrity_check;')"
if [[ "${INTEGRITY}" != "ok" ]]; then
  echo "ERRO: integrity_check retornou: ${INTEGRITY}" >&2
  exit 1
fi

if [[ -d "${UPLOADS_DIR}" ]]; then
  tar -C "${DATA_DIR}" -czf "${DEST}/uploads.tar.gz" uploads
else
  mkdir -p "${DEST}/uploads-empty"
fi

(
  cd "${DEST}"
  sha256sum authera-link-card.db > SHA256SUMS
  if [[ -f uploads.tar.gz ]]; then
    sha256sum uploads.tar.gz >> SHA256SUMS
  fi
)

cat > "${DEST}/INFO.txt" <<EOF
Authera Link Card
Criado em: $(date --iso-8601=seconds)
Banco origem: ${DB_PATH}
Uploads origem: ${UPLOADS_DIR}
SQLite integrity_check: ok
EOF

echo "OK: ${DEST}"
