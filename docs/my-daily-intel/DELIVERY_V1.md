# 我的每日情报台 — 正式交付说明

交付版本：**Delivery v1.0.0**

仓库：
`https://github.com/fangen141-del/my-daily-intel`

本版本是在 AIHOT 成熟框架基础上完成的“我的每日情报台”母版级改造。正式交付以后，新的信源、模型、专题、对象关注和界面微调都属于后续迭代，不再阻塞本版本交付。

## 一、这次正式交付包含什么

### AIHOT 原生能力

以下能力保留：

- 精选
- 全部动态
- 热点榜
- 搜索与筛选
- 同事实归组
- 同事件聚合
- 事件时间线
- 日报 / 周报 / 月报
- 主题页
- 收藏与已读
- 内容详情
- RSS
- 公开 API
- MCP
- Agent Markdown
- 后台信源管理
- 内容诊断
- 模型步骤配置
- 运行记录
- 预算熔断
- Docker 部署
- PostgreSQL 数据库

### 我的每日情报台新增能力

- 我的关注
- 关注主题增删改停
- 公司 / 人物 / 资产 / 基金 / 股票 / 国家 / 行业 / 产品等对象类型
- 多关键词
- 排除词
- 来源类型
- 重要程度
- 刷新频率
- AND / OR / NOT 专家规则
- 关键词权重
- 相关度阈值
- 规则调试器
- 命中 / 未命中原因
- 同一事实 / 同一事件聚合复用
- 官方一手识别
- 多来源交叉验证
- 为什么重要
- 事实 / 媒体观点 / 系统分析分层
- 对我的影响结构
- 官方 / 媒体 / 社交分栏
- 媒体观点 / 市场观点
- 主题时间线
- 首页模块排序
- 首页模块隐藏
- 重点关注显示数量
- 重点关注显示密度
- 本地 JSON 导入 / 导出

## 二、正式交付的数据边界

服务器保存：
- 信源
- 文章
- 分析结果
- 事件
- 热点
- 日报 / 周报 / 月报
- 后台配置
- 运行记录

浏览器本地保存：
- 我的关注
- 专家规则
- 权重
- 排除词
- 影响对象
- 首页布局
- 个人显示偏好

因此个人配置不会自动跨设备同步。

需要换电脑或浏览器时，使用“导出配置 / 导入配置”。

## 三、正式交付信源

### 已进入生产 seed

T1 官方：
- 国家统计局 · 最新发布
- 国家发展改革委 · 新闻发布
- 中国证监会 · 要闻

T2 中国大陆科技媒体：
- 少数派
- 爱范儿

原 AIHOT 示例海外 AI 信源仍保留。

### 已验证为候选、但不阻塞交付

- 中国政府网
- 财政部
- 中国人民银行
- 国家金融监督管理总局
- 国家外汇管理局
- 上交所
- 深交所
- 商务部
- 工信部
- 36氪
- 财经媒体
- 科技创业媒体
- 微信公众号
- 抖音 / 小红书 / B站外部采集

这些属于交付后的信源迭代，不属于“系统还没完成”。

## 四、正式部署入口

中国大陆部署：

`docs/my-daily-intel/DEPLOY_MAINLAND.md`

首次部署检查：

`docs/my-daily-intel/FIRST_DEPLOY_CHECKLIST.md`

常见故障：

`docs/my-daily-intel/TROUBLESHOOTING.md`

信源状态：

`docs/my-daily-intel/SOURCE_STATUS.md`

## 五、推荐生产环境

- Linux
- 2 核以上
- 4 GB RAM 以上
- 20 GB 以上磁盘
- Docker + Docker Compose
- Node.js 24.11+（仅初始化脚本或非 Docker 部署需要）
- PostgreSQL 17（Docker 已包含）

模型接口：
- DeepSeek
- 阿里云百炼 / 千问
- 智谱
- 或其他 OpenAI 兼容接口

## 六、正式启动

```bash
git clone https://github.com/fangen141-del/my-daily-intel.git
cd my-daily-intel
node scripts/init-env.ts --llm-key 你的模型APIKey
docker compose up -d --build
```

打开：

- 前台：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`

管理员密码在：
`.env -> ADMIN_PASSWORD`

## 七、交付验收标准

正式交付版本必须满足：

- TypeScript typecheck 通过
- Web build 通过
- Web tests 通过
- Backend tests 通过
- API smoke 通过
- Web smoke 通过
- MCP smoke 通过
- Docker build 通过
- Docker runtime smoke 通过

最终交付只在最后一个 release PR 全绿后合并到 `main`。

## 八、后续怎么迭代

正式交付后，把工作分成四类即可：

1. 信源扩展
2. 精选标准校准
3. 模型成本与效果优化
4. UI / 阅读体验微调

不要再为了“再加几个信源”阻塞生产部署。

## 九、上游 AIHOT 的关系

本仓库不是重新写的简化版。

它继续使用 AIHOT 原来的：
- backend
- publication
- event / story
- reports
- worker
- site shell
- API / MCP
- Docker / CI

个人情报功能主要通过：
`modules/personal-intel/`

叠加在原架构上。

以后同步上游时，应优先保护：
- `modules/personal-intel/`
- `docs/my-daily-intel/`
- `site/site.ts`
- `site/brand/`
- 已增加的大陆信源配置

## 十、版本定义

**Delivery v1.0.0 = 第一版可以正式部署、正式使用、后续在生产基础上继续迭代的版本。**

它不表示“以后不再更新”，而表示“主体产品已经完成，不再把新增信源当成交付前置条件”。
