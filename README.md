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
│   └── cyberpunk_2077_build_db_v2.json   # build DB: single source of truth
├── schema/
│   ├── schema.ts         # zod schema for the build DB
│   ├── types.ts
│   └── validate.ts       # npm run validate:db
├── Dockerfile            # multi-stage: node build -> unprivileged nginx
├── nginx.conf            # SPA fallback, asset caching, security headers, /healthz
├── docker-compose.yml
└── .github/workflows/
    ├── ci.yml            # validate DB, lint, build, Docker build
    └── docker-publish.yml  # publish image to GHCR
```

## Self-hosting

The app is fully static once built, so any web server works. The container serves it with unprivileged nginx on port **8080** inside the container.

### Quick start: prebuilt image

A multi-arch image (amd64 + arm64) is published to GitHub Container Registry on every push to `main`:

```bash
docker run -d --name nc-os-planner --restart unless-stopped \
  -p 8080:8080 ghcr.io/mauo2358/nc-os-2077-build-planner:latest
```

Then open `http://<docker-host>:8080`. Pin a specific build with a `sha-<commit>` tag instead of `latest`. With Compose, swap `build: .` for `image: ghcr.io/mauo2358/nc-os-2077-build-planner:latest` in `docker-compose.yml`.

### Build it yourself

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

## Contributing

Forks and pull requests are welcome.

- **The build DB is the source of truth.** Perks, attribute bonuses, skill tracks, cyberware capacity, presets and Dogtown exclusives all live in `src/cyberpunk_2077_build_db_v2.json`. The UI reads from it, so most content fixes are JSON-only.
- **Validate before you push.** `npm run validate:db` checks the DB against the zod schema in `schema/schema.ts`. CI runs the same check, plus lint and build, on every push and pull request.
- **Adding a field to the DB?** Update `schema/schema.ts` and `schema/types.ts` in the same change.
- **Game rules:** Patch 2.1+ / Phantom Liberty only (Lv. 60 cap, 81 attribute points, attributes 3-20, perk tiers at 4/9/15/20, max 9 Relic points). Please don't add pre-2.0 perks.

## License

Code is licensed under the MIT License; see [LICENSE](LICENSE). Cyberpunk 2077 names, terms and related content are the property of CD PROJEKT S.A. and are not covered by this license.
