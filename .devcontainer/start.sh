#!/bin/bash
cd "$(dirname "$0")/.."
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
export PGPASSWORD=hybreed

sudo service postgresql start >/dev/null 2>&1 || true

LOGS="$HOME/hybreed-logs"
mkdir -p "$LOGS"

start() {
  local name=$1 dir=$2 port=$3
  if ss -ltn | grep -q ":$port "; then
    echo "$name already running on :$port"
    return
  fi
  (cd "$dir" && nohup bun run dev > "$LOGS/$name.log" 2>&1 &)
  echo "started $name (log: $LOGS/$name.log)"
}

start api packages/api 9000
start admin apps/admin 7000
start vendor apps/vendor 7001
start storefront apps/storefront 3000
