import type { FeedItemSummary } from "@aihot/contracts/site";
import type { ExpertRules } from "./storage.ts";

export interface MatchExplanation {
  matched: boolean;
  score: number;
  mustHits: string[];
  anyHits: string[];
  notHits: string[];
  weightHits: Array<{ term: string; weight: number }>;
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

export function evaluateRules(item: FeedItemSummary, rules: ExpertRules): MatchExplanation {
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
  const matched = mustOk && anyOk && notOk && thresholdOk;

  const reasons: string[] = [];
  if (mustHits.length) reasons.push("满足必须包含：" + mustHits.join("、"));
  if (missingMust.length) reasons.push("缺少必须包含：" + missingMust.join("、"));
  if (anyHits.length) reasons.push("命中任意包含：" + anyHits.join("、"));
  if (!anyOk) reasons.push("没有命中任何 OR 关键词");
  if (notHits.length) reasons.push("命中排除词：" + notHits.join("、"));
  if (weightHits.length) reasons.push("权重命中：" + weightHits.map(x => x.term + (x.weight >= 0 ? " +" : " ") + x.weight).join("、"));
  if (!thresholdOk) reasons.push(`相关度 ${score}，低于阈值 ${rules.threshold}`);
  if (matched) reasons.push(`最终相关度 ${score}，规则通过`);
  return { matched, score, mustHits, anyHits, notHits, weightHits, reasons };
}
