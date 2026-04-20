## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```env
# microCMS
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
```

3. Start dev server:

```bash
npm run dev
```

## Data Source

- Public works (`/`) and journal (`/journal`) fetch from microCMS by default.
- If microCMS env vars are missing or fetch fails, the app falls back to local JSON in `data/`.

Recommended microCMS APIs:
- `works`
- `achievements`

## Works API Storage

- `GET /api/works` reads from:
  1. microCMS (`works` endpoint) when `MICROCMS_*` env vars are configured
  2. local `data/works.json` as fallback
- `POST/PATCH/DELETE /api/works` writes to:
  1. microCMS (`works` endpoint) when `MICROCMS_*` env vars are configured
  2. local `data/works.json` only in non-Vercel local runtime
- On Vercel, set `MICROCMS_SERVICE_DOMAIN` and `MICROCMS_API_KEY` to enable write APIs.
