import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const migrationPath = path.join(root, "migrations/0018_journal_integrity.sql");
const seedPath = path.join(root, "seed/journal-integrity-10.sql");
const review = readFileSync(path.join(root, "lib/integrity-review-source.md"), "utf8");

const ORDER = [
  ["art_xin_light", "integrity-light-promise", "道德经 · 诚信｜轻许的那句，往往最先失信", "2026-11-17T23:20:00", "诚信 / 道德经"],
  ["art_xin_true", "integrity-not-saying-all", "庄子 · 诚信｜真诚不是把所有话都说尽", "2026-11-17T23:10:00", "诚信 / 庄子"],
  ["art_xin_daily", "integrity-trust-by-repetition", "周易 · 诚信｜信用是一次次做出来的，不是一次声明", "2026-11-17T23:00:00", "诚信 / 周易"],
  ["art_xin_fault", "integrity-faults-in-the-open", "论语 · 诚信｜有过错而不瞒，改了才更值得托付", "2026-11-17T22:50:00", "诚信 / 论语"],
  ["art_xin_self", "integrity-do-not-self-deceive", "大学 · 诚信｜最难骗过的，其实是自己", "2026-11-17T22:40:00", "诚信 / 大学"],
  ["art_xin_alone", "integrity-when-unseen", "中庸 · 诚信｜越是无人看见，越要跟自己一致", "2026-11-17T22:30:00", "诚信 / 中庸"],
  ["art_xin_ruse", "integrity-ruse-not-for-partners", "孙子兵法 · 诚信｜兵可以诡，合作不能诡", "2026-11-17T22:20:00", "诚信 / 孙子兵法"],
  ["art_xin_plain", "integrity-not-flattery", "孟子 · 诚信｜讨好换来的同意，不是诚", "2026-11-17T22:10:00", "诚信 / 孟子"],
  ["art_xin_act", "integrity-knowing-is-doing", "传习录 · 诚信｜知道却不做，其实还不知道", "2026-11-17T22:00:00", "诚信 / 传习录"],
  ["art_xin_form", "integrity-shared-rules", "礼记 · 诚信｜互信写在彼此都守的规矩里", "2026-11-17T21:50:00", "诚信 / 礼记"],
] as const;

function sqlStrings(sql: string) {
  const values: string[] = [];
  let i = 0;
  while (i < sql.length) {
    if (sql[i] !== "'") {
      i += 1;
      continue;
    }
    let j = i + 1;
    let out = "";
    while (j < sql.length) {
      if (sql[j] === "'" && sql[j + 1] === "'") {
        out += "'";
        j += 2;
        continue;
      }
      if (sql[j] === "'") break;
      out += sql[j];
      j += 1;
    }
    assert.notEqual(j, sql.length, "unterminated SQL string");
    values.push(out);
    i = j + 1;
  }
  return values;
}

function webpSize(buf: Buffer) {
  assert.equal(buf.subarray(0, 4).toString(), "RIFF");
  assert.equal(buf.subarray(8, 12).toString(), "WEBP");
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const tag = buf.subarray(offset, offset + 4).toString();
    const size = buf.readUInt32LE(offset + 4);
    const payload = buf.subarray(offset + 8, offset + 8 + size);
    if (tag === "VP8X" && payload.length >= 10) {
      return { width: 1 + payload.readUIntLE(4, 3), height: 1 + payload.readUIntLE(7, 3) };
    }
    if (tag === "VP8 ") {
      const mark = payload.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
      assert.ok(mark >= 0);
      return {
        width: payload.readUInt16LE(mark + 3) & 0x3fff,
        height: payload.readUInt16LE(mark + 5) & 0x3fff,
      };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("webp size not found");
}

function approvedParagraphs(markdown: string) {
  return markdown
    .split(/\n## /)
    .filter((part) => /^(道德经|庄子|周易|论语|大学|中庸|孙子兵法|孟子|传习录|礼记) /.test(part))
    .map((part) =>
      part
        .split(/\n\s*\n/)
        .slice(1)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk && !chunk.startsWith("*角度：") && !chunk.includes("返回目录") && !chunk.startsWith("![")),
    )
    .map((chunks) => chunks.filter((chunk) => !(chunk.startsWith("*") && chunk.endsWith("*"))));
}

function articleImage(block: string) {
  const collapsed = block.replace(/\s+/g, " ").trim();
  const match = /^!\[(.*?)\]\((\/[^)\s]+)\)\s*$/.exec(collapsed);
  return match ? { alt: match[1], src: match[2] } : null;
}

