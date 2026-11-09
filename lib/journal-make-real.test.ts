import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const migrationPath = path.join(root, "migrations/0015_journal_make_real.sql");
const seedPath = path.join(root, "seed/journal-make-real-10.sql");

const EXPECTED = [
  ["art_aspire_first", "first-small-work", "不必等准备好，先做出第一个小作品"],
  ["art_aspire_who", "who-you-can-help", "你会什么之外，更重要的是你能帮谁"],
  ["art_aspire_decide", "ai-keeps-the-choice", "让 AI 替你处理事务，不替你决定人生"],
  ["art_aspire_service", "ordinary-experience-service", "你习以为常的经验，也许就是别人需要的服务"],
  ["art_aspire_clear", "say-yourself-clearly", "不必让所有人喜欢，先把自己说清楚"],
  ["art_aspire_listen", "listen-to-one-person", "别一直闭门打磨，去听一个真实的人怎么说"],
  ["art_aspire_worth", "after-likes-what-counts", "有人点赞之后，怎样知道它真的有价值"],
  ["art_aspire_rhythm", "rhythm-you-can-keep", "创造不该耗尽你：找到能持续的节奏"],
  ["art_aspire_keep", "leave-the-work-behind", "别每次从零开始，把做过的事留下来"],
  ["art_aspire_choose", "choose-work-and-life", "自由不是不工作，而是能选择怎样工作和生活"],
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

function articleImage(block: string) {
  const collapsed = block.replace(/\s+/g, " ").trim();
  const match = /^!\[(.*?)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)\s*$/.exec(collapsed);
  if (!match) return null;
  return { alt: match[1] || "", src: match[2] };
}

test("make-real migration is insert-only and matches the seed file", () => {
  const sql = readFileSync(migrationPath, "utf8");
  assert.equal(readFileSync(seedPath, "utf8"), sql);
  assert.doesNotMatch(sql, /\b(DELETE|UPDATE|DROP|ALTER)\b/i);
  assert.match(sql, /INSERT OR IGNORE INTO articles/);
});

test("ten make-real essays are unique, dated, illustrated, and do not collide", () => {
  const sql = readFileSync(migrationPath, "utf8");
  const values = sqlStrings(sql);
  assert.equal(values.length, 90);
  const older = new Set<string>();
  for (const file of readdirSync(path.join(root, "migrations"))) {
    if (!file.endsWith(".sql") || file.startsWith("0015_")) continue;
    for (const value of sqlStrings(readFileSync(path.join(root, "migrations", file), "utf8"))) {
      if (/^[a-z0-9-]{2,48}$/.test(value)) older.add(value);
    }
  }
  const seen = new Set<string>();
  for (let n = 0; n < 10; n += 1) {
    const [id, slug, title, summary, topic, tags, cover, body, published] = values.slice(n * 9, n * 9 + 9);
    const expected = EXPECTED[n];
    assert.equal(id, expected[0]);
    assert.equal(slug, expected[1]);
    assert.equal(title, expected[2]);
    assert.ok(summary.length > 20);
    assert.match(topic, /^把向往做出来 \/ /);
    assert.ok(tags.split(",").length >= 3);
    assert.equal(cover, `/images/journal/${slug}-cover.webp`);
    assert.match(published, /^2026-11-09T(1[2-6]):[03]0:00$/);
    assert.ok(!seen.has(slug) && !older.has(slug));
    seen.add(slug);
    const cjk = (body.match(/[\u4e00-\u9fff]/g) || []).length;
    assert.ok(cjk >= 2500 && cjk <= 3500, `${slug} ${cjk}`);
    const blocks = body.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
    const images = blocks.map(articleImage).filter((item): item is { alt: string; src: string } => Boolean(item));
    assert.ok(images.length >= 2 && images.length <= 3, `${slug} images ${images.length}`);
    assert.equal(images.length, blocks.filter((block) => block.startsWith("![")).length);
    const paths = [cover, ...images.map((image) => image.src)];
    for (const rel of paths) {
      const file = path.join(root, "public", rel);
      const size = webpSize(readFileSync(file));
      assert.deepEqual(size, { width: 1600, height: 900 }, rel);
    }
    for (const image of images) {
      assert.ok(image.alt.length >= 8, image.src);
    }
    assert.doesNotMatch(body, /谢昌|七维探索|立即报名|保你|月入/);
  }
  const times = Array.from({ length: 10 }, (_, n) => values[n * 9 + 8]);
  const sorted = [...times].sort((a, b) => (a < b ? 1 : -1));
  assert.deepEqual(times, sorted);
  assert.equal(times[0], "2026-11-09T16:30:00");
  assert.equal(times[9], "2026-11-09T12:00:00");
});
