import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import type { FeedItemSummary, TimelineResponse } from "@aihot/contracts/site";
import type { Screen } from "@aihot/web/components/shell/screens";
import { PhoneBar } from "@aihot/web/components/shell/PhoneBar";
import { evaluateRules } from "../rules.ts";
import { expertRulesFor, updateExpertRules, usePersonalIntel, type ExpertRules } from "../storage.ts";

export const handle: Screen = { tab: "me", name: "规则调试" };

const split = (s: string) => [...new Set(s.split(/[\n,，]/).map(x => x.trim()).filter(Boolean))];

function beijingDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

async function loadToday(): Promise<FeedItemSummary[]> {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const out: FeedItemSummary[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 10; page++) {
    const qs = new URLSearchParams({ limit: "40" });
    if (cursor) qs.set("cursor", cursor);
    const res = await fetch("/api/site/timeline?" + qs.toString());
    if (!res.ok) throw new Error("无法读取今天的资讯");
    const data = await res.json() as TimelineResponse;
    let reachedOlder = false;
    for (const card of data.cards) {
      const day = beijingDay(card.anchorAt);
      if (day === today) out.push(card.item);
      else reachedOlder = true;
    }
    if (reachedOlder || !data.nextCursor) break;
    cursor = data.nextCursor;
  }
  return out;
}

function WeightEditor({value,onChange}:{value:Record<string,number>;onChange:(v:Record<string,number>)=>void}) {
  const [text,setText]=useState(Object.entries(value).map(([k,v])=>k+" "+(v>=0?"+":"")+v).join("\n"));
  const apply=(next:string)=>{
    setText(next);
    const weights:Record<string,number>={};
    for(const line of next.split(/\n/)){
      const m=line.trim().match(/^(.*?)\s+([+-]?\d+(?:\.\d+)?)$/);
      if(m?.[1]) weights[m[1].trim()]=Number(m[2]);
    }
    onChange(weights);
  };
  return <textarea value={text} onChange={e=>apply(e.target.value)} rows={7} className="mt-1.5 w-full rounded-control border border-line bg-field px-3 py-2 font-mono text-[12.5px] leading-relaxed text-ink outline-none focus:border-accent" placeholder={"OpenAI +10\nGPT-6 +8\n广告 -10"} />;
}

