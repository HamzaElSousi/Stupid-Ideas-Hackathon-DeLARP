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
      <section className="collab" aria-labelledby="collab-title">
        <span className="collab-stamp" aria-hidden>
          Joint operation
        </span>
        <h1 id="collab-title">
          DeLARP <span aria-hidden>×</span> <span className="sr-only">and</span> AURA DEBT
        </h1>
        <p className="collab-lede">
          This API powers <b>AURA DEBT</b>, a parody bank that audits your cringe, built by{" "}
          <a href="https://github.com/mansijoshi04" target="_blank" rel="noreferrer">
            @mansijoshi04
          </a>{" "}
          and team at this same hackathon. Their LARP check sends posts to our investigator, and our verdict lands in
          their ledger as an aura fine. Two stupid ideas, one economy.
        </p>
        <ol className="flow" aria-label="How the two apps connect">
          <li>
            <b>AURA DEBT</b>
            <span>you paste a post</span>
          </li>
          <li className="us">
            <b>DeLARP API</b>
            <span>we look for receipts</span>
          </li>
          <li>
            <b>Their ledger</b>
            <span>−8,800 aura, plus a side quest</span>
          </li>
        </ol>
        <div className="collab-links">
          <a className="btn-primary" href="https://aura-debt.vercel.app/" target="_blank" rel="noreferrer">
            Open AURA DEBT
          </a>
          <a className="btn-secondary" href="https://github.com/mansijoshi04/sih_project" target="_blank" rel="noreferrer">
            See their code on GitHub
          </a>
        </div>
      </section>

      <section className="hero">
        <h2 className="api-title">The Stupid API</h2>
        <p className="lede">
          Real endpoints, real JSON, completely useless data. No key, no rate limits, CORS wide open, because nothing here
          should be trusted anyway.
        </p>
      </section>

      <section className="debt-clock" aria-live="off">
        <p className="label">National aura debt, accruing live</p>
        <b>{data ? `-${debt.toLocaleString()}` : "calculating…"}</b>
        <p className="debt-sub">
          {data
            ? `${data.most_wanted.length} debtors, ${data.stats.larpsCaught} LARPs caught. Debt ceiling: none. GDP in grass touched: 0.`
            : " "}
        </p>
      </section>

      <section className="lookup">
                <form onSubmit={lookup}>
          <label className="lookup-title" htmlFor="h">
            Run a credit check on anyone
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

      <section className="endpoints">
        <h2 className="api-title small">Endpoints</h2>
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
                  {out?.loading ? "Calling…" : "Try it live"}
                </button>
                <pre className="example">{e.example}</pre>
              </div>
              {out?.body && (
                <div className="response">
                  <div className="response-head">
                    <span>{out.status} · {out.ms} ms</span>
                    <button type="button" onClick={() => setOutputs((o) => ({ ...o, [e.path]: { loading: false } }))}>
                      Close
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
        <h2 className="api-title small">Fine print</h2>
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
