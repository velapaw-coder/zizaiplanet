import { getUserFromRequest, type User } from "./auth";
import { composeHome, type HomeCard, type StoredCard } from "./compose";
import { db } from "./db";
import {
  EXPLORE_COOKIE,
  isSecureRequest,
  nowIso,
  parseCookies,
  redirectTo,
  serializeCookie,
} from "./http";
import { makeRoomCard } from "./room-card";
import { ROOMS, roomById, roomIndex, type RoomDef } from "./rooms";
import { safeNext } from "./text";

const EXPLORE_TTL = 60 * 60 * 24 * 30;

type SessionRow = {
  id: string;
  user_id: string | null;
  room_index: number;
  question_index: number;
  phase: string;
  revisit_dimension: string | null;
  created_at: string;
  updated_at: string;
};

type AnswerRow = {
  session_id: string;
  dimension: string;
  q_index: number;
  question: string;
  answer: string | null;
  skipped: number;
};

type CardRow = {
  session_id: string;
  dimension: string;
  keywords: string;
  quote: string | null;
  summary: string;
  evidence: StoredCard["evidence"];
  lit: number;
  via: string;
  updated_at: string;
};

export type TimelineItem =
  | { type: "guide"; text: string }
  | { type: "q"; text: string }
  | { type: "a"; text: string; skipped: boolean }
  | { type: "card"; name: string; place: string; summary: string; quote: string | null; keywords: string[]; evidence: string; via: string; lit: boolean };

export type ExploreView = {
  phase: "intro" | "question" | "card" | "paused" | "done";
  progress: Array<{ id: string; name: string; place: string; guide: string; icon: string; tone: string; lit: boolean; current: boolean }>;
  timeline: TimelineItem[];
  question?: { room: string; place: string; guide: string; kind: string; text: string; index: number; note?: string };
  homeCard: HomeCard | null;
  litCount: number;
  revisit: boolean;
  nextLabel: string | null;
};

const INTRO =
  "七维自我探索卡对应七个维度：本源、天赋、品味、价值观、身份、同频关系、人生愿景。看见自己，找到方向，开启属于你的自在生活。一次只进一维，每维两题：先是感受，再是一件具体的小事；写下原话，这一维就会点亮。任意三维点亮后会出现临时个人画像；七维都有原话，才会生成完整个人画像，「想成为的自己」才从证据里长出来。可以跳过，也可以停下。结果默认私密。这不是心理诊断，也不是能力测验。";

function exploreCookie(request: Request, id: string) {
  return serializeCookie(EXPLORE_COOKIE, id, EXPLORE_TTL, isSecureRequest(request));
}

function notice(path: string, message: string) {
  const url = new URL(path, "http://local");
  url.searchParams.set("notice", message);
  return `${url.pathname}${url.search}${url.hash}`;
}

async function loadSession(id: string | undefined) {
  if (!id) return null;
  return db().prepare("SELECT * FROM explore_sessions WHERE id = ?").bind(id).first<SessionRow>();
}

async function loadAnswers(sessionId: string) {
  const rows = await db()
    .prepare("SELECT * FROM room_answers WHERE session_id = ?")
    .bind(sessionId)
    .all<AnswerRow>();
  return rows.results;
}

async function loadCards(sessionId: string) {
  const rows = await db().prepare("SELECT * FROM room_cards WHERE session_id = ?").bind(sessionId).all<CardRow>();
  return rows.results.map(toStored);
}

function toStored(row: CardRow): StoredCard & { via: string } {
  let keywords: string[] = [];
  try {
    const parsed = JSON.parse(row.keywords) as unknown;
    if (Array.isArray(parsed)) keywords = parsed.map(String);
  } catch {
    keywords = [];
  }
  return {
    dimension: row.dimension,
    keywords,
    quote: row.quote,
    summary: row.summary,
    evidence: row.evidence,
    lit: row.lit === 1,
    via: row.via,
  };
}

