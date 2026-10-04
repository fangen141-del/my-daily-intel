import { useSyncExternalStore } from "react";

export type SourceType = "all" | "news" | "finance" | "tech" | "social" | "self_media" | "government" | "official" | "research" | "custom";
export type RefreshFrequency = "realtime" | "hourly" | "6h" | "daily" | "manual";

export interface ExpertRules {
  must: string[];
  any: string[];
  not: string[];
  weights: Record<string, number>;
  threshold: number;
}

export type ImpactDirection = "positive" | "neutral" | "negative" | "watch";
export type ImpactStatus = "placeholder" | "manual" | "computed";

export interface ImpactProfile {
  targetName: string;
  targetKind: "topic" | "asset" | "company" | "person" | "country" | "industry" | "fund" | "stock" | "other";
}

export interface FocusTopic {
  id: string;
  name: string;
  keywords: string[];
  excludes: string[];
  sources: SourceType[];
  importance: 1 | 2 | 3 | 4 | 5;
  refresh: RefreshFrequency;
  enabled: boolean;
  expert?: ExpertRules;
  impactProfile?: ImpactProfile;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalIntelConfig {
  version: 1;
  preset: "comprehensive" | "investor" | "founder" | "technology" | "custom";
  topics: FocusTopic[];
}

const KEY = "dailyintel:personal-intel:v1";
const EVENT = "dailyintel:personal-intel-change";

const presets: Record<Exclude<PersonalIntelConfig["preset"], "custom">, Array<[string, string[], number]>> = {
  comprehensive: [
    ["国内政策", ["国务院", "政策", "监管"], 5],
    ["国际局势", ["国际局势", "地缘政治", "外交"], 4],
    ["财经市场", ["A股", "美股", "黄金", "人民币"], 5],
    ["科技与AI", ["人工智能", "AI", "OpenAI", "Claude"], 4],
    ["社会民生", ["就业", "医疗", "教育", "消费"], 3],
  ],
  investor: [
    ["黄金", ["黄金", "金价", "Gold", "COMEX Gold"], 5],
    ["美联储", ["美联储", "Federal Reserve", "Fed"], 5],
    ["A股", ["A股", "沪深", "上证", "深证"], 5],
    ["美股", ["美股", "纳斯达克", "标普500", "道琼斯"], 4],
    ["人民币汇率", ["人民币", "美元兑人民币", "USD/CNY"], 4],
  ],
  founder: [
    ["AI", ["AI", "人工智能", "AI Agent"], 5],
    ["创业融资", ["创业", "融资", "并购", "创投"], 5],
    ["新产品", ["发布", "上线", "新产品", "新服务"], 4],
    ["商业模式", ["商业模式", "增长", "收入", "盈利"], 4],
    ["创业政策", ["创业政策", "补贴", "监管"], 3],
  ],
  technology: [
    ["OpenAI", ["OpenAI", "ChatGPT", "GPT"], 5],
    ["Claude", ["Claude", "Anthropic"], 5],
    ["Google", ["Google", "Gemini", "DeepMind"], 4],
    ["Microsoft", ["Microsoft", "微软"], 4],
    ["Apple", ["Apple", "苹果"], 3],
    ["芯片", ["芯片", "GPU", "半导体", "NVIDIA"], 4],
  ],
};

function topic(name:string, keywords:string[], importance:number): FocusTopic {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    keywords,
    excludes: [],
    sources: ["all"],
    importance: Math.max(1, Math.min(5, importance)) as FocusTopic["importance"],
    refresh: "hourly",
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function makePreset(preset: Exclude<PersonalIntelConfig["preset"], "custom"> = "comprehensive"): PersonalIntelConfig {
  return { version: 1, preset, topics: presets[preset].map(([n,k,i]) => topic(n,k,i)) };
}

let memory: PersonalIntelConfig | null = null;
function read(): PersonalIntelConfig {
  if (typeof window === "undefined") return memory ?? { version: 1, preset: "comprehensive", topics: [] };
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    const initial = makePreset("comprehensive");
    window.localStorage.setItem(KEY, JSON.stringify(initial));
    memory = initial;
    return initial;
  }
  try {
    const parsed = JSON.parse(raw) as PersonalIntelConfig;
    if (parsed?.version === 1 && Array.isArray(parsed.topics)) {
      memory = parsed;
      return parsed;
    }
  } catch {}
  const fallback = makePreset("comprehensive");
  window.localStorage.setItem(KEY, JSON.stringify(fallback));
  memory = fallback;
  return fallback;
}

function emit() {
  memory = null;
  window.dispatchEvent(new Event(EVENT));
}

export function writeConfig(config: PersonalIntelConfig) {
  window.localStorage.setItem(KEY, JSON.stringify(config));
  emit();
}

export function upsertTopic(next: FocusTopic) {
  const c = read();
  const exists = c.topics.some(t => t.id === next.id);
  writeConfig({ ...c, preset: "custom", topics: exists ? c.topics.map(t => t.id === next.id ? next : t) : [next, ...c.topics] });
}

export function deleteTopic(id: string) {
  const c = read();
  writeConfig({ ...c, preset: "custom", topics: c.topics.filter(t => t.id !== id) });
}

export function toggleTopic(id: string) {
  const c = read();
  writeConfig({ ...c, preset: "custom", topics: c.topics.map(t => t.id === id ? { ...t, enabled: !t.enabled, updatedAt: new Date().toISOString() } : t) });
}

export function replacePreset(preset: Exclude<PersonalIntelConfig["preset"], "custom">) {
  writeConfig(makePreset(preset));
}

export function exportConfig(): string {
  return JSON.stringify(read(), null, 2);
}

export function importConfig(text: string) {
  const parsed = JSON.parse(text) as PersonalIntelConfig;
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.topics)) throw new Error("配置文件格式不正确");
  writeConfig(parsed);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

let serverSnapshot: PersonalIntelConfig = { version: 1, preset: "comprehensive", topics: [] };
export function usePersonalIntel(): PersonalIntelConfig {
  return useSyncExternalStore(subscribe, read, () => serverSnapshot);
}

export function updateExpertRules(id: string, expert: ExpertRules) {
  const c = read();
  writeConfig({ ...c, preset: "custom", topics: c.topics.map(t => t.id === id ? { ...t, expert, updatedAt: new Date().toISOString() } : t) });
}

export function impactProfileFor(topic: FocusTopic): ImpactProfile {
  return topic.impactProfile ?? { targetName: topic.name, targetKind: "topic" };
}

export function updateImpactProfile(id: string, impactProfile: ImpactProfile) {
  const c = read();
  writeConfig({ ...c, preset: "custom", topics: c.topics.map(t => t.id === id ? { ...t, impactProfile, updatedAt: new Date().toISOString() } : t) });
}

export function expertRulesFor(topic: FocusTopic): ExpertRules {
  return topic.expert ?? { must: [], any: [...topic.keywords], not: [...topic.excludes], weights: {}, threshold: 1 };
}

export function newTopic(): FocusTopic {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name: "", keywords: [], excludes: [], sources: ["all"], importance: 3, refresh: "hourly", enabled: true, createdAt: now, updatedAt: now };
}
