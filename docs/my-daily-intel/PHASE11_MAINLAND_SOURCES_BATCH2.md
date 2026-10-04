# Phase 11 — 第二批中国大陆信源

本阶段继续扩展中国大陆信源，但仍坚持“能稳定抓取才进生产 seed”。

## 已加入生产 seed

### 少数派

- id: `rss-sspai`
- feed: `https://sspai.com/feed`
- kind: rss
- tier: T2
- tags: 媒体 / 科技 / 产品 / 效率
- interval: 60 分钟
- 首次回灌：10 条

使用少数派公开 RSS。

### 爱范儿

- id: `rss-ifanr`
- feed: `https://www.ifanr.com/feed`
- kind: rss
- tier: T2
- tags: 媒体 / 科技 / 产品 / 商业
- interval: 60 分钟
- 首次回灌：10 条

使用爱范儿公开 RSS。

## 为什么暂时没把 36氪写进生产 seed

36氪官方 RSS 订阅中心明确列出了：

- 综合：`https://36kr.com/feed`
- 文章：`https://36kr.com/feed-article`
- 快讯：`https://36kr.com/feed-newsflash`
- 动态：`https://36kr.com/feed-moment`

但当前验证环境访问 `https://36kr.com/feed` 会先进入安全检测页面。

因此：
- 官方 RSS 存在
- 但“我们的服务器能否稳定直接抓取”尚未确认

在没有从实际大陆部署服务器预览成功之前，不进入 `industry/sources.json`。

上线后应在后台手动测试这四个 RSS；若大陆服务器能稳定直连，再优先接：
- `feed-newsflash`：适合快讯
- `feed-article`：适合文章

## 财政部

财政部“政策发布”总入口稳定：
`https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/`

但文章会分流到：
- `kjs.mof.gov.cn`
- `jrs.mof.gov.cn`
- `szs.mof.gov.cn`
- `jjs.mof.gov.cn`
- `gss.mof.gov.cn`
- `sbs.mof.gov.cn`
- `zwgls.mof.gov.cn`
- `nys.mof.gov.cn`
- `gks.mof.gov.cn`
- 以及其他司局子域

如果当前直接用 allowUrlPrefixes：
- 写单一 `www.mof.gov.cn` 会漏掉大量正文
- 手写所有子域又容易以后漏新司局

因此本阶段继续保留为候选，不用脆弱方案抢跑。

后续优先方案：
1. 找统一 JSON / 数据接口；
2. 或给 web_list 增加“允许某域名后缀”的安全规则，例如 `*.mof.gov.cn`，同时仍限制列表来源为政策发布页。

## 深圳证券交易所

本所要闻页面内容正常、更新持续，但抓取环境对页面请求偶有超时。

在没有确认稳定文章 URL / JSON 接口之前，不进入生产 seed。

后续优先寻找：
- 列表页背后的 JSON 请求
- 稳定的文章路径前缀
- 是否存在官方 RSS

## 本阶段测试

`tests/mainland-sources.test.ts` 新增：

- 少数派必须是 RSS / T2
- 爱范儿必须是 RSS / T2
- feed 地址锁定
- 两者必须带“媒体 / 科技”标签

## 当前正式大陆信源

### T1 官方
- 国家统计局 · 最新发布
- 国家发展改革委 · 新闻发布
- 中国证监会 · 要闻

### T2 媒体
- 少数派
- 爱范儿

后续继续补：
- 36氪（先做服务器端实际 RSS 预览）
- 财政部
- 深交所
- 上交所
- 央行
- 外汇局
- 金融监管总局
- 财经媒体
