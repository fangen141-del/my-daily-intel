# 中国大陆信源：第一批候选清单

更新日期：2026-10-04

本清单只记录已经确认仍有持续更新内容的页面。

**原则：候选页不等于已经可直接生产抓取。**

HTML 结构、选择器、日期字段必须在目标部署的 `/admin/sources/new` 中做“预览抓取”验证后，才能正式创建为 `web_list`。

## 第一组：国家级政策 / 宏观 / 监管

### 中国政府网 · 政策

- 地址：`https://www.gov.cn/zhengce/`
- 建议名称：中国政府网 · 最新政策
- tier：T1
- participation_mode：editorial
- tags：官方、政府、政策
- 建议频率：60 分钟
- 关注：国务院政策文件、重要政策发布

### 国家统计局 · 最新发布

- 地址：`https://www.stats.gov.cn/szst/`
- 建议名称：国家统计局 · 最新发布
- tier：T1
- participation_mode：editorial
- tags：官方、政府、财经、数据
- 建议频率：60 分钟
- 关注：CPI、PPI、PMI、工业、消费、投资、房地产、就业等

### 国家发展改革委 · 新闻发布

- 地址：`https://www.ndrc.gov.cn/xwdt/xwfb/`
- 建议名称：国家发展改革委 · 新闻发布
- tier：T1
- participation_mode：editorial
- tags：官方、政府、财经、政策
- 建议频率：60 分钟
- 关注：宏观政策、价格、投资、产业政策、民营经济

### 财政部 · 政策发布

- 地址：`https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/`
- 建议名称：财政部 · 政策发布
- tier：T1
- participation_mode：editorial
- tags：官方、政府、财经、政策
- 建议频率：60 分钟
- 关注：财政政策、税收、政府债、金融协同

### 中国证监会 · 证监会要闻

- 地址：`https://www.csrc.gov.cn/csrc/c100028/common_xq_list.shtml`
- 建议名称：中国证监会 · 要闻
- tier：T1
- participation_mode：editorial
- tags：官方、政府、财经、监管、资本市场
- 建议频率：30–60 分钟
- 关注：资本市场政策、处罚、监管、制度调整

### 深圳证券交易所 · 本所要闻

- 地址：`https://www.szse.cn/aboutus/trends/news/`
- 建议名称：深圳证券交易所 · 要闻
- tier：T1
- participation_mode：editorial
- tags：官方、财经、交易所、资本市场
- 建议频率：60 分钟

### 深圳证券交易所 · 通知公告

- 地址：`https://www.szse.cn/www/disclosure/notice/general/`
- 建议名称：深圳证券交易所 · 通知公告
- tier：T1
- participation_mode：editorial
- tags：官方、财经、交易所、公告
- 建议频率：30–60 分钟

## 第二组：下一步验证

正式加入前需要逐个预览页面结构：

- 上海证券交易所：热点动态 / 新闻发布 / 规则与公告
- 中国人民银行：货币政策、新闻发布
- 国家金融监督管理总局
- 国家外汇管理局
- 商务部
- 工业和信息化部
- 海关总署
- 国务院新闻办公室

## 第三组：媒体

媒体类不要直接设为 T1。

建议默认：
- tier：T2
- participation_mode：editorial
- tags：媒体 + 垂直标签

计划分组：

### 财经
- 财新
- 第一财经
- 证券时报
- 上海证券报
- 中国证券报
- 21世纪经济报道
- 经济观察报

### 科技 / 创业
- 36氪
- 虎嗅
- 钛媒体
- 创业邦
- 投资界
- 晚点
- 少数派
- 爱范儿
- InfoQ 中文

这些站点是否用 RSS、web_list、JSON API 或外部采集，应逐个验证，不写未经验证的 RSS 地址。

## 第四组：微信 / 社交 / 个人

AIHOT 原生支持：
- 微信公众号：`mp_account`
- X：`x_search`
- 自己的采集脚本：`external`

微信需要 Dajiala key；如果不想依赖付费第三方，可以后续做一套你自己维护的外部采集器，再通过 `POST /api/ingest/items` 推入本站。

大陆社交平台（抖音、小红书、B站）目前不应假装成“原生支持”。更适合走：
1. 自己维护的采集脚本
2. 输出统一 JSON
3. 通过 external ingest 进入本站

这样前端、精选、事件归组、热点、个人关注都无需另写一套。

## 创建正式源前的后台检查

每个候选源在后台预览时必须记录：

- 返回条目数
- 前 5 条标题
- 前 5 条 URL
- 发布时间
- 是否有摘要
- 是否出现导航/广告
- 是否需要详情页补日期
- 是否需要 Jina
- 是否在大陆服务器可直连

预览正常后，才把配置固化进 `industry/sources.json`。
