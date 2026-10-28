import assert from "node:assert/strict";
import test from "node:test";
import {
  aspirationFromLegacy,
  aspirationHasContent,
  emptyAspiration,
  legacyMirror,
  normalizeAspiration,
  resolveAspiration,
} from "./aspiration";

test("legacy four fields map into sections and bad json falls back", () => {
  const page = resolveAspiration({
    aspiration_json: "{nope",
    experience: "十年在供应链里跟单。后来开始自己做小咨询。",
    expertise: "擅长：供应链跟进；做事看重：把话说清楚",
    direction: "想把经验做成小规模服务",
    cases: "1. 轻咨询\n2. 访谈三位老板",
  });
  assert.match(page.claim.sentence, /小规模服务/);
  assert.ok(page.story.nodes.length >= 2);
  assert.ok(page.believe.points.some((point) => point.includes("供应链") || point.includes("说清楚")));
  assert.equal(page.practice.steps.length, 2);
  assert.equal(page.resonance.groups.length, 0);
  assert.equal(aspirationHasContent(page), true);
});

test("saved six-section json wins over older columns", () => {
  const stored = emptyAspiration();
  stored.claim.sentence = "我自己改过的主张";
  stored.claim.keywords = ["慢", "真", "远"];
  const page = resolveAspiration({
    aspiration_json: JSON.stringify(stored),
    direction: "旧方向",
    experience: "旧经历",
    expertise: "旧专长",
    cases: "旧案例",
  });
  assert.equal(page.claim.sentence, "我自己改过的主张");
  assert.deepEqual(page.claim.keywords, ["慢", "真", "远"]);
  assert.equal(page.story.nodes.length, 0);
});

test("empty stored json still reads the old columns", () => {
  const page = resolveAspiration({
    aspiration_json: "{}",
    direction: "仍然想慢慢来",
    experience: "",
    expertise: "",
    cases: "",
  });
  assert.match(page.claim.sentence, /慢慢来/);
});

test("normalize caps resonance groups and drops blank ones", () => {
  const raw = emptyAspiration();
  raw.resonance.groups = [
    ...Array.from({ length: 5 }, (_, index) => ({
      who: `人${index}`,
      direction: "方向",
      connect: "写信",
      goal: "",
    })),
    { who: "", direction: "", connect: "", goal: "只有目标" },
  ];
  const page = normalizeAspiration(raw);
  assert.equal(page.resonance.groups.length, 4);
  assert.equal(aspirationHasContent(aspirationFromLegacy({ experience: "", expertise: "", direction: "", cases: "" })), false);
});

test("legacy mirror keeps a prose trace of the six sections", () => {
  const page = normalizeAspiration({
    claim: { sentence: "我想把日子过慢一点", keywords: ["慢", "院子"] },
    story: { nodes: [{ when: "起点", title: "关掉手机", detail: "感到自在" }] },
    believe: { points: ["不拿别人的节奏衡量自己"], closing: "" },
    practice: { steps: [{ name: "动手", detail: "先整理一次行程" }] },
    longing: { keywords: ["早起"], line: "想靠近早起散步的日子" },
    resonance: { groups: [{ who: "说话不用硬撑的人", direction: "一起走慢", connect: "先读这一页", goal: "" }] },
  });
  const mirror = legacyMirror(page);
  assert.match(mirror.direction, /早起|慢一点/);
  assert.match(mirror.experience, /关掉手机/);
  assert.match(mirror.cases, /动手|说话不用硬撑/);
});
