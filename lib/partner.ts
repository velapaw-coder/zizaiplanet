import { getUserFromRequest, type User } from "./auth";
import type { HomeCard } from "./compose";
import { savedHome } from "./content";
import { db } from "./db";
import { isSecureRequest, nowIso, parseCookies, serializeCookie } from "./http";
import { getPlatformChatProvider, llmStatus, type ChatMessage } from "./llm";
import { clip } from "./text";

const PARTNER_COOKIE = "zizai_partner";
const TTL = 60 * 60 * 24 * 30;
const MAX_HISTORY = 36;

export const PARTNER_SYSTEM = `你是「自在星球」的 AI 分身，帮已经做过七维自我探索的自由创造者认清起点、梳理能力与经验，并做方向对话。核心理念是 AI创造自由。自由生意，是能带来人生自由的生意。称呼对方为自由创造者。

原则：
1. 只基于对方提供的七维画像摘要与对话原话；不要编造经历，不要替他决定生意项目。
2. 聚焦三件事：画像解读（他是谁、向往什么）、能力与资源梳理、值得进一步研究的 2～4 个方向（简短、可验证）。
3. 不做站内撮合、不推销具体课程或产品、不要求他绑定自在星球项目。
4. 语气真诚、克制、口语化中文；每次回复控制在 200～450 字，必要时用小标题。
5. 当方向已较清晰时，用固定标记输出一份可下载的方向纪要（便于生成 PDF）：
<<<DIRECTION_SUMMARY>>>
标题：……
一句话方向：……
能力与资源：……
可选方向：1.… 2.… 3.…
本周最小一步：……
<<<END_DIRECTION_SUMMARY>>>
标记内写给人看的正文，不要写代码。未到可汇总阶段时不要输出该标记。
6. 若对方尚未完成七维，先温和建议去完成「认识自己」七维探索，再继续深聊。`;

type PartnerSession = {
  id: string;
  user_id: string;
  status: string;
  direction_summary: string | null;
  created_at: string;
  updated_at: string;
};

type PartnerMessage = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

function cookie(request: Request, id: string) {
  return serializeCookie(PARTNER_COOKIE, id, TTL, isSecureRequest(request));
}

function clearCookie(request: Request) {
  return serializeCookie(PARTNER_COOKIE, "", 0, isSecureRequest(request));
}

async function loadSession(id: string | undefined) {
  if (!id) return null;
  return db().prepare("SELECT * FROM partner_sessions WHERE id = ?").bind(id).first<PartnerSession>();
}

async function loadMessages(sessionId: string) {
  const rows = await db()
    .prepare("SELECT * FROM partner_messages WHERE session_id = ? ORDER BY created_at ASC")
    .bind(sessionId)
    .all<PartnerMessage>();
  return rows.results;
}

function owns(session: PartnerSession, user: User | null) {
  return Boolean(user && session.user_id === user.id);
}

export type PartnerContext = {
  litCount: number;
  portraitReady: boolean;
  oneLiner: string | null;
  directionNote: string | null;
  roomSummaries: Array<{ name: string; quote: string | null; summary: string; lit: boolean }>;
  portraitText: string | null;
  profileDirection: string | null;
  profileExpertise: string | null;
  profileExperience: string | null;
};

