# Spidey AI Widget — Setup

A floating chat widget ("Spidey") that greets visitors automatically and
answers questions about your portfolio, powered by Groq.

## Files added

- `spiderman.js` — front-end widget logic (open/close, send messages, render replies)
- CSS block appended to the bottom of `style.css` (search for "Spidey AI Widget")
- Widget markup added to `index.html` right before `</body>`
- `api/chat.js` — a serverless function that calls Groq **on the server**
- `.env.example` — template for your local API key

## Why the API call goes through `api/chat.js`

Your Groq API key must never appear in `spiderman.js`, `index.html`, or any
file the browser downloads — anyone could open dev tools, copy it, and rack
up usage on your account. `api/chat.js` runs on the server, reads the key
from an environment variable, and the browser only ever talks to your own
`/api/chat` endpoint. This is the standard, safe pattern for client-side
sites that need a secret key.

## Deploying on Vercel (recommended — matches your other projects)

1. Push this project to a GitHub repo and import it in Vercel (or run
   `vercel` from the project folder).
2. In the Vercel dashboard: **Project → Settings → Environment Variables**
   → add `GROQ_API_KEY` with your real key → save.
3. Redeploy. Vercel automatically turns `api/chat.js` into a serverless
   function at `/api/chat` — no extra config needed.
4. Open your live site — Spidey should pop up ~1.5s after load.

## Testing locally

```bash
npm i -g vercel        # once
cp .env.example .env   # then paste your real key into .env
vercel dev              # serves both the static site and /api/chat
```

Opening `index.html` directly as a `file://` URL will NOT work for the chat
(there's no server to run `api/chat.js`) — the welcome bubble still shows,
but replies will fail gracefully with a "spider-sense is fuzzy" message.

## Deploying somewhere other than Vercel

Any host that supports Node serverless/edge functions works the same way —
Netlify Functions, Cloudflare Pages Functions, etc. You'd move the logic in
`api/chat.js` into that platform's function format and point
`spiderman.js`'s `fetch('/api/chat', ...)` at the equivalent path. Say the
word if you want me to port it to a specific platform.

## Customizing

- **Personality / facts about you**: edit `SYSTEM_PROMPT` in `api/chat.js`.
  Update it whenever you add new projects or change roles.
- **Model**: change the `MODEL` constant in `api/chat.js`. Current default
  is `openai/gpt-oss-20b` (fast + cheap on Groq). Groq's Llama 3.x chat
  models were recently deprecated in favor of the GPT-OSS family — check
  console.groq.com/docs/models if you want to swap.
- **Welcome message / auto-open delay**: edit `WELCOME` and the
  `setTimeout(openPanel, 1400)` line in `spiderman.js`.
- **Colors**: `--spidey-red` / `--spidey-blue` variables at the top of the
  CSS block in `style.css`.

## Notes

- The widget is an original spider-mascot design (icon, colors, name
  "Spidey") — not Marvel's Spider-Man likeness or logo — to keep things
  copyright-safe for a personal portfolio.
- Each request sends only the last ~10 messages to keep token usage (and
  cost) low. There's no persistent chat history across page reloads by
  design; let me know if you'd rather it remember returning visitors.
