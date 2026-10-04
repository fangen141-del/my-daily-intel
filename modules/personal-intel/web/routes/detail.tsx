import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import type { FeedItemSummary, GroupInfo, TimelineCard, TimelineResponse } from "@aihot/contracts/site";
import type { Screen } from "@aihot/web/components/shell/screens";
import { evaluateRules } from "../rules.ts";
import { expertRulesFor, usePersonalIntel } from "../storage.ts";

export const handle: Screen = { tab: "me", name: "主题情报" };

interface StoryMap {
  factId: string;
  story: { publicId: string; title: string } | null;
}

interface MatchedCard {
  card: TimelineCard;
  score: number;
  reasons: string[];
}

interface EventView {
  key: string;
  story: StoryMap["story"];
  factIds: string[];
  title: string;
  cards: MatchedCard[];
  latestAt: string;
  reportCount: number;
  topScore: number;
}

function dayCN(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

async function loadRecentSelected(): Promise<TimelineCard[]> {
  const out: TimelineCard[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 6; page++) {
    const qs = new URLSearchParams({ limit: "40" });
    if (cursor) qs.set("cursor", cursor);
    const res = await fetch("/api/site/timeline?" + qs.toString());
    if (!res.ok) throw new Error("暂时无法读取资讯");
    const data = await res.json() as TimelineResponse;
    out.push(...data.cards);
    if (!data.nextCursor) break;
    cursor = data.nextCursor;
  }
  return out;
}

async function storyMapOf(factIds: string[]): Promise<Map<string, StoryMap["story"]>> {
  if (!factIds.length) return new Map();
  const out = new Map<string, StoryMap["story"]>();
  for (let i = 0; i < factIds.length; i += 80) {
    const batch = factIds.slice(i, i + 80);
    const qs = new URLSearchParams({ factIds: batch.join(",") });
    const res = await fetch("/api/personal-intel/story-map?" + qs.toString());
    if (!res.ok) throw new Error("暂时无法读取事件关系");
    const data = await res.json() as { mappings: StoryMap[] };
    for (const row of data.mappings) out.set(row.factId, row.story);
  }
  return out;
}

function buildEvents(rows: MatchedCard[], mapping: Map<string, StoryMap["story"]>): EventView[] {
  const groups = new Map<string, EventView>();
  for (const row of rows) {
    const factId = row.card.group?.factId ?? null;
    const story = factId ? (mapping.get(factId) ?? null) : null;
    const key = story ? "story:" + story.publicId : factId ? "fact:" + factId : "item:" + row.card.item.id;
    let event = groups.get(key);
    if (!event) {
      event = {
        key,
        story,
        factIds: [],
        title: story?.title ?? row.card.item.title,
        cards: [],
        latestAt: row.card.anchorAt,
        reportCount: 0,
        topScore: row.score,
      };
      groups.set(key, event);
    }
    event.cards.push(row);
    event.topScore = Math.max(event.topScore, row.score);
    if (Date.parse(row.card.anchorAt) > Date.parse(event.latestAt)) event.latestAt = row.card.anchorAt;
    if (factId && !event.factIds.includes(factId)) {
      event.factIds.push(factId);
      event.reportCount += Math.max(1, row.card.group?.reportCount ?? 1);
    } else if (!factId) {
      event.reportCount += 1;
    }
  }
  return [...groups.values()].sort((a,b) => b.topScore - a.topScore || Date.parse(b.latestAt)-Date.parse(a.latestAt));
}

export default function FocusDetailPage() {
  const { id } = useParams();
  const config = usePersonalIntel();
  const topic = config.topics.find(t => t.id === id);
  const rules = topic ? expertRulesFor(topic) : null;
  const [cards,setCards] = useState<TimelineCard[]>([]);
  const [mapping,setMapping] = useState<Map<string,StoryMap["story"]>>(new Map());
  const [status,setStatus] = useState<"loading"|"ready"|"error">("loading");
  const [error,setError] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setStatus("loading"); setError("");
      try {
        const next = await loadRecentSelected();
        if (!alive) return;
        const factIds = [...new Set(next.map(x => x.group?.factId).filter((x): x is string => !!x))];
        const map = await storyMapOf(factIds);
        if (!alive) return;
        setCards(next); setMapping(map); setStatus("ready");
      } catch(e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "读取失败"); setStatus("error");
      }
    };
    void run();
    return () => { alive = false; };
  }, [id]);

  const matched = useMemo<MatchedCard[]>(() => {
    if (!rules) return [];
    return cards
      .map(card => ({ card, result: evaluateRules(card.item, rules) }))
      .filter(x => x.result.matched)
      .map(x => ({ card: x.card, score: x.result.score, reasons: x.result.reasons }));
  }, [cards,rules]);

  const events = useMemo(() => buildEvents(matched, mapping), [matched,mapping]);
  const latest = useMemo(() => [...matched].sort((a,b)=>Date.parse(b.card.anchorAt)-Date.parse(a.card.anchorAt)),[matched]);

  if (!topic || !rules) return <div className="card p-6"><h1 className="text-[18px] font-semibold text-ink">找不到这个关注主题</h1><Link to="/focus" className="mt-3 inline-block text-[13px] text-accent">返回我的关注</Link></div>;

  return <div className="pb-8">
    <div className="border-b border-line pb-5">
      <Link to="/focus" className="text-[12px] text-ink-4 hover:text-accent">← 我的关注</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.08em] text-accent">我的世界 · 事件聚合</div>
          <h1 className="mt-1 text-[24px] font-semibold text-ink">{topic.name} · 今日情报</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">先按你的规则找出相关资讯，再沿用 AIHOT 的事实归组与事件关系，把重复报道和同一事件的连续进展合在一起。</p>
        </div>
        <div className="flex gap-2">
          <Link to={"/focus/debug/"+encodeURIComponent(topic.id)} className="h-9 rounded-full border border-line-strong px-4 py-2 text-[13px] text-ink-2">调试规则</Link>
          <Link to="/focus/manage" className="h-9 rounded-full border border-line-strong px-4 py-2 text-[13px] text-ink-2">管理主题</Link>
        </div>
      </div>
    </div>

    {status==="loading" && <div className="py-14 text-center text-[13px] text-ink-4">正在整理与你有关的事件…</div>}
    {status==="error" && <div className="card mt-5 p-5 text-[13px] text-hot">{error}</div>}

    {status==="ready" && <>
      <div className="mt-5 grid grid-cols-3 gap-2 lg:max-w-xl">
        <Metric label="相关资讯" value={matched.length} />
        <Metric label="聚合事件" value={events.length} />
        <Metric label="多源事件" value={events.filter(e=>e.reportCount>1).length} />
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-[18px] font-semibold text-ink">今日最重要</h2><span className="text-[12px] text-ink-4">按你的相关度规则排序</span></div>
        {!events.length ? <Empty /> : <div className="space-y-3">{events.slice(0,5).map((event,index)=><EventCard key={event.key} event={event} rank={index+1} />)}</div>}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-[18px] font-semibold text-ink">事件聚合</h2><span className="text-[12px] text-ink-4">同一事实、多家报道不再重复占位</span></div>
        <div className="grid gap-3 lg:grid-cols-2">{events.map(event=><EventCard key={event.key} event={event} />)}</div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-[18px] font-semibold text-ink">最新消息</h2><span className="text-[12px] text-ink-4">{latest.length} 条相关资讯</span></div>
        <div className="divide-y divide-line rounded-card border border-line bg-surface">
          {latest.slice(0,40).map(({card,score})=><Link key={card.item.id} to={"/items/"+card.item.id} className="block px-4 py-3.5 transition-colors hover:bg-bg-sunk/60"><div className="flex items-start gap-3"><time className="mono w-[50px] shrink-0 pt-0.5 text-[11.5px] text-ink-4">{dayCN(card.anchorAt)}</time><div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium leading-5 text-ink">{card.item.title}</div><div className="mt-1 text-[11.5px] text-ink-4">{card.item.source.name} · 相关度 {score}{card.group?.reportCount && card.group.reportCount>1 ? " · 同一事实 "+card.group.reportCount+" 篇报道" : ""}</div></div></div></Link>)}
        </div>
      </section>
    </>}
  </div>;
}

function Metric({label,value}:{label:string;value:number}) {
  return <div className="rounded-tile border border-line bg-surface px-3 py-3"><div className="num text-[20px] font-semibold text-ink">{value}</div><div className="mt-0.5 text-[11.5px] text-ink-4">{label}</div></div>;
}

function Empty() {
  return <div className="card px-5 py-10 text-center"><div className="text-[14px] font-semibold text-ink">当前规则还没有命中资讯</div><p className="mt-1.5 text-[12.5px] text-ink-4">可以进入“调试规则”查看为什么没有命中。</p></div>;
}

function EventCard({event,rank}:{event:EventView;rank?:number}) {
  const rep = [...event.cards].sort((a,b)=>b.score-a.score)[0]!;
  const reason = rep.reasons.find(x=>x.startsWith("满足")||x.startsWith("命中")||x.startsWith("权重")) ?? ("相关度 "+rep.score);
  const body = <article className="card card-hover h-full px-4 py-4">
    <div className="flex items-start gap-3">
      {rank && <span className="num mt-0.5 w-5 shrink-0 text-[16px] font-semibold text-accent">{rank}</span>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-4">
          {event.story ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">事件</span> : event.factIds.length ? <span className="rounded-full bg-bg-sunk px-2 py-0.5">同一事实</span> : <span className="rounded-full bg-bg-sunk px-2 py-0.5">单篇</span>}
          <span>{dayCN(event.latestAt)}</span>
          <span>至少 {event.reportCount} 篇报道</span>
          {event.factIds.length>1 && <span>{event.factIds.length} 个进展</span>}
        </div>
        <h3 className="mt-2 text-[15.5px] font-semibold leading-6 text-ink">{event.title}</h3>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">与你相关：{reason}</p>
        {event.cards.length>1 && <p className="mt-1.5 text-[11.5px] text-ink-4">已将 {event.cards.length} 条匹配资讯合并到这一事件下，避免重复阅读。</p>}
      </div>
    </div>
  </article>;
  return event.story ? <Link to={"/story/"+event.story.publicId} className="block h-full">{body}</Link> : <Link to={"/items/"+rep.card.item.id} className="block h-full">{body}</Link>;
}
