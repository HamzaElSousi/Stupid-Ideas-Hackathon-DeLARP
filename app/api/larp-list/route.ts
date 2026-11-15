import { getLarpList, getStats, storageMode } from "@/lib/store";
import { json, preflight } from "@/lib/cors";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET() {
  const [larpers, stats] = await Promise.all([getLarpList(), getStats()]);
  return json({ storage: storageMode, stats, larpers });
}
