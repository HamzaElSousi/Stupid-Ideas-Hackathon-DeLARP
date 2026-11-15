import { incrStat } from "@/lib/store";
import { track } from "@/lib/amplitude";
import { json, preflight } from "@/lib/cors";

export function OPTIONS() {
  return preflight();
}

// POST: someone pressed FARTY PARTY. Returns the global fart count.
export async function POST(req: Request) {
  const { combo = 1 } = await req.json().catch(() => ({}));
  const farts = await incrStat("farts");
  await track("farty_party_pressed", { combo, global_farts: farts });
  return json({
    farts,
    combo,
    message: farts % 69 === 0 ? "Nice. Milestone fart." : "Fart registered with the authorities.",
  });
}
