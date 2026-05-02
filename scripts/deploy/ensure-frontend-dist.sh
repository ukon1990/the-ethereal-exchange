#!/usr/bin/env bash
set -euo pipefail

dist_ready=false
frontend_dir="frontend"
dist_file="${frontend_dir}/app-dist.tar.gz"

if [[ -n "${WORKFLOW_RUN_ID:-}" ]]; then
  api_url="https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runs/${WORKFLOW_RUN_ID}/artifacts"
  artifact_id="$(curl -fsSL \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "$api_url" | python3 -c "import json,sys; data=json.load(sys.stdin); arts=[a for a in data['artifacts'] if a['name']=='frontend-dist' and not a['expired']]; print(arts[0]['id'] if arts else '')")"

  if [[ -n "$artifact_id" ]]; then
    curl -fsSL \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/artifacts/${artifact_id}/zip" \
      -o /tmp/frontend-dist.zip
    rm -rf /tmp/frontend-dist
    mkdir -p /tmp/frontend-dist
    unzip -q /tmp/frontend-dist.zip -d /tmp/frontend-dist
    artifact_path="$(find /tmp/frontend-dist -maxdepth 2 -name 'app-dist.tar.gz' | head -n 1)"
    if [[ -n "$artifact_path" ]]; then
      cp "$artifact_path" "$dist_file"
      dist_ready=true
      echo "Using frontend-dist artifact from workflow run ${WORKFLOW_RUN_ID}"
    else
      echo "frontend-dist artifact from workflow run ${WORKFLOW_RUN_ID} did not contain app-dist.tar.gz; falling back to local build."
    fi
  else
    echo "No frontend-dist artifact found for workflow run ${WORKFLOW_RUN_ID}; falling back to local build."
  fi
fi

if [[ "$dist_ready" != "true" ]]; then
  echo "Building frontend locally."
  (cd "$frontend_dir" && bun install --frozen-lockfile && bun run build && tar -czf app-dist.tar.gz -C dist .)
fi

if [[ ! -f "$dist_file" ]]; then
  echo "Frontend dist artifact was not prepared" >&2
  exit 1
fi
