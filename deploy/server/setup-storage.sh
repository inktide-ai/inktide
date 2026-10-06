#!/usr/bin/env bash
# One-time MinIO setup: the upload bucket the API writes to, readable anonymously because
# the browser loads avatars and covers straight from https://s3.<app-host>/<bucket>/<key>.
#   ./setup-storage.sh
set -euo pipefail
cd "$(dirname "$0")"

val() { grep "^$1=" .env | cut -d= -f2-; }
BUCKET=$(val S3Settings__DefaultBucket)
MINIO_PW=$(val MINIO_ROOT_PASSWORD)

docker compose exec -T -e MC_HOST_local="http://minio:${MINIO_PW}@localhost:9000" minio sh -c "
  mc mb --ignore-existing local/${BUCKET} &&
  mc anonymous set download local/${BUCKET}"
echo "bucket ${BUCKET} ready"
