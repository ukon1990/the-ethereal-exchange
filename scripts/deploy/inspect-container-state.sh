#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  APP_NAME
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: $var_name" >&2
    exit 1
  fi
done

ENV_FILE_PATH="${ENV_FILE_PATH:-/opt/${APP_NAME}/config/app.env}"
if [[ -n "${CONTAINER_NAMES:-}" ]]; then
  IFS=',' read -r -a container_names <<< "$CONTAINER_NAMES"
else
  container_names=("$APP_NAME" "${APP_NAME}-backend" "${APP_NAME}-frontend")
fi

echo "== docker ps =="
docker ps -a --no-trunc

container_name=""
container_id=""
for name in "${container_names[@]}"; do
  candidate_id="$(docker ps -aq --filter "name=^/${name}$" | head -n 1)"
  if [[ -n "$candidate_id" ]]; then
    container_name="$name"
    container_id="$candidate_id"
    break
  fi
done
if [[ -z "$container_id" ]]; then
  echo "CONTAINER_STATE=missing"
  exit 1
fi

container_state="$(docker inspect --format '{{.State.Status}}' "$container_id")"
container_exit_code="$(docker inspect --format '{{.State.ExitCode}}' "$container_id")"

echo "CONTAINER_ID=$container_id"
echo "CONTAINER_NAME=$container_name"
echo "CONTAINER_STATE=$container_state"
echo "CONTAINER_EXIT_CODE=$container_exit_code"

echo "== container logs =="
docker logs --tail 500 "$container_name" || true

echo "== docker stats =="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}\t{{.PIDs}}" || true

echo "== docker inspect =="
docker inspect "$container_id" --format 'STATE={{.State.Status}} EXIT={{.State.ExitCode}} STARTED={{.State.StartedAt}} OOM={{.State.OOMKilled}} RESTARTS={{.RestartCount}} MEM={{.HostConfig.Memory}} CPUS={{.HostConfig.NanoCpus}}' || true

echo "== java ps =="
ps -o pid,ppid,pcpu,pmem,rss,vsz,etime,args -C java || true

echo "== cgroup memory/cpu =="
container_runtime_id="$(docker inspect --format '{{.Id}}' "$container_id" 2>/dev/null || true)"
for base in \
  "/sys/fs/cgroup/system.slice/docker-${container_runtime_id}.scope" \
  "/sys/fs/cgroup/docker/${container_runtime_id}"
do
  if [[ -d "$base" ]]; then
    echo "CGROUP=$base"
    [[ -f "$base/memory.current" ]] && echo "memory.current=$(cat "$base/memory.current")"
    [[ -f "$base/memory.max" ]] && echo "memory.max=$(cat "$base/memory.max")"
    [[ -f "$base/cpu.stat" ]] && cat "$base/cpu.stat"
  fi
done

echo "== listeners =="
ss -lntp || true

echo "== kernel oom hints =="
dmesg | tail -n 100 || true
journalctl -k -n 100 --no-pager || true

echo "== env file =="
if [[ -f "$ENV_FILE_PATH" ]]; then
  echo "ENV_FILE_PATH=$ENV_FILE_PATH"
  echo "ENV_KEYS_START"
  awk -F= '!/^[[:space:]]*($|#)/ && NF {print $1}' "$ENV_FILE_PATH"
  echo "ENV_KEYS_END"
else
  echo "ENV_FILE_MISSING=$ENV_FILE_PATH"
fi

if [[ "$container_state" != "running" ]]; then
  exit 1
fi
