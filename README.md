# DeLARP

**Show me the product.** Paste a LinkedIn or X post (or a screenshot). An AI investigator searches the web for proof of the claims and gives it a LARP score.

- **Under 50%** → `REAL TALK.`
- **50% or more** → an AI-generated, politely devastating reply comment, and the author goes on the **LARP List**.

Built for the Stupid Ideas Hackathon, Ottawa, Nov 15 2026.

## Prize tracks

| Track | What we built |
| --- | --- |
| **Stupidest AI** | Gemini (Google Search grounding) with Claude (web search) as fallback, both with vision: reads the post/screenshot, searches for receipts, scores the LARP, writes the backhanded comment (`lib/analyze.ts`) |
| **Stupidest API** | `/api/stupid` and `/api/stupid/aura-debt` return each LARPer's aura debt, APR, credit rating and collections agent. Open CORS so **AURA DEBT** can call it |
| **Stupidest button** | **FARTY PARTY**: browser-synthesized fart, emoji gas clouds, screen shake, combos. 5x combo = disco, 10x = toxic |
| **Stupidest metric** | LARP List metrics: larpers by platform, national LARP rate, aura destroyed, global farts. Optionally sent to Amplitude |

## Stupid API

All endpoints return JSON with `Access-Control-Allow-Origin: *`.

```
GET  /api/stupid                                   national aura debt + most wanted
GET  /api/stupid/aura-debt?username=X&platform=x   one person's aura debt statement
GET  /api/larp-list                                raw list + metrics
POST /api/analyze  { text?, image?, username?, platform? }
POST /api/fart     { combo? }
```

Example `aura-debt` response (trimmed):

```json
{
  "username": "hustlebro420",
  "on_larp_list": true,
  "larp_score": 100,
  "aura": {
    "balance": -137951,
    "apr": "57.000% compounded every time they post",
    "minimum_payment": "Touch grass for 3 consecutive business days",
    "credit_rating": "F (Founder of nothing)",
    "collections_agent": "The ghost of your Series A"
  }
}
```

## Run locally

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY and/or ANTHROPIC_API_KEY
npm run dev
```

No API key? It runs in "vibes mode" with fake keyword-based verdicts so the demo still works.

## Deploy on Vercel

1. Import the repo in Vercel.
2. Add `GEMINI_API_KEY` (primary) and `ANTHROPIC_API_KEY` (fallback) in Environment Variables.
3. Storage → add **Upstash Redis** (it injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`) so the LARP List persists.
4. Optional: `AMPLITUDE_API_KEY` to send metrics to Amplitude.
