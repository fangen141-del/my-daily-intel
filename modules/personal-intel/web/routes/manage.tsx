import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Screen } from "@aihot/web/components/shell/screens";
import { PhoneBar } from "@aihot/web/components/shell/PhoneBar";
import {
  deleteTopic, exportConfig, importConfig, newTopic, replacePreset, upsertTopic, usePersonalIntel,
  focusKindFor, impactProfileFor, type FocusKind, type FocusTopic, type ImpactProfile, type RefreshFrequency, type SourceType
} from "../storage.ts";

export const handle: Screen = { tab: "me", name: "管理关注" };

const SOURCE_LABELS: Array<[SourceType,string]> = [
  ["all","全部来源"],["news","新闻媒体"],["finance","财经媒体"],["tech","科技媒体"],["social","社交媒体"],
  ["self_media","自媒体"],["government","政府"],["official","官方机构"],["research","研究机构"],["custom","自定义网站"],
];
const REFRESH: Array<[RefreshFrequency,string]> = [["realtime","实时"],["hourly","每小时"],["6h","每6小时"],["daily","每天"],["manual","手动刷新"]];
const PRESETS = [["comprehensive","综合情报"],["investor","投资者"],["founder","创业者"],["technology","科技"]] as const;
const split = (s:string) => [...new Set(s.split(/[\n,，]/).map(x=>x.trim()).filter(Boolean))];

function Editor({topic,onDone}:{topic:FocusTopic,onDone:()=>void}) {
  const [v,setV] = useState(topic);
  const [keywords,setKeywords] = useState(topic.keywords.join("\n"));
  const [excludes,setExcludes] = useState(topic.excludes.join("\n"));
  const [impact,setImpact] = useState<ImpactProfile>(impactProfileFor(topic));
  const [kind,setKind] = useState<FocusKind>(focusKindFor(topic));
  const save=()=>{
    const now=new Date().toISOString();
    upsertTopic({...v,name:v.name.trim(),kind,keywords:split(keywords),excludes:split(excludes),impactProfile:impact,updatedAt:now});
    onDone();
  };
  const chooseSource=(s:SourceType)=>{
    if(s==="all") return setV({...v,sources:["all"]});
    const current=v.sources.filter(x=>x!=="all");
    const next=current.includes(s)?current.filter(x=>x!==s):[...current,s];
    setV({...v,sources:next.length?next:["all"]});
  };
  return <div className="card mt-4 p-4 lg:p-5">
    <div className="grid gap-4 lg:grid-cols-2">
      <label className="block"><span className="text-[12px] font-medium text-ink-3">主题名称</span><input value={v.name} onChange={e=>setV({...v,name:e.target.value})} className="mt-1.5 h-10 w-full rounded-control border border-line bg-field px-3 text-[14px] text-ink outline-none focus:border-accent" placeholder="例如：黄金" /></label>
      <label className="block"><span className="text-[12px] font-medium text-ink-3">关注对象类型</span><select value={kind} onChange={e=>setKind(e.target.value as FocusKind)} className="mt-1.5 h-10 w-full rounded-control border border-line bg-field px-3 text-[14px] text-ink"><option value="topic">主题</option><option value="asset">资产</option><option value="fund">基金</option><option value="stock">股票</option><option value="company">公司</option><option value="person">人物</option><option value="country">国家</option><option value="industry">行业</option><option value="product">产品</option><option value="other">其他</option></select></label>
      <label className="block"><span className="text-[12px] font-medium text-ink-3">重要程度</span><select value={v.importance} onChange={e=>setV({...v,importance:Number(e.target.value) as FocusTopic["importance"]})} className="mt-1.5 h-10 w-full rounded-control border border-line bg-field px-3 text-[14px] text-ink"><option value={5}>★★★★★ 核心关注</option><option value={4}>★★★★ 重要</option><option value={3}>★★★ 一般</option><option value={2}>★★ 偶尔看看</option><option value={1}>★ 低优先级</option></select></label>
      <label className="block"><span className="text-[12px] font-medium text-ink-3">关键词（每行或逗号分隔）</span><textarea value={keywords} onChange={e=>setKeywords(e.target.value)} rows={5} className="mt-1.5 w-full rounded-control border border-line bg-field px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus:border-accent" placeholder={"黄金\n金价\nGold\nCOMEX Gold"} /></label>
      <label className="block"><span className="text-[12px] font-medium text-ink-3">排除词</span><textarea value={excludes} onChange={e=>setExcludes(e.target.value)} rows={5} className="mt-1.5 w-full rounded-control border border-line bg-field px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus:border-accent" placeholder={"黄金首饰\n珠宝广告"} /></label>
    </div>
    <div className="mt-4"><div className="text-[12px] font-medium text-ink-3">信息来源</div><div className="mt-2 flex flex-wrap gap-2">{SOURCE_LABELS.map(([k,label])=><button type="button" key={k} onClick={()=>chooseSource(k)} className={"chip " + (v.sources.includes(k)?"border-accent bg-accent-soft text-accent":"")}>{label}</button>)}</div></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="block"><span className="text-[12px] font-medium text-ink-3">影响对象名称</span><input value={impact.targetName} onChange={e=>setImpact({...impact,targetName:e.target.value})} className="mt-1.5 h-10 w-full rounded-control border border-line bg-field px-3 text-[14px] text-ink outline-none focus:border-accent" placeholder="例如：我的黄金基金" /></label>
      <label className="block"><span className="text-[12px] font-medium text-ink-3">影响对象类型</span><select value={impact.targetKind} onChange={e=>setImpact({...impact,targetKind:e.target.value as ImpactProfile["targetKind"]})} className="mt-1.5 h-10 w-full rounded-control border border-line bg-field px-3 text-[14px] text-ink"><option value="topic">主题</option><option value="asset">资产</option><option value="fund">基金</option><option value="stock">股票</option><option value="company">公司</option><option value="person">人物</option><option value="country">国家</option><option value="industry">行业</option><option value="other">其他</option></select></label>
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label><span className="text-[12px] font-medium text-ink-3">刷新频率</span><select value={v.refresh} onChange={e=>setV({...v,refresh:e.target.value as RefreshFrequency})} className="mt-1.5 h-10 w-full rounded-control border border-line bg-field px-3 text-[14px] text-ink">{REFRESH.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
      <label className="flex items-end"><button type="button" onClick={()=>setV({...v,enabled:!v.enabled})} className={"h-10 w-full rounded-control border px-3 text-[13px] font-medium "+(v.enabled?"border-ok bg-ok-soft text-ok-ink":"border-line bg-bg-sunk text-ink-3")}>{v.enabled?"当前：启用":"当前：暂停"}</button></label>
    </div>
    <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onDone} className="h-9 rounded-full border border-line-strong px-4 text-[13px] text-ink-2">取消</button><button type="button" disabled={!v.name.trim()} onClick={save} className="h-9 rounded-full bg-accent px-4 text-[13px] font-medium text-accent-contrast disabled:opacity-40">保存主题</button></div>
  </div>;
}

