import type { FeedItemSummary } from "@aihot/contracts/site";
import type { ExpertRules, SourceType } from "./storage.ts";

export interface MatchExplanation {
  matched: boolean;
  score: number;
  mustHits: string[];
  anyHits: string[];
  notHits: string[];
  weightHits: Array<{ term: string; weight: number }>;
  sourceAllowed: boolean;
  sourceReason: string;
  reasons: string[];
}

function norm(v: string): string {
  return v.toLocaleLowerCase();
}

export function searchableText(item: FeedItemSummary): string {
  return norm([
    item.title,
    item.summary ?? "",
    item.reason ?? "",
    item.source?.name ?? "",
    ...(item.tags ?? []),
  ].join("\n"));
}


function sourceTag(item: FeedItemSummary, ...names: string[]): boolean {
  const tags = item.source.tags ?? [];
  return names.some(name => tags.some(tag => norm(tag) === norm(name)));
}

export function sourceMatches(item: FeedItemSummary, sources: SourceType[]): { allowed: boolean; reason: string } {
  if (!sources.length || sources.includes("all")) return { allowed: true, reason: "全部来源" };
  const checks: Array<[SourceType, boolean, string]> = [
    ["news", item.channel === "news", "新闻来源"],
    ["social", item.channel === "x" || item.source.kind === "x_search", "社交来源"],
    ["official", item.source.firstParty === true || sourceTag(item, "官方"), "官方来源"],
    ["research", sourceTag(item, "研究", "研究机构"), "研究来源"],
    ["self_media", sourceTag(item, "个人", "自媒体"), "个人 / 自媒体"],
    ["finance", sourceTag(item, "财经", "金融"), "财经来源"],
    ["tech", sourceTag(item, "科技", "技术"), "科技来源"],
    ["government", sourceTag(item, "政府", "政务"), "政府来源"],
    ["custom", item.source.kind === "external" || sourceTag(item, "自定义"), "自定义来源"],
  ];
  const hit = checks.find(([key, ok]) => sources.includes(key) && ok);
  return hit ? { allowed: true, reason: hit[2] } : { allowed: false, reason: "来源类型不符合当前主题设置" };
}

export function evaluateRules(item: FeedItemSummary, rules: ExpertRules, sources: SourceType[] = ["all"]): MatchExplanation {
  const text = searchableText(item);
  const hit = (term: string) => term.trim() !== "" && text.includes(norm(term.trim()));
  const mustHits = rules.must.filter(hit);
  const anyHits = rules.any.filter(hit);
  const notHits = rules.not.filter(hit);
  const weightHits = Object.entries(rules.weights)
    .filter(([term]) => hit(term))
    .map(([term, weight]) => ({ term, weight }));

  const missingMust = rules.must.filter(term => !hit(term));
  const mustOk = missingMust.length === 0;
  const anyOk = rules.any.length === 0 || anyHits.length > 0;
  const notOk = notHits.length === 0;

  const score = anyHits.length + mustHits.length * 2 + weightHits.reduce((sum, x) => sum + x.weight, 0);
  const thresholdOk = score >= rules.threshold;
  const source = sourceMatches(item, sources);
  const matched = mustOk && anyOk && notOk && thresholdOk && source.allowed;

  const reasons: string[] = [];
  if (mustHits.length) reasons.push("满足必须包含：" + mustHits.join("、"));
  if (missingMust.length) reasons.push("缺少必须包含：" + missingMust.join("、"));
  if (anyHits.length) reasons.push("命中任意包含：" + anyHits.join("、"));
  if (!anyOk) reasons.push("没有命中任何 OR 关键词");
  if (notHits.length) reasons.push("命中排除词：" + notHits.join("、"));
  if (weightHits.length) reasons.push("权重命中：" + weightHits.map(x => x.term + (x.weight >= 0 ? " +" : " ") + x.weight).join("、"));
  if (!thresholdOk) reasons.push(`相关度 ${score}，低于阈值 ${rules.threshold}`);
  if (!source.allowed) reasons.push(source.reason);
  else if (!sources.includes("all")) reasons.push("来源匹配：" + source.reason);
  if (matched) reasons.push(`最终相关度 ${score}，规则通过`);
  return { matched, score, mustHits, anyHits, notHits, weightHits, sourceAllowed: source.allowed, sourceReason: source.reason, reasons };
}