async function touch(session: SessionRow, patch: Partial<SessionRow>) {
  const next = { ...session, ...patch, updated_at: nowIso() };
  await db()
    .prepare(
      `UPDATE explore_sessions
       SET user_id = ?, room_index = ?, question_index = ?, phase = ?, revisit_dimension = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      next.user_id,
      next.room_index,
      next.question_index,
      next.phase,
      next.revisit_dimension,
      next.updated_at,
      next.id,
    )
    .run();
  return next;
}

function owns(session: SessionRow, user: User | null) {
  if (!session.user_id) return true;
  return Boolean(user && session.user_id === user.id);
}

export async function buildExploreView(sessionId: string | null): Promise<ExploreView> {
  const session = sessionId ? await loadSession(sessionId) : null;
  if (!session) {
    return {
      phase: "intro",
      progress: ROOMS.map((room) => ({ id: room.id, name: room.name, place: room.place, guide: room.guide, icon: room.icon, tone: room.tone, lit: false, current: false })),
      timeline: [{ type: "guide", text: INTRO }],
      homeCard: null,
      litCount: 0,
      revisit: false,
      nextLabel: null,
    };
  }
  const answers = await loadAnswers(session.id);
  const cards = await loadCards(session.id);
  const lit = new Set(cards.filter((card) => card.lit).map((card) => card.dimension));
  const timeline: TimelineItem[] = [{ type: "guide", text: INTRO }];
  for (let index = 0; index <= session.room_index && index < ROOMS.length; index += 1) {
    const upto = index === session.room_index && session.phase === "question" ? session.question_index : 2;
    pushRoom(timeline, ROOMS[index], answers, cards, upto);
  }
  const room = ROOMS[session.room_index] ?? ROOMS[0];
  const changeNote = session.revisit_dimension
    ? `本次照顾了「${roomById(session.revisit_dimension)?.name ?? room.name}」`
    : session.phase === "paused"
      ? "你先停在这里"
      : session.phase === "done"
        ? "首次探索"
        : "探索还在进行";
  const homeCard = composeHome({ cards, changeNote });
  const showHome = session.phase === "paused" || session.phase === "done" || homeCard.litCount >= 3;
  const nextRoom = ROOMS[session.room_index + 1];
  let nextLabel: string | null = null;
  if (session.phase === "card") {
    if (session.revisit_dimension) nextLabel = "回到探索卡";
    else if (!nextRoom) nextLabel = "看七维之后的个人画像";
    else nextLabel = `去下一维 · ${nextRoom.name}`;
  }
  const question =
    session.phase === "question"
      ? {
          room: room.name,
          place: room.place,
          guide: room.guide,
          kind: session.question_index === 0 ? "感受" : "具体小事",
          text: room.questions[session.question_index] ?? room.questions[0],
          index: session.question_index,
          note:
            room.id === "identity"
              ? "身份维度可以回答。若前面四维（本源、天赋、品味、价值观）还没有足够原话，这里不会生成「想成为的自己」。"
              : `本维引导：${room.guide} 答完两题并留下原话，这一维就会点亮。`,
        }
      : undefined;
  return {
    phase: session.phase as ExploreView["phase"],
    progress: ROOMS.map((item, index) => ({
      id: item.id,
      name: item.name,
      place: item.place,
      guide: item.guide,
      icon: item.icon,
      tone: item.tone,
      lit: lit.has(item.id),
      current: index === session.room_index && session.phase !== "done" && session.phase !== "paused",
    })),
    timeline,
    question,
    homeCard: showHome ? homeCard : null,
    litCount: homeCard.litCount,
    revisit: Boolean(session.revisit_dimension),
    nextLabel,
  };
}

function pushRoom(
  timeline: TimelineItem[],
  room: RoomDef,
  answers: AnswerRow[],
  cards: Array<StoredCard & { via: string }>,
  uptoQuestion: number,
) {
  const roomAnswers = answers.filter((item) => item.dimension === room.id).sort((a, b) => a.q_index - b.q_index);
  for (const answer of roomAnswers) {
    if (answer.q_index >= uptoQuestion) continue;
    timeline.push({ type: "q", text: `${room.name} · ${answer.question}` });
    timeline.push({
      type: "a",
      text: answer.skipped ? "这题先跳过。" : answer.answer || "",
      skipped: answer.skipped === 1,
    });
  }
  if (uptoQuestion >= 2) {
    const card = cards.find((item) => item.dimension === room.id);
    if (card) {
      timeline.push({
        type: "card",
        name: room.name,
        place: room.place,
        summary: card.summary,
        quote: card.quote,
        keywords: card.keywords,
        evidence: card.evidence,
        via: card.via,
        lit: card.lit,
      });
    }
  }
}

export async function handleExplore(request: Request, form: FormData) {
  const action = String(form.get("action") || "");
  const user = await getUserFromRequest(request);
  const existingId = parseCookies(request.headers.get("cookie"))[EXPLORE_COOKIE];
  const back = (message?: string) => redirectTo(request, message ? notice("/explore#now", message) : "/explore#now");

  if (action === "start") {
    const existing = await loadSession(existingId);
    if (existing && owns(existing, user)) return back();
    const id = crypto.randomUUID();
    const stamp = nowIso();
    await db()
      .prepare(
        `INSERT INTO explore_sessions
         (id, user_id, room_index, question_index, phase, revisit_dimension, created_at, updated_at)
         VALUES (?, ?, 0, 0, 'question', NULL, ?, ?)`,
      )
      .bind(id, user?.id ?? null, stamp, stamp)
      .run();
    return redirectTo(request, "/explore#now", [exploreCookie(request, id)]);
  }

  if (action === "enter") {
    return enterDimension(request, user, String(form.get("dimension") || ""));
  }

  const session = await loadSession(existingId);
  if (!session || !owns(session, user)) return redirectTo(request, notice("/explore", "这次探索还没有开始。"));
  if (user && !session.user_id) session.user_id = user.id;

  if (action === "answer" || action === "skip") {
    if (session.phase !== "question") return back();
    const room = ROOMS[session.room_index];
    if (!room) return back();
    const qIndex = session.question_index;
    let answer: string | null = null;
    let skipped = 0;
    if (action === "skip") skipped = 1;
    else {
      answer = String(form.get("text") || "").trim();
      if (!answer) return back("写下一句，或者选择跳过。");
      if (answer.length > 2000) answer = answer.slice(0, 2000);
    }
    await db()
      .prepare(
        `INSERT INTO room_answers (session_id, dimension, q_index, question, answer, skipped)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(session_id, dimension, q_index) DO UPDATE SET
           answer = excluded.answer, skipped = excluded.skipped, question = excluded.question`,
      )
      .bind(session.id, room.id, qIndex, room.questions[qIndex], answer, skipped)
      .run();
    if (qIndex === 0) {
      await touch(session, { question_index: 1 });
      return back();
    }
    const rows = await loadAnswers(session.id);
    const pair = [0, 1].map((index) => {
      const row = rows.find((item) => item.dimension === room.id && item.q_index === index);
      return { answer: row?.answer ?? null, skipped: row?.skipped === 1 };
    });
    const card = await makeRoomCard(room, pair);
    await db()
      .prepare(
        `INSERT INTO room_cards
         (session_id, dimension, keywords, quote, summary, evidence, lit, via, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(session_id, dimension) DO UPDATE SET
           keywords = excluded.keywords, quote = excluded.quote, summary = excluded.summary,
           evidence = excluded.evidence, lit = excluded.lit, via = excluded.via, updated_at = excluded.updated_at`,
      )
      .bind(
        session.id,
        room.id,
        JSON.stringify(card.keywords),
        card.quote,
        card.summary,
        card.evidence,
        card.lit ? 1 : 0,
        card.via,
        nowIso(),
      )
      .run();
    await touch(session, { phase: "card" });
    return back();
  }

  if (action === "next") {
    if (session.phase !== "card") return back();
    if (session.revisit_dimension) {
      await touch(session, { phase: "paused", revisit_dimension: null });
      return redirectTo(request, notice("/explore", "这一维已点亮。再点上方其他维继续即可。"));
    }
    if (session.room_index >= ROOMS.length - 1) {
      await touch(session, { phase: "done" });
      return redirectTo(request, "/explore#home");
    }
    await touch(session, { room_index: session.room_index + 1, question_index: 0, phase: "question" });
    return back();
  }

  if (action === "stop") {
    if (session.phase === "intro") return back();
    await touch(session, { phase: "paused" });
    return redirectTo(request, "/explore#home");
  }

  return redirectTo(request, notice(safeNext(form.get("next"), "/explore"), "这个动作没有被认出来。"));
}

export async function cardsForSession(sessionId: string) {
  return loadCards(sessionId);
}

export async function activeExploreSession(request: Request, user: User | null) {
  const cookieId = parseCookies(request.headers.get("cookie"))[EXPLORE_COOKIE];
  const session = await loadSession(cookieId);
  if (session && owns(session, user)) return session;
  return null;
}

export async function savedExploreSession(user: User | null) {
  if (!user) return null;
  const home = await db()
    .prepare("SELECT session_id FROM homes WHERE user_id = ?")
    .bind(user.id)
    .first<{ session_id: string }>();
  if (!home) return null;
  const saved = await loadSession(home.session_id);
  if (saved && (!saved.user_id || saved.user_id === user.id)) return saved;
  return null;
}

/** Click an orb/tile: create or reuse session and jump straight into that dimension. */
export async function enterDimension(request: Request, user: User | null, dimension: string) {
  const index = roomIndex(dimension);
  if (index < 0) return redirectTo(request, notice("/explore", "没有这一维。"));

  let session = (await savedExploreSession(user)) ?? (await activeExploreSession(request, user));
  const cookies: string[] = [];

  if (!session) {
    const id = crypto.randomUUID();
    const stamp = nowIso();
    await db()
      .prepare(
        `INSERT INTO explore_sessions
         (id, user_id, room_index, question_index, phase, revisit_dimension, created_at, updated_at)
         VALUES (?, ?, ?, 0, 'question', ?, ?, ?)`,
      )
      .bind(id, user?.id ?? null, index, dimension, stamp, stamp)
      .run();
    cookies.push(exploreCookie(request, id));
    return redirectTo(request, "/explore#now", cookies);
  }

  if (user && !session.user_id) session.user_id = user.id;
  await db().prepare("DELETE FROM room_answers WHERE session_id = ? AND dimension = ?").bind(session.id, dimension).run();
  await db().prepare("DELETE FROM room_cards WHERE session_id = ? AND dimension = ?").bind(session.id, dimension).run();
  await touch(session, { room_index: index, question_index: 0, phase: "question", revisit_dimension: dimension });
  cookies.push(exploreCookie(request, session.id));
  return redirectTo(request, "/explore#now", cookies);
}

export async function revisitDimension(request: Request, user: User | null, dimension: string) {
  return enterDimension(request, user, dimension);
}

export function exploreCookieFor(request: Request, id: string) {
  return exploreCookie(request, id);
}
