#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  APP_NAME
  AWS_REGION
  IMAGE_URI
  CONTAINER_PORT
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: $var_name" >&2
    exit 1
  fi
done

LOG_GROUP="${LOG_GROUP:-/aws/ec2/${APP_NAME}}"
HOST_PORT="${HOST_PORT:-}"
REGISTRY="${IMAGE_URI%%/*}"
NETWORK_NAME="${NETWORK_NAME:-}"

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"

docker pull "$IMAGE_URI"
docker rm -f "$APP_NAME" >/dev/null 2>&1 || true

run_args=(
  -d
  --name "$APP_NAME"
  --restart unless-stopped
  --log-driver awslogs
  --log-opt awslogs-region="$AWS_REGION"
  --log-opt awslogs-group="$LOG_GROUP"
  --log-opt awslogs-stream="$APP_NAME"
)

if [[ -n "$HOST_PORT" ]]; then
  run_args+=(-p "${HOST_PORT}:${CONTAINER_PORT}")
fi

if [[ -n "${ENV_FILE_PATH:-}" ]]; then
  run_args+=(--env-file "$ENV_FILE_PATH")
fi

if [[ -n "$NETWORK_NAME" ]]; then
  docker network create "$NETWORK_NAME" >/dev/null 2>&1 || true
  run_args+=(--network "$NETWORK_NAME")
fi

if [[ -n "${BACKEND_ORIGIN:-}" ]]; then
  run_args+=(-e "BACKEND_ORIGIN=$BACKEND_ORIGIN")
fi

docker run "${run_args[@]}" "$IMAGE_URI"
