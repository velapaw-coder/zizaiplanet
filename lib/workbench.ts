import { getUserFromRequest, type User } from "./auth";
import { composeHome } from "./compose";
import { db } from "./db";
import { EXPLORE_COOKIE, isSecureRequest, nowIso, parseCookies, serializeCookie } from "./http";
import { getPlatformChatProvider, llmStatus, type ChatMessage } from "./llm";
import { ROOMS, type DimensionId } from "./rooms";
import { SEVEN_DIMENSIONS_SKILL } from "./seven-skill";
import { clip } from "./text";

const WORKBENCH_COOKIE = "zizai_workbench";
const TTL = 60 * 60 * 24 * 30;
const MAX_HISTORY = 40;

type WbSession = {
  id: string;
  user_id: string | null;
  explore_session_id: string | null;
  preset_id: string;
  model: string | null;
  status: string;
  portrait_text: string | null;
  created_at: string;
  updated_at: string;
};

type WbMessage = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

function cookie(request: Request, id: string) {
  return serializeCookie(WORKBENCH_COOKIE, id, TTL, isSecureRequest(request));
}

function owns(session: WbSession, user: User | null) {
  if (!session.user_id) return true;
  return Boolean(user && session.user_id === user.id);
}

async function loadSession(id: string | undefined) {
  if (!id) return null;
  return db().prepare("SELECT * FROM workbench_sessions WHERE id = ?").bind(id).first<WbSession>();
}

async function loadMessages(sessionId: string) {
  const rows = await db()
    .prepare("SELECT * FROM workbench_messages WHERE session_id = ? ORDER BY created_at ASC")
    .bind(sessionId)
    .all<WbMessage>();
  return rows.results;
}

async function ensureExploreSession(user: User | null, existingExploreId: string | null) {
  if (existingExploreId) {
    const row = await db()
      .prepare("SELECT id FROM explore_sessions WHERE id = ?")
      .bind(existingExploreId)
      .first<{ id: string }>();
    if (row) return row.id;
  }
  const id = crypto.randomUUID();
  const stamp = nowIso();
  await db()
    .prepare(
      `INSERT INTO explore_sessions
       (id, user_id, room_index, question_index, phase, revisit_dimension, created_at, updated_at)
       VALUES (?, ?, 0, 0, 'paused', NULL, ?, ?)`,
    )
    .bind(id, user?.id ?? null, stamp, stamp)
    .run();
  return id;
}

export async function getWorkbenchState(request: Request) {
  const user = await getUserFromRequest(request);
  const status = await llmStatus();
  const cookieId = parseCookies(request.headers.get("cookie"))[WORKBENCH_COOKIE];
  let session = await loadSession(cookieId);
  if (session && !owns(session, user)) session = null;
  const messages = session ? await loadMessages(session.id) : [];
  const focus = session?.explore_session_id ? await loadFocusDimension(session.explore_session_id) : null;
  const progress = session?.explore_session_id
    ? await loadDimProgress(session.explore_session_id, focus)
    : emptyProgress();
  return {
    user: user ? { id: user.id, displayName: user.display_name } : null,
    llm: status,
    session: session
      ? {
          id: session.id,
          presetId: session.preset_id,
          model: session.model,
          status: session.status,
          portraitText: session.portrait_text,
          updatedAt: session.updated_at,
          focusDimension: focus,
        }
      : null,
    progress,
    messages: messages.map((item) => ({
      id: item.id,
      role: item.role as "user" | "assistant" | "system",
      content: stripLitMarkers(item.content),
      createdAt: item.created_at,
    })),
  };
}

