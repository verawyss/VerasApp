# Sports Attendance Frontend

Next.js PWA Frontend für die Sports Attendance App.

## Setup

```bash
npm install
cp .env.local.example .env.local
# .env.local anpassen
npm run dev
```

## Environment Variables

In `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## PWA Icons

Ersetze folgende Dateien mit deinen eigenen Icons:
- `public/icon-192.png` (192x192 px)
- `public/icon-512.png` (512x512 px)
- `public/favicon.ico`

## Vercel Deployment

1. Push zu GitHub
2. Verbinde Repository mit Vercel
3. Setze `NEXT_PUBLIC_API_URL` in Vercel Settings
4. Deploy!
