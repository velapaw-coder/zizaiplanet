import assert from "node:assert/strict";
import test from "node:test";
import { composeHome, draftRoom, evidenceFor, homeCardTitle } from "./compose";
import { keywordsFrom } from "./text";

test("keywords stay inside the user's words", () => {
  const words = keywordsFrom("清晨独自散步，不需要向谁解释");
  assert.ok(words.length > 0);
  assert.equal(words.some((word) => word.includes("创业")), false);
  assert.ok(words.every((word) => "清晨独自散步，不需要向谁解释".includes(word)));
});

test("evidence follows how much was actually said", () => {
  assert.deepEqual(evidenceFor([{ answer: "太短", skipped: false }]), { evidence: "待加深", lit: false });
  assert.equal(
    evidenceFor([{ answer: "我喜欢清晨一个人走路", skipped: false }, { answer: null, skipped: true }]).evidence,
    "待验证",
  );
  const strong = evidenceFor([
    {
      answer: "周末我会关掉消息，在院子里待到天黑，那时候不必向任何人解释自己正在做什么，只是坐着。",
      skipped: false,
    },
    {
      answer: "去年春天我一个人去了城外的水库，坐了整个下午，没有拍照，也没有发消息给谁。",
      skipped: false,
    },
  ]);
  assert.equal(strong.evidence, "较强");
  assert.equal(strong.lit, true);
});

test("identity stays unwritten until the first four dimensions and identity have quotes", () => {
  const partial = composeHome({
    cards: [
      draftRoom("origin", "本源", [{ answer: "不需要证明的时候是清晨散步", skipped: false }]),
      draftRoom("talent", "天赋", [{ answer: "修东西的时候会忘记时间", skipped: false }]),
      draftRoom("taste", "品味", [{ answer: "喜欢窗边一张空桌子", skipped: false }]),
    ],
  });
  assert.equal(partial.identityStatus, "待加深");
  assert.equal(partial.privateName, null);
  assert.match(partial.identityNote, /待加深/);
  assert.equal(partial.identityNote.includes("创业"), false);
  assert.equal(partial.provisional, true);
  assert.equal(partial.portraitReady, false);
  assert.ok(partial.nextSteps.length <= 3);
  assert.match(partial.oneLiner, /清晨散步/);
  assert.equal(homeCardTitle(partial), "临时个人画像");
  assert.match(partial.directionNote, /临时方向|七维/);
  assert.equal(partial.identityNote.includes("镜厅"), false);
  assert.equal(partial.nextSteps.some((s) => s.includes("房间")), false);
});

test("a private name can grow only from the identity-dimension quote", () => {
  const answers = (text: string) => [{ answer: text, skipped: false }, { answer: `${text}。这是一件具体的小事，我记得当时的光线。`, skipped: false }];
  const full = composeHome({
    cards: [
      draftRoom("origin", "本源", answers("清晨散步时最自在")),
      draftRoom("talent", "天赋", answers("修旧物会忘记时间")),
      draftRoom("taste", "品味", answers("窗边一张空桌子就够")),
      draftRoom("values", "价值观", answers("不想用忙来证明自己")),
      draftRoom("identity", "身份", answers("我希望被认识成一个慢慢做事的人")),
    ],
    changeNote: "首次安家",
  });
  assert.equal(full.identityStatus, "已从证据长出");
  assert.ok(full.privateName);
  assert.match(full.identityNote, /慢慢做事/);
  assert.match(full.identityNote, /清晨散步/);
  assert.equal(full.changeNote, "首次安家");
  assert.equal(full.identityNote.includes("创始人"), false);
  assert.equal(full.identityNote.includes("镜厅"), false);
  assert.equal(full.portraitReady, false);
});

test("all seven dimensions lit yields a ready personal portrait", () => {
  const answers = (text: string) => [
    { answer: text, skipped: false },
    { answer: `${text}。记得当时窗外的光，我没有赶时间。`, skipped: false },
  ];
  const portrait = composeHome({
    cards: [
      draftRoom("origin", "本源", answers("清晨散步时最自在")),
      draftRoom("talent", "天赋", answers("修旧物会忘记时间")),
      draftRoom("taste", "品味", answers("窗边一张空桌子就够")),
      draftRoom("values", "价值观", answers("不想用忙来证明自己")),
      draftRoom("identity", "身份", answers("我希望被认识成一个慢慢做事的人")),
      draftRoom("relation", "同频关系", answers("喜欢不用解释的陪伴")),
      draftRoom("vision", "人生愿景", answers("普通日子有茶有书就好")),
    ],
  });
  assert.equal(portrait.litCount, 7);
  assert.equal(portrait.portraitReady, true);
  assert.equal(portrait.provisional, false);
  assert.equal(homeCardTitle(portrait), "我的个人画像");
  assert.match(portrait.directionNote, /本源|向往|想成为/);
  assert.ok(portrait.nextSteps.some((s) => s.includes("AI 分身") || s.includes("主页") || s.includes("重修")));
});
