import { Link } from "react-router";
import type { Screen } from "@aihot/web/components/shell/screens";
import { usePersonalIntel, toggleTopic } from "../storage.ts";

export const handle: Screen = { tab: "me", name: "我的关注" };

const stars = (n:number) => "★".repeat(n) + "☆".repeat(5-n);
const refreshLabel: Record<string,string> = { realtime:"实时", hourly:"每小时", "6h":"每6小时", daily:"每天", manual:"手动" };

export default function FocusPage() {
  const config = usePersonalIntel();
  const topics = [...config.topics].sort((a,b) => Number(b.enabled)-Number(a.enabled) || b.importance-a.importance || a.name.localeCompare(b.name,"zh-CN"));
  return (
    <div className="pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.08em] text-accent">我的世界</div>
          <h1 className="mt-1 text-[24px] font-semibold leading-tight text-ink">我的关注</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">你决定要持续关注什么。系统后续会按这些主题做匹配、排序和聚合；这一页先负责把你的关注对象管理清楚。</p>
        </div>
        <Link to="/focus/manage" className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-[13px] font-medium text-accent-contrast">管理我的关注</Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {topics.map(t => (
          <article id={t.id} key={t.id} className={"card px-4 py-4 " + (t.enabled ? "" : "opacity-60")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-semibold text-ink">{t.name}</h2>
                <div className="mt-1 text-[11.5px] text-amber-ink">{stars(t.importance)}</div>
              </div>
              <button onClick={() => toggleTopic(t.id)} className={"shrink-0 rounded-full px-2.5 py-1 text-[11.5px] " + (t.enabled ? "bg-ok-soft text-ok-ink" : "bg-bg-sunk text-ink-4")}>{t.enabled ? "已启用" : "已暂停"}</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.keywords.slice(0,8).map(k => <span key={k} className="chip">{k}</span>)}
              {!t.keywords.length && <span className="text-[12px] text-ink-4">未设置关键词</span>}
            </div>
            {t.excludes.length > 0 && <div className="mt-3 text-[12px] leading-relaxed text-ink-4">排除：{t.excludes.join("、")}</div>}
            <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3 text-[11.5px] text-ink-4">
              <span>{t.sources.includes("all") ? "全部来源" : t.sources.length+" 类来源"}</span>
              <span>{refreshLabel[t.refresh] ?? t.refresh}</span>
            </div>
          </article>
        ))}
      </div>

      {!topics.length && <div className="card mt-5 px-5 py-12 text-center"><div className="text-[16px] font-semibold text-ink">还没有关注主题</div><p className="mt-2 text-[13px] text-ink-3">去“管理我的关注”添加第一个主题。</p></div>}
    </div>
  );
}