export async function startWorkbench(request: Request) {
  const user = await getUserFromRequest(request);
  const { provider, endpoint, mock } = await getPlatformChatProvider();
  const presetId = endpoint.presetId;
  const model = endpoint.model;
  const exploreCookieId = parseCookies(request.headers.get("cookie"))[EXPLORE_COOKIE] ?? null;
  const exploreId = await ensureExploreSession(user, exploreCookieId);
  const id = crypto.randomUUID();
  const stamp = nowIso();
  await db()
    .prepare(
      `INSERT INTO workbench_sessions
       (id, user_id, explore_session_id, preset_id, model, status, portrait_text, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', NULL, ?, ?)`,
    )
    .bind(id, user?.id ?? null, exploreId, presetId, model, stamp, stamp)
    .run();

  const welcomeId = crypto.randomUUID();
  const boot = await provider.chat({
    messages: [
      { role: "system", content: SEVEN_DIMENSIONS_SKILL },
      { role: "user", content: "请开始七维探索。用一两段欢迎语说明七维与两种模式，并询问我选自适应还是完整；若我已说开始则默认自适应。" },
    ],
    temperature: 0.6,
  });
  const welcome =
    boot.content ||
    "你好。我是自在星球七维探索向导。七维：本源、天赋、品味、价值观、身份、同频关系、人生愿景。可选自适应或完整探索；直接说「开始」即默认自适应。";

  await db()
    .prepare(
      `INSERT INTO workbench_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)`,
    )
    .bind(welcomeId, id, welcome, stamp)
    .run();

  const cookies = [cookie(request, id), serializeCookie(EXPLORE_COOKIE, exploreId, TTL, isSecureRequest(request))];
  const progress = await loadDimProgress(exploreId, null);
  return {
    ok: true as const,
    mock,
    sessionId: id,
    message: { id: welcomeId, role: "assistant" as const, content: stripLitMarkers(welcome), createdAt: stamp },
    cookies,
    progress,
  };
}