export async function loadPartnerContext(userId: string): Promise<PartnerContext> {
  const saved = await savedHome(userId);
  const card = saved?.card ?? null;
  let portraitText: string | null = null;
  try {
    const row = await db()
      .prepare(
        `SELECT portrait_text FROM workbench_sessions
         WHERE user_id = ? AND portrait_text IS NOT NULL AND portrait_text != ''
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .bind(userId)
      .first<{ portrait_text: string }>();
    portraitText = row?.portrait_text ?? null;
  } catch {
    // ignore
  }
  let profileDirection: string | null = null;
  let profileExpertise: string | null = null;
  let profileExperience: string | null = null;
  try {
    const profile = await db()
      .prepare("SELECT experience, expertise, direction FROM profiles WHERE user_id = ?")
      .bind(userId)
      .first<{ experience: string; expertise: string; direction: string }>();
    if (profile) {
      profileDirection = profile.direction || null;
      profileExpertise = profile.expertise || null;
      profileExperience = profile.experience || null;
    }
  } catch {
    // table may be fresh
  }

  const rooms =
    card?.rooms?.map((room) => ({
      name: room.name,
      quote: room.quote,
      summary: room.summary,
      lit: Boolean(room.lit),
    })) ?? [];

  return {
    litCount: card?.litCount ?? rooms.filter((r) => r.lit).length,
    portraitReady: Boolean(card?.portraitReady),
    oneLiner: card?.oneLiner ?? null,
    directionNote: card?.directionNote ?? null,
    roomSummaries: rooms,
    portraitText,
    profileDirection,
    profileExpertise,
    profileExperience,
  };
}

function buildContextBlock(ctx: PartnerContext, displayName: string) {
  const lines: string[] = [`称呼：${displayName}`, `七维点亮：${ctx.litCount}/7${ctx.portraitReady ? "（画像已齐）" : ""}`];
  if (ctx.oneLiner) lines.push(`一句话本源：${clip(ctx.oneLiner, 80)}`);
  if (ctx.directionNote) lines.push(`向往定位：${clip(ctx.directionNote, 200)}`);
  if (ctx.profileExperience) lines.push(`向往·经历：${clip(ctx.profileExperience, 240)}`);
  if (ctx.profileExpertise) lines.push(`向往·专长：${clip(ctx.profileExpertise, 160)}`);
  if (ctx.profileDirection) lines.push(`向往·长期方向：${clip(ctx.profileDirection, 160)}`);
  if (ctx.roomSummaries.length) {
    lines.push("七维摘要（含原话，仅供本次私密对话，勿原样公开复述隐私细节）：");
    for (const room of ctx.roomSummaries) {
      if (!room.lit && !room.quote) continue;
      lines.push(
        `- ${room.name}${room.lit ? "·已点亮" : ""}：${room.quote ? `「${clip(room.quote, 72)}」` : ""} ${clip(room.summary || "", 80)}`,
      );
    }
  }
  if (ctx.portraitText) {
    lines.push("对话画像原文（节选）：");
    lines.push(clip(ctx.portraitText, 1800));
  }
  if (ctx.litCount < 1) {
    lines.push("提示：对方几乎还没有七维探索记录，请先引导他去 /explore 完成认识自己。");
  }
  return lines.join("\n");
}

function parseDirectionSummary(content: string): { cleaned: string; summary: string | null } {
  const match = content.match(/<<<DIRECTION_SUMMARY>>>\s*([\s\S]*?)\s*<<<END_DIRECTION_SUMMARY>>>/);
  if (!match) return { cleaned: content, summary: null };
  const summary = match[1].trim();
  const cleaned = content.replace(/<<<DIRECTION_SUMMARY>>>[\s\S]*?<<<END_DIRECTION_SUMMARY>>>/, "").trim();
  return { cleaned: cleaned || summary, summary };
}

function mockPartnerReply(turns: number, lastUser: string, ctx: PartnerContext): string {
  if (turns <= 1) {
    return ctx.litCount < 1
      ? "你好，我是你的 AI 分身（演示模式）。我这边还几乎看不到你的七维探索记录。建议你先去「认识自己」完成七维聊天；有了画像后，我们再一起梳理能力与方向。\n\n（配置大模型密钥后即可真实对话。）"
      : `你好，我是你的 AI 分身（演示模式）。我已读到你七维里约 ${ctx.litCount} 维的摘要${ctx.oneLiner ? `，本源一句是「${clip(ctx.oneLiner, 36)}」` : ""}。\n\n接下来我们可以：1）解读画像；2）梳理你已有的能力与关系；3）提出几个值得进一步研究的方向。你想先从哪一块开始？\n\n（当前未配置密钥，回复为演示。）`;
  }
  if (/方向|汇总|纪要|下载|PDF|总结|方案/.test(lastUser) || turns > 6) {
    return `根据我们刚才的对话（演示），先给你一份方向纪要草稿：

<<<DIRECTION_SUMMARY>>>
标题：认清起点 · 方向纪要（演示）
一句话方向：把已有经验做成可独立交付、时间更自由的小规模服务。
能力与资源：七维已点亮 ${ctx.litCount} 维；专长与关系仍需用真实经历验证。
可选方向：1. 围绕旧行业痛点做轻咨询 2. 用 AI 提效完成一件小交付 3. 先访谈 3 位潜在对象再决定
本周最小一步：约一位熟人聊 20 分钟，确认一个真实卡点。
<<<END_DIRECTION_SUMMARY>>>

你可以下载 PDF 留存；「我的向往」会按纪要自动生成公开摘要，改完即可分享。演示模式下内容仅供示意。`;
  }
  return `我听到你说：「${clip(lastUser, 60)}」。结合七维摘要，我们先把「能力」和「向往」分开看：什么是你已经做过的，什么是你想走向的。你可以再补一件具体经历，或直接说「帮我列三个方向」。`;
}

export async function getPartnerState(request: Request) {
  const user = await getUserFromRequest(request);
  const status = await llmStatus();
  if (!user) {
    return {
      user: null,
      llm: status,
      session: null,
      context: null as PartnerContext | null,
      messages: [] as Array<{ id: string; role: "user" | "assistant" | "system"; content: string; createdAt: string }>,
    };
  }
  const context = await loadPartnerContext(user.id);
  const cookieId = parseCookies(request.headers.get("cookie"))[PARTNER_COOKIE];
  let session = await loadSession(cookieId);
  if (session && !owns(session, user)) session = null;
  if (!session) {
    // resume latest active session for this user
    session =
      (await db()
        .prepare(
          `SELECT * FROM partner_sessions WHERE user_id = ? AND status = 'active'
           ORDER BY updated_at DESC LIMIT 1`,
        )
        .bind(user.id)
        .first<PartnerSession>()) ?? null;
  }
  const messages = session ? await loadMessages(session.id) : [];
  return {
    user: { id: user.id, displayName: user.display_name },
    llm: status,
    session: session
      ? {
          id: session.id,
          status: session.status,
          directionSummary: session.direction_summary,
          updatedAt: session.updated_at,
        }
      : null,
    context,
    messages: messages.map((item) => ({
      id: item.id,
      role: item.role as "user" | "assistant" | "system",
      content: item.content,
      createdAt: item.created_at,
    })),
  };
}

export async function startPartner(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return { ok: false as const, error: "请先登录成为自由创造者。", status: 401 };
  const { provider, mock } = await getPlatformChatProvider();
  const context = await loadPartnerContext(user.id);
  const id = crypto.randomUUID();
  const stamp = nowIso();
  await db()
    .prepare(
      `INSERT INTO partner_sessions (id, user_id, status, direction_summary, created_at, updated_at)
       VALUES (?, ?, 'active', NULL, ?, ?)`,
    )
    .bind(id, user.id, stamp, stamp)
    .run();

  const contextBlock = buildContextBlock(context, user.display_name);
  const boot = await provider.chat({
    messages: [
      { role: "system", content: `${PARTNER_SYSTEM}\n\n—— 探索上下文 ——\n${contextBlock}` },
      {
        role: "user",
        content:
          "请用一两段话欢迎我，简要反馈你从我的七维/画像里读到的要点，并询问我想先解读画像、梳理能力，还是直接谈方向。不要输出 DIRECTION_SUMMARY 标记。",
      },
    ],
    temperature: 0.55,
  });
  const welcome =
    boot.content ||
    mockPartnerReply(1, "开始", context);

  const welcomeId = crypto.randomUUID();
  await db()
    .prepare(`INSERT INTO partner_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)`)
    .bind(welcomeId, id, welcome, stamp)
    .run();

  return {
    ok: true as const,
    mock: Boolean(mock || boot.mock),
    sessionId: id,
    context,
    message: { id: welcomeId, role: "assistant" as const, content: welcome, createdAt: stamp },
    cookies: [cookie(request, id)],
  };
}

export async function sendPartnerMessage(request: Request, input: { text: string }) {
  const user = await getUserFromRequest(request);
  if (!user) return { ok: false as const, error: "请先登录。", status: 401 };
  const cookieId = parseCookies(request.headers.get("cookie"))[PARTNER_COOKIE];
  let session = await loadSession(cookieId);
  if (!session || !owns(session, user)) {
    session =
      (await db()
        .prepare(
          `SELECT * FROM partner_sessions WHERE user_id = ? AND status = 'active'
           ORDER BY updated_at DESC LIMIT 1`,
        )
        .bind(user.id)
        .first<PartnerSession>()) ?? null;
  }
  if (!session || !owns(session, user)) {
    return { ok: false as const, error: "请先开始一次 AI 分身对话。", status: 400 };
  }

  const text = input.text.trim();
  if (!text) return { ok: false as const, error: "写一句再发送。", status: 400 };
  if (text.length > 4000) return { ok: false as const, error: "单条最多 4000 字。", status: 400 };

  const stamp = nowIso();
  const userMsgId = crypto.randomUUID();
  await db()
    .prepare(`INSERT INTO partner_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)`)
    .bind(userMsgId, session.id, text, stamp)
    .run();

  const context = await loadPartnerContext(user.id);
  const { provider, mock } = await getPlatformChatProvider();
  const history = await loadMessages(session.id);
  const trimmed = history.slice(-MAX_HISTORY);
  const contextBlock = buildContextBlock(context, user.display_name);
  const chatMessages: ChatMessage[] = [
    { role: "system", content: `${PARTNER_SYSTEM}\n\n—— 探索上下文 ——\n${contextBlock}` },
    ...trimmed.map((item) => ({
      role: (item.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: item.content,
    })),
  ];

  let raw: string | null = null;
  let usedMock = mock;
  if (mock) {
    raw = mockPartnerReply(trimmed.length, text, context);
    usedMock = true;
  } else {
    const result = await provider.chat({ messages: chatMessages, temperature: 0.55 });
    if (!result.content) {
      return { ok: false as const, error: result.error || "模型没有返回内容。", status: 502, mock: usedMock };
    }
    raw = result.content;
    usedMock = Boolean(result.mock);
  }

  const { cleaned, summary } = parseDirectionSummary(raw);
  const assistantId = crypto.randomUUID();
  const assistantStamp = nowIso();
  await db()
    .prepare(`INSERT INTO partner_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)`)
    .bind(assistantId, session.id, cleaned, assistantStamp)
    .run();

  let directionSummary = session.direction_summary;
  if (summary) {
    directionSummary = summary;
    await db()
      .prepare(`UPDATE partner_sessions SET direction_summary = ?, updated_at = ? WHERE id = ?`)
      .bind(summary, assistantStamp, session.id)
      .run();
    try {
      const { syncProfileFromSources } = await import("./profile");
      await syncProfileFromSources(user.id, "fill_empty");
    } catch {
      // best-effort auto profile
    }
  } else {
    await db().prepare(`UPDATE partner_sessions SET updated_at = ? WHERE id = ?`).bind(assistantStamp, session.id).run();
  }

  return {
    ok: true as const,
    mock: usedMock,
    userMessage: { id: userMsgId, role: "user" as const, content: text, createdAt: stamp },
    message: { id: assistantId, role: "assistant" as const, content: cleaned, createdAt: assistantStamp },
    directionSummary,
    context,
    cookies: [cookie(request, session.id)],
  };
}

export async function resetPartner(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return { ok: false as const, error: "请先登录。", status: 401, cookies: [clearCookie(request)] };
  const cookieId = parseCookies(request.headers.get("cookie"))[PARTNER_COOKIE];
  const session = await loadSession(cookieId);
  if (session && owns(session, user)) {
    await db()
      .prepare(`UPDATE partner_sessions SET status = 'archived', updated_at = ? WHERE id = ?`)
      .bind(nowIso(), session.id)
      .run();
  }
  return { ok: true as const, cookies: [clearCookie(request)] };
}

export function composePartnerPlanFromSession(input: {
  displayName: string;
  context: PartnerContext;
  directionSummary: string | null;
  card?: HomeCard | null;
}) {
  const name = input.displayName || "自由创造者";
  const summary = (input.directionSummary || "").trim();
  const title = summary ? "我的方向纪要" : "方向对话（进行中）";
  const oneLiner =
    summary.match(/一句话方向[：:]\s*(.+)/)?.[1]?.trim() ||
    input.context.oneLiner ||
    input.context.directionNote ||
    "方向仍在对话中澄清。";
  const sections: Array<{ id: string; title: string; body: string }> = [];
  if (summary) {
    sections.push({ id: "summary", title: "方向纪要", body: summary });
  } else {
    sections.push({
      id: "progress",
      title: "当前进度",
      body: `已点亮七维 ${input.context.litCount}/7。继续与 AI 分身对话，说「帮我汇总方向」即可生成可下载纪要。`,
    });
  }
  if (input.context.directionNote) {
    sections.push({ id: "portrait", title: "来自七维的向往定位", body: input.context.directionNote });
  }
  const litRooms = input.context.roomSummaries.filter((r) => r.lit && r.quote).slice(0, 5);
  if (litRooms.length) {
    sections.push({
      id: "dims",
      title: "七维要点（摘要）",
      body: litRooms.map((r) => `「${r.name}」${clip(r.quote || "", 60)}`).join("\n"),
    });
  }
  sections.push({
    id: "next",
    title: "下一步",
    body: "打开「我的向往」查看自动生成的公开摘要，改完即可分享；需要时再回 AI 分身继续澄清。不做站内项目撮合。",
  });
  return {
    title,
    subtitle: `${name} · 自在星球 AI 分身`,
    oneLiner: clip(oneLiner, 120),
    sections,
    closing: "这份纪要来自你与 AI 分身的对话，仅供本人留存与自愿分享。方向属于你自己。",
    portraitReady: Boolean(summary) || input.context.portraitReady,
    litCount: input.context.litCount,
    directionSummary: summary || null,
  };
}

export type PartnerPlan = ReturnType<typeof composePartnerPlanFromSession>;
