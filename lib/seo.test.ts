import assert from "node:assert/strict";
import test from "node:test";
import { PAGE_COPY, absoluteUrl, articleJsonLd, pageMeta, siteJsonLd, toIsoDateTime } from "./seo";

test("absolute urls stay on the production host", () => {
  assert.equal(absoluteUrl("/"), "https://www.zizaiplanet.com");
  assert.equal(absoluteUrl("/explore"), "https://www.zizaiplanet.com/explore");
  assert.equal(absoluteUrl("https://images.unsplash.com/photo"), "https://images.unsplash.com/photo");
});

test("page meta points open graph and canonical at the page itself", () => {
  const meta = pageMeta(PAGE_COPY.explore);
  assert.equal(meta.openGraph && "url" in meta.openGraph ? meta.openGraph.url : "", "https://www.zizaiplanet.com/explore");
  assert.equal(meta.alternates?.canonical, "https://www.zizaiplanet.com/explore");
  assert.equal(
    meta.openGraph && "title" in meta.openGraph ? meta.openGraph.title : "",
    "见自己 · 七维自我探索 · 自在星球",
  );
  assert.equal(meta.twitter?.title, "见自己 · 七维自我探索 · 自在星球");
  assert.equal(meta.robots, undefined);
});

test("home title is absolute so the layout template does not double the brand", () => {
  const meta = pageMeta(PAGE_COPY.home);
  assert.deepEqual(meta.title, { absolute: "自在星球 · AI创造自由" });
  assert.equal(meta.openGraph && "url" in meta.openGraph ? meta.openGraph.url : "", "https://www.zizaiplanet.com");
  assert.equal(meta.description, PAGE_COPY.home.description);
});

test("private pages are noindex, follow and still name their own url", () => {
  const meta = pageMeta({
    title: "创造者家园",
    description: "登录后的创造者家园。",
    path: "/garden",
    noindex: true,
  });
  assert.deepEqual(meta.robots, { index: false, follow: true });
  assert.equal(meta.openGraph && "url" in meta.openGraph ? meta.openGraph.url : "", "https://www.zizaiplanet.com/garden");
});

test("article metadata uses the cover and published time", () => {
  const meta = pageMeta({
    title: "看见自己",
    description: "先见自己。",
    path: "/journal/see-yourself-first",
    type: "article",
    image: "/images/journal/cover.webp",
    publishedTime: "2026-10-01T09:00:00",
  });
  assert.equal(meta.openGraph && "type" in meta.openGraph ? meta.openGraph.type : "", "article");
  assert.equal(
    meta.openGraph && "publishedTime" in meta.openGraph ? meta.openGraph.publishedTime : "",
    "2026-10-01T09:00:00+08:00",
  );
  const images = meta.openGraph && "images" in meta.openGraph ? meta.openGraph.images : [];
  const first = Array.isArray(images) ? images[0] : images;
  assert.equal(typeof first === "object" && first && "url" in first ? first.url : "", "https://www.zizaiplanet.com/images/journal/cover.webp");
});

test("dates without a clock still become iso", () => {
  assert.equal(toIsoDateTime("2026-10-12"), "2026-10-12T00:00:00+08:00");
  assert.equal(toIsoDateTime("not a date"), undefined);
});

test("site json-ld names the brand and skips search", () => {
  const json = JSON.stringify(siteJsonLd());
  assert.equal(json.includes("SearchAction"), false);
  assert.equal(json.includes("自在星球"), true);
  assert.equal(json.includes("https://www.zizaiplanet.com/logo.png"), true);
  assert.equal(json.includes("以道驭AI，以创造得自由"), true);
});

test("article json-ld is a blog posting from the organization", () => {
  const data = articleJsonLd({
    title: "看见自己",
    description: "先见自己。",
    path: "/journal/see-yourself-first",
    image: "https://images.unsplash.com/photo",
    datePublished: "2026-10-01 09:00:00",
  });
  assert.equal(data["@type"], "BlogPosting");
  assert.equal(data.author["@type"], "Organization");
  assert.equal(data.author.name, "自在星球");
  assert.equal(data.datePublished, "2026-10-01T09:00:00+08:00");
  assert.deepEqual(data.image, ["https://images.unsplash.com/photo"]);
});

test("public hub descriptions stay in the snippet range", () => {
  for (const [key, page] of Object.entries(PAGE_COPY)) {
    if (key === "home") continue;
    const han = page.description.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
    assert.ok(han >= 68 && han <= 120, `${key} han=${han}`);
    const social = `${page.title} · 自在星球`;
    assert.ok(social.length <= 80, `${key} title length ${social.length}`);
  }
});
