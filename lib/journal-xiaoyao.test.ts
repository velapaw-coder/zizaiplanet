import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const migrationPath = path.join(root, "migrations/0016_journal_xiaoyao.sql");
const seedPath = path.join(root, "seed/journal-xiaoyao-10.sql");

const EXPECTED = [
  ["art_xiao_desire", "wanting-more-freedom", "《道德经》｜想要的越来越多，人还能自由吗？", "2026-11-10T01:40:00"],
  ["art_xiao_praise", "unmoved-by-praise", "《庄子》｜不再被别人的评价困住，才能活出自己的逍遥", "2026-11-10T01:30:00"],
  ["art_xiao_change", "not-pushed-by-change", "《周易》｜人生不断变化，怎样不被变化推着走？", "2026-11-10T01:20:00"],
  ["art_xiao_measure", "heart-within-measure", "《论语》｜从心所欲不逾矩：自由与边界，真的矛盾吗？", "2026-11-10T01:10:00"],
  ["art_xiao_worth", "know-what-is-worth", "《大学》｜知道什么值得追求，才能从忙乱中获得自由", "2026-11-10T01:00:00"],
  ["art_xiao_middle", "neither-forced-nor-loose", "《中庸》｜不勉强自己，也不放任自己：找到自在的分寸", "2026-11-10T00:50:00"],
  ["art_xiao_battle", "decline-some-battles", "《孙子兵法》｜不卷入每一场竞争，是一种选择的自由", "2026-11-10T00:40:00"],
  ["art_xiao_refuse", "freedom-to-refuse", "《孟子》｜有所不为，才有不被利益牵着走的自由", "2026-11-10T00:30:00"],
  ["art_xiao_thief", "thief-in-the-heart", "《传习录》｜放下心里的贼：为什么没人束缚你，你仍不自在？", "2026-11-10T00:20:00"],
  ["art_xiao_near", "near-but-not-seized", "《礼记》｜在人与人的关系里，怎样既有连接，也有自由？", "2026-11-10T00:10:00"],
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
  return match ? { alt: match[1] || "", src: match[2] } : null;
}

test("xiaoyao migration is insert-only and matches its seed file", () => {
  const sql = readFileSync(migrationPath, "utf8");
  assert.equal(readFileSync(seedPath, "utf8"), sql);
  assert.doesNotMatch(sql, /\b(DELETE|UPDATE|DROP|ALTER)\b/);
  assert.match(sql, /INSERT OR IGNORE INTO articles/);
  assert.match(readFileSync(path.join(root, "public/images/journal/xiaoyao-image-sources.md"), "utf8"), /Public domain/);
});

test("ten xiaoyao essays keep distinct classics, sources, and old slugs", () => {
  const sql = readFileSync(migrationPath, "utf8");
  const values = sqlStrings(sql);
  assert.equal(values.length, 90);
  const older = new Set<string>();
  for (const file of readdirSync(path.join(root, "migrations"))) {
    if (!file.endsWith(".sql") || file.startsWith("0016_")) continue;
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
    assert.equal(published, expected[3]);
    assert.match(topic, /^逍遥 \/ /);
    assert.ok(summary.length > 12);
    assert.ok(!seen.has(slug) && !older.has(slug));
    seen.add(slug);
    const cjk = (body.match(/[\u4e00-\u9fff]/g) || []).length;
    assert.ok(cjk >= 2500 && cjk <= 3500, `${slug} ${cjk}`);
    const blocks = body.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
    const images = blocks.map(articleImage).filter((item): item is { alt: string; src: string } => Boolean(item));
    assert.ok(images.length >= 2 && images.length <= 3, slug);
    for (const rel of [cover, ...images.map((image) => image.src)]) {
      const size = webpSize(readFileSync(path.join(root, "public", rel)));
      assert.deepEqual(size, { width: 1600, height: 900 }, rel);
    }
    assert.match(body, /公有领域|CC0/);
    assert.doesNotMatch(body, /谢昌|月入|保你赚/);
  }
  assert.match(values[8 * 9 + 7], /与杨仕德薛尚谦/);
  assert.match(values[8 * 9 + 7], /不在《传习录》/);
});
