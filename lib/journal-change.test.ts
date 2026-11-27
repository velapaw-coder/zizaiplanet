import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const migrationPath = path.join(root, "migrations/0020_journal_change.sql");
const seedPath = path.join(root, "seed/journal-change-10.sql");
const review = readFileSync(path.join(root, "lib/change-review-source.md"), "utf8");

const CLASSICS = ["道德经", "庄子", "周易", "论语", "大学", "中庸", "孙子兵法", "孟子", "传习录", "礼记"];

const ORDER = [
  ["art_bian_hold", "change-ten-hold-loosely", "道德经 · 变化｜握得太紧的，往往先从手里滑走", "2026-11-27T17:20:00", "变化 / 道德经", "变化,道德经,松开,执着", "change-daodejing", "手松开了，布才摊得平"],
  ["art_bian_still", "change-ten-inside-still", "庄子 · 变化｜事情可以大变，里面不必一起跟着翻", "2026-11-27T17:10:00", "变化 / 庄子", "变化,庄子,安时,处顺", "change-zhuangzi", "风可以动，杯可以不动"],
  ["art_bian_timing", "change-ten-timing-to-act", "周易 · 变化｜时候未到硬改，和时候到了不改，是同一类错", "2026-11-27T17:00:00", "变化 / 周易", "变化,周易,行止,时机", "change-yijing", "开到一半，也是一种时候"],
  ["art_bian_line", "change-ten-line-unmoved", "论语 · 变化｜做法可以改，那条不该越过的线不能改", "2026-11-27T16:50:00", "变化 / 论语", "变化,论语,底线,权变", "change-analects", "位置可以挪，线还在原处"],
  ["art_bian_anchor", "change-ten-inner-anchor", "大学 · 变化｜心里没有定点，变化一来就会满屋乱转", "2026-11-27T16:40:00", "变化 / 大学", "变化,大学,定点,志向", "change-daxue", "先有压住的这一点，页才安得住"],
  ["art_bian_middle", "change-ten-neither-extreme", "中庸 · 变化｜拒绝一切变化，和追上所有变化，都会偏", "2026-11-27T16:30:00", "变化 / 中庸", "变化,中庸,中道,过偏", "change-zhongyong", "稍稍偏一点，仍然是稳的"],
  ["art_bian_aim", "change-ten-keep-the-aim", "孙子兵法 · 变化｜方法可以改，要去的那个地方不能被带跑", "2026-11-27T16:20:00", "变化 / 孙子兵法", "变化,孙子兵法,方向,方法", "change-sunzi", "水的走法可以改，要去的还是这只杯"],
  ["art_bian_stand", "change-ten-what-you-hold", "孟子 · 变化｜境遇换了，能立住的那一层还在你手里", "2026-11-27T16:10:00", "变化 / 孟子", "变化,孟子,立住,境遇", "change-mencius", "叶子可以落，这株还立着"],
  ["art_bian_act", "change-ten-move-before-clarity", "传习录 · 变化｜等想通了再动身，变化早走过去了", "2026-11-27T16:00:00", "变化 / 传习录", "变化,传习录,知行,行动", "change-chuanxilu", "叶子已经在壶里，这才算开始磨"],
  ["art_bian_form", "change-ten-form-and-care", "礼记 · 变化｜形式可以改，待人的底线不能随手改", "2026-11-27T15:50:00", "变化 / 礼记", "变化,礼记,形式,待人", "change-liji", "盘子可以拿开，两份还在"],
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
    .filter((part) => new RegExp(`^\\d+ (${CLASSICS.join("|")}) · 变化`).test(part))
    .map((part) =>
      part
        .split(/\n\s*\n/)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk && chunk !== "---")
        .slice(1),
    );
}

function articleImage(block: string) {
  const collapsed = block.replace(/\s+/g, " ").trim();
  const match = /^!\[(.*?)\]\((\/[^)\s]+)\)\s*$/.exec(collapsed);
  return match ? { alt: match[1], src: match[2] } : null;
}

