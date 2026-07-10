# VocalBridge Teammate Academy (Netlify + backend)

Static HTML training site + **Netlify Functions** backend so you can see teammates’ quiz scores online.

## What’s included

| Path | Role |
|---|---|
| `public/index.html` | Full Teammate Academy UI |
| `netlify/functions/submit-score.js` | `POST` — save a score |
| `netlify/functions/admin-scores.js` | `GET` — list scores (password) |
| `netlify.toml` | Build/publish config |

## Features

- Difficulty: Beginner / Medium / Advanced  
- 100-question bank, no repeats until pool reset  
- Player name  
- **Submit score online** (teammate button)  
- Admin: click **VocalBridge** title **5×** → OK → password  
- **Load ONLINE scores** in admin panel  

## Deploy on Netlify (free)

### A) Drag-and-drop (simple)

1. Create a free account at [https://app.netlify.com](https://app.netlify.com)  
2. Zip the **contents** of this project **or** connect a Git repo (recommended)  
3. For CLI / Git (recommended for Functions + Blobs):

```bash
# Install Netlify CLI once
npm install -g netlify-cli

cd vocalbridge-academy
cd netlify/functions && npm install && cd ../..
netlify login
netlify init    # create new site
netlify env:set ADMIN_PASSWORD "vb-admin-2026"
netlify deploy --prod
```

### B) GitHub → Netlify UI

1. Push `vocalbridge-academy/` to a GitHub repo  
2. Netlify → **Add new site** → Import from Git  
3. Build settings:
   - **Build command:** `cd netlify/functions && npm install`  
   - **Publish directory:** `public`  
   - **Functions directory:** `netlify/functions`  
4. Site settings → **Environment variables**:
   - `ADMIN_PASSWORD` = your secret (example `vb-admin-2026`)  
5. Deploy  

> Netlify Blobs are used for storage (no extra database). Available on modern Netlify projects automatically for Functions.

## Custom domain

Netlify → Domain management → Add domain → set DNS as shown (free HTTPS).

## How teammates submit scores

1. Open your Netlify URL  
2. Enter **name** on Home → Save  
3. Take the quiz  
4. Click **Submit score online**  

## How you view everyone’s scores

1. On the live site, click **VocalBridge** (logo text) **5 times**  
2. **Open Administrator?** → **OK**  
3. Password = `ADMIN_PASSWORD` env (default `vb-admin-2026`)  
4. Click **Load ONLINE scores**  

Local-only history still works with **Refresh local**.

## API (for debugging)

### Submit

`POST /.netlify/functions/submit-score`

```json
{
  "name": "Aarav",
  "difficulty": "beginner",
  "correct": 8,
  "wrong": 2,
  "xp": 120,
  "usedCount": 10,
  "clientId": "optional"
}
```

### Admin list

`GET /.netlify/functions/admin-scores?password=YOUR_PASSWORD`

## Security notes

- This is a **school helper**, not bank-grade security.  
- Change `ADMIN_PASSWORD` in Netlify env.  
- Change the same string in `public/index.html` (`ADMIN_PASSWORD` in JS) so the admin UI matches.  
- Anyone with the password can read scores. Don’t post the password in the chat with your friend.  
- Scores are not encrypted end-to-end; don’t store sensitive personal data.

## Unlisted site tips

Add is already in HTML: `noindex, nofollow`.  
Share the Netlify URL only with your teammate.  
Optional: random site name like `vb-academy-x7k2.netlify.app`.

## Local test (optional)

```bash
cd vocalbridge-academy/netlify/functions && npm install && cd ../..
netlify dev
```

Open the URL Netlify prints (usually `http://localhost:8888`).
