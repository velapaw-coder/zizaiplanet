import {
  focusWorkbenchDimension,
  getWorkbenchState,
  resetWorkbench,
  sendWorkbenchMessage,
  startWorkbench,
} from "@/lib/workbench";

export async function GET(request: Request) {
  try {
    const state = await getWorkbenchState(request);
    return Response.json(state);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "七维自我探索暂时不可用。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      text?: string;
      dimension?: string;
    };
    const action = body.action || "send";

    if (action === "start") {
      const result = await startWorkbench(request);
      const headers = new Headers({ "Content-Type": "application/json" });
      for (const item of result.cookies) headers.append("Set-Cookie", item);
      return new Response(
        JSON.stringify({
          ok: true,
          mock: result.mock,
          sessionId: result.sessionId,
          message: result.message,
          progress: result.progress,
        }),
        { status: 200, headers },
      );
    }

    if (action === "reset") {
      const result = await resetWorkbench(request);
      const headers = new Headers({ "Content-Type": "application/json" });
      for (const item of result.cookies) headers.append("Set-Cookie", item);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    if (action === "focus") {
      const result = await focusWorkbenchDimension(request, String(body.dimension || ""));
      if (!result.ok) {
        return Response.json({ ok: false, error: result.error }, { status: result.status });
      }
      const headers = new Headers({ "Content-Type": "application/json" });
      if ("cookies" in result && result.cookies) {
        for (const item of result.cookies) headers.append("Set-Cookie", item);
      }
      return new Response(JSON.stringify(result), { status: 200, headers });
    }

    if (action === "send") {
      const result = await sendWorkbenchMessage(request, { text: String(body.text || "") });
      if (!result.ok) {
        return Response.json(
          { ok: false, error: result.error, mock: "mock" in result ? result.mock : undefined },
          { status: result.status },
        );
      }
      return Response.json(result);
    }

    return Response.json({ error: "未知动作" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "七维自我探索请求失败。" }, { status: 500 });
  }
}
