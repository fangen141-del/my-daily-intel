import "./setup.ts";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fromHtml } from "@aihot/backend/sources/web-list";

const data = JSON.parse(await readFile(new URL("../industry/sources.json", import.meta.url), "utf8")) as {
  sources: Array<{ id:string; kind:string; config:Record<string,unknown>; tier:string; tags:string[] }>;
};

function source(id:string) {
  const found=data.sources.find(s=>s.id===id);
  assert.ok(found, "missing source "+id);
  return { ...found, participation_mode:"editorial" } as never;
}

test("mainland official sources are seeded as first-party web lists", () => {
  for (const id of ["web-cn-stats-latest","web-cn-ndrc-news","web-cn-csrc-news"]) {
    const s=data.sources.find(x=>x.id===id)!;
    assert.equal(s.kind,"web_list");
    assert.equal(s.tier,"T1");
    assert.ok(s.tags.includes("官方"));
  }
});

test("national statistics source keeps only latest-release article paths", () => {
  const html = [
    '<a href="/sj/zxfb/202609/t20260930_1.html">PMI</a>',
    '<a href="/xw/">新闻</a>',
    '<a href="https://www.gov.cn/">中国政府网</a>'
  ].join("");
  assert.deepEqual(
    fromHtml(html,"https://www.stats.gov.cn/szst/",source("web-cn-stats-latest")).map(x=>x.url),
    ["https://www.stats.gov.cn/sj/zxfb/202609/t20260930_1.html"]
  );
});

test("NDRC source keeps only press-release paths", () => {
  const html = [
    '<a href="/xwdt/xwfb/202609/t20260930_1.html">发布会</a>',
    '<a href="/xwdt/">新闻动态</a>',
    '<a href="/fgsj/">司局</a>'
  ].join("");
  assert.deepEqual(
    fromHtml(html,"https://www.ndrc.gov.cn/xwdt/xwfb/",source("web-cn-ndrc-news")).map(x=>x.url),
    ["https://www.ndrc.gov.cn/xwdt/xwfb/202609/t20260930_1.html"]
  );
});

test("CSRC source keeps only commission-news article paths", () => {
  const html = [
    '<a href="/csrc/c100028/c7659506/content.shtml">吹哨人奖励</a>',
    '<a href="/csrc/c100029/common_list.shtml">新闻发布会</a>',
    '<a href="/">首页</a>'
  ].join("");
  assert.deepEqual(
    fromHtml(html,"https://www.csrc.gov.cn/csrc/c100028/common_xq_list.shtml",source("web-cn-csrc-news")).map(x=>x.url),
    ["https://www.csrc.gov.cn/csrc/c100028/c7659506/content.shtml"]
  );
});


test("verified mainland tech media use direct RSS feeds", () => {
  const cases = [
    ["rss-sspai", "https://sspai.com/feed", ["媒体","科技"]],
    ["rss-ifanr", "https://www.ifanr.com/feed", ["媒体","科技"]],
  ] as const;
  for (const [id, feedUrl, requiredTags] of cases) {
    const s = data.sources.find(x => x.id === id);
    assert.ok(s, "missing source " + id);
    assert.equal(s.kind, "rss");
    assert.equal((s.config as { feedUrl?: string }).feedUrl, feedUrl);
    assert.equal(s.tier, "T2");
    for (const tag of requiredTags) assert.ok(s.tags.includes(tag), id + " missing tag " + tag);
  }
});
