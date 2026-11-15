"use client";

import { useEffect, useState } from "react";

type Stupid = {
  national_aura_debt: number;
  stats: { scans: number; larpsCaught: number; realTalks: number; farts: number; auraDestroyed: number };
  most_wanted: { username: string; aura: { debt: number; credit_rating: string } }[];
};

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  title: string;
  what: string;
  example: string;
  run: () => Promise<Response>;
};

const SAMPLE_POST =
  "Humbled to announce my stealth AI startup just hit $5M ARR in 6 weeks. Pre-product, but post-vision. DM me to invest. Agree?";

export default function StupidApiPage() {
  const [data, setData] = useState<Stupid | null>(null);
  const [debt, setDebt] = useState(0);
  const [handle, setHandle] = useState("");
  const [statement, setStatement] = useState<unknown>(null);
  const [looking, setLooking] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, { loading: boolean; body?: string; ms?: number; status?: number }>>({});

  useEffect(() => {
    fetch("/api/stupid")
      .then((r) => r.json())
      .then((d: Stupid) => {
        setData(d);
        setDebt(d.national_aura_debt);
      })
      .catch(() => {});
  }, []);

  // Interest accrues live, because of course it does.
  useEffect(() => {
    if (!data) return;
    const t = setInterval(() => setDebt((d) => d + 42 + Math.floor(Math.random() * 27)), 700);
    return () => clearInterval(t);
  }, [data]);

  const endpoints: Endpoint[] = [
    {
      method: "GET",
      path: "/api/stupid",
      title: "The national aura debt",
      what: "Every LARPer's statement, the total debt, the debt ceiling (none), and GDP measured in grass touched (0).",
      example: "GET /api/stupid",
      run: () => fetch("/api/stupid"),
    },
    {
      method: "GET",
      path: "/api/stupid/aura-debt?username=…",
      title: "One person's aura statement",
      what: "Balance, APR compounded every time they post, credit rating, collections agent, and the minimum payment to get out of debt.",
      example: "GET /api/stupid/aura-debt?username=chad.ventures",
      run: () => fetch(`/api/stupid/aura-debt?username=${encodeURIComponent(data?.most_wanted[0]?.username || "chad.ventures")}`),
    },
    {
      method: "POST",
      path: "/api/analyze",
      title: "Investigate a post",
      what: "Send a post's text or a screenshot. Claude searches for receipts and returns a LARP score, a roast, and an aura fine. This is the one AURA DEBT calls. Takes about 10 seconds.",
      example: `POST /api/analyze\n{ "text": "${SAMPLE_POST.slice(0, 48)}…" }`,
      run: () =>
        fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: SAMPLE_POST }),
        }),
    },
    {
      method: "GET",
      path: "/api/larp-list",
      title: "The LARP List, raw",
      what: "The wanted board as JSON, plus the stupid metrics: LARPers by platform, posts investigated, aura destroyed, farts.",
      example: "GET /api/larp-list",
      run: () => fetch("/api/larp-list"),
    },
    {
      method: "POST",
      path: "/api/fart",
      title: "Register a fart",
      what: "Logs one press of the button you were told not to press. Returns the global count. Reported to the authorities.",
      example: "POST /api/fart",
      run: () => fetch("/api/fart", { method: "POST", body: JSON.stringify({ combo: 1 }) }),
    },
  ];

  async function tryIt(e: Endpoint) {
    setOutputs((o) => ({ ...o, [e.path]: { loading: true } }));
    const t0 = performance.now();
    try {
      const r = await e.run();
      const j = await r.json();
      setOutputs((o) => ({
        ...o,
        [e.path]: { loading: false, status: r.status, ms: Math.round(performance.now() - t0), body: JSON.stringify(j, null, 2) },
      }));
    } catch (err) {
      setOutputs((o) => ({ ...o, [e.path]: { loading: false, body: String(err) } }));
    }
  }

  async function lookup(ev: React.FormEvent) {
    ev.preventDefault();
    if (!handle.trim()) return;
    setLooking(true);
    try {
      const r = await fetch(`/api/stupid/aura-debt?username=${encodeURIComponent(handle.trim())}`);
      setStatement(await r.json());
    } finally {
      setLooking(false);
    }
  }

  const st = statement as null | {
    username: string;
    on_larp_list: boolean;
    larp_score: number;
    aura: { balance: number; apr: string; minimum_payment: string; credit_rating: string; collections_agent: string | null };
    vibes: { hustle_to_output_ratio: string; grass_touched_this_week: number };
  };

  return (
    <div className="page wide">
      <section className="hero">
        <p className="kicker">Public API · v0.0.1-alpha-final-FINAL(2)</p>
        <h1>
          The <mark>Stupid</mark> API
        </h1>
        <p className="lede">
          Real endpoints. Real JSON. Completely useless data. Free to call, no key, CORS wide open, because nothing here
          should be trusted anyway.
        </p>
      </section>

      <section className="debt-clock" aria-live="off">
        <p className="label">National aura debt · accruing live</p>
        <b>{data ? `-${debt.toLocaleString()}` : "calculating…"}</b>
        <p className="debt-sub">
          {data
            ? `${data.most_wanted.length} debtors · ${data.stats.larpsCaught} LARPs caught · debt ceiling: none · GDP in grass touched: 0`
            : " "}
        </p>
      </section>

      <section className="lookup">
        <div className="tab">CREDIT CHECK</div>
        <form onSubmit={lookup}>
          <label className="label" htmlFor="h">
            Pull anyone&apos;s aura statement
          </label>
          <div className="lookup-row">
            <input id="h" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" />
            <button type="submit" className="lookup-go" disabled={looking || !handle.trim()}>
              {looking ? "Pulling…" : "Run credit check"}
            </button>
          </div>
          {data && data.most_wanted.length > 0 && (
            <p className="chips">
              Try:{" "}
              {data.most_wanted.slice(0, 4).map((d) => (
                <button key={d.username} type="button" onClick={() => setHandle(d.username)}>
                  @{d.username}
                </button>
              ))}
            </p>
          )}
        </form>

        {st && (
          <div className={`statement ${st.on_larp_list ? "bad" : "good"}`}>
            <div className="statement-head">
              <span>DeLARP Bureau of Aura Enforcement</span>
              <span>Statement for @{st.username}</span>
            </div>
            <div className="statement-balance">
              <span className="label">Balance</span>
              <b>{st.aura.balance.toLocaleString()} AURA</b>
            </div>
            <dl>
              <div>
                <dt>Credit rating</dt>
                <dd>{st.aura.credit_rating}</dd>
              </div>
              <div>
                <dt>APR</dt>
                <dd>{st.aura.apr}</dd>
              </div>
              <div>
                <dt>Minimum payment</dt>
                <dd>{st.aura.minimum_payment}</dd>
              </div>
              <div>
                <dt>Collections agent</dt>
                <dd>{st.aura.collections_agent ?? "None. They're fine."}</dd>
              </div>
              <div>
                <dt>Hustle to output</dt>
                <dd>{st.vibes.hustle_to_output_ratio}</dd>
              </div>
              <div>
                <dt>Grass touched this week</dt>
                <dd>{st.vibes.grass_touched_this_week}</dd>
              </div>
            </dl>
            {!st.on_larp_list && <p className="statement-note">Not on the LARP List. Account in good standing. Suspicious.</p>}
          </div>
        )}
      </section>

      <section className="powering">
        <p className="label">Powering other people&apos;s bad ideas</p>
        <h2>AURA DEBT runs on this API</h2>
        <p>
          Another team at this hackathon built <b>AURA DEBT</b>, a parody bank that audits your cringe. Its{" "}
          <b>LARP check</b> sends posts to our <code>POST /api/analyze</code>, and our verdict lands in their ledger as an
          aura fine, with a side quest to pay it off. Two stupid ideas, one economy.
        </p>
        <div className="flow" aria-hidden>
          <span>AURA DEBT</span>
          <i>→ post →</i>
          <span className="us">DeLARP API</span>
          <i>→ −8,800 aura →</i>
          <span>their ledger</span>
        </div>
        <a href="https://github.com/mansijoshi04/sih_project" target="_blank" rel="noreferrer" className="ext">
          See AURA DEBT on GitHub →
        </a>
      </section>

      <section className="endpoints">
        <p className="label">Endpoints</p>
        {endpoints.map((e) => {
          const out = outputs[e.path];
          return (
            <article key={e.path} className="endpoint">
              <header>
                <span className={`verb ${e.method.toLowerCase()}`}>{e.method}</span>
                <code>{e.path}</code>
              </header>
              <h3>{e.title}</h3>
              <p>{e.what}</p>
              <div className="endpoint-actions">
                <button type="button" onClick={() => tryIt(e)} disabled={out?.loading}>
                  {out?.loading ? "Calling…" : "▶ Try it live"}
                </button>
                <pre className="example">{e.example}</pre>
              </div>
              {out?.body && (
                <div className="response">
                  <div className="response-head">
                    <span>{out.status} · {out.ms} ms</span>
                    <button type="button" onClick={() => setOutputs((o) => ({ ...o, [e.path]: { loading: false } }))}>
                      ✕
                    </button>
                  </div>
                  <pre>{out.body}</pre>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="errors">
        <p className="label">Fine print</p>
        <ul>
          <li>
            <b>Rate limits:</b> none. The aura economy is already in freefall.
          </li>
          <li>
            <b>Auth:</b> none. Nobody is pretending to protect this data.
          </li>
          <li>
            <b>SLA:</b> 99.9% uptime, 0% usefulness.
          </li>
          <li>
            <b>Disclaimer:</b> do not use for lending decisions. Or any decisions.
          </li>
        </ul>
      </section>
    </div>
  );
}