export async function sendWorkbenchMessage(request: Request, input: { text: string }) {
  const user = await getUserFromRequest(request);
  const cookieId = parseCookies(request.headers.get("cookie"))[WORKBENCH_COOKIE];
  let session = await loadSession(cookieId);
  if (!session || !owns(session, user)) {
    return { ok: false as const, error: "请先开始一次七维自我探索对话。", status: 400 };
  }
  if (user && !session.user_id) {
    await db().prepare("UPDATE workbench_sessions SET user_id = ? WHERE id = ?").bind(user.id, session.id).run();
    session = { ...session, user_id: user.id };
  }

  const text = input.text.trim();
  if (!text) return { ok: false as const, error: "写一句再发送。", status: 400 };
  if (text.length > 4000) return { ok: false as const, error: "单条最多 4000 字。", status: 400 };

  const { provider, endpoint, mock } = await getPlatformChatProvider();
  const presetId = endpoint.presetId;
  const model = endpoint.model;
  const stamp = nowIso();
  const userMsgId = crypto.randomUUID();
  await db()
    .prepare(`INSERT INTO workbench_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)`)
    .bind(userMsgId, session.id, text, stamp)
    .run();

  const history = await loadMessages(session.id);
  const trimmed = history.slice(-MAX_HISTORY);
  const focusId = session.explore_session_id ? await loadFocusDimension(session.explore_session_id) : null;
  const focusRoom = focusId ? ROOMS.find((item) => item.id === focusId) : null;
  const systemExtra = focusRoom
    ? `\n\n当前居民点选了「${focusRoom.name}」维（${focusRoom.guide}）。请优先在这一维追问与点亮；足够后输出 <<<LIT:${focusRoom.name}>>> 。`
    : "";
  const chatMessages: ChatMessage[] = [
    { role: "system", content: SEVEN_DIMENSIONS_SKILL + systemExtra },
    ...trimmed.map((item) => ({
      role: (item.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: item.content,
    })),
  ];
  const result = await provider.chat({ messages: chatMessages, temperature: 0.55 });
  if (!result.content) {
    return {
      ok: false as const,
      error: result.error || "模型没有返回内容。",
      status: 502,
      mock,
    };
  }

  const assistantId = crypto.randomUUID();
  const assistantStamp = nowIso();
  await db()
    .prepare(`INSERT INTO workbench_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)`)
    .bind(assistantId, session.id, result.content, assistantStamp)
    .run();

  const cleaned = stripLitMarkers(result.content);
  let litIds = parseLitMarkers(result.content);
  // Fallback: resident explicitly asks to light current/named dims even if model omitted markers.
  if (!litIds.length) {
    litIds = inferLitFromUserIntent(text, session.explore_session_id ? await loadFocusDimension(session.explore_session_id) : null);
  }
  if (session.explore_session_id && litIds.length) {
    await lightDimensions(session.explore_session_id, litIds, text);
  }

  let portraitText = session.portrait_text;
  let wroteHome = false;
  if (cleaned.includes("七维个人定位画像")) {
    portraitText = cleaned;
    await db()
      .prepare(
        `UPDATE workbench_sessions
         SET preset_id = ?, model = ?, portrait_text = ?, status = 'portrait', updated_at = ?
         WHERE id = ?`,
      )
      .bind(presetId, model, portraitText, assistantStamp, session.id)
      .run();
    wroteHome = await writePortraitBestEffort(session, user, portraitText);
  } else {
    await db()
      .prepare(`UPDATE workbench_sessions SET preset_id = ?, model = ?, updated_at = ? WHERE id = ?`)
      .bind(presetId, model, assistantStamp, session.id)
      .run();
  }

  // Persist cleaned assistant text (without machine markers)
  if (cleaned !== result.content) {
    await db()
      .prepare(`UPDATE workbench_messages SET content = ? WHERE id = ?`)
      .bind(cleaned, assistantId)
      .run();
  }

  const focus = session.explore_session_id ? await loadFocusDimension(session.explore_session_id) : null;
  const progress = session.explore_session_id
    ? await loadDimProgress(session.explore_session_id, focus)
    : emptyProgress();

  return {
    ok: true as const,
    mock,
    endpoint: { presetId: endpoint.presetId, model: endpoint.model, label: endpoint.label, configured: endpoint.configured },
    userMessage: { id: userMsgId, role: "user" as const, content: text, createdAt: stamp },
    message: { id: assistantId, role: "assistant" as const, content: cleaned, createdAt: assistantStamp },
    portraitText,
    wroteHome,
    progress,
  };
}

export async function resetWorkbench(request: Request) {
  const user = await getUserFromRequest(request);
  const cookieId = parseCookies(request.headers.get("cookie"))[WORKBENCH_COOKIE];
  const session = await loadSession(cookieId);
  if (session && owns(session, user)) {
    await db().prepare(`UPDATE workbench_sessions SET status = 'archived', updated_at = ? WHERE id = ?`).bind(nowIso(), session.id).run();
  }
  return {
    ok: true as const,
    cookies: [serializeCookie(WORKBENCH_COOKIE, "", 0, isSecureRequest(request))],
  };
}


export async function focusWorkbenchDimension(request: Request, dimension: string) {
  const user = await getUserFromRequest(request);
  const cookieId = parseCookies(request.headers.get("cookie"))[WORKBENCH_COOKIE];
  let session = await loadSession(cookieId);
  if (!session || !owns(session, user)) {
    // auto-start if needed
    const started = await startWorkbench(request);
    session = await loadSession(started.sessionId);
    if (!session) return { ok: false as const, error: "无法开始探索。", status: 500, cookies: started.cookies };
    const dim = ROOMS.find((item) => item.id === dimension);
    if (!dim) return { ok: false as const, error: "未知维度。", status: 400, cookies: started.cookies };
    await db()
      .prepare(`UPDATE explore_sessions SET revisit_dimension = ?, updated_at = ? WHERE id = ?`)
      .bind(dimension, nowIso(), session.explore_session_id)
      .run();
    const stamp = nowIso();
    const guideId = crypto.randomUUID();
    const guide =
      `好，我们先回到「${dim.name}」：${dim.guide}\n\n请用你自己的话再讲一段相关经历或感受；若已满意当前点亮，也可以说「下一维」。`;
    await db()
      .prepare(`INSERT INTO workbench_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)`)
      .bind(guideId, session.id, guide, stamp)
      .run();
    const progress = await loadDimProgress(session.explore_session_id!, dimension);
    return {
      ok: true as const,
      cookies: started.cookies,
      message: { id: guideId, role: "assistant" as const, content: guide, createdAt: stamp },
      progress,
      focusDimension: dimension,
    };
  }
  if (!session.explore_session_id) {
    return { ok: false as const, error: "探索会话缺失。", status: 400 };
  }
  const dim = ROOMS.find((item) => item.id === dimension);
  if (!dim) return { ok: false as const, error: "未知维度。", status: 400 };
  await db()
    .prepare(`UPDATE explore_sessions SET revisit_dimension = ?, updated_at = ? WHERE id = ?`)
    .bind(dimension, nowIso(), session.explore_session_id)
    .run();
  const stamp = nowIso();
  const guideId = crypto.randomUUID();
  const guide =
    `好，我们回到「${dim.name}」：${dim.guide}\n\n请再补充一段具体原话；若想换一维，直接点右侧卡片即可。`;
  await db()
    .prepare(`INSERT INTO workbench_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)`)
    .bind(guideId, session.id, guide, stamp)
    .run();
  const progress = await loadDimProgress(session.explore_session_id, dimension);
  return {
    ok: true as const,
    message: { id: guideId, role: "assistant" as const, content: guide, createdAt: stamp },
    progress,
    focusDimension: dimension,
  };
}


const LIT_NAME_TO_ID: Record<string, DimensionId> = {
  本源: "origin",
  天赋: "talent",
  品味: "taste",
  价值观: "values",
  身份: "identity",
  同频关系: "relation",
  关系: "relation",
  人生愿景: "vision",
  愿景: "vision",
  origin: "origin",
  talent: "talent",
  taste: "taste",
  values: "values",
  identity: "identity",
  relation: "relation",
  vision: "vision",
};

function stripLitMarkers(content: string) {
  return content
    .replace(/^[ \t]*<<<LIT:[^>]+>>>[ \t]*$/gim, "")
    .replace(/[ \t]*<<<LIT:[^>]+>>>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseLitMarkers(content: string): DimensionId[] {
  const found = new Set<DimensionId>();
  const re = /<<<LIT:\s*([^>]+?)>>>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) {
    const key = match[1].trim();
    const id = LIT_NAME_TO_ID[key] || LIT_NAME_TO_ID[key.replace(/\s+/g, "")];
    if (id) found.add(id);
  }
  return [...found];
}

function inferLitFromUserIntent(userText: string, focus: string | null): DimensionId[] {
  if (!/(点亮|够了|可以亮|这一维可以|先点亮)/.test(userText)) return [];
  const found = new Set<DimensionId>();
  for (const [name, id] of Object.entries(LIT_NAME_TO_ID)) {
    if (name.length >= 2 && userText.includes(name)) found.add(id as DimensionId);
  }
  if (!found.size && focus && ROOMS.some((item) => item.id === focus)) found.add(focus as DimensionId);
  return [...found];
}

function emptyProgress() {
  return ROOMS.map((room) => ({
    id: room.id,
    name: room.name,
    icon: room.icon,
    tone: room.tone,
    guide: room.guide,
    lit: false,
    current: false,
  }));
}

async function loadFocusDimension(exploreSessionId: string) {
  const row = await db()
    .prepare("SELECT revisit_dimension FROM explore_sessions WHERE id = ?")
    .bind(exploreSessionId)
    .first<{ revisit_dimension: string | null }>();
  return row?.revisit_dimension || null;
}

async function loadDimProgress(exploreSessionId: string, focus: string | null) {
  const rows = await db()
    .prepare("SELECT dimension, lit, quote FROM room_cards WHERE session_id = ?")
    .bind(exploreSessionId)
    .all<{ dimension: string; lit: number; quote: string | null }>();
  const byId = new Map(rows.results.map((item) => [item.dimension, item]));
  return ROOMS.map((room) => {
    const card = byId.get(room.id);
    return {
      id: room.id,
      name: room.name,
      icon: room.icon,
      tone: room.tone,
      guide: room.guide,
      lit: Boolean(card?.lit),
      current: focus === room.id,
      quote: card?.quote ?? null,
    };
  });
}

async function lightDimensions(exploreSessionId: string, ids: DimensionId[], latestUserText: string) {
  const stamp = nowIso();
  const quote = clip(latestUserText.replace(/\s+/g, " ").trim(), 120) || null;
  for (const id of ids) {
    const room = ROOMS.find((item) => item.id === id)!;
    const summary = quote
      ? `在「${room.name}」这一维：${clip(quote, 280)}`
      : `「${room.name}」已在对话中点亮。`;
    await db()
      .prepare(
        `INSERT INTO room_cards
         (session_id, dimension, keywords, quote, summary, evidence, lit, via, updated_at)
         VALUES (?, ?, ?, ?, ?, '中等', 1, 'chat', ?)
         ON CONFLICT(session_id, dimension) DO UPDATE SET
           keywords = excluded.keywords,
           quote = COALESCE(excluded.quote, room_cards.quote),
           summary = excluded.summary,
           evidence = excluded.evidence,
           lit = 1,
           via = excluded.via,
           updated_at = excluded.updated_at`,
      )
      .bind(
        exploreSessionId,
        id,
        JSON.stringify(quote ? [clip(quote, 12)] : [room.name]),
        quote,
        summary,
        stamp,
      )
      .run();
  }
}

const DIM_ALIASES: Array<{ id: DimensionId; names: string[] }> = [
  { id: "origin", names: ["本源"] },
  { id: "talent", names: ["天赋"] },
  { id: "taste", names: ["品味"] },
  { id: "values", names: ["价值观"] },
  { id: "identity", names: ["身份"] },
  { id: "relation", names: ["同频关系", "关系"] },
  { id: "vision", names: ["人生愿景", "愿景"] },
];

function extractDimBlock(text: string, names: string[]) {
  for (const name of names) {
    const re = new RegExp(`(?:#{1,3}\\s*)?${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n(?:#{1,3}\\s*)?(?:本源|天赋|品味|价值观|身份|同频关系|人生愿景|一句话|个人价值|仍需验证)|$)`);
    const match = text.match(re);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function pickQuote(block: string) {
  const quoted = block.match(/「([^」]{4,120})」/);
  if (quoted) return quoted[1];
  const line = block
    .split("\n")
    .map((item) => item.replace(/^[-*]\s*/, "").replace(/^关键发现[：:]\s*/, "").trim())
    .find((item) => item.length >= 8);
  return line ? clip(line, 120) : null;
}

async function writePortraitBestEffort(session: WbSession, user: User | null, portraitText: string) {
  const exploreId = session.explore_session_id;
  if (!exploreId) return false;
  const stamp = nowIso();
  const cards = [];
  for (const dim of DIM_ALIASES) {
    const block = extractDimBlock(portraitText, dim.names);
    const room = ROOMS.find((item) => item.id === dim.id)!;
    const quote = block ? pickQuote(block) : null;
    const summary = block
      ? `在「${room.name}」这一维（七维深度对话）：${clip(block.replace(/\s+/g, " "), 280)}`
      : `「${room.name}」这一维还没有足够的原话。`;
    const lit = Boolean(quote);
    await db()
      .prepare(
        `INSERT INTO room_cards
         (session_id, dimension, keywords, quote, summary, evidence, lit, via, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'workbench', ?)
         ON CONFLICT(session_id, dimension) DO UPDATE SET
           keywords = excluded.keywords, quote = excluded.quote, summary = excluded.summary,
           evidence = excluded.evidence, lit = excluded.lit, via = excluded.via, updated_at = excluded.updated_at`,
      )
      .bind(
        exploreId,
        dim.id,
        JSON.stringify(quote ? [clip(quote, 12)] : []),
        quote,
        summary,
        lit ? "中等" : "待加深",
        lit ? 1 : 0,
        stamp,
      )
      .run();
    cards.push({
      dimension: dim.id,
      keywords: quote ? [clip(quote, 12)] : [],
      quote,
      summary,
      evidence: (lit ? "中等" : "待加深") as "中等" | "待加深",
      lit,
    });
  }

  await db()
    .prepare(`UPDATE explore_sessions SET phase = 'done', updated_at = ? WHERE id = ?`)
    .bind(stamp, exploreId)
    .run();

  if (!user) return false;
  const home = composeHome({ cards, changeNote: "七维深度对话写入" });
  if (home.litCount < 1) return false;
  await db()
    .prepare(
      `INSERT INTO homes (user_id, session_id, payload, is_private, updated_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         session_id = excluded.session_id, payload = excluded.payload, updated_at = excluded.updated_at`,
    )
    .bind(user.id, exploreId, JSON.stringify(home), stamp)
    .run();
  return true;
}
