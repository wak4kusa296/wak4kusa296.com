## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```env
# microCMS
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-read-api-key
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
