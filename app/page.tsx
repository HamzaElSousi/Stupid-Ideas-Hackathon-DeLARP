"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Analysis } from "@/lib/analyze";

type Result = Analysis & { listed: { offenses: number } | null; error?: string };

const LOADING_LINES = [
  "Reading the post with a straight face",
  "Counting the word 'humbled'",
  "Checking the news for the $10M raise",
  "Looking for a single paying customer",
  "Searching GitHub for one (1) commit",
  "Asking their cofounder (their mom)",
  "Locating the product. Still locating",
];

type Sample = { text: string; username: string; platform: "linkedin" | "x" };

const LARPS: Sample[] = [
  {
    username: "chad.ventures",
    platform: "linkedin",
    text: `Thrilled and humbled to announce that after 3 months in stealth, my AI-powered Web3 platform has hit $10M ARR 🚀

As a serial entrepreneur and visionary, I've learned that success is a mindset. We're disrupting the $4 trillion "doing stuff" industry.

Grateful for my team (me). DM me if you want to invest before our Series A.

Agree? 👇

#founder #AI #hustle #grindset`,
  },
  {
    username: "0xGrindLord",
    platform: "x",
    text: `Quit my 9-5 to go full-time on my AI agent startup.

Day 47:
- $0 revenue
- $1M in vibes
- 3 cofounders (2 are GPTs)
- pre-seed closing soon (my uncle is thinking about it)

Building in public. Most of you won't understand this yet. 🧵👇`,
  },
  {
    username: "brayden.hustleworth",
    platform: "linkedin",
    text: `My 6-year-old asked me what I do.

I said: Founder. CEO. Investor. Advisor. Thought Leader. Keynote Speaker.

He asked what my company makes.

I stayed silent.

That's when I realized: the greatest companies are built in silence. 🤫

I'm humbled to be named a Top 1% Voice (by myself).

Agree?`,
  },
  {
    username: "stealthfounder_",
    platform: "x",
    text: `Can't say much yet but we're about to change EVERYTHING.

Stealth mode. Backed by top-tier angels. Ex-FAANG (interviewed once). 10x engineer, 100x visionary.

Waitlist is 50,000 people deep (trust me).

LFG 🚀🚀🚀`,
  },
];

const HUMAN: Sample = {
  username: "priya.codes",
  platform: "linkedin",
  text: `Small update: I passed my AWS Solutions Architect exam this week on my third try. It took a lot of evenings after work.

Thanks to my study group for the practice questions and for putting up with me. On to the next one.`,
};

function tierOf(score: number) {
  if (score < 20) return "Certified human 🌱";
  if (score < 50) return "Mild LinkedIn energy";
  if (score < 70) return "Part-time LARPer";
  if (score < 90) return "Full-time LARPer";
  return "LARP Lord 👑";
}

