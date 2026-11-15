import { auraReport } from "@/lib/aura";
import { getLarpList, getStats } from "@/lib/store";
import { json, preflight } from "@/lib/cors";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/stupid  ->  the whole stupid economy in one payload
export async function GET() {
  const [larpers, stats] = await Promise.all([getLarpList(), getStats()]);
  const debtors = larpers.map((l) => auraReport(l.username, l));
  const totalDebt = debtors.reduce((s, d) => s + d.aura.debt, 0);
  return json({
    api: "DeLARP Stupid API v0.0.1-alpha-final-FINAL(2)",
    endpoints: {
      "GET /api/stupid": "this. the national aura debt.",
      "GET /api/stupid/aura-debt?username=X&platform=linkedin|x": "one person's aura debt statement",
      "GET /api/larp-list": "raw LARP List + metrics",
      "POST /api/analyze": "{ text?, image? (data URL), username?, platform? } -> LARP verdict",
      "POST /api/fart": "register a fart",
    },
    national_aura_debt: totalDebt,
    debt_ceiling: "none. we are so cooked.",
    gdp_in_grass_touched: 0,
    stats,
    most_wanted: debtors.slice(0, 10),
  });
}