export default function ManageFocusPage(){
  const config=usePersonalIntel();
  const [editing,setEditing]=useState<FocusTopic|null>(null);
  const [notice,setNotice]=useState("");
  const sorted=useMemo(()=>[...config.topics].sort((a,b)=>b.importance-a.importance),[config.topics]);

  const download=()=>{
    const blob=new Blob([exportConfig()],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="my-intelligence-config.json"; a.click(); URL.revokeObjectURL(url);
  };
  const upload=async(file:File)=>{
    try { importConfig(await file.text()); setNotice("配置已导入"); setEditing(null); }
    catch(e){ setNotice(e instanceof Error?e.message:"导入失败"); }
  };

  return <div className="pb-8"><PhoneBar back={{ to: "/focus", label: "我的关注" }} title="管理我的关注" />
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
      <div><Link to="/focus" className="text-[12px] text-ink-4 hover:text-accent">← 我的关注</Link><h1 className="mt-2 text-[24px] font-semibold text-ink">情报主题管理器</h1><p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">主题不写死在代码里。你可以自己添加、删除、暂停，并控制关键词、排除词、来源、优先级和刷新频率。</p></div>
      <button onClick={()=>setEditing(newTopic())} className="h-9 rounded-full bg-accent px-4 text-[13px] font-medium text-accent-contrast">+ 新建主题</button>
    </div>

    <section className="mt-5">
      <div className="text-[12px] font-semibold text-ink-3">快速预设</div>
      <div className="mt-2 flex flex-wrap gap-2">{PRESETS.map(([k,l])=><button key={k} onClick={()=>{ if(confirm("应用预设会替换当前关注主题，是否继续？")) replacePreset(k); }} className="chip">{l}</button>)}</div>
    </section>

    {editing && <Editor topic={editing} onDone={()=>setEditing(null)} />}

    <div className="mt-5 divide-y divide-line rounded-card border border-line bg-surface">
      {sorted.map(t=><div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold text-ink">{t.name}</span>{!t.enabled&&<span className="rounded-full bg-bg-sunk px-2 py-0.5 text-[10px] text-ink-4">暂停</span>}</div><div className="mt-1 truncate text-[11.5px] text-ink-4">{"★".repeat(t.importance)} · {t.keywords.slice(0,5).join(" · ")}</div></div>
        <Link to={"/focus/debug/"+encodeURIComponent(t.id)} className="text-[12.5px] text-ink-3 hover:text-accent">专家模式</Link>
        <button onClick={()=>setEditing(t)} className="text-[12.5px] text-accent">编辑</button>
        <button onClick={()=>{if(confirm("删除“"+t.name+"”？")) deleteTopic(t.id)}} className="text-[12.5px] text-hot">删除</button>
      </div>)}
    </div>

    <section className="mt-6 border-t border-line pt-5">
      <h2 className="text-[14px] font-semibold text-ink">配置备份</h2>
      <p className="mt-1 text-[12.5px] text-ink-4">所有关注配置保存在当前浏览器。导出后可在另一台电脑重新导入。</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={download} className="h-9 rounded-full border border-line-strong px-4 text-[13px] text-ink-2">导出配置</button>
        <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line-strong px-4 text-[13px] text-ink-2">导入配置<input type="file" accept="application/json,.json" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) void upload(f); e.currentTarget.value="";}} /></label>
        {notice&&<span className="text-[12px] text-ink-3">{notice}</span>}
      </div>
    </section>
  </div>;
}