export default function RuleDebuggerPage(){
  const {id}=useParams();
  const config=usePersonalIntel();
  const topic=config.topics.find(t=>t.id===id);
  const topicSources = topic?.sources ?? ["all"];
  const initial=topic ? expertRulesFor(topic) : null;
  const [rules,setRules]=useState<ExpertRules | null>(initial);
  const [items,setItems]=useState<FeedItemSummary[]>([]);
  const [status,setStatus]=useState<"idle"|"loading"|"ready"|"error">("idle");
  const [error,setError]=useState("");

  useEffect(()=>{ if(topic) setRules(expertRulesFor(topic)); },[topic?.id]);
  const results=useMemo(()=>rules ? items.map(item=>({item,match:evaluateRules(item,rules,topicSources)})).sort((a,b)=>Number(b.match.matched)-Number(a.match.matched)||b.match.score-a.match.score) : [],[items,rules,topicSources]);
  const hits=results.filter(x=>x.match.matched);
  const misses=results.filter(x=>!x.match.matched);

  if(!topic || !rules) return <div className="card p-6"><h1 className="text-[18px] font-semibold text-ink">找不到这个关注主题</h1><Link to="/focus/manage" className="mt-3 inline-block text-[13px] text-accent">返回管理我的关注</Link></div>;

  const run=async()=>{
    setStatus("loading"); setError("");
    try { setItems(await loadToday()); setStatus("ready"); }
    catch(e){ setError(e instanceof Error?e.message:"读取失败"); setStatus("error"); }
  };
  const save=()=>updateExpertRules(topic.id,rules);

  return <div className="pb-8"><PhoneBar back={{ to: "/focus", label: "我的关注" }} title="规则调试" />
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
      <div><Link to="/focus/manage" className="text-[12px] text-ink-4 hover:text-accent">← 情报主题管理器</Link><div className="mt-2 text-[11px] font-semibold tracking-[0.08em] text-accent">专家模式</div><h1 className="mt-1 text-[24px] font-semibold text-ink">{topic.name} · 规则调试</h1><p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">先定义什么必须出现、什么出现任意一个即可、什么必须排除，再用权重微调相关度。测试会直接读取今天的 AIHOT 精选资讯。</p></div>
      <button onClick={save} className="h-9 rounded-full bg-accent px-4 text-[13px] font-medium text-accent-contrast">保存规则</button>
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <section className="card p-4 lg:p-5">
        <h2 className="text-[15px] font-semibold text-ink">布尔规则</h2>
        <label className="mt-4 block"><span className="text-[12px] font-medium text-ink-3">必须包含 · AND</span><textarea value={rules.must.join("\n")} onChange={e=>setRules({...rules,must:split(e.target.value)})} rows={5} className="mt-1.5 w-full rounded-control border border-line bg-field px-3 py-2 text-[13px] text-ink outline-none focus:border-accent" placeholder="每行一个词，全部满足才通过" /></label>
        <label className="mt-4 block"><span className="text-[12px] font-medium text-ink-3">任意包含 · OR</span><textarea value={rules.any.join("\n")} onChange={e=>setRules({...rules,any:split(e.target.value)})} rows={5} className="mt-1.5 w-full rounded-control border border-line bg-field px-3 py-2 text-[13px] text-ink outline-none focus:border-accent" placeholder="任意命中一个即可" /></label>
        <label className="mt-4 block"><span className="text-[12px] font-medium text-ink-3">排除 · NOT</span><textarea value={rules.not.join("\n")} onChange={e=>setRules({...rules,not:split(e.target.value)})} rows={5} className="mt-1.5 w-full rounded-control border border-line bg-field px-3 py-2 text-[13px] text-ink outline-none focus:border-accent" placeholder="命中任意一个就排除" /></label>
      </section>

      <section className="card p-4 lg:p-5">
        <h2 className="text-[15px] font-semibold text-ink">相关度评分</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-4">基础分：每个 AND 命中 +2，每个 OR 命中 +1；再叠加下面的自定义权重。</p>
        <label className="mt-4 block"><span className="text-[12px] font-medium text-ink-3">关键词权重</span><WeightEditor value={rules.weights} onChange={weights=>setRules({...rules,weights})} /></label>
        <label className="mt-4 block"><span className="text-[12px] font-medium text-ink-3">最低相关度阈值</span><input type="number" step="1" value={rules.threshold} onChange={e=>setRules({...rules,threshold:Number(e.target.value)||0})} className="mt-1.5 h-10 w-full rounded-control border border-line bg-field px-3 text-[14px] text-ink outline-none focus:border-accent" /></label>
        <div className="mt-5 rounded-card border border-line-soft bg-bg-sunk px-3.5 py-3 text-[12px] leading-relaxed text-ink-3">例如：OpenAI +10，GPT-6 +8，ChatGPT +5，发布 +6，故障 +7，传闻 +1，广告 -10。</div>
      </section>
    </div>

    <section className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={()=>void run()} disabled={status==="loading"} className="h-9 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-medium text-ink-2 hover:border-accent hover:text-accent disabled:opacity-50">{status==="loading"?"正在测试…":"测试规则"}</button>
        {status==="ready"&&<span className="text-[12.5px] text-ink-3">今天读取 <b className="text-ink">{items.length}</b> 条，命中 <b className="text-accent">{hits.length}</b> 条，未命中 <b className="text-ink">{misses.length}</b> 条。</span>}
        {status==="error"&&<span className="text-[12.5px] text-hot">{error}</span>}
      </div>

      {status==="ready"&&<div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ResultList title="命中的信息" items={hits} empty="今天没有信息通过当前规则。" />
        <ResultList title="未命中的信息" items={misses} empty="今天读取到的信息全部命中。" />
      </div>}
    </section>
  </div>;
}

function ResultList({title,items,empty}:{title:string;items:Array<{item:FeedItemSummary;match:ReturnType<typeof evaluateRules>}>;empty:string}){
  return <section className="rounded-card border border-line bg-surface">
    <div className="border-b border-line px-4 py-3"><h2 className="text-[14px] font-semibold text-ink">{title} <span className="ml-1 font-normal text-ink-4">{items.length}</span></h2></div>
    {!items.length?<div className="px-4 py-8 text-center text-[12.5px] text-ink-4">{empty}</div>:<div className="divide-y divide-line-soft">{items.map(({item,match})=><article key={item.id} className="px-4 py-3.5"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><Link to={"/items/"+item.id} className="text-[13.5px] font-semibold leading-5 text-ink hover:text-accent">{item.title}</Link><div className="mt-1 text-[11.5px] text-ink-4">{item.source.name} · 相关度 {match.score}</div></div><span className={"shrink-0 rounded-full px-2 py-0.5 text-[10.5px] "+(match.matched?"bg-ok-soft text-ok-ink":"bg-bg-sunk text-ink-4")}>{match.matched?"命中":"未命中"}</span></div><ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-ink-3">{match.reasons.map((r,i)=><li key={i}>· {r}</li>)}</ul></article>)}</div>}
  </section>;
}
