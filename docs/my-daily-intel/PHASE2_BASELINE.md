# Phase 2 — AIHOT 高保真母版基线

本分支只做母版校验，不做品牌、视觉、功能或数据结构改造。

## 基线来源

- 上游：`KKKKhazix/AIHOT`
- 上游分支：`main`
- 本仓库：`fangen141-del/my-daily-intel`
- 本仓库基线：`main`

校验时两边完全一致：

- commit: `04978ba78d3e9ed50d877ad545c5544ca33f1d3c`
- tree: `99d74328cf1e93f6f850a724823e6c7073175512`

因此当前 `main` 是 AIHOT 原版的逐 Tree 高保真母版，不是简化重写版。

## Phase 2 不允许改变的内容

- 桌面 Sidebar 与移动端 TabBar
- 精选 / 全部动态双入口
- 热点榜与事件页
- 日报 / 周报 / 月报
- 主题页
- 搜索的“最新 / 全文相关”模式
- 频道 / 类别 / 标签筛选
- 收藏与已读状态
- 详情页三栏渐进折叠结构
- 亮色 / 深色主题 token
- 960px 响应式壳层切换
- View Transition 与移动端 push/back 动效
- 下拉刷新、返回顶部、错误恢复
- publication 统一读取层
- 事件归组、合并、热度计算
- worker 定时任务
- 原有测试与 CI

## CI 验证标准

本 PR 必须通过仓库原有 Check Workflow：

1. Node.js 24 安装依赖
2. `npm run typecheck`
3. `npm run build -w @aihot/web`
4. Web tests
5. Backend tests
6. Built site smoke check
7. MCP check
8. Docker Compose build/start
9. Docker smoke check
10. 初始信源数量校验

## 后续改造原则

Phase 3 以后所有改造都必须遵循：

> 先复用 AIHOT 现有组件、数据流和模块机制；只有原版不存在的能力，才新增。

个人关注系统优先设计为 `modules/personal-intel/`，不得为了新增个人功能重写现有首页、热点、事件、详情、日报、主题和搜索。


## CI 触发记录

Actions 已由仓库所有者启用；本次提交用于触发 Phase 2 基线完整 CI 验证。
