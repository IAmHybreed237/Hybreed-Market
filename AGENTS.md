# Mercur Marketplace Project

**This is a Mercur marketplace project — an open-source AI-native multi-vendor marketplace built on MedusaJS v2.**

## Read the docs first

Before any non-trivial change, read the **bundled documentation** — it ships as a dependency, so it is offline and version-matched to this project's packages:

1. Index: `node_modules/@mercurjs/docs/llms.txt`
2. Full pages: `node_modules/@mercurjs/docs/content/**/*.mdx`

It covers the domain model (sellers, products, offers, attributes, commissions, payouts, order groups), the CLI, the typed API client, the dashboard SDK, and module references. Don't guess at an API or data model the docs already describe.

### Project Structure

```
├── packages/api/         # Backend API — modules, workflows, links, subscribers
├── apps/admin/           # Admin dashboard — operator panel
├── apps/vendor/          # Vendor portal — seller dashboard
└── blocks.json           # Block configuration and registry aliases
```

## Documentation

- **Bundled docs (read first)**: `node_modules/@mercurjs/docs/llms.txt` → `content/**/*.mdx`
- **Online docs**: https://docs.mercurjs.com
- **MCP Server**: https://docs.mercurjs.com/mcp — connect your AI agent for documentation search
- **llms.txt (online)**: https://docs.mercurjs.com/llms.txt

## Configuration Files

- `blocks.json` — block configuration and registry path aliases
- `packages/api/medusa-config.ts` — MedusaJS configuration
- `apps/admin/vite.config.ts` — admin dashboard build config
- `apps/vendor/vite.config.ts` — vendor portal build config

## Getting Started

```bash
bun run dev
```

This starts:

- Backend API at `http://localhost:9000`
- Admin Panel at `http://localhost:9000/seller`
- Vendor Panel at `http://localhost:9000/dashboard`

## Local dev database (PostgreSQL on 5434)

The app DB is a manual cluster at `../.devdata/pg` (workspace root, outside the repo). Its `postgresql.conf` says port 5433, but the ASCON KOMPAS-3D service already occupies 5433 — so it MUST be started with an explicit port override:

```
"C:/Program Files/PostgreSQL/17/bin/pg_ctl.exe" -D "C:/Users/CSA/Documents/HYBREED-Market/.devdata/pg" -l "C:/Users/CSA/Documents/HYBREED-Market/pg-startup.log" -o "-p 5434" start
```

`DATABASE_URL` points at `localhost:5434/hybreed`. Start this cluster BEFORE `medusa develop` or the API crashes on ECONNREFUSED. Other postgres instances on this machine (ASCON service on 5433, `postgresql-x64-17` on 5432) are unrelated — do not stop them.
