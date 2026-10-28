import assert from "node:assert/strict";
import test from "node:test";
import { composeHome, draftRoom } from "./compose";
import { composeExplorePlan, explorePlanPlainText } from "./explore-plan";

function lit(id: string, name: string, quote: string) {
  return draftRoom(id, name, [
    { answer: quote, skipped: false },
    { answer: `${quote}的具体小事`, skipped: false },
  ]);
}

test("composeExplorePlan builds overall scheme when 7 dims lit", () => {
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
  const plan = composeExplorePlan({ card: home, displayName: "样板居民" });
  assert.equal(plan.portraitReady, true);
  assert.match(plan.title, /自我探索方案/);
  assert.match(plan.direction, /本源/);
  assert.match(plan.closing, /样板居民/);
  const text = explorePlanPlainText(plan);
  assert.match(text, /自在星球/);
  assert.match(text, /企业微信/);
});
