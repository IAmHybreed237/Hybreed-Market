#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "==> Installing PostgreSQL 17 (PGDG)..."
sudo apt-get update -qq
sudo apt-get install -y -qq postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y >/dev/null 2>&1 || true
sudo apt-get install -y -qq postgresql-17
sudo service postgresql start

echo "==> Creating hybreed role and database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='hybreed'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER hybreed WITH PASSWORD 'hybreed' SUPERUSER;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='hybreed'" | grep -q 1 \
  || sudo -u postgres createdb -O hybreed hybreed

echo "==> Installing bun..."
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
fi
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
grep -q 'BUN_INSTALL' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
EOF

echo "==> Writing env files..."
cat > packages/api/.env <<'EOF'
STORE_CORS=http://localhost:3000,http://localhost:8000,https://*.app.github.dev
ADMIN_CORS=http://localhost:7000,http://localhost:9000,https://*.app.github.dev
VENDOR_CORS=http://localhost:7001,https://*.app.github.dev
AUTH_CORS=http://localhost:7000,http://localhost:7001,http://localhost:9000,https://*.app.github.dev
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
DATABASE_URL=postgresql://hybreed:hybreed@localhost:5432/hybreed
MERCUR_VENDOR_URL=http://localhost:7001
STOREFRONT_REVALIDATE_URL=http://localhost:3000
STOREFRONT_REVALIDATE_SECRET=supersecret
FILE_BACKEND_URL=http://localhost:9000/static
# Add NOTCHPAY_* keys here if you need mobile money payments in dev
EOF

cat > apps/storefront/.env <<'EOF'
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_ecb6c439849923bed2b09921d83ad8af35fb5cef113bb727021d11c5fab01390
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_REGION=cm
NEXT_PUBLIC_STRIPE_KEY=supersecret
REVALIDATE_SECRET=supersecret
NEXT_PUBLIC_SITE_NAME="Fleek Marketplace"
NEXT_PUBLIC_SITE_DESCRIPTION="Fleek Markeplace"
NEXT_PUBLIC_VENDOR_URL=http://localhost:9000/seller
EOF

echo "==> Installing dependencies (bun install)..."
bun install

echo "==> Setting up database..."
export PGPASSWORD=hybreed
if [ -f .devcontainer/hybreed.dump ]; then
  echo "    Restoring database dump..."
  pg_restore -h localhost -U hybreed -d hybreed --clean --if-exists --no-owner .devcontainer/hybreed.dump || true
else
  echo "    No dump found - running migrations and seed..."
  (cd packages/api && bunx medusa db:migrate && bun run seed) || echo "    Migration/seed failed - run manually later"
fi

echo "==> Post-create complete. Servers will auto-start on next codespace start."
