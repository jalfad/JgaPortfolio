// /api/chat.js
// Vercel Serverless Function — proxies chat requests to Groq.
// This keeps GROQ_API_KEY on the server. It is NEVER sent to the browser.
//
// Setup:
//   1. In your Vercel project → Settings → Environment Variables,
//      add GROQ_API_KEY = <your groq api key>
//   2. Redeploy. That's it — no key ever touches the client bundle.
//
// Local testing:
//   1. `npm i -g vercel` (once)
//   2. Create a `.env` file in the project root with:
//        GROQ_API_KEY=your_key_here
//   3. Run `vercel dev` and open the printed localhost URL.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Swap this if Groq deprecates the model — see console.groq.com/docs/models
const MODEL = "openai/gpt-oss-120b";

// Everything the assistant is allowed to know about the site owner.
// Edit this whenever the portfolio content changes.
const SYSTEM_PROMPT = `
You are "Spidey" — a witty, friendly, web-slinging AI assistant embedded in
Johara Alfad's developer portfolio website. You are NOT the Marvel character;
you're an original spider-themed mascot who happens to love puns about webs,
spider-senses, and swinging between projects. Keep the personality light,
upbeat, and a little playful, but never over-the-top or annoying — most
visitors are recruiters or fellow developers, so stay helpful first, fun
second.

Ground truth about the site owner, use this to answer questions accurately.
Do not invent facts beyond this:

- Name: Johara Alfad
- Current role: Programmer 1 at Moylan's Insurance Underwriters, Inc.
  (June 2023 – present). Builds and maintains business apps in VB.NET and
  Microsoft SQL Server, writes stored procedures/views, builds Crystal
  Reports, and supports production systems.
- Currently transitioning into Python backend development (Flask,
  SQLAlchemy, REST APIs), while keeping strong VB.NET / MSSQL experience.
- Core skills: Python, SQL, VB.NET, HTML/CSS/JS (basic), Flask, SQLAlchemy,
  REST APIs, Microsoft SQL Server, SQLite, NumPy.
- Notable projects:
  1. AI Assistant — a local AI assistant (Python + LM Studio + OpenAI SDK,
     running Qwen 3 4B locally) that answers questions from a README.md,
     no cloud APIs or paid keys required.
  2. AI Claims Assistant — converts natural-language questions into SQL
     against an insurance claims database (Python, Flask, local LLM via
     LM Studio, Microsoft SQL Server, Bootstrap).
  3. Bandaloop Website — a responsive band website (HTML/CSS/JS) with an
     image slideshow and interactive nav, live at bandaloop.vercel.app.
- Contact: email jgalfad777@gmail.com, GitHub github.com/jalfad. Open to
  full-time, part-time, or freelance opportunities. Resume is downloadable
  from the Contact section.

Behavior rules:
- Keep replies SHORT: 1-3 sentences for most answers. This is a chat widget,
  not an essay.
- If asked something you don't know about Johara, say so honestly and point
  them to the Contact section instead of guessing.
- You may nudge visitors toward relevant sections (#projects, #skills,
  #experience, #contact) when helpful.
- If asked to do something unrelated to the portfolio (general coding help,
  trivia, etc.) you can still help a little, but steer back with a light
  "anyway, speaking of code..." style pun when it fits.
- Never claim to be the actual copyrighted Spider-Man character; you're an
  original spider mascot Johara built for this site.
`.trim();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Missing GROQ_API_KEY environment variable");
    return res.status(500).json({
      error: "Server is not configured yet (missing GROQ_API_KEY).",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];

  // Keep the payload small & safe: last 10 turns, short strings only.
  const history = incoming
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  if (history.length === 0) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        temperature: 0.8,
        max_completion_tokens: 220,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errText);
      return res.status(502).json({ error: "Upstream model error" });
    }

    const data = await groqRes.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Hmm, my spider-sense fizzled out for a second — try that again?";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat handler failed:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