test("change migration and seed insert only the ten approved essays", () => {
  const sql = readFileSync(migrationPath, "utf8");
  const seedSql = readFileSync(seedPath, "utf8");
  for (const text of [sql, seedSql]) {
    assert.equal((text.match(/INSERT OR IGNORE INTO articles/g) || []).length, 1);
    assert.doesNotMatch(text, /\b(DELETE|UPDATE|DROP|ALTER)\b/);
    assert.doesNotMatch(text, /INSERT OR REPLACE/);
    assert.doesNotMatch(text, /(^|\n)---(\n|$)/);
    assert.ok(!text.includes("art_nat_change"));
    assert.ok(!text.includes("art_dao_change"));
    assert.ok(!text.includes("change-what-stays"));
  }
  assert.equal(
    seedSql.slice(seedSql.indexOf("INSERT OR IGNORE INTO articles")),
    sql.slice(sql.indexOf("INSERT OR IGNORE INTO articles")),
  );

  const older = new Set<string>();
  for (const file of readdirSync(path.join(root, "migrations"))) {
    if (!file.endsWith(".sql") || file >= "0020_") continue;
    const text = readFileSync(path.join(root, "migrations", file), "utf8");
    for (const value of sqlStrings(text)) {
      if (/^[a-z0-9-]{2,48}$/.test(value)) older.add(value);
    }
  }

  const values = sqlStrings(sql);
  assert.equal(values.length, 90);
  const approved = approvedParagraphs(review);
  assert.equal(approved.length, 10);

  for (let n = 0; n < 10; n += 1) {
    const [id, slug, title, summary, topic, tags, cover, body, published] = values.slice(n * 9, n * 9 + 9);
    const expected = ORDER[n];
    assert.equal(id, expected[0]);
    assert.equal(slug, expected[1]);
    assert.equal(title, expected[2]);
    assert.equal(published, expected[3]);
    assert.equal(topic, expected[4]);
    assert.equal(tags, expected[5]);
    assert.equal(cover, `/images/journal/${expected[6]}-cover.webp`);
    assert.ok(!older.has(id) && !older.has(slug), `${id}/${slug} must be new`);
    for (const file of readdirSync(path.join(root, "migrations"))) {
      if (!file.endsWith(".sql") || file >= "0020_") continue;
      const text = readFileSync(path.join(root, "migrations", file), "utf8");
      assert.ok(!text.includes(id) && !text.includes(slug), `${id}/${slug} appears in ${file}`);
    }

    assert.match(published, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    if (n > 0) {
      const gap = Date.parse(ORDER[n - 1][3]) - Date.parse(published);
      assert.equal(gap, 10 * 60 * 1000);
    }

    assert.doesNotMatch(body, /可人相待|这一周可以做的一件小事/);
    assert.equal(body.split("\n").some((line) => line.trim() === "---"), false);

    const paragraphs = approved[n];
    assert.equal(paragraphs.length, 4);
    assert.equal(summary, paragraphs[0].slice(0, paragraphs[0].indexOf("。") + 1));

    const blocks = body.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
    assert.deepEqual(blocks.map(articleImage).filter(Boolean), [
      { alt: `${expected[7]}。AI生成的生活场景。`, src: `/images/journal/${expected[6]}-inline.webp` },
    ]);
    const imageIndex = blocks.findIndex((block) => articleImage(block));
    assert.equal(imageIndex, 2);
    const prose = blocks.filter((block) => !articleImage(block));
    assert.deepEqual(prose, paragraphs);
    assert.match(blocks[imageIndex], /AI生成的生活场景/);
    assert.doesNotMatch(blocks[imageIndex], /实拍|公有领域|古画/);

    for (const rel of [cover, `/images/journal/${expected[6]}-inline.webp`]) {
      const size = webpSize(readFileSync(path.join(root, "public", rel)));
      assert.equal(size.width, 1280, rel);
      assert.equal(size.height, 720, rel);
    }
  }

  assert.equal(ORDER[4][2].includes("心里没有定点"), true);
  assert.equal(ORDER[4][2].includes("泞有"), false);
  assert.equal(values[4 * 9 + 2].includes("心里没有定点"), true);
  assert.equal(values[4 * 9 + 2].includes("泞有"), false);
});

test("change series leaves the existing nature change essay and its images untouched", () => {
  const oldTitle = "周易 · 变化｜变化来时，先分清什么在变、什么没变";
  assert.match(readFileSync(path.join(root, "migrations/0013_journal_nature.sql"), "utf8"), new RegExp(oldTitle));
  assert.match(readFileSync(path.join(root, "seed/journal-nature-10.sql"), "utf8"), new RegExp(oldTitle));
  for (const rel of ["/images/journal/change-what-stays-cover.webp", "/images/journal/change-what-stays-inline.webp"]) {
    assert.ok(existsSync(path.join(root, "public", rel)), rel);
  }
  const newImages = new Set(
    ORDER.flatMap((row) => [`${row[6]}-cover.webp`, `${row[6]}-inline.webp`]),
  );
  assert.equal(newImages.size, 20);
  assert.ok(!newImages.has("change-what-stays-cover.webp"));
});
