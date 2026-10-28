import { getPartnerState, resetPartner, sendPartnerMessage, startPartner } from "@/lib/partner";

export async function GET(request: Request) {
  try {
    const state = await getPartnerState(request);
    return Response.json(state);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "AI 分身暂时不可用。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string; text?: string };
    const action = body.action || "send";

    if (action === "start") {
      const result = await startPartner(request);
      if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
      const headers = new Headers({ "Content-Type": "application/json" });
      for (const item of result.cookies) headers.append("Set-Cookie", item);
      return new Response(
        JSON.stringify({
          ok: true,
          mock: result.mock,
          sessionId: result.sessionId,
          message: result.message,
          context: result.context,
        }),
        { status: 200, headers },
      );
    }

    if (action === "reset") {
      const result = await resetPartner(request);
      if (!result.ok) {
        const headers = new Headers({ "Content-Type": "application/json" });
        for (const item of result.cookies || []) headers.append("Set-Cookie", item);
        return new Response(JSON.stringify({ ok: false, error: result.error }), { status: result.status, headers });
      }
      const headers = new Headers({ "Content-Type": "application/json" });
      for (const item of result.cookies) headers.append("Set-Cookie", item);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    if (action === "send") {
      const result = await sendPartnerMessage(request, { text: String(body.text || "") });
      if (!result.ok) {
        return Response.json(
          { ok: false, error: result.error, mock: "mock" in result ? result.mock : undefined },
          { status: result.status },
        );
      }
      const headers = new Headers({ "Content-Type": "application/json" });
      if (result.cookies) for (const item of result.cookies) headers.append("Set-Cookie", item);
      return new Response(JSON.stringify(result), { status: 200, headers });
    }

    return Response.json({ error: "未知动作" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "AI 分身请求失败。" }, { status: 500 });
  }
}
