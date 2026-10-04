import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import type { GroupReportsResponse, StoryDetail, TimelineCard, TimelineResponse } from "@aihot/contracts/site";
import type { Screen } from "@aihot/web/components/shell/screens";
import { PhoneBar } from "@aihot/web/components/shell/PhoneBar";
import { evaluateRules } from "../rules.ts";
import { expertRulesFor, focusKindFor, impactProfileFor, usePersonalIntel, type RefreshFrequency } from "../storage.ts";

export const handle: Screen = { tab: "me", name: "主题情报" };

const REFRESH_MS: Record<RefreshFrequency, number | null> = {
  realtime: 60_000,
  hourly: 3_600_000,
  "6h": 21_600_000,
  daily: 86_400_000,
  manual: null,
};

const REFRESH_LABEL: Record<RefreshFrequency, string> = {
  realtime: "每分钟",
  hourly: "每小时",
  "6h": "每6小时",
  daily: "每天",
  manual: "手动",
};

const FOCUS_KIND_LABEL: Record<string, string> = {
  topic: "主题", asset: "资产", fund: "基金", stock: "股票", company: "公司",
  person: "人物", country: "国家", industry: "行业", product: "产品", other: "其他",
};


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


async function loadStoryDetails(events: EventView[]): Promise<Map<string, StoryDetail>> {
  const ids = [...new Set(events.map(e => e.story?.publicId).filter((x): x is string => !!x))].slice(0, 30);
  const rows = await Promise.all(ids.map(async id => {
    const res = await fetch("/api/site/stories/" + encodeURIComponent(id));
    if (!res.ok) return null;
    return [id, await res.json() as StoryDetail] as const;
  }));
  return new Map(rows.filter((x): x is readonly [string, StoryDetail] => !!x));
}

async function loadFactSourceCounts(factIds: string[]): Promise<Map<string, number>> {
  const rows = await Promise.all([...new Set(factIds)].slice(0, 80).map(async factId => {
    const res = await fetch("/api/site/groups/" + encodeURIComponent(factId) + "/reports");
    if (!res.ok) return [factId, 0] as const;
    const data = await res.json() as GroupReportsResponse;
    return [factId, new Set(data.reports.map(r => r.source.name)).size] as const;
  }));
  return new Map(rows);
}

function verificationText(event: EventView, story: StoryDetail | undefined, factSources: Map<string, number>): string {
  if (story) {
    if (story.officialReports.length > 0 && story.sourceCount >= 2) return "有官方一手；" + story.sourceCount + " 个来源交叉报道";
    if (story.sourceCount >= 3) return story.sourceCount + " 个来源交叉报道";
    if (story.sourceCount === 2) return "2 个来源交叉报道";
    return "单一来源，尚未形成交叉验证";
  }
  const maxSources = Math.max(0, ...event.factIds.map(id => factSources.get(id) ?? 0));
  if (maxSources >= 3) return maxSources + " 个来源报道同一事实";
  if (maxSources === 2) return "2 个来源报道同一事实";
  return event.reportCount > 1 ? event.reportCount + " 篇相关报道；来源交叉情况有限" : "单一报道，暂未交叉验证";
}

function importantText(event: EventView, story: StoryDetail | undefined): string {
  const rep = [...event.cards].sort((a,b)=>b.score-a.score)[0]!;
  const relation = rep.reasons.find(x=>x.startsWith("满足")||x.startsWith("命中")||x.startsWith("权重"));
  const parts = [relation ? "与你的关注规则高度相关：" + relation : "与你的关注规则相关度为 " + rep.score];
  if (story?.sourceCount && story.sourceCount > 1) parts.push("已有 " + story.sourceCount + " 个来源交叉报道");
  if (story?.officialReports.length) parts.push("包含官方一手信息");
  return parts.join("；") + "。";
}

