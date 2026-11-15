import type { Larper } from "./store";

// Deterministic "randomness" so the same username always owes the same stupid amount.
function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h);
}

const CREDIT_RATINGS = ["AAA (Actually Accomplished A lot)", "BB (Bit Braggy)", "C (Crunchbase-less)", "D (Delusional)", "F (Founder of nothing)"];
const COLLECTORS = ["Your mom", "A guy named Bob from collections", "The ghost of your Series A", "Three unpaid interns", "The Ottawa Tech Council of Vibes"];
const PAYMENT_PLANS = [
  "Post one (1) screenshot of actual revenue",
  "Touch grass for 3 consecutive business days",
  "Remove 'Visionary' from your headline",
  "Ship literally anything",
  "Reply 'I lied' under your last 4 posts",
  "Delete the word 'humbled' from your vocabulary",
  "Commit to GitHub once. Just once.",
];

export function auraReport(username: string, larper: Larper | null) {
  const clean = username.replace(/^@/, "").trim();
  const h = hash(clean.toLowerCase());
  const score = larper?.larpScore ?? h % 50; // non-listed people get a "clean-ish" score
  const offenses = larper?.offenses ?? 0;
  const debt = larper ? score * 1337 + offenses * 4200 + (h % 69) : 0;
  const balance = larper ? -debt : 10 + (h % 900);
  const ratingIdx = larper ? Math.min(4, Math.floor(score / 22)) : 0;

  return {
    username: clean,
    platform: larper?.platform ?? "unknown",
    on_larp_list: Boolean(larper),
    larp_score: score,
    offenses,
    aura: {
      balance,
      debt,
      currency: "AURA",
      usd_equivalent: "$0.00 (aura is not legal tender, sadly)",
      apr: larper ? `${(42 + (h % 28)).toFixed(3)}% compounded every time they post` : "0% (they're fine)",
      minimum_payment: larper ? PAYMENT_PLANS[h % PAYMENT_PLANS.length] : "none",
      credit_rating: CREDIT_RATINGS[ratingIdx],
      collections_agent: larper ? COLLECTORS[h % COLLECTORS.length] : null,
      bailout_eligible: false,
    },
    vibes: {
      grass_touched_this_week: larper ? 0 : 1 + (h % 7),
      hustle_to_output_ratio: larper ? `${100 + (h % 900)}:0` : `${1 + (h % 3)}:1`,
      buzzwords_per_post: larper ? 4 + (h % 12) : h % 2,
      estimated_real_users: larper ? (h % 3 === 0 ? "their cofounder's mom" : 0) : "unknown but probably real",
    },
    last_known_verdict: larper?.lastVerdict ?? null,
    last_known_comment: larper?.lastComment ?? null,
    disclaimer: "This data is stupid. Do not use for lending decisions. Or any decisions.",
    issued_by: "DeLARP Bureau of Aura Enforcement",
    generated_at: new Date().toISOString(),
  };
}
