import type { Platform } from "./store";

export type Claim = {
  claim: string;
  verdict: "verified" | "unverified" | "debunked" | "pure vibes";
  evidence: string;
};

export type Analysis = {
  username: string | null;
  platform: Platform;
  larpScore: number;
  verdictTitle: string;
  summary: string;
  claims: Claim[];
  buzzwords: { original: string; translation: string }[];
  redFlags: string[];
  comment: string;
  sources: { title: string; url: string }[];
  searches: string[];
  mode: "ai" | "vibes";
  provider: "claude" | "vibes";
};

export type AnalyzeInput = {
  text?: string;
  image?: { data: string; mediaType: string }; // base64, no data: prefix
  usernameHint?: string;
  platformHint?: Platform;
};

const SYSTEM = `You are DeLARP, a forensic investigator that exposes tech bros who LARP (pretend to be more successful than they are) on LinkedIn and X.

You receive a post as text and/or a screenshot. Your job:
1. Identify the author's username/handle and the platform (linkedin, x, or unknown).
2. Extract the concrete claims (funding raised, revenue, users, titles, "founder of", awards, exits, followers...).
3. USE WEB SEARCH to look for real proof of the important claims: the company website, Crunchbase-style funding news, press, GitHub, product pages, app store listings. Do 2-4 focused searches. If you can't find the person, search the company/product instead.
4. Score how much of a LARP it is from 0 to 100:
   - 0-49: claims check out or it's a normal humble post. Real.
   - 50-100: big claims, no proof, vaporware, buzzword soup, "stealth", "building in public" with nothing public.
   Missing evidence for huge claims counts AGAINST them. Normal people posting normal things should score low.
5. If the score is 50 or more, write ONE LinkedIn/X reply comment that is backhanded: sweet and supportive on the surface, quietly devastating underneath. It should read like a real comment someone could post. Rules for the comment: under 280 characters, no slurs, nothing about appearance, race, gender, religion, health or family, no threats, no profanity. Roast the claim, not the human. Examples of the tone:
   - "Congrats on the $10M raise! Couldn't find the announcement anywhere, must be really stealth. Can't wait to see the product someday 🙏"
   - "So inspiring that you've helped 10,000 founders. Would love to meet one of them!"
6. Translate 2-4 buzzwords from the post into what they actually mean (funny, short).

Be funny everywhere except the evidence field, which must be honest about what you did or didn't find.

When you are done investigating, call the file_report tool exactly once with your findings. Do not write the report as text.`;

type ContentBlock = {
  type: string;
  text?: string;
  input?: { query?: string };
  content?: unknown;
  citations?: { url?: string; title?: string }[];
};

function clampScore(n: unknown) {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50;
}

function normPlatform(p: unknown): Platform {
  const s = String(p ?? "").toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s === "x" || s.includes("twitter")) return "x";
  return "unknown";
}

function extractJson(text: string): Record<string, unknown> | null {
  const fenced = [...text.matchAll(/```json\s*([\s\S]*?)```/g)].pop()?.[1];
  const candidate = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

type RawRun = { report: Record<string, unknown>; searches: string[]; sources: { url: string; title: string }[] };

const REPORT_TOOL = {
  name: "file_report",
  description: "File the final DeLARP investigation report. Call this once, after any web searches.",
  input_schema: {
    type: "object",
    properties: {
      username: { type: ["string", "null"], description: "Author handle without @, or null if unknown" },
      platform: { type: "string", enum: ["linkedin", "x", "unknown"] },
      larp_score: { type: "integer", minimum: 0, maximum: 100 },
      verdict_title: { type: "string", description: "Short dramatic headline, max 8 words" },
      summary: { type: "string", description: "1-2 funny sentences on what you found" },
      claims: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claim: { type: "string" },
            verdict: { type: "string", enum: ["verified", "unverified", "debunked", "pure vibes"] },
            evidence: { type: "string" },
          },
          required: ["claim", "verdict", "evidence"],
        },
      },
      buzzwords: {
        type: "array",
        items: {
          type: "object",
          properties: { original: { type: "string" }, translation: { type: "string" } },
          required: ["original", "translation"],
        },
      },
      red_flags: { type: "array", items: { type: "string" } },
      comment: { type: ["string", "null"], description: "Backhanded reply if larp_score >= 50, else null" },
    },
    required: ["platform", "larp_score", "verdict_title", "summary", "claims", "buzzwords", "red_flags"],
  },
};

function buildPrompt(input: AnalyzeInput) {
  let prompt = "Investigate this post for LARPing.\n";
  if (input.usernameHint) prompt += `The author's handle is: ${input.usernameHint}\n`;
  if (input.platformHint && input.platformHint !== "unknown") prompt += `Platform: ${input.platformHint}\n`;
  if (input.text?.trim()) prompt += `\nPOST TEXT:\n"""\n${input.text.trim().slice(0, 6000)}\n"""\n`;
  if (input.image) prompt += "\nThe screenshot of the post is attached.";
  return prompt;
}

type Block = ContentBlock & { id?: string; name?: string; input?: Record<string, unknown> & { query?: string } };

async function callClaude(apiKey: string, messages: unknown[], forceReport: boolean) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 3000,
      system: SYSTEM,
      messages,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }, REPORT_TOOL],
      tool_choice: forceReport ? { type: "tool", name: "file_report" } : { type: "auto" },
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as { content: Block[]; stop_reason: string };
}

