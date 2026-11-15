"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- original cartoon suspects (drawn here, no outside art) ---------- */
function VestBro() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden>
      <rect width="120" height="120" fill="#cfd8dc" />
      <path d="M18 120c4-26 20-38 42-38s38 12 42 38z" fill="#5b7fa6" />
      <path d="M34 120l8-34 18 14 18-14 8 34z" fill="#3f4a52" />
      <path d="M52 84h16l-8 14z" fill="#fff" />
      <circle cx="60" cy="52" r="24" fill="#f1c7a3" />
      <path d="M36 46c2-18 14-24 24-24s24 6 26 22c-8-6-18-10-26-10s-16 4-24 12z" fill="#7a4b2a" />
      <rect x="40" y="46" width="40" height="10" rx="3" fill="#111" />
      <path d="M50 64q10 7 20 0" stroke="#7a3e2a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="86" cy="56" r="3.5" fill="#fff" stroke="#999" />
    </svg>
  );
}

function Nomad() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden>
      <rect width="120" height="120" fill="#8fd3f4" />
      <circle cx="98" cy="22" r="10" fill="#ffd54a" />
      <rect y="92" width="120" height="28" fill="#f2d49b" />
      <path d="M24 120c4-22 18-32 36-32s32 10 36 32z" fill="#ff8a65" />
      <circle cx="60" cy="58" r="21" fill="#e9b48c" />
      <ellipse cx="60" cy="40" rx="34" ry="7" fill="#d9b26f" />
      <path d="M44 40c0-14 8-20 16-20s16 6 16 20z" fill="#e8c27f" />
      <rect x="44" y="52" width="13" height="9" rx="4" fill="#222" />
      <rect x="63" y="52" width="13" height="9" rx="4" fill="#222" />
      <path d="M57 56h6" stroke="#222" strokeWidth="2" />
      <path d="M52 68q8 6 16 0" stroke="#8a4b2a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M86 90l10-26" stroke="#555" strokeWidth="3" />
      <rect x="90" y="56" width="12" height="16" rx="2" fill="#333" transform="rotate(20 96 64)" />
    </svg>
  );
}

function CryptoBro() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden>
      <rect width="120" height="120" fill="#2b2d42" />
      <path d="M20 120c4-26 20-38 40-38s36 12 40 38z" fill="#444b5a" />
      <path d="M40 84c6 8 34 8 40 0" stroke="#d4af37" strokeWidth="3" fill="none" />
      <circle cx="60" cy="96" r="7" fill="#d4af37" />
      <text x="60" y="100" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2b2d42">₿</text>
      <path d="M32 58c0-22 12-34 28-34s28 12 28 34c0 4-2 4-4 2-4-16-14-20-24-20s-20 4-24 20c-2 2-4 2-4-2z" fill="#444b5a" />
      <circle cx="60" cy="58" r="20" fill="#d9a77f" />
      <path d="M50 54L-6 34" stroke="#ff2a2a" strokeWidth="5" strokeLinecap="round" className="laser" />
      <path d="M70 54l56-20" stroke="#ff2a2a" strokeWidth="5" strokeLinecap="round" className="laser" />
      <circle cx="51" cy="55" r="4" fill="#ff2a2a" />
      <circle cx="69" cy="55" r="4" fill="#ff2a2a" />
      <path d="M52 68h16" stroke="#6b3a24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type Item = {
  id: string;
  kind: "polaroid" | "note" | "card";
  x: number; // % of board
  y: number;
  r: number; // rotation
  claim: string;
  truth: string;
  art?: () => React.JSX.Element;
  tone?: string;
};

