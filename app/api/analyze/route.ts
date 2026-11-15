import { analyzePost } from "@/lib/analyze";
import { addLarper, incrStat, type Platform } from "@/lib/store";
import { track } from "@/lib/amplitude";
import { json, preflight } from "@/lib/cors";

export const runtime = "nodejs";
export const maxDuration = 60;

export function OPTIONS() {
  return preflight();
}

export async function POST(req: Request) {
  let body: {
    text?: string;
    image?: string; // data URL or raw base64
    imageType?: string;
    username?: string;
    platform?: Platform;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Send JSON. Even LARPers send JSON." }, { status: 400 });
  }

  const text = body.text?.slice(0, 8000);
  let image: { data: string; mediaType: string } | undefined;
  if (body.image) {
    const m = body.image.match(/^data:(image\/[a-z+]+);base64,(.*)$/);
    image = m
      ? { mediaType: m[1], data: m[2] }
      : { mediaType: body.imageType || "image/jpeg", data: body.image };
  }
  if (!text?.trim() && !image) {
    return json({ error: "Paste a post or drop a screenshot. We can't de-larp the void." }, { status: 400 });
  }

  try {
    const analysis = await analyzePost({
      text,
      image,
      usernameHint: body.username?.trim() || undefined,
      platformHint: body.platform,
    });

    await incrStat("scans");
    let listed = null;
    if (analysis.larpScore >= 50) {
      await incrStat("larpsCaught");
      await incrStat("auraDestroyed", analysis.larpScore * 1337);
      if (analysis.username) {
        listed = await addLarper({
          username: analysis.username,
          platform: analysis.platform,
          larpScore: analysis.larpScore,
          verdict: analysis.verdictTitle,
          comment: analysis.comment,
        });
      }
    } else {
      await incrStat("realTalks");
    }

    await track("post_delarped", {
      larp_score: analysis.larpScore,
      platform: analysis.platform,
      verdict: analysis.larpScore >= 50 ? "LARP" : "REAL TALK",
      added_to_list: Boolean(listed),
      mode: analysis.mode,
    });

    return json({ ...analysis, listed });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Investigation failed" }, { status: 500 });
  }
}