test("integrity migration inserts only the ten approved essays", () => {
  const sql = readFileSync(migrationPath, "utf8");
  assert.equal(readFileSync(seedPath, "utf8"), sql);
  assert.doesNotMatch(sql, /\b(DELETE|UPDATE|DROP|ALTER)\b/);
  assert.match(sql, /INSERT OR IGNORE INTO articles/);
  assert.doesNotMatch(readFileSync(path.join(root, "migrations/0016_journal_xiaoyao.sql"), "utf8"), /integrity-/);
  assert.doesNotMatch(readFileSync(path.join(root, "migrations/0017_journal_xiaoyao_concise.sql"), "utf8"), /integrity-/);
  const values = sqlStrings(sql);
  assert.equal(values.length, 90);
  const older = new Set<string>();
  for (const file of readdirSync(path.join(root, "migrations"))) {
    if (!file.endsWith(".sql") || file.startsWith("0018_")) continue;
    for (const value of sqlStrings(readFileSync(path.join(root, "migrations", file), "utf8"))) {
      if (/^[a-z0-9-]{2,48}$/.test(value)) older.add(value);
    }
  }
  for (let n = 0; n < 10; n += 1) {
    const [id, slug, title, , topic, , cover, body, published] = values.slice(n * 9, n * 9 + 9);
    const expected = ORDER[n];
    assert.equal(id, expected[0]);
    assert.equal(slug, expected[1]);
    assert.equal(title, expected[2]);
    assert.equal(published, expected[3]);
    assert.equal(topic, expected[4]);
    assert.ok(!older.has(slug) && !older.has(id));
    assert.equal(cover, `/images/journal/${["integrity-daodejing","integrity-zhuangzi","integrity-yijing","integrity-analects","integrity-daxue","integrity-zhongyong","integrity-sunzi","integrity-mencius","integrity-chuanxilu","integrity-liji"][n]}-cover.webp`);
    const prose = body.split(/\n\n+/).map((block) => block.trim()).filter((block) => block && !articleImage(block));
    const approved = approvedParagraphs(review)[n];
    assert.deepEqual(prose.slice(0, approved.length), approved);
    const images = body.split(/\n\n+/).map(articleImage).filter((item): item is { alt: string; src: string } => Boolean(item));
    const captions = review
      .split(/\n## /)
      .filter((part) => /^(道德经|庄子|周易|论语|大学|中庸|孙子兵法|孟子|传习录|礼记) /.test(part))
      [n].split(/\n\s*\n/)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.startsWith("*") && chunk.endsWith("*") && !chunk.startsWith("*角度："))
      .map((chunk) => chunk.slice(1, -1).trim());
    assert.equal(images.length, 1);
    assert.equal(captions.length, 2);
    assert.equal(images[0].alt, `${captions[1]}。AI生成的生活场景。`);
    assert.match(images[0].alt, /AI生成的生活场景/);
    assert.doesNotMatch(images[0].alt, /实拍|公有领域|古画/);
    for (const rel of [cover, images[0].src]) {
      const size = webpSize(readFileSync(path.join(root, "public", rel)));
      assert.ok(size.width >= 900 && Math.abs(size.width / size.height - 16 / 9) < 0.03, rel);
    }
    assert.doesNotMatch(body, /返回目录|尚未发布|sources\.md|角度：/);
  }
});
