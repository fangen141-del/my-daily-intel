import { useState, type DragEvent, type ReactNode } from "react";
import HomeFocus from "./HomeFocus.tsx";
import { homeLayoutFor, resetHomeLayout, updateHomeLayout, usePersonalIntel, type HomeModuleKey } from "./storage.ts";

const LABEL: Record<HomeModuleKey,string> = { focus:"我的重点关注", hot:"今日热点", feed:"精选时间线" };

function move(order: HomeModuleKey[], key: HomeModuleKey, delta: number): HomeModuleKey[] {
  const from = order.indexOf(key);
  const to = Math.max(0, Math.min(order.length - 1, from + delta));
  if (from < 0 || from === to) return order;
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, key);
  return next;
}

export default function HomeLayout({ hot, feed, moduleTop }: { hot: ReactNode; feed: ReactNode; moduleTop: ReactNode }) {
  const config = usePersonalIntel();
  const prefs = homeLayoutFor(config);
  const [editing,setEditing] = useState(false);
  const [dragging,setDragging] = useState<HomeModuleKey | null>(null);

  const renderModule = (key: HomeModuleKey) => {
    if (key === "focus") return <HomeFocus count={prefs.focusCount} size={prefs.focusSize} />;
    if (key === "hot") return hot;
    return feed;
  };

  const setHidden = (key: HomeModuleKey, hidden: boolean) => {
    updateHomeLayout({ ...prefs, hidden: hidden ? [...new Set([...prefs.hidden,key])] : prefs.hidden.filter(x=>x!==key) });
  };

  const drop = (target: HomeModuleKey) => {
    if (!dragging || dragging === target) return setDragging(null);
    const from = prefs.order.indexOf(dragging);
    const to = prefs.order.indexOf(target);
    const next = [...prefs.order];
    next.splice(from,1);
    next.splice(to,0,dragging);
    updateHomeLayout({ ...prefs, order: next });
    setDragging(null);
  };

  return <div>
    {moduleTop}
    <div className="mb-3 flex items-center justify-end">
      <button type="button" onClick={()=>setEditing(x=>!x)} className="text-[12px] text-ink-4 transition-colors hover:text-accent">
        {editing ? "完成编辑" : "编辑首页"}
      </button>
    </div>

    {editing && <section className="mb-4 rounded-card border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-[13px] font-semibold text-ink">首页模块</div><div className="mt-0.5 text-[11.5px] text-ink-4">电脑可拖动排序；手机可用上下按钮。隐藏和排序只保存在当前浏览器。</div></div>
        <button type="button" onClick={resetHomeLayout} className="text-[12px] text-accent">恢复默认</button>
      </div>
      <div className="mt-3 space-y-2">
        {prefs.order.map((key,index)=><div key={key} draggable onDragStart={()=>setDragging(key)} onDragEnd={()=>setDragging(null)} onDragOver={(e:DragEvent)=>e.preventDefault()} onDrop={()=>drop(key)} className={"flex flex-wrap items-center gap-2 rounded-control border px-3 py-2.5 "+(dragging===key?"border-accent bg-accent-soft":"border-line bg-bg-sunk")}>
          <span className="cursor-grab select-none text-ink-4" title="拖动排序">☰</span>
          <span className="min-w-[100px] flex-1 text-[13px] font-medium text-ink">{LABEL[key]}</span>
          <button type="button" disabled={index===0} onClick={()=>updateHomeLayout({...prefs,order:move(prefs.order,key,-1)})} className="rounded-full px-2 py-1 text-[12px] text-ink-3 disabled:opacity-30">↑</button>
          <button type="button" disabled={index===prefs.order.length-1} onClick={()=>updateHomeLayout({...prefs,order:move(prefs.order,key,1)})} className="rounded-full px-2 py-1 text-[12px] text-ink-3 disabled:opacity-30">↓</button>
          {key==="focus" && <>
            <select value={prefs.focusSize} onChange={e=>updateHomeLayout({...prefs,focusSize:e.target.value as "compact"|"normal"})} className="h-8 rounded-control border border-line bg-field px-2 text-[12px] text-ink">
              <option value="normal">标准大小</option><option value="compact">紧凑</option>
            </select>
            <select value={prefs.focusCount} onChange={e=>updateHomeLayout({...prefs,focusCount:Number(e.target.value) as 2|4|6|8})} className="h-8 rounded-control border border-line bg-field px-2 text-[12px] text-ink">
              <option value={2}>显示2个</option><option value={4}>显示4个</option><option value={6}>显示6个</option><option value={8}>显示8个</option>
            </select>
          </>}
          <button type="button" onClick={()=>setHidden(key,!prefs.hidden.includes(key))} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-ink-3">{prefs.hidden.includes(key)?"显示":"隐藏"}</button>
        </div>)}
      </div>
    </section>}

    {prefs.order.map(key => prefs.hidden.includes(key) ? (editing ? <div key={key} className="mb-3 rounded-control border border-dashed border-line px-4 py-3 text-[12px] text-ink-4">{LABEL[key]} 已隐藏</div> : null) : <div key={key}>{renderModule(key)}</div>)}
  </div>;
}
