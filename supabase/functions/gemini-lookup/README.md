# gemini-lookup — "Learn More" for one artwork

The artwork screen in the museum app has a **Learn More** button. It asks this
function for a short brief about the artwork; the function searches the web with
Gemini grounding and answers with a summary, a few quick facts and the pages it
used. The app shows those sources and a disclaimer.

**The Gemini key never reaches the browser.** `app.js` contains no API key — it
posts artwork metadata (name, artist, year, location, museum write-up) to this
function and gets JSON back. Anyone who opens DevTools can only see the artwork
they are already looking at.

## Deploy

```powershell
# once per machine
npx supabase login
npx supabase link --project-ref twkgioiyfjfkppzerdii

# the key lives only in Supabase secrets
npx supabase secrets set GEMINI_API_KEY="<your-gemini-key>"

# ship the function
npx supabase functions deploy gemini-lookup --no-verify-jwt
```

`config.toml` already declares the function (`verify_jwt = false`), so a plain
`npx supabase functions deploy` works too. Check it afterwards:

```powershell
curl "https://twkgioiyfjfkppzerdii.functions.supabase.co/functions/v1/gemini-lookup" `
  -H "Content-Type: application/json" `
  -d '{\"artwork\":{\"name\":\"Puente de Malabon (Malabon Bridge)\"}}'
```

## Protecting the key

1. **Keep it server-side.** Only `npx supabase secrets set` (or the dashboard's
   Edge Function secrets) should ever hold it. Never paste it into `app.js`,
   `index.html`, `firebase.json` or a git-tracked file.
2. **Restrict the key in Google Cloud** (APIs & Services → Credentials → the key):
   - API restrictions → *Generative Language API* only, so the key cannot be
     reused for Maps, Vision, etc.
   - Application restrictions → *None* (server calls have no referrer) — the
     restriction that matters here is the API one plus the quota below.
3. **Cap the project budget / quota** in Google Cloud → Billing → Budgets, and
   set a quota limit for *generativelanguage.googleapis.com* so a runaway day
   stops at a known number instead of a surprise invoice.
4. **Rotate on exposure.** If the key was ever pasted into chat, an email, or a
   commit, delete it and create a new one; then `supabase secrets set` again.
5. **Turn the feature off instantly** without a redeploy:
   `npx supabase secrets set GEMINI_LOOKUP_ENABLED=false`.

Every request is also shaped by the function itself: the prompt is fixed on the
server (the caller can only supply artwork metadata), output is capped at 1200
tokens, and the endpoint cannot be used to ask arbitrary questions.

## Limits (all overridable as secrets)

| Secret | Default | Meaning |
| --- | --- | --- |
| `LEARN_DEVICE_HOURLY_LIMIT` | 8 | searches per device per hour |
| `LEARN_DEVICE_DAILY_LIMIT` | 30 | searches per device per day |
| `LEARN_IP_MINUTE_LIMIT` | 20 | searches per IP per minute (a hall shares one IP) |
| `LEARN_GLOBAL_DAILY_LIMIT` | 500 | searches across the whole project per day |
| `GEMINI_MODEL` | `gemini-flash-latest` | preferred model; `gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-2.5-flash` are tried in order if it is retired, overloaded or quota-blocked |

## Troubleshooting

- **`429 RESOURCE_EXHAUSTED` on every model, but plain (ungrounded) requests work.**
  The project's *Google Search grounding* quota is used up. Grounded search has
  its own daily allowance, separate from the text models; check
  <https://aistudio.google.com/docs/rate-limits> and the project's usage at
  <https://ai.dev/rate-limit>. Wait for the daily reset, or enable billing on the
  project.
- **`404 ... model is no longer available to new users`.** Google retires model
  ids for new keys. Set `GEMINI_MODEL` to a current flash model
  (`npx supabase secrets set GEMINI_MODEL=gemini-3.5-flash`).
- **`Learn More is not configured yet.`** `GEMINI_API_KEY` was never set, or the
  function was deployed before the secret existed — set it and redeploy.
| `ALLOWED_ORIGINS` | *(empty = any)* | comma-separated origins, e.g. `https://gbrmuseumtest.web.app,https://gbrmuseumtest.firebaseapp.com` |

Answers are cached in memory for 12 hours per artwork, and the app caches them on
the device for 7 days, so repeat taps normally cost nothing.

Note: the counters live in the function instance's memory, which is reset when an
instance is recycled. They are a cheap guard, not a billing guarantee — the
Google Cloud quota cap above is the hard stop.

## Response

```json
{
  "artwork": "Puente de Malabon (Malabon Bridge)",
  "summary": "Two short paragraphs…",
  "facts": [{ "label": "Medium", "value": "Oil on canvas" }],
  "caution": "",
  "sources": [{ "title": "Malabon City heritage", "url": "https://…" }],
  "queries": ["Puente de Malabon history"],
  "model": "gemini-2.5-flash",
  "fetchedAt": "2026-02-01T09:12:44.123Z",
  "cached": false
}
```

Errors come back as `{ "error": "…", "retryAfter": 60 }` with a matching status:
`429` (limits), `503` (off, not configured, or Gemini busy), `502` (bad answer).