async function runClaude(input: AnalyzeInput, apiKey: string): Promise<RawRun> {
  const userContent: unknown[] = [];
  if (input.image) {
    userContent.push({ type: "image", source: { type: "base64", media_type: input.image.mediaType, data: input.image.data } });
  }
  userContent.push({ type: "text", text: buildPrompt(input) });

  const messages: { role: string; content: unknown }[] = [{ role: "user", content: userContent }];
  const allBlocks: Block[] = [];
  let report: Record<string, unknown> | null = null;

  for (let i = 0; i < 5 && !report; i++) {
    // Last chance: force the report tool so we always get structured output.
    const force = i === 4;
    const data = await callClaude(apiKey, messages, force);
    allBlocks.push(...data.content);
    const reportBlock = data.content.find((b) => b.type === "tool_use" && b.name === "file_report");
    if (reportBlock?.input) {
      report = reportBlock.input;
      break;
    }
    messages.push({ role: "assistant", content: data.content });
    if (data.stop_reason === "pause_turn") continue;
    // Finished without filing: ask again, this time forcing the tool.
    messages.push({ role: "user", content: [{ type: "text", text: "Now file your findings with the file_report tool." }] });
    const forced = await callClaude(apiKey, messages, true);
    allBlocks.push(...forced.content);
    const fb = forced.content.find((b) => b.type === "tool_use" && b.name === "file_report");
    if (fb?.input) report = fb.input;
    break;
  }
  if (!report) {
    // Last-ditch: a model that typed JSON as text anyway
    const text = allBlocks.filter((b) => b.type === "text").map((b) => b.text).join("");
    report = extractJson(text);
  }
  if (!report) throw new Error("The investigator lost the case file. Try again.");

  const searches: string[] = [];
  const found = new Map<string, string>();
  const cited = new Map<string, string>();
  for (const b of allBlocks) {
    if (b.type === "server_tool_use" && b.input?.query) searches.push(String(b.input.query));
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content as { url?: string; title?: string }[]) if (r.url) found.set(r.url, r.title || r.url);
    }
    for (const c of b.citations ?? []) if (c.url) cited.set(c.url, c.title || c.url);
  }
  const sources = [...(cited.size ? cited : found)].slice(0, 6).map(([url, title]) => ({ url, title }));
  return { report, searches, sources };
}

function toAnalysis(run: RawRun, input: AnalyzeInput, provider: "claude"): Analysis {
  const json = run.report;
  const score = clampScore(json.larp_score);
  const handle = typeof json.username === "string" && json.username.trim() ? json.username : null;
  return {
    username: handle || input.usernameHint || null,
    platform: input.platformHint && input.platformHint !== "unknown" ? input.platformHint : normPlatform(json.platform),
    larpScore: score,
    verdictTitle: String(json.verdict_title || (score >= 50 ? "LARP DETECTED" : "Surprisingly real")),
    summary: String(json.summary || ""),
    claims: Array.isArray(json.claims) ? (json.claims as Claim[]).slice(0, 6) : [],
    buzzwords: Array.isArray(json.buzzwords) ? (json.buzzwords as Analysis["buzzwords"]).slice(0, 4) : [],
    redFlags: Array.isArray(json.red_flags) ? (json.red_flags as string[]).slice(0, 5) : [],
    comment: score >= 50 ? String(json.comment || "Congrats! Can't wait to see the product someday 🙏") : "REAL TALK.",
    sources: run.sources,
    searches: run.searches,
    mode: "ai",
    provider,
  };
}

// Claude investigates; with no key, vibes mode keeps the demo alive.
export async function analyzePost(input: AnalyzeInput): Promise<Analysis> {
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!claudeKey) return vibesMode(input);
  try {
    return toAnalysis(await runClaude(input, claudeKey), input, "claude");
  } catch (e) {
    // One retry: the internet is flaky and so are LARPers
    console.error("First investigation failed, retrying:", e);
    return toAnalysis(await runClaude(input, claudeKey), input, "claude");
  }
}

// No API key? Still put on a show for the demo.
function vibesMode(input: AnalyzeInput): Analysis {
  const text = input.text ?? "";
  const triggers = [
    "thrilled", "humbled", "excited to announce", "stealth", "founder", "visionary", "disrupt",
    "web3", "ai-powered", "10x", "serial entrepreneur", "agree?", "building in public", "revenue",
    "raised", "unicorn", "thought leader", "grateful", "ceo", "exit", "$", "million",
  ];
  const lower = text.toLowerCase();
  const hits = triggers.filter((t) => lower.includes(t));
  const score = Math.min(100, 20 + hits.length * 12 + (input.image ? 15 : 0));
  const handle = input.usernameHint || text.match(/@([\w.-]{3,30})/)?.[1] || null;
  return {
    username: handle,
    platform: input.platformHint ?? "unknown",
    larpScore: score,
    verdictTitle: score >= 50 ? "Buzzword density critical" : "Suspiciously normal human",
    summary:
      score >= 50
        ? `Detected ${hits.length} red-flag phrases. The vibes are immaculate, the evidence is missing.`
        : "Not enough hustle-speak to convict. Probably just a person.",
    claims: hits.slice(0, 3).map((h) => ({
      claim: `Used the phrase "${h}"`,
      verdict: "pure vibes" as const,
      evidence: "Vibes mode: no API key set, so no real search was run.",
    })),
    buzzwords: [
      { original: "stealth startup", translation: "unemployed with a Notion page" },
      { original: "building in AI", translation: "has a ChatGPT tab open" },
    ],
    redFlags: hits.slice(0, 5),
    comment: score >= 50 ? "So inspiring! Can't wait to see the product someday 🙏" : "REAL TALK.",
    sources: [],
    searches: [],
    mode: "vibes",
    provider: "vibes",
  };
}
