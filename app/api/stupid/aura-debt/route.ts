import { auraReport } from "@/lib/aura";
import { getLarper, larperKey, type Platform } from "@/lib/store";
import { json, preflight } from "@/lib/cors";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

// GET /api/stupid/aura-debt?username=elonfan69&platform=x
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  if (!username) {
    return json(
      { error: "Who owes aura? Pass ?username=", example: "/api/stupid/aura-debt?username=elonfan69&platform=x" },
      { status: 400 }
    );
  }
  const platformParam = searchParams.get("platform") as Platform | null;
  const platforms: Platform[] = platformParam ? [platformParam] : ["linkedin", "x", "unknown"];
  let larper = null;
  for (const p of platforms) {
    larper = await getLarper(larperKey(p, username));
    if (larper) break;
  }
  return json(auraReport(username, larper));
}
