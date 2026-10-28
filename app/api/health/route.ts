import { db } from "@/lib/db";
import { getLlmProvider } from "@/lib/llm";

export async function GET() {
  try {
    const row = await db().prepare("SELECT COUNT(*) AS articles FROM articles").first<{ articles: number }>();
    return Response.json({ ok: true, articles: row?.articles ?? 0, llm: getLlmProvider().name });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, llm: getLlmProvider().name }, { status: 500 });
  }
}