export default function FocusDetailPage() {
  const { id } = useParams();
  const config = usePersonalIntel();
  const topic = config.topics.find(t => t.id === id);
  const rules = topic ? expertRulesFor(topic) : null;
  const impact = topic ? impactProfileFor(topic) : null;
  const focusKind = topic ? focusKindFor(topic) : "topic";
  const [reloadToken,setReloadToken] = useState(0);
  const [lastUpdated,setLastUpdated] = useState<string | null>(null);
  const [cards,setCards] = useState<TimelineCard[]>([]);
  const [mapping,setMapping] = useState<Map<string,StoryMap["story"]>>(new Map());
  const [storyDetails,setStoryDetails] = useState<Map<string,StoryDetail>>(new Map());
  const [factSources,setFactSources] = useState<Map<string,number>>(new Map());
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
        setCards(next); setMapping(map); setLastUpdated(new Date().toISOString()); setStatus("ready");
      } catch(e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "读取失败"); setStatus("error");
      }
    };
    void run();
    return () => { alive = false; };
  }, [id, reloadToken]);

  const matched = useMemo<MatchedCard[]>(() => {
    if (!rules) return [];
    return cards
      .map(card => ({ card, result: evaluateRules(card.item, rules) }))
      .filter(x => x.result.matched)
      .map(x => ({ card: x.card, score: x.result.score, reasons: x.result.reasons }));
  }, [cards,rules]);

  const events = useMemo(() => buildEvents(matched, mapping), [matched,mapping]);
  const eventKey = useMemo(() => events.map(e => e.key).join("|"), [events]);
  useEffect(() => {
    let alive = true;
    if (!events.length) {
      setStoryDetails(new Map());
      setFactSources(new Map());
      return;
    }
    const run = async () => {
      const [stories, facts] = await Promise.all([
        loadStoryDetails(events),
        loadFactSourceCounts(events.flatMap(e => e.factIds)),
      ]);
      if (!alive) return;
      setStoryDetails(stories);
      setFactSources(facts);
    };
    void run();
    return () => { alive = false; };
  }, [eventKey]);

  useEffect(() => {
    if (!topic) return;
    const ms = REFRESH_MS[topic.refresh];
    if (!ms) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setReloadToken(x => x + 1);
    }, ms);
    return () => window.clearInterval(timer);
  }, [topic?.id, topic?.refresh]);

  const latest = useMemo(() => [...matched].sort((a,b)=>Date.parse(b.card.anchorAt)-Date.parse(a.card.anchorAt)),[matched]);
  const mediaReports = useMemo(() => latest.filter(x => x.card.item.channel === "news"), [latest]);
  const socialReports = useMemo(() => latest.filter(x => x.card.item.channel === "x"), [latest]);
  const officialReports = useMemo(() => {
    const seen = new Set<string>();
    const out = [];
    for (const story of storyDetails.values()) {
      for (const report of story.officialReports) {
        if (seen.has(report.id)) continue;
        seen.add(report.id);
        out.push(report);
      }
    }
    return out.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  }, [storyDetails]);

  if (!topic || !rules || !impact) return <div className="card p-6"><h1 className="text-[18px] font-semibold text-ink">找不到这个关注主题</h1><Link to="/focus" className="mt-3 inline-block text-[13px] text-accent">返回我的关注</Link></div>;

  return <div className="pb-8"><PhoneBar back={{ to: "/focus", label: "我的关注" }} title="主题情报" />
    <div className="border-b border-line pb-5">
      <Link to="/focus" className="text-[12px] text-ink-4 hover:text-accent">← 我的关注</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.08em] text-accent">我的世界 · 专业情报</div>
          <h1 className="mt-1 text-[24px] font-semibold text-ink">{topic.name} · 今日情报</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">把与你有关的资讯先去重、再按事件聚合，同时区分事实、来源验证、系统分析和影响判断，减少重复信息和未经说明的推测。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-ink-4">{FOCUS_KIND_LABEL[focusKind] ?? focusKind} · 刷新：{REFRESH_LABEL[topic.refresh]}{lastUpdated ? " · 最近 "+dayCN(lastUpdated) : ""}</span>
          <button type="button" onClick={()=>setReloadToken(x=>x+1)} className="h-9 rounded-full border border-line-strong px-4 text-[13px] text-ink-2">立即刷新</button>
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
        <Metric label="多源事件" value={events.filter(e => {
          const story = e.story ? storyDetails.get(e.story.publicId) : undefined;
          return story ? story.sourceCount > 1 : Math.max(0, ...e.factIds.map(id => factSources.get(id) ?? 0)) > 1;
        }).length} />
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-[18px] font-semibold text-ink">今日最重要</h2><span className="text-[12px] text-ink-4">按相关度、证据和事件聚合结果阅读</span></div>
        {!events.length ? <Empty /> : <div className="space-y-3">{events.slice(0,5).map((event,index)=><IntelCard key={event.key} event={event} rank={index+1} story={event.story?storyDetails.get(event.story.publicId):undefined} factSources={factSources} impactTarget={impact.targetName} />)}</div>}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-[18px] font-semibold text-ink">多方验证与事件聚合</h2><span className="text-[12px] text-ink-4">同一事实、多家报道不再重复占位</span></div>
        <div className="grid gap-3 lg:grid-cols-2">{events.map(event=><IntelCard key={event.key} event={event} story={event.story?storyDetails.get(event.story.publicId):undefined} factSources={factSources} impactTarget={impact.targetName} compact />)}</div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-[18px] font-semibold text-ink">来源视角</h2><span className="text-[12px] text-ink-4">直接使用现有官方、媒体与社交数据分栏</span></div>
        <div className="grid gap-3 lg:grid-cols-3">
          <SourceColumn title="官方消息" count={officialReports.length} empty="当前相关事件里没有识别到官方一手报道。">
            {officialReports.slice(0,8).map(r=><Link key={r.id} to={"/items/"+r.id} className="block border-b border-line-soft py-2.5 last:border-b-0"><div className="text-[11.5px] text-ink-4">{r.source.name} · {dayCN(r.publishedAt)}</div><div className="mt-1 text-[13px] font-medium leading-5 text-ink hover:text-accent">{r.title}</div></Link>)}
          </SourceColumn>
          <SourceColumn title="媒体报道" count={mediaReports.length} empty="当前规则没有命中媒体报道。">
            {mediaReports.slice(0,8).map(({card})=><Link key={card.item.id} to={"/items/"+card.item.id} className="block border-b border-line-soft py-2.5 last:border-b-0"><div className="text-[11.5px] text-ink-4">{card.item.source.name} · {dayCN(card.anchorAt)}</div><div className="mt-1 text-[13px] font-medium leading-5 text-ink hover:text-accent">{card.item.title}</div></Link>)}
          </SourceColumn>
          <SourceColumn title="社交讨论" count={socialReports.length} empty="当前规则没有命中 X / 社交来源。">
            {socialReports.slice(0,8).map(({card})=><Link key={card.item.id} to={"/items/"+card.item.id} className="block border-b border-line-soft py-2.5 last:border-b-0"><div className="text-[11.5px] text-ink-4">{card.item.source.name} · {dayCN(card.anchorAt)}</div><div className="mt-1 text-[13px] font-medium leading-5 text-ink hover:text-accent">{card.item.summary ?? card.item.title}</div></Link>)}
          </SourceColumn>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-baseline justify-between"><h2 className="text-[18px] font-semibold text-ink">今日时间线</h2><span className="text-[12px] text-ink-4">{latest.length} 条与你相关的进展</span></div>
        <div className="rounded-card border border-line bg-surface">
          <ol className="relative ml-4 border-l border-line py-1">
            {latest.slice(0,50).map(({card,score})=><li key={card.item.id} className="relative py-3 pl-5 pr-4"><span className="absolute -left-[4px] top-[20px] size-[7px] rounded-full bg-accent ring-4 ring-surface"/><div className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink-4"><time className="mono">{dayCN(card.anchorAt)}</time><span>{card.item.source.name}</span><span>相关度 {score}</span>{card.group?.reportCount && card.group.reportCount>1 ? <span>同一事实 {card.group.reportCount} 篇报道</span> : null}</div><Link to={"/items/"+card.item.id} className="mt-1 block text-[13.5px] font-medium leading-5 text-ink hover:text-accent">{card.item.title}</Link></li>)}
          </ol>
        </div>
      </section>
    </>}
  </div>;
}

