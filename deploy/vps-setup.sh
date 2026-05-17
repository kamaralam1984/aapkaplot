#!/usr/bin/env bash
# AapKaPlot — one-command VPS setup / redeploy script.
# Designed to run alongside the existing `vidyt` deployment without touching it.
#
#   bash deploy/vps-setup.sh        # idempotent — safe to re-run for updates

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────
APP_NAME="aapkaplot"
APP_DIR="/var/www/aapkaplot"
APP_PORT=3001
REPO_URL="https://github.com/kamaralam1984/aapkaplot.git"
BRANCH="main"
CF_TUNNEL_ID="269d6968-9b43-45be-bfa3-ccdc15976a95"
CF_CONFIG="/etc/cloudflared/config.yml"
LOG_DIR="/var/log/aapkaplot"

log()  { echo -e "\033[1;32m▶\033[0m $*"; }
warn() { echo -e "\033[1;33m⚠\033[0m $*"; }
err()  { echo -e "\033[1;31m✗\033[0m $*"; }

# ── Sanity checks ───────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  err "Run as root (sudo)."; exit 1
fi
command -v node >/dev/null  || { err "Install Node 20 first: apt install -y nodejs"; exit 1; }
command -v pm2  >/dev/null  || { err "Install PM2 first: npm i -g pm2"; exit 1; }
command -v git  >/dev/null  || { err "Install git: apt install -y git"; exit 1; }

# ── Prep dirs ───────────────────────────────────────────────────────────
mkdir -p "$LOG_DIR"
mkdir -p "$(dirname "$APP_DIR")"

# ── Clone or pull ───────────────────────────────────────────────────────
if [ ! -d "$APP_DIR/.git" ]; then
  log "Cloning repo into $APP_DIR…"
  git clone --depth=20 -b "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  log "Updating existing checkout…"
  cd "$APP_DIR"
  git fetch --depth=20 origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi
cd "$APP_DIR"

# ── Generate .env.local on first run only ──────────────────────────────
if [ ! -f "$APP_DIR/.env.local" ]; then
  log "Generating .env.local with fresh secrets…"
  cat > "$APP_DIR/.env.local" <<EOF
NEXT_PUBLIC_SITE_URL=https://8rupiya.in
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
AUTH_SECRET=$(openssl rand -hex 32)
# Add these later if you want the real integrations:
# NEXT_PUBLIC_MAPBOX_TOKEN=
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=
# TURNSTILE_SECRET=
# ANTHROPIC_API_KEY=
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
# DATABASE_URL=postgres://...
# REDIS_URL=redis://127.0.0.1:6379
# USE_DB=1
EOF
  chmod 600 "$APP_DIR/.env.local"
else
  log ".env.local already present — leaving it alone."
fi

# Symlink .env → .env.local so Prisma CLI (which only reads .env) picks up
# DATABASE_URL during `prisma generate` / `prisma db push`. Next.js itself
# reads .env.local natively, so this only affects the CLI.
ln -sf "$APP_DIR/.env.local" "$APP_DIR/.env"

# ── Install + build ─────────────────────────────────────────────────────
log "Installing npm deps (skipping heavy optional SDKs)…"
# Always use `npm install` to tolerate lockfile drift introduced by Cloudflare
# Pages dev deps (which target Node 22). `npm ci` is too strict for our flow.
npm install --omit=optional --no-audit --no-fund --loglevel=error

# Defensive: regenerate Prisma client in case the postinstall hook is missing
# on an older checkout. Cheap (~5s) and prevents `prisma.<model> does not exist`
# build failures after schema changes.
log "Regenerating Prisma client…"
npx prisma generate >/dev/null

log "Building Next.js (production)…"
npm run build

# ── Patch cloudflared config (idempotent) ──────────────────────────────
if [ -f "$CF_CONFIG" ]; then
  if grep -q "8rupiya.in" "$CF_CONFIG"; then
    log "cloudflared already has 8rupiya.in routes."
  else
    log "Adding 8rupiya.in ingress rules to $CF_CONFIG…"
    cp "$CF_CONFIG" "${CF_CONFIG}.bak.$(date +%Y%m%d-%H%M%S)"
    # Insert before the catch-all 404 rule.
    sed -i '/service: http_status:404/i \  - hostname: www.8rupiya.in\n    service: http://localhost:3001\n  - hostname: 8rupiya.in\n    service: http://localhost:3001' "$CF_CONFIG"
    log "Reloading cloudflared…"
    systemctl restart cloudflared
  fi
else
  warn "$CF_CONFIG not found — skipping cloudflared patch. Edit it manually."
fi

# ── PM2 start / reload ─────────────────────────────────────────────────
log "Starting / reloading PM2 process…"
pm2 startOrReload "$APP_DIR/ecosystem.config.cjs" --update-env
pm2 save

# ── Health check ───────────────────────────────────────────────────────
log "Health check…"
sleep 2
HEALTH=$(curl -sIo /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/" || echo "000")
if [ "$HEALTH" = "200" ] || [ "$HEALTH" = "307" ]; then
  log "✓ Healthy — http://127.0.0.1:${APP_PORT}/ → $HEALTH"
else
  warn "Got HTTP $HEALTH from local app. Check 'pm2 logs aapkaplot' for details."
fi

cat <<EOF

────────────────────────────────────────────────────────────
✓ AapKaPlot is running on $APP_DIR (port $APP_PORT, PM2 'aapkaplot')

Useful commands:
  pm2 list
  pm2 logs aapkaplot --lines 100
  pm2 restart aapkaplot
  systemctl status cloudflared
  curl -sI http://127.0.0.1:${APP_PORT}/ | head -5

Next: ask Claude to switch the 8rupiya.in CNAMEs to the tunnel
      so traffic stops hitting Cloudflare Pages and lands here instead.
────────────────────────────────────────────────────────────
EOF
