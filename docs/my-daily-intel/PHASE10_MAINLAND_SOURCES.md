# Phase 10 — 第一批中国大陆官方信源实装

本阶段不再只维护候选网址，而是把已经能确认 URL 规律、适合直接进入现有 `web_list` 采集器的官方源正式写入 `industry/sources.json`。

## 已实装

### 国家统计局 · 最新发布

- id: `web-cn-stats-latest`
- 列表：`https://www.stats.gov.cn/szst/`
- 文章路径：`https://www.stats.gov.cn/sj/zxfb/`
- tier: T1
- tags: 官方 / 政府 / 财经 / 数据
- interval: 60 分钟
- 首次回灌：12 条

列表上的“最新发布”文章 URL 规律稳定，因此使用：
- 普通 HTML
- 不指定脆弱 CSS class
- 通过 allowUrlPrefixes 过滤，只保留 `/sj/zxfb/` 正文

### 国家发展改革委 · 新闻发布

- id: `web-cn-ndrc-news`
- 列表：`https://www.ndrc.gov.cn/xwdt/xwfb/`
- 文章路径：同一 `/xwdt/xwfb/` 目录
- tier: T1
- tags: 官方 / 政府 / 财经 / 政策
- interval: 60 分钟
- 首次回灌：12 条

详情页日期使用：
`发布时间：YYYY/MM/DD`

因此配置 publishedAtRegex，并按北京时间 +08:00 解释。

### 中国证监会 · 要闻

- id: `web-cn-csrc-news`
- 列表：`https://www.csrc.gov.cn/csrc/c100028/common_xq_list.shtml`
- 文章路径：`https://www.csrc.gov.cn/csrc/c100028/`
- tier: T1
- tags: 官方 / 政府 / 财经 / 监管 / 资本市场
- interval: 60 分钟
- 首次回灌：12 条

详情页日期使用：
`日期：YYYY-MM-DD`

因此配置 publishedAtRegex。

## 为什么不用 itemSelector

这三个源暂时都不依赖页面的 CSS class。

AIHOT 的 `web_list` 在未设置 itemSelector 时会遍历链接，再用 allowUrlPrefixes 过滤。

这样比绑定某个 `.news-list > li` 更抗官网小改版：
- CSS class 改名，不影响
- 导航链接被 URL 前缀过滤
- 文章路径变化时会明显抓不到并在后台报错，而不是悄悄抓错内容

## 新增测试

`tests/mainland-sources.test.ts`

测试内容：
- 3 个源必须存在
- 必须为 web_list
- 必须是 T1
- 必须带“官方”标签
- 统计局只接受 `/sj/zxfb/`
- 发改委只接受 `/xwdt/xwfb/`
- 证监会只接受 `/csrc/c100028/`

## 暂不实装

### 财政部

财政部“政策发布”列表会跳转到会计司、税政司、金融司、经济建设司等多个二级子域。

如果直接放宽 URL 过滤，会把导航和非政策内容混进来；如果手写当前子域名单，又容易漏掉以后新增司局。

下一步优先寻找稳定的列表结构或统一数据接口后再进入 seed。

### 深圳证券交易所

深交所列表内容可读取，但页面有动态加载与特殊结构。

正式实装前继续确认：
- 文章真实 URL 规律
- 列表是否存在稳定 JSON 接口
- 是否可以不用脆弱 CSS selector 抓取

## 部署后的验证

即使 CI 通过，实际部署后仍应在后台逐个看：

1. 最近抓取时间
2. 最近 5 条标题
3. 发布时间
4. 是否只出现目标栏目
5. 是否出现正文抓取失败
6. 连续 24 小时是否稳定

如果官网改版导致 no items matched，应暂停该源并更新配置，不要放宽到“抓全站链接”。
