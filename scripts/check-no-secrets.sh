#!/usr/bin/env bash
# Blocks commits that stage env files, service account JSON, or common secret patterns.

set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "check-no-secrets: not a git repository"
  exit 1
fi

staged="$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)"

if [ -z "$staged" ]; then
  exit 0
fi

blocked=0

block_file() {
  local path="$1"
  local reason="$2"
  echo "check-no-secrets: blocked — $path ($reason)" >&2
  blocked=1
}

while IFS= read -r path; do
  [ -z "$path" ] && continue
  base="$(basename "$path")"

  case "$path" in
    .env.example|*/.env.example) continue ;;
    secrets/*|*/secrets/*) block_file "$path" "secrets directory" ;;
    *-firebase-adminsdk*.json) block_file "$path" "Firebase service account JSON" ;;
    */google-services.json|google-services.json) block_file "$path" "Firebase Android config" ;;
    */GoogleService-Info.plist|GoogleService-Info.plist) block_file "$path" "Firebase iOS config" ;;
    */serviceAccount*.json) block_file "$path" "service account JSON" ;;
  esac

  case "$base" in
    .env|.env.local|.env.production|.env.development)
      block_file "$path" "environment file with secrets"
      ;;
    .env.*)
      if [ "$base" != ".env.example" ]; then
        block_file "$path" "environment file with secrets"
      fi
      ;;
  esac
done <<<"$staged"

# Scan staged content in env/credential files for obvious real secrets
while IFS= read -r path; do
  [ -z "$path" ] && continue
  case "$path" in
    .env.example|*/.env.example) continue ;;
    .env|*/.env|*.env|*firebase-adminsdk*.json|secrets/*|*/secrets/*) ;;
    *) continue ;;
  esac
  diff="$(git diff --cached -- "$path" 2>/dev/null || true)"
  if printf '%s' "$diff" | grep -qE '^\+.*AIzaSy[a-zA-Z0-9_-]{20,}'; then
    block_file "$path" "staged Firebase API key — keep in gitignored .env only"
  fi
  if printf '%s' "$diff" | grep -qE '^\+.*postgresql://postgres:[^/]+@'; then
    if ! printf '%s' "$diff" | grep -qE 'YOUR_|your-|postgres@127\.0\.0\.1:5433'; then
      block_file "$path" "staged database URL with password — use placeholders in examples"
    fi
  fi
  if printf '%s' "$diff" | grep -qE '^\+.*"private_key":'; then
    block_file "$path" "staged private key — never commit service account JSON"
  fi
done <<<"$staged"

if [ "$blocked" -ne 0 ]; then
  echo "" >&2
  echo "Use .env.example for templates. Keep real keys in .env (gitignored) or Secret Manager." >&2
  exit 1
fi

exit 0
