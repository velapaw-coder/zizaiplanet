import assert from "node:assert/strict";
import test from "node:test";
import { ruleModeration } from "./moderate-rules";

test("ordinary life notes pass the rule check", () => {
  const result = ruleModeration("下午的光停在桌角，我把书翻到昨天那一页。");
  assert.equal(result.pass, true);
});

test("ads, abuse, and fraud stay off the public feed", () => {
  assert.equal(ruleModeration("想聊天的加微信 abc123").pass, false);
  assert.match(ruleModeration("这人真是傻逼").reason, /辱骂/);
  assert.match(ruleModeration("刷单日入过千，稳赚不赔").reason, /诈骗/);
});
