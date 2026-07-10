# VocalBridge — Google Sheet + Apps Script backend (step by step)

Works with site hosted on **Vercel / tiiny / Puter / Netlify static** — no Netlify Functions needed.

---

## Part 1 — Create the spreadsheet

1. Go to [https://sheets.google.com](https://sheets.google.com)
2. **Blank** spreadsheet
3. Rename spreadsheet: `VocalBridge Scores`
4. Rename bottom tab to: `Scores` (must match script)
5. In row 1 put headers (optional — script can create them):

```text
timestamp | name | difficulty | correct | wrong | total | pct | xp | usedCount | clientId | remark
```

---

## Part 2 — Add the script

1. In the Sheet menu: **Extensions → Apps Script**
2. Delete any default code in `Code.gs`
3. Paste everything from:

   `google-apps-script/Code.gs`

4. Click **Save** (disk icon)
5. Project name: `VocalBridge Backend`

### Optional: change admin password
In `Code.gs` find:

```js
var ADMIN_PASSWORD = 'vb-admin-2026';
```

Use the **same** password as in the website (`ADMIN_PASSWORD` in `index.html`).

---

## Part 3 — Deploy as Web App (this is your backend URL)

1. Top right: **Deploy → New deployment**
2. Gear icon ⚙️ → **Web app**
3. Settings:
   - **Description:** `v1`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. **Deploy**
5. Google may ask permission:
   - **Review permissions**
   - Choose your Google account
   - **Advanced → Go to VocalBridge Backend (unsafe)** (normal for your own script)
   - **Allow**
6. Copy the **Web app URL**  
   Looks like:
   ```text
   https://script.google.com/macros/s/AKfy.../exec
   ```
7. Keep this URL. You’ll paste it into the website.

### If you edit the script later
**Deploy → Manage deployments → Edit (pencil) → New version → Deploy**  
Then use the same URL (or copy if it changes).

---

## Part 4 — Put the URL into the Academy website

1. Open `public/index.html` (or `VocalBridge_Teammate_Academy.html`)
2. Find:

```js
const GOOGLE_SCRIPT_URL = "";
```

3. Paste your Web app URL between the quotes:

```js
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";
```

4. Save
5. Re-upload / redeploy that HTML to Vercel (or wherever you host)

---

## Part 5 — Test

### Submit (friend side)
1. Open your live site
2. Enter **name** → Save
3. Answer at least 1 quiz question
4. Click **Submit score online**
5. Should say submitted OK
6. Open Google Sheet → new row appears

### Admin online (you)
1. Click **VocalBridge** title **5 times**
2. OK → password `vb-admin-2026`
3. Click **Load ONLINE scores**
4. You should see players + recent submissions

---

## Part 6 — Security (school level)

| Do | Don’t |
|---|---|
| Keep script URL only in your site code | Post admin password to friend |
| Share only the Vercel/site link with friend | Make Sheet “public on the web” unless you understand risk |
| Sheet can stay Private to your Google account | Put real personal data beyond first name |

Anyone who finds the script URL might submit fake scores. Fine for a teammate trainer; change password if needed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Submit failed / CORS / Network | Must use **deployed Web app URL** ending in `/exec`, not the editor URL |
| Unauthorized in admin | Password in HTML and `Code.gs` must match |
| No rows | Tab must be named `Scores` or let script create it; redeploy after code changes |
| Still old behavior | Hard refresh site; confirm you updated `GOOGLE_SCRIPT_URL` on the **hosted** file |
| Permission errors | Deploy → Execute as **Me**, access **Anyone**, re-authorize |

---

## What you host where

| Piece | Where |
|---|---|
| Website HTML | Vercel / tiiny / Puter / etc. |
| Database | Google Sheet |
| Backend API | Apps Script Web App URL |

Done.
