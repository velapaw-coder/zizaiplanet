import { clip } from "./text";

/** Public「我的向往」page. Editable after generation. Not a résumé and not a slide deck. */
export type StoryNode = {
  when: string;
  title: string;
  detail: string;
};

export type PracticeStep = {
  name: string;
  detail: string;
};

export type ResonanceGroup = {
  who: string;
  direction: string;
  connect: string;
  goal: string;
};

export type AspirationPage = {
  claim: { sentence: string; keywords: string[] };
  story: { nodes: StoryNode[] };
  believe: { points: string[]; closing: string };
  practice: { steps: PracticeStep[] };
  longing: { keywords: string[]; line: string };
  resonance: { groups: ResonanceGroup[] };
};

export const ASPIRATION_SECTIONS = [
  { id: "claim", title: "主张", lead: "一句话，和三个属于你的词。" },
  { id: "story", title: "故事", lead: "短时间线。节点可少可多。" },
  { id: "believe", title: "相信", lead: "你愿意长期守住的话。" },
  { id: "practice", title: "做事", lead: "你实际怎么把事情做下去。每一步的名字都可以改。" },
  { id: "longing", title: "向往", lead: "想靠近的方向，一两句就够。" },
  {
    id: "resonance",
    title: "同频",
    lead: "希望遇见的人。每一类写三行：他们是谁、共同方向、连接方式。共同目标可以不写。",
  },
] as const;

const LIMIT = {
  sentence: 180,
  keyword: 12,
  claimKeywords: 3,
  nodes: 8,
  when: 16,
  title: 24,
  detail: 200,
  points: 6,
  point: 80,
  closing: 160,
  steps: 6,
  stepName: 12,
  stepDetail: 160,
  longingKeywords: 6,
  longingLine: 220,
  groups: 4,
  who: 120,
  groupDirection: 120,
  connect: 120,
  goal: 120,
  json: 20000,
};

