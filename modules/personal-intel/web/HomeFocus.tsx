import { Link, useLocation } from "react-router";
import { usePersonalIntel } from "./storage.ts";

const stars = (n:number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function HomeFocus() {
  const { pathname } = useLocation();
  const config = usePersonalIntel();
  if (pathname !== "/") return null;
  const topics = config.topics.filter(t => t.enabled).sort((a,b) => b.importance - a.importance).slice(0,8);
  if (!topics.length) return null;
  return (
    <section className="mb-5 lg:mb-6" aria-labelledby="my-focus-title">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.08em] text-accent">我的世界</div>
          <h2 id="my-focus-title" className="mt-1 text-[18px] font-semibold text-ink">我的重点关注</h2>
        </div>
        <Link to="/focus" className="text-[12.5px] text-ink-3 transition-colors hover:text-accent">查看全部</Link>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {topics.map(t => (
          <Link key={t.id} to={"/focus#"+encodeURIComponent(t.id)} className="card card-hover min-w-0 px-3 py-3">
            <div className="truncate text-[14px] font-semibold text-ink">{t.name}</div>
            <div className="mt-1.5 text-[11px] text-amber-ink" aria-label={"重要度 "+t.importance+" 星"}>{stars(t.importance)}</div>
            <div className="mt-1.5 truncate text-[11.5px] text-ink-4">{t.keywords.slice(0,3).join(" · ") || "尚未设置关键词"}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