function SourceColumn({title,count,empty,children}:{title:string;count:number;empty:string;children:ReactNode}) {
  return <section className="card px-4 py-4">
    <div className="flex items-baseline justify-between gap-3"><h3 className="text-[14px] font-semibold text-ink">{title}</h3><span className="num text-[11.5px] text-ink-4">{count}</span></div>
    <div className="mt-2">{count ? children : <p className="py-5 text-[12px] leading-relaxed text-ink-4">{empty}</p>}</div>
  </section>;
}

function Metric({label,value}:{label:string;value:number}) {
  return <div className="rounded-tile border border-line bg-surface px-3 py-3"><div className="num text-[20px] font-semibold text-ink">{value}</div><div className="mt-0.5 text-[11.5px] text-ink-4">{label}</div></div>;
}

function Empty() {
  return <div className="card px-5 py-10 text-center"><div className="text-[14px] font-semibold text-ink">当前规则还没有命中资讯</div><p className="mt-1.5 text-[12.5px] text-ink-4">可以进入“调试规则”查看为什么没有命中。</p></div>;
}

function IntelCard({event,rank,story,factSources,impactTarget,compact=false}:{event:EventView;rank?:number;story?:StoryDetail;factSources:Map<string,number>;impactTarget:string;compact?:boolean}) {
  const rep = [...event.cards].sort((a,b)=>b.score-a.score)[0]!;
  const verification = verificationText(event, story, factSources);
  const systemAnalysis = story?.digest ?? story?.summary ?? rep.card.item.reason ?? null;
  const target = impactTarget || "当前关注对象";
  const body = <article className="card card-hover h-full px-4 py-4">
    <div className="flex items-start gap-3">
      {rank && <span className="num mt-0.5 w-5 shrink-0 text-[16px] font-semibold text-accent">{rank}</span>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-4">
          {event.story ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">事件</span> : event.factIds.length ? <span className="rounded-full bg-bg-sunk px-2 py-0.5">同一事实</span> : <span className="rounded-full bg-bg-sunk px-2 py-0.5">单篇</span>}
          <span>{dayCN(event.latestAt)}</span>
          <span>{verification}</span>
        </div>
        <h3 className="mt-2 text-[15.5px] font-semibold leading-6 text-ink">{event.title}</h3>
        {!compact && <div className="mt-3 grid gap-2.5">
          <IntelRow label="事实 / 已报道"><span>{rep.card.item.title}</span><span className="ml-1 text-ink-4">— {rep.card.item.source.name}</span></IntelRow>
          <IntelRow label="媒体观点"><span className="text-ink-4">当前数据没有把媒体观点单独结构化；不把报道标题或系统摘要冒充媒体立场。</span></IntelRow>
          <IntelRow label="系统分析"><span className={systemAnalysis?"":"text-ink-4"}>{systemAnalysis ?? "暂无结构化系统分析。"}</span></IntelRow>
          <IntelRow label="为什么重要">{importantText(event, story)}</IntelRow>
          <IntelRow label="来源验证"><span>{verification}</span>{story?.officialReports.length ? <span className="ml-1 text-ok-ink">· 有 {story.officialReports.length} 篇官方一手</span> : null}</IntelRow>
          <IntelRow label="对我的影响"><span className="rounded-full bg-amber-soft px-2 py-0.5 text-amber-ink">待观察</span><span className="ml-2">对象：{target}。当前只确认“有关联”，尚未接入因果分析，因此不自动判断利好或利空。</span></IntelRow>
        </div>}
        {compact && <div className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-ink-3"><p>为什么重要：{importantText(event, story)}</p><p>对 {target}：<span className="text-amber-ink">待观察</span></p></div>}
      </div>
    </div>
  </article>;
  return event.story ? <Link to={"/story/"+event.story.publicId} className="block h-full">{body}</Link> : <Link to={"/items/"+rep.card.item.id} className="block h-full">{body}</Link>;
}

function IntelRow({label,children}:{label:string;children:ReactNode}) {
  return <div className="rounded-control bg-bg-sunk px-3 py-2.5 text-[12.5px] leading-relaxed"><div className="mb-1 text-[10.5px] font-semibold tracking-[0.06em] text-ink-4">{label}</div><div className="text-ink-2">{children}</div></div>;
}