export function emptyAspiration(): AspirationPage {
  return {
    claim: { sentence: "", keywords: [] },
    story: { nodes: [] },
    believe: { points: [], closing: "" },
    practice: { steps: [] },
    longing: { keywords: [], line: "" },
    resonance: { groups: [] },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max);
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqTexts(items: string[], maxItems: number, maxLen: number, minLen = 2) {
  const out: string[] = [];
  for (const item of items) {
    const text = item.trim().slice(0, maxLen);
    if (text.length < minLen || out.includes(text)) continue;
    out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function normalizeAspiration(input: unknown): AspirationPage {
  const src = asRecord(input);
  const claim = asRecord(src.claim);
  const story = asRecord(src.story);
  const believe = asRecord(src.believe);
  const practice = asRecord(src.practice);
  const longing = asRecord(src.longing);
  const resonance = asRecord(src.resonance);

  const nodes = asList(story.nodes)
    .map((node) => {
      const row = asRecord(node);
      return {
        when: asText(row.when, LIMIT.when),
        title: asText(row.title, LIMIT.title),
        detail: asText(row.detail, LIMIT.detail),
      };
    })
    .filter((node) => node.when || node.title || node.detail)
    .slice(0, LIMIT.nodes);

  const steps = asList(practice.steps)
    .map((step) => {
      const row = asRecord(step);
      return {
        name: asText(row.name, LIMIT.stepName),
        detail: asText(row.detail, LIMIT.stepDetail),
      };
    })
    .filter((step) => step.name || step.detail)
    .slice(0, LIMIT.steps);

  const groups = asList(resonance.groups)
    .map((group) => {
      const row = asRecord(group);
      return {
        who: asText(row.who, LIMIT.who),
        direction: asText(row.direction, LIMIT.groupDirection),
        connect: asText(row.connect, LIMIT.connect),
        goal: asText(row.goal, LIMIT.goal),
      };
    })
    .filter((group) => group.who || group.direction || group.connect)
    .slice(0, LIMIT.groups);

  return {
    claim: {
      sentence: asText(claim.sentence, LIMIT.sentence),
      keywords: uniqTexts(
        asList(claim.keywords).map((item) => asText(item, LIMIT.keyword)),
        LIMIT.claimKeywords,
        LIMIT.keyword,
        1,
      ),
    },
    story: { nodes },
    believe: {
      points: uniqTexts(
        asList(believe.points).map((item) => asText(item, LIMIT.point)),
        LIMIT.points,
        LIMIT.point,
      ),
      closing: asText(believe.closing, LIMIT.closing),
    },
    practice: { steps },
    longing: {
      keywords: uniqTexts(
        asList(longing.keywords).map((item) => asText(item, LIMIT.keyword)),
        LIMIT.longingKeywords,
        LIMIT.keyword,
        1,
      ),
      line: asText(longing.line, LIMIT.longingLine),
    },
    resonance: { groups },
  };
}

export function parseAspirationJson(raw: string | null | undefined): AspirationPage | null {
  if (!raw || !raw.trim()) return null;
  if (raw.length > LIMIT.json) return null;
  try {
    return normalizeAspiration(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function aspirationHasContent(page: AspirationPage) {
  return Boolean(
    page.claim.sentence ||
      page.claim.keywords.length ||
      page.story.nodes.length ||
      page.believe.points.length ||
      page.believe.closing ||
      page.practice.steps.length ||
      page.longing.keywords.length ||
      page.longing.line ||
      page.resonance.groups.length,
  );
}

function firstChunk(text: string, max: number) {
  const part = text.split(/[。！？\n]/)[0]?.trim() || text.trim();
  return part.slice(0, max);
}

function labeledPieces(text: string) {
  return text
    .split(/[；;·|/、，,\n]+/)
    .map((piece) => piece.replace(/^(擅长|向往|想成为|本源|做事看重)[：:]\s*/, "").trim())
    .filter((piece) => piece.length >= 2);
}

/** Old four-field profiles still render. Missing sections stay empty instead of throwing. */
export function aspirationFromLegacy(input: {
  experience?: string | null;
  expertise?: string | null;
  direction?: string | null;
  cases?: string | null;
}): AspirationPage {
  const experience = String(input.experience || "").trim();
  const expertise = String(input.expertise || "").trim();
  const direction = String(input.direction || "").trim();
  const cases = String(input.cases || "").trim();

  const directionChunks = direction
    .split(/[·\n]/)
    .map((piece) => piece.trim())
    .filter(Boolean);
  const sentence = firstChunk(directionChunks[0] || expertise || experience, LIMIT.sentence);

  const experienceParts = experience
    .split(/\n+/)
    .flatMap((block) => block.split(/。+/))
    .map((piece) => piece.trim())
    .filter((piece) => piece.length >= 2);

  const nodes: StoryNode[] =
    experienceParts.length <= 1
      ? experience
        ? [{ when: "", title: "走过的一段", detail: experience.slice(0, LIMIT.detail) }]
        : []
      : experienceParts.slice(0, LIMIT.nodes).map((piece) => ({
          when: "",
          title: "",
          detail: piece.slice(0, LIMIT.detail),
        }));

  const points = labeledPieces(expertise)
    .map((piece) => piece.slice(0, LIMIT.point))
    .slice(0, LIMIT.points);

  const caseLines = cases
    .replace(/\s*(\d+)[.、．]\s*/g, "\n$1. ")
    .split(/\n+/)
    .map((line) => line.replace(/^\d+[.、．]\s*/, "").trim())
    .filter((line) => line.length >= 2);

  const steps: PracticeStep[] =
    caseLines.length > 1
      ? caseLines.slice(0, LIMIT.steps).map((line) => ({
          name: line.slice(0, Math.min(8, LIMIT.stepName)),
          detail: line.length > 8 ? line.slice(0, LIMIT.stepDetail) : "",
        }))
      : cases
        ? [{ name: "正在做", detail: cases.slice(0, LIMIT.stepDetail) }]
        : [];

  const longingLine = direction && direction !== sentence ? direction.slice(0, LIMIT.longingLine) : "";

  return normalizeAspiration({
    claim: {
      sentence,
      keywords: labeledPieces(`${expertise}\n${directionChunks.slice(1).join("\n")}`)
        .filter((piece) => piece.length <= LIMIT.keyword)
        .slice(0, LIMIT.claimKeywords),
    },
    story: { nodes },
    believe: { points, closing: "" },
    practice: { steps },
    longing: {
      keywords: labeledPieces(direction)
        .filter((piece) => piece.length <= LIMIT.keyword)
        .slice(0, LIMIT.longingKeywords),
      line: longingLine,
    },
    resonance: { groups: [] },
  });
}

export function resolveAspiration(input: {
  aspiration_json?: string | null;
  experience?: string | null;
  expertise?: string | null;
  direction?: string | null;
  cases?: string | null;
}): AspirationPage {
  const parsed = parseAspirationJson(input.aspiration_json);
  if (parsed && aspirationHasContent(parsed)) return parsed;
  return aspirationFromLegacy(input);
}

/** Keep the original columns in sync so older readers (AI 分身 context) still have prose. */
export function legacyMirror(page: AspirationPage) {
  const sentence = page.claim.sentence.trim();
  const line = page.longing.line.trim();
  const direction = (line.length >= sentence.length ? line : sentence).slice(0, 800);
  const expertise = uniqTexts([...page.claim.keywords, ...page.believe.points], 8, 80).join("；").slice(0, 800);
  const experience = page.story.nodes
    .map((node) => [node.when, node.title, node.detail].filter(Boolean).join(" · "))
    .join("\n")
    .slice(0, 2000);
  const cases = [
    ...page.practice.steps.map((step, index) => `${index + 1}. ${step.name}${step.detail ? `：${step.detail}` : ""}`),
    ...page.resonance.groups.map((group) =>
      [group.who, group.direction, group.connect, group.goal].filter(Boolean).join(" / "),
    ),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);
  return { experience, expertise, direction, cases };
}

export function aspirationPdfSections(page: AspirationPage): Array<{ title: string; body: string }> {
  const sections: Array<{ title: string; body: string }> = [];
  const claim = [page.claim.sentence, page.claim.keywords.length ? page.claim.keywords.join(" · ") : ""]
    .filter(Boolean)
    .join("\n");
  if (claim) sections.push({ title: "主张", body: claim });

  const story = page.story.nodes
    .map((node) => {
      const head = [node.when, node.title].filter(Boolean).join(" ");
      return `· ${head}${node.detail ? ` — ${node.detail}` : ""}`.trim();
    })
    .join("\n");
  if (story) sections.push({ title: "故事", body: story });

  const believe = [...page.believe.points.map((point) => `· ${point}`), page.believe.closing].filter(Boolean).join("\n");
  if (believe) sections.push({ title: "相信", body: believe });

  const steps = page.practice.steps
    .map((step, index) => `${index + 1}. ${step.name}${step.detail ? ` — ${step.detail}` : ""}`)
    .join("\n");
  if (steps) sections.push({ title: "做事", body: steps });

  const longing = [page.longing.keywords.join(" · "), page.longing.line].filter(Boolean).join("\n");
  if (longing) sections.push({ title: "向往", body: longing });

  const people = page.resonance.groups
    .map((group, index) => {
      const lines = [
        group.who ? `他们是谁：${group.who}` : "",
        group.direction ? `共同方向：${group.direction}` : "",
        group.connect ? `连接方式：${group.connect}` : "",
        group.goal ? `共同目标：${group.goal}` : "",
      ].filter(Boolean);
      return lines.length ? `${index + 1}.\n${lines.join("\n")}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
  if (people) sections.push({ title: "同频", body: people });

  return sections.map((section) => ({ title: section.title, body: clip(section.body, 1800) }));
}

export function aspirationShareText(page: AspirationPage) {
  return (
    page.claim.sentence ||
    page.longing.line ||
    page.story.nodes[0]?.detail ||
    page.believe.points[0] ||
    ""
  );
}
