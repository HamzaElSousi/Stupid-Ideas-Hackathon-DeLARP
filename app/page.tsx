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

const SAMPLE = `Thrilled and humbled to announce that after 3 months in stealth, my AI-powered Web3 platform has hit $10M ARR 🚀

As a serial entrepreneur and visionary, I've learned that success is a mindset. We're disrupting the $4 trillion "doing stuff" industry.

Grateful for my team (me). DM me if you want to invest before our Series A.

Agree? 👇

#founder #AI #hustle #grindset`;

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
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLine((l) => Math.min(l + 1, LOADING_LINES.length - 1)), 2600);
    return () => clearInterval(t);
  }, [loading]);

  // Ctrl+V a screenshot anywhere
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) {
        e.preventDefault();
        setImage(await shrinkImage(file));
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function onFile(file?: File) {
    if (file && file.type.startsWith("image/")) setImage(await shrinkImage(file));
  }

  async function investigate() {
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
          image,
          username: username || undefined,
          platform: platform === "auto" ? undefined : platform,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something broke. Probably a LARPer.");
      setResult(data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        resultRef.current?.focus({ preventScroll: true });
      }, 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
        <label className="label" htmlFor="post">The post</label>
        <textarea
          id="post"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the 'thrilled and humbled' post here…"
          rows={8}
        />
        <button className="linkish" onClick={() => setText(SAMPLE)} type="button">
          no post handy? load a certified LARP
        </button>

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

        <button className="go" disabled={loading || (!text.trim() && !image)} onClick={investigate}>
          {loading ? "INVESTIGATING…" : "DeLARP THIS"}
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
            <p className="label">LARP score</p>
          </div>

          <h2>{result.verdictTitle}</h2>
          {result.username && (
            <p className="suspect">
              Suspect: <b>@{result.username.replace(/^@/, "")}</b> on {result.platform === "x" ? "X" : result.platform}
            </p>
          )}
          <p className="summary">{result.summary}</p>

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
            <p className="note">Investigated by {result.provider === "gemini" ? "Gemini + Google Search" : "Claude + web search"}.</p>
          )}
        </section>
      )}
    </div>
  );
}
