import assert from "node:assert/strict";
import test from "node:test";
import { composeHome, draftRoom } from "./compose";
import { draftPublicProfileFields, readableSlugCandidate } from "./profile-generate";

function lit(id: string, name: string, quote: string) {
  return draftRoom(id, name, [
    { answer: quote, skipped: false },
    { answer: `${quote}的具体小事`, skipped: false },
  ]);
}

test("draftPublicProfileFields from explore only is public-safe", () => {
  const cards = [
    lit("origin", "本源", "关掉手机后我感到真正自在"),
    lit("talent", "天赋", "帮邻居整理出差行程时特别顺手"),
    lit("taste", "品味", "喜欢安静有光的小院子"),
    lit("values", "价值观", "不拿别人的节奏衡量自己"),
    lit("identity", "身份", "想成为能带人慢慢看清自己的人"),
    lit("relation", "同频关系", "想和说话不用硬撑的人在一起"),
    lit("vision", "人生愿景", "普通一天：早起散步，傍晚写一点东西"),
  ];
  const home = composeHome({ cards, changeNote: "测试" });
  const draft = draftPublicProfileFields({ card: home, directionSummary: null });
  assert.equal(draft.source, "explore");
  assert.match(draft.expertise, /擅长|整理出差/);
  assert.match(draft.direction, /向往|想成为|本源/);
  assert.match(draft.experience, /能力|生活/);
  // must not dump full multi-turn chat / portrait markdown markers
  assert.doesNotMatch(draft.experience + draft.expertise + draft.direction, /<<<|对话画像原文/);
});

test("draftPublicProfileFields prefers partner direction summary", () => {
  const cards = [
    lit("origin", "本源", "关掉手机后我感到真正自在"),
    lit("talent", "天赋", "帮邻居整理出差行程时特别顺手"),
    lit("taste", "品味", "喜欢安静有光的小院子"),
    lit("values", "价值观", "不拿别人的节奏衡量自己"),
    lit("identity", "身份", "想成为能带人慢慢看清自己的人"),
    lit("relation", "同频关系", "想和说话不用硬撑的人在一起"),
    lit("vision", "人生愿景", "普通一天早起散步傍晚写一点东西"),
  ];
  const home = composeHome({ cards, changeNote: "t" });
  const summary = `标题：认清起点
一句话方向：把制造业经验做成小规模外贸跟进服务。
能力与资源：十年供应链 + 客户沟通。
可选方向：1.轻咨询 2.AI 提效小交付
本周最小一步：访谈三位外贸老板。`;
  const draft = draftPublicProfileFields({ card: home, directionSummary: summary });
  assert.equal(draft.source, "both");
  assert.match(draft.direction, /制造业经验|外贸跟进/);
  assert.match(draft.expertise, /供应链|沟通/);
  assert.match(draft.cases, /轻咨询|访谈/);
});

test("readableSlugCandidate falls back for Chinese names", () => {
  assert.equal(readableSlugCandidate("Alice Chen", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"), "alice-chen");
  assert.match(readableSlugCandidate("林间", "12345678-aaaa-bbbb-cccc-ddddeeeeffff"), /^zp-12345678$/);
});
