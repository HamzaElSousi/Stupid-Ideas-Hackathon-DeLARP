"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Puff = { id: number; x: number; y: number; emoji: string; dx: number; rot: number; size: number };

const EMOJIS = ["💨", "💨", "💨", "🍑", "🎉", "🪩", "💩", "🫘"];
const CALLOUTS = [
  "FARTY PARTY",
  "SHE'S BLOWING",
  "SERIES B(EANS)",
  "PRE-REVENUE, POST-BURRITO",
  "DISRUPTING THE AIR",
  "TOXIC ASSET",
  "PIVOT TO GAS",
  "10X ENGINEER, 100X EMISSIONS",
];

// Synthesized in the browser: no audio files, no copyright, all gas.
function playFart(intensity: number) {
  const W = window as unknown as { __fartCtx?: AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctx = window.AudioContext || W.webkitAudioContext;
  if (!Ctx) return;
  const ctx = (W.__fartCtx ??= new Ctx());
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const dur = 0.35 + Math.random() * 0.6 + Math.min(intensity, 10) * 0.05;
  const base = 55 + Math.random() * 60;

  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(0.8, now + 0.03);
  out.gain.setValueAtTime(0.8, now + dur * 0.6);
  out.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500 + Math.random() * 500;
  filter.Q.value = 4;
  filter.connect(out).connect(ctx.destination);

  // the "voice" of the fart
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(base * 1.3, now);
  osc.frequency.exponentialRampToValueAtTime(base * 0.7, now + dur);

  // the flappy wobble
  const lfo = ctx.createOscillator();
  lfo.type = "square";
  lfo.frequency.setValueAtTime(14 + Math.random() * 18, now);
  lfo.frequency.linearRampToValueAtTime(8 + Math.random() * 6, now + dur);
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = base * 0.45;
  lfo.connect(lfoGain).connect(osc.frequency);

  // a bit of wet noise
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * 0.35;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.25;

  osc.connect(filter);
  noise.connect(noiseGain).connect(filter);
  [osc, lfo, noise].forEach((n) => {
    n.start(now);
    n.stop(now + dur + 0.05);
  });
}

export default function FartyParty() {
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const [combo, setCombo] = useState(0);
  const [callout, setCallout] = useState<string | null>(null);
  const [globalFarts, setGlobalFarts] = useState<number | null>(null);
  const comboTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const idRef = useRef(0);

  const fart = useCallback(() => {
    const next = combo + 1;
    setCombo(next);
    clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), 1800);

    playFart(next);

    const count = 10 + Math.min(next, 12) * 3;
    const fresh: Puff[] = Array.from({ length: count }, () => ({
      id: idRef.current++,
      x: 70 + Math.random() * 25,
      y: 75 + Math.random() * 15,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      dx: -(20 + Math.random() * 70),
      rot: Math.random() * 720 - 360,
      size: 1.5 + Math.random() * 2.5,
    }));
    setPuffs((p) => [...p.slice(-120), ...fresh]);
    setTimeout(() => setPuffs((p) => p.filter((x) => !fresh.includes(x))), 2200);

    setCallout(CALLOUTS[Math.floor(Math.random() * CALLOUTS.length)]);

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!calm) {
      document.body.classList.remove("shake");
      void document.body.offsetWidth;
      document.body.classList.add("shake");
      if (next >= 5) document.body.classList.add("disco");
    }
    if (next >= 10) document.body.classList.add("toxic");

    fetch("/api/fart", { method: "POST", body: JSON.stringify({ combo: next }) })
      .then((r) => r.json())
      .then((d) => setGlobalFarts(d.farts))
      .catch(() => {});
  }, [combo]);

  useEffect(() => {
    if (combo === 0) {
      document.body.classList.remove("disco", "toxic");
      setCallout(null);
    }
  }, [combo]);

  return (
    <>
      <div className="fart-layer" aria-hidden>
        {puffs.map((p) => (
          <span
            key={p.id}
            className="puff"
            style={
              {
                left: `${p.x}vw`,
                top: `${p.y}vh`,
                fontSize: `${p.size}rem`,
                "--dx": `${p.dx}vw`,
                "--rot": `${p.rot}deg`,
              } as React.CSSProperties
            }
          >
            {p.emoji}
          </span>
        ))}
        {callout && (
          <div className="callout" key={combo}>
            {callout}
            {combo > 1 && <small>COMBO x{combo}</small>}
          </div>
        )}
      </div>
      <button
        className="farty"
        onClick={fart}
        title="Does absolutely nothing useful"
        aria-label={`Farty party. Plays a fart sound.${globalFarts !== null ? ` ${globalFarts} global farts so far.` : ""}`}
      >
        <span>FARTY</span>
        <span>PARTY</span>
        {globalFarts !== null && <em>{globalFarts.toLocaleString()} global farts</em>}
      </button>
    </>
  );
}
