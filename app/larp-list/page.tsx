import Link from "next/link";
import { getLarpList, getStats, storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function LarpListPage() {
  const [larpers, stats] = await Promise.all([getLarpList(), getStats()]);
  const platformTotal = stats.byPlatform.linkedin + stats.byPlatform.x + stats.byPlatform.unknown || 1;
  const larpRate = stats.scans ? Math.round((stats.larpsCaught / stats.scans) * 100) : 0;

  const platforms = [
    { key: "linkedin", name: "LinkedIn", n: stats.byPlatform.linkedin },
    { key: "x", name: "X", n: stats.byPlatform.x },
    { key: "unknown", name: "Unknown", n: stats.byPlatform.unknown },
  ];

  return (
    <div className="page">
      <section className="hero">
        <p className="kicker">Department of Receipts, LARP Division</p>
        <h1>
          Most wanted
        </h1>
        <p className="lede">Everyone who scored 50% or higher. Sorted by LARP score × times caught. If you&apos;re on here, the fastest way off is shipping something.</p>
      </section>

      <section className="metrics">
        <div>
          <b>{larpers.length}</b>
          <span>larpers on file</span>
        </div>
        <div>
          <b>{stats.scans}</b>
          <span>posts investigated</span>
        </div>
        <div>
          <b>{larpRate}%</b>
          <span>national LARP rate</span>
        </div>
        <div>
          <b>{stats.realTalks}</b>
          <span>REAL TALKs issued</span>
        </div>
        <div>
          <b>{stats.auraDestroyed.toLocaleString()}</b>
          <span>aura destroyed</span>
        </div>
        <div>
          <b>{stats.farts.toLocaleString()}</b>
          <span>farts partied</span>
        </div>
      </section>

      <section className="platforms">
        <p className="label">Where they were caught</p>
        {platforms.map((p) => (
          <div key={p.key} className="bar">
            <span>{p.name}</span>
            <div>
              <i className={p.key} style={{ width: `${(p.n / platformTotal) * 100}%` }} />
            </div>
            <b>{p.n}</b>
          </div>
        ))}
      </section>

      <section className="list">
        {larpers.length === 0 ? (
          <p className="empty">
            Nobody on the list yet. Either the internet got honest overnight, or nobody has looked. <Link href="/">Go catch someone →</Link>
          </p>
        ) : (
          <ol>
            {larpers.map((l, i) => (
              <li key={l.key}>
                <span className="rank">#{i + 1}</span>
                <div className="who">
                  <b>@{l.username}</b>
                  <span className={`plat ${l.platform}`}>{l.platform === "x" ? "X" : l.platform}</span>
                  <p>{l.lastVerdict}</p>
                  <q>{l.lastComment}</q>
                </div>
                <div className="nums">
                  <b>{l.larpScore}%</b>
                  <span className="reward">reward: 0 aura</span>
                  <span>
                    {l.offenses} strike{l.offenses > 1 ? "s" : ""} · {ago(l.lastCaught)}
                  </span>
                  <a href={`/api/stupid/aura-debt?username=${encodeURIComponent(l.username)}&platform=${l.platform}`} target="_blank">
                    aura debt →
                  </a>
                </div>
              </li>
            ))}
          </ol>
        )}
        {storageMode === "memory" && (
          <p className="note">Storage: memory mode. Add Upstash Redis on Vercel so the list survives.</p>
        )}
      </section>
    </div>
  );
}