// A two-tone police siren, synthesized. Wee-woo.
function playSiren() {
  const W = window as unknown as { __sirenCtx?: AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctx = window.AudioContext || W.webkitAudioContext;
  if (!Ctx) return;
  const ctx = (W.__sirenCtx ??= new Ctx());
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "square";
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
  gain.gain.setValueAtTime(0.06, now + 1.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
  for (let i = 0; i < 4; i++) {
    osc.frequency.setValueAtTime(i % 2 ? 620 : 900, now + i * 0.45);
  }
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 2);
}

// Shrink screenshots so they fit under Vercel's request limit.
async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const max = 1568;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<"auto" | "linkedin" | "x">("auto");
  const [loading, setLoading] = useState(false);
  const [line, setLine] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [caseNo, setCaseNo] = useState("0000");
  const [stageOpen, setStageOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const textRef = useRef(text);
  textRef.current = text;
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLine((l) => Math.min(l + 1, LOADING_LINES.length - 1)), 900);
    return () => clearInterval(t);
  }, [loading]);

  // Ctrl+V a screenshot anywhere
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) {
        e.preventDefault();
        const data = await shrinkImage(file);
        setImage(data);
        // Paste a screenshot with an empty text box: skip straight to the investigation.
        if (!textRef.current.trim()) investigate({ image: data });
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc closes the verdict
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) setStageOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading]);

  async function onFile(file?: File) {
    if (file && file.type.startsWith("image/")) setImage(await shrinkImage(file));
  }

  async function investigate(override?: { image?: string | null }) {
    const img = override && "image" in override ? override.image : image;
    setStageOpen(true);
    setTyped("");
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    setLine(0);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          image: img,
          username: username || undefined,
          platform: platform === "auto" ? undefined : platform,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something broke. Probably a LARPer.");
      setResult(data);
      setCaseNo(String(Math.floor(1000 + Math.random() * 9000)));
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (data.larpScore >= 50) {
        playSiren();
        if (!calm) {
          document.body.classList.add("siren");
          setTimeout(() => document.body.classList.remove("siren"), 2000);
        }
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStageOpen(false);
    } finally {
      setLoading(false);
    }
  }

  const isLarp = result ? result.larpScore >= 50 : false;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!result) return;
    const target = result.larpScore;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setShown(target);
    let n = 0;
    setShown(0);
    const t = setInterval(() => {
      n = Math.min(target, n + Math.max(1, Math.round(target / 25)));
      setShown(n);
      if (n >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [result]);

  useEffect(() => {
    if (!result) return;
    const full = result.comment;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTyped(full);
    let i = 0;
    let cleanup = () => {};
    const start = setTimeout(() => {
      const t = setInterval(() => {
        i += 2;
        setTyped(full.slice(0, i));
        if (i >= full.length) clearInterval(t);
      }, 18);
      cleanup = () => clearInterval(t);
    }, 900);
    return () => {
      clearTimeout(start);
      cleanup();
    };
  }, [result]);

  function nextSuspect() {
    setStageOpen(false);
    setResult(null);
    setText("");
    setImage(null);
    setUsername("");
    setPlatform("auto");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handle = (result?.username || username || "").replace(/^@/, "");

  return (
    <div className="page">
      <section className="hero">
        <p className="kicker">Case No. {new Date().getFullYear()}-STUPID · Department of Receipts</p>
        <h1>
          Show me the <mark>product.</mark>
        </h1>
        <p className="lede">
          Paste a LinkedIn or X post. Our AI investigator searches the internet for proof, scores the LARP, and either
          says <b>REAL TALK.</b> or writes the most politely devastating comment you&apos;ve ever posted.
        </p>
      </section>

      <section className="evidence">
        <div className="tab">EXHIBIT A</div>
        <p className="paste-hint">
          <kbd>Ctrl</kbd>+<kbd>V</kbd> a screenshot anywhere on this page and the investigation starts by itself.
        </p>
        <label className="label" htmlFor="post">The post</label>
        <textarea
          id="post"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the 'thrilled and humbled' post here…"
          rows={8}
        />
        <div className="samples">
          <button
            className="linkish"
            type="button"
            onClick={() => {
              const smp = LARPS[sampleIdx % LARPS.length];
              setSampleIdx((i) => i + 1);
              setText(smp.text);
              setUsername(smp.username);
              setPlatform(smp.platform);
            }}
          >
            🎲 load a certified LARP
          </button>
          <button
            className="linkish"
            type="button"
            onClick={() => {
              setText(HUMAN.text);
              setUsername(HUMAN.username);
              setPlatform(HUMAN.platform);
            }}
          >
            🌱 or a suspiciously normal human
          </button>
        </div>

        <div
          className={`drop ${dragging ? "over" : ""} ${image ? "has" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={image ? "Screenshot attached. Press to replace it." : "Attach a screenshot of the post"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFile(e.dataTransfer.files[0]);
          }}
        >
          {image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Screenshot evidence" />
              <button
                className="remove"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImage(null);
                }}
              >
                ✕ remove
              </button>
            </>
          ) : (
            <span>📸 Drop a screenshot, click to upload, or just Ctrl+V it</span>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>

        <div className="row">
          <div className="field">
            <label className="label" htmlFor="user">Suspect&apos;s handle (optional)</label>
            <input id="user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@hustlebro420" />
          </div>
          <div className="field">
            <span className="label">Crime scene</span>
            <div className="seg" role="group" aria-label="Platform">
              {(["auto", "linkedin", "x"] as const).map((p) => (
                <button key={p} type="button" aria-pressed={platform === p} className={platform === p ? "on" : ""} onClick={() => setPlatform(p)}>
                  {p === "auto" ? "Auto" : p === "linkedin" ? "LinkedIn" : "X"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="go" disabled={loading || (!text.trim() && !image)} onClick={() => investigate()}>
          {loading ? "INVESTIGATING…" : "DeLARP THIS 🔎"}
        </button>
        <div aria-live="polite">
          {loading && (
            <div className="investigating">
              <p className="label">Investigation in progress</p>
              <ol>
                {LOADING_LINES.map((l, i) => (
                  <li key={l} className={i < line ? "done" : i === line ? "now" : ""}>
                    {l}
                    {i === line ? "…" : ""}
                  </li>
                ))}
              </ol>
              <div className="bar-loader" />
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              <b>⚠</b>
              <span>
                {error} <br />
                <small>Try again, or paste the text instead of a screenshot.</small>
              </span>
            </p>
          )}
        </div>
      </section>

      {result && (
        <section
          ref={resultRef}
          className={`verdict ${isLarp ? "larp" : "real"}`}
          aria-label={`Verdict: ${isLarp ? "LARP" : "real talk"}, ${result.larpScore} percent`}
          tabIndex={-1}
        >
          <div className="stamp" aria-hidden>{isLarp ? "LARP" : "REAL TALK"}</div>

          <div className="score">
            <div className="num">
              {shown}
              <small>%</small>
            </div>
            <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.larpScore} aria-label="LARP score">
              <div style={{ width: `${result.larpScore}%` }} />
              <span style={{ left: "50%" }} />
            </div>
            <div className="meter-scale" aria-hidden>
              <span>touches grass</span>
              <span>founder of nothing</span>
            </div>
            <p className="tier">{tierOf(result.larpScore)}</p>
          </div>

          <h2>{result.verdictTitle}</h2>
          {result.username && (
            <p className="suspect">
              Suspect: <b>@{result.username.replace(/^@/, "")}</b> on {result.platform === "x" ? "X" : result.platform}
            </p>
          )}
          <p className="summary">{result.summary}</p>

          {isLarp ? (
            <div className="mugshot">
              <div className="lineup" aria-hidden>
                <span className="perp">🤵</span>
                <div className="placard">
                  <b>DeLARP PD</b>
                  <span>@{(result.username || "unknown").replace(/^@/, "")}</span>
                  <span>CASE #{caseNo}</span>
                </div>
              </div>
              <div className="charges">
                <p className="label">Charged with</p>
                <ul>
                  {(result.redFlags.length ? result.redFlags : ["Aggravated buzzword use", "Possession of a vision without a product"])
                    .slice(0, 4)
                    .map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                </ul>
                <dl>
                  <div>
                    <dt>Bail</dt>
                    <dd>1 working product</dd>
                  </div>
                  <div>
                    <dt>Aura lost</dt>
                    <dd>-{(result.larpScore * 1337).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="certified">
              <div className="seal" aria-hidden>
                <span>CERTIFIED</span>
                <b>🫡</b>
                <span>NOT A LARPER</span>
              </div>
              <p>
                Rare sighting: a post with receipts. This person may have touched grass recently. Approach with respect.
              </p>
            </div>
          )}

          <div className="comment">
            <p className="label">{isLarp ? "Your AI-generated reply" : "Recommended reply"}</p>
            <blockquote>{result.comment}</blockquote>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(result.comment);
                setCopied(true);
              }}
            >
              {copied ? "Copied. Go cause damage." : "Copy comment"}
            </button>
          </div>

          {isLarp && (
            <p className="listed">
              {result.listed
                ? `🚨 Added to the LARP List${result.listed.offenses > 1 ? ` (repeat offender, ${result.listed.offenses} strikes)` : ""}. `
                : "🚨 No handle found, so they escape the list. This time. "}
              <Link href="/larp-list">See the LARP List →</Link>
            </p>
          )}

          {result.claims.length > 0 && (
            <div className="block">
              <p className="label">Claims vs. receipts</p>
              <ul className="claims">
                {result.claims.map((c, i) => (
                  <li key={i}>
                    <span className={`pill ${c.verdict.replace(" ", "-")}`}>{c.verdict}</span>
                    <div>
                      <b>{c.claim}</b>
                      <p>{c.evidence}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.buzzwords.length > 0 && (
            <div className="block">
              <p className="label">Buzzword translator</p>
              <dl className="buzz">
                {result.buzzwords.map((b, i) => (
                  <div key={i}>
                    <dt>&ldquo;{b.original}&rdquo;</dt>
                    <dd>{b.translation}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {result.redFlags.length > 0 && (
            <div className="block">
              <p className="label">Red flags</p>
              <div className="flags">
                {result.redFlags.map((f, i) => (
                  <span key={i}>🚩 {f}</span>
                ))}
              </div>
            </div>
          )}

          {(result.searches.length > 0 || result.sources.length > 0) && (
            <div className="block">
              <p className="label">Investigation log</p>
              {result.searches.length > 0 && (
                <p className="searches">Searched: {result.searches.map((s) => `“${s}”`).join(" · ")}</p>
              )}
              <ul className="sources">
                {result.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.mode === "vibes" ? (
            <p className="note">Running in vibes mode (no AI key set), so no real search happened.</p>
          ) : (
            <p className="note">Investigated by Claude Haiku with live web search.</p>
          )}
        </section>
      )}
      {stageOpen && (loading || result) && (
        <div
          className={`stage ${loading ? "is-loading" : result && result.larpScore >= 50 ? "guilty" : "innocent"}`}
          role="dialog"
          aria-modal="true"
          aria-label={loading ? "Investigation in progress" : "Verdict"}
        >
          {loading ? (
            <div className="interrogation">
              <div className="lamp" aria-hidden />
              <p className="stage-kicker">Interrogation room 3 · case #{caseNo === "0000" ? "????" : caseNo}</p>
              <h2 className="stage-title">
                Investigating <span>{username ? `@${username.replace(/^@/, "")}` : "the suspect"}</span>
              </h2>
              <ol className="stage-steps" aria-live="polite">
                {LOADING_LINES.map((l, i) => (
                  <li key={l} className={i < line ? "done" : i === line ? "now" : ""}>
                    {l}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            result && (
              <div className="courtroom">
                <p className="stage-kicker">The Court of Receipts finds</p>
                <p className="defendant">@{handle || "anonymous"}</p>
                <div className="gavel" aria-hidden>
                  {isLarp ? "🔨" : "🫡"}
                </div>
                <div className="big-stamp">{isLarp ? "GUILTY" : "REAL TALK."}</div>
                <p className="charge">
                  {isLarp ? "of LARPing in the first degree" : "Certified not a LARPer. Rare. Respect."}
                </p>
                <div className="stage-score">
                  <b>{shown}%</b>
                  <span>{tierOf(result.larpScore)}</span>
                </div>
                {isLarp && <p className="stage-headline">&ldquo;{result.verdictTitle}&rdquo;</p>}
                <blockquote className="roast">
                  <span className="label">{isLarp ? "Sentenced to this comment" : "Official response"}</span>
                  {typed}
                  <i className="caret" aria-hidden />
                </blockquote>
                <div className="stage-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      navigator.clipboard.writeText(result.comment);
                      setCopied(true);
                    }}
                  >
                    {copied ? "Copied. Go." : isLarp ? "📋 Copy the roast" : "📋 Copy"}
                  </button>
                  <button type="button" onClick={nextSuspect}>
                    ⏭ Next suspect
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStageOpen(false);
                      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
                    }}
                  >
                    🗂 Full case file
                  </button>
                  {isLarp && (
                    <Link href="/larp-list" className="stage-link">
                      🚨 LARP List
                    </Link>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
