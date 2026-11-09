# NC-OS // 2077 Build Planner

Interactive **Cyberpunk 2077 (Patch 2.1+ / Phantom Liberty)** stat, perk and iconic-gear planner with a Kiroshi-style HUD.

- Preset archetype builds loaded from a JSON database (`src/cyberpunk_2077_build_db_v2.json`)
- Manual `+` / `-` attribute allocation against the Lv. 60 / 81-point cap, with perk tiers unlocking at 4 / 9 / 15 / 20
- Iconic gear location checklist, Relic tree, synergy breakdowns, leveling roadmap
- Skill tracks and cyberware capacity / Edgerunner tabs (driven by `skillTracks` and `chromeCapacity` sections of the DB)
- Custom build architect with localStorage persistence and JSON import/export

Fan project. Not affiliated with or endorsed by CD PROJEKT RED. Cyberpunk 2077 is a trademark of CD PROJEKT S.A.

## Stack

React 19 · Vite 8 · Tailwind CSS v4 (via `@tailwindcss/postcss`) · oxlint

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
```

Requires Node.js 20.19+.

## Project layout

```
.
├── index.html
├── public/favicon.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   └── cyberpunk_2077_build_db_v2.json
├── Dockerfile            # multi-stage: node build -> unprivileged nginx
├── nginx.conf            # SPA fallback, asset caching, security headers, /healthz
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Self-hosting

The app is fully static once built, so any web server works. The included container serves it with unprivileged nginx on port **8080** inside the container.

```bash
# Build and run
docker compose up -d --build

# Health check
curl -fsS http://127.0.0.1:${PLANNER_PORT:-8080}/healthz
```

Set `PLANNER_PORT` in a local `.env` to change the host port (check your port inventory first). TLS is expected to terminate at your reverse proxy:

| Proxy setting | Value |
|---|---|
| Domain | `planner.example.com` |
| Scheme | `http` |
| Forward host | `<docker-host-ip>` (or `nc-os-planner` on a shared Docker network) |
| Forward port | `${PLANNER_PORT}` (or `8080` on a shared network) |
| WebSockets | not needed |

### Without Docker

```bash
npm ci && npm run build
# copy dist/ to your web root, and add an SPA fallback:
#   try_files $uri $uri/ /index.html;
```

## Data

Custom builds are stored in the visitor's browser (`localStorage` key `nc_os_custom_presets`). Nothing is sent to a server.

## License

TBD