const ITEMS: Item[] = [
  { id: "p1", kind: "polaroid", x: 3, y: 30, r: -6, art: VestBro, claim: "“Founder & CEO”", truth: "Founder of a Notion page" },
  { id: "p2", kind: "polaroid", x: 81, y: 24, r: 5, art: Nomad, claim: "“Digital nomad”", truth: "Lives at mom's. 1 beach pic" },
  { id: "p3", kind: "polaroid", x: 67, y: 60, r: -4, art: CryptoBro, claim: "“Angel investor”", truth: "Bought $40 of Doge in 2021" },
  { id: "n4", kind: "note", x: 21, y: 29, r: -3, tone: "#9fd4ff", claim: "Top 1% Voice in Leadership", truth: "Nominated by himself" },
  { id: "n3", kind: "note", x: 60, y: 27, r: 3, tone: "#9ee6a5", claim: "“My gf is a model, you wouldn't know her”", truth: "She goes to another school" },
  { id: "n1", kind: "note", x: 4, y: 71, r: 4, tone: "#ffe86b", claim: "$10M ARR in 3 months??", truth: "$0 ARR, $10M in vibes" },
  { id: "n2", kind: "note", x: 41, y: 75, r: -5, tone: "#ff9fc4", claim: "Dubai, Monaco, Bali. On a Tuesday.", truth: "Same 3 photos since 2019" },
  { id: "c1", kind: "card", x: 33, y: 48, r: -2, claim: "NO RECEIPTS FOUND", truth: "WE CHECKED. NOTHING." },
];

// pin positions (center-top of each item) for the red string, in % of board
const PIN: Record<string, [number, number]> = {
  p1: [11, 31], p2: [89, 25], p3: [75, 61], n4: [30, 30], n3: [69, 28], n1: [13, 72], n2: [50, 76],
};
const HUB: [number, number] = [50, 52];

const RANSOM = "RECEIPTS, PLEASE.";

function Board({ truth }: { truth?: boolean }) {
  return (
    <div className={`eb-layer ${truth ? "eb-truth" : ""}`} aria-hidden={truth ? true : undefined}>
      {!truth && (
        <svg className="eb-strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {Object.entries(PIN).map(([id, [x, y]], i) => (
            <line key={id} x1={x} y1={y} x2={HUB[0]} y2={HUB[1]} style={{ animationDelay: `${0.4 + i * 0.12}s` }} />
          ))}
        </svg>
      )}
      {ITEMS.map((it) => {
        const Art = it.art;
        const style = { left: `${it.x}%`, top: `${it.y}%`, "--r": `${it.r}deg`, background: it.tone } as React.CSSProperties;
        const text = truth ? it.truth : it.claim;
        if (it.kind === "polaroid" && Art)
          return (
            <figure key={it.id} className="eb-polaroid" data-id={it.id} style={style}>
              <i className="eb-pin" />
              <Art />
              <figcaption>{text}</figcaption>
            </figure>
          );
        if (it.kind === "note")
          return (
            <div key={it.id} className="eb-note" data-id={it.id} style={style}>
              <i className="eb-pin" />
              {text}
            </div>
          );
        return (
          <div key={it.id} className="eb-card" data-id={it.id} style={style}>
            {text}
          </div>
        );
      })}
    </div>
  );
}

export default function EvidenceBoard() {
  const ref = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(true);
  const user = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      if (!user.current) {
        const s = (t - t0) / 1000;
        // lazy figure-eight sweep across the evidence
        const x = 50 + 36 * Math.sin(s * 0.55);
        const y = 45 + 26 * Math.sin(s * 1.1);
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
      }
      raf = requestAnimationFrame(tick);
    };
    if (!reduce) raf = requestAnimationFrame(tick);
    else {
      el.style.setProperty("--mx", "50%");
      el.style.setProperty("--my", "42%");
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    user.current = true;
    setHint(false);
    el.style.setProperty("--mx", `${((e.clientX - b.left) / b.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - b.top) / b.height) * 100}%`);
  }

  return (
    <section className="evidence-board" aria-label="Evidence board">
      <div
        ref={ref}
        className="eb"
        onPointerMove={move}
        onPointerDown={move}
        onPointerLeave={() => {
          user.current = false;
        }}
      >
        <Board />
        <Board truth />
        <div className="eb-lens" aria-hidden>
          <span className="eb-handle" />
        </div>
        <h1 className="ransom" aria-label="Receipts, please.">
          {RANSOM.split("").map((ch, i) =>
            ch === " " ? (
              <span key={i} className="sp" />
            ) : (
              <span key={i} className={`r${i % 6}`} style={{ "--rr": `${((i * 37) % 13) - 6}deg` } as React.CSSProperties} aria-hidden>
                {ch}
              </span>
            )
          )}
        </h1>
      </div>
      <p className={`eb-hint ${hint ? "" : "gone"}`}>Move the magnifying glass over the evidence to see the truth.</p>
    </section>
  );
}
