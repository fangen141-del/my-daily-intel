# Phase 3 — 品牌改造：我的每日情报台

本阶段只替换站点身份和用户可见文案，不重做 AIHOT 已成熟的产品结构。

## 已完成

- 站名：`我的每日情报台`
- 产品定位：综合个人信息情报中心，而不是单一 AI 行业站
- 首页标题：`今天，我关注的事情发生了什么？`
- 描述、关键词、About 文案改为综合情报语义
- MCP 前缀：`dailyintel`
- Crawler：`DailyIntelBot/1.0`
- 源码链接指向本仓库
- 新增独立站点 SVG 标识，不继续使用上游 AIHOT 标识
- Manifest / favicon 引用改为独立标识
- 更新日志记录品牌基线

## 明确保留

本阶段没有改变：

- Sidebar / 手机 TabBar
- 精选 / 全部动态
- 热点榜
- 事件页
- 日报 / 周报 / 月报
- 主题
- 搜索与筛选
- 收藏与已读
- 阅读详情结构
- 亮色 / 深色 token
- 卡片尺寸、信息密度、字号、间距
- 960px 响应式壳层
- 页面切换与移动端动效
- API / publication / event grouping / worker 数据逻辑

## Phase 3 验收

必须继续通过原仓库的完整 Check Workflow。若品牌替换导致 typecheck、build、tests、smoke 或 Docker 启动退化，则不得进入 Phase 4。

Phase 4 才开始增加 `modules/personal-intel/`，实现“我的关注”。
