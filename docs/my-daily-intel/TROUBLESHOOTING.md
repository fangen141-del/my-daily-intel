# 常见故障处理

适用于：我的每日情报台 Delivery v1.0.0

## 1. 网页打不开

先运行：

```bash
docker compose ps
docker compose logs --tail=100 web
docker compose logs --tail=100 api
```

常见原因：
- web 没启动
- api 没启动
- setup migration 失败
- 3000 端口被占用

## 2. 后台登录不了

检查：

`.env -> ADMIN_PASSWORD`

管理员密码至少 12 位。

修改后：

```bash
docker compose up -d
```

## 3. 首页有页面但一直没有内容

检查：

```dotenv
COLLECT_ENABLED=true
MODEL_CALLS_ENABLED=true
```

然后：

```bash
docker compose logs --tail=200 worker
```

如果所有源都没有抓取，检查 worker。

如果只是一两个外站失败，不代表系统整体故障。

## 4. 模型 401

说明 API Key 或 Base URL 不正确。

检查：

- LLM_BASE_URL
- LLM_API_KEY
- LLM_MODEL

修改后重启 api / worker。

## 5. 模型 429

一般是：
- 余额不足
- QPS 超限
- 并发过高

先看模型服务商后台。

不要通过关闭测试或吞掉错误解决。

## 6. 中国大陆服务器抓不到海外站

可以设置：

```dotenv
EGRESS_PROXY_URL=http://代理地址:端口
```

该代理只用于外部采集 / 图片。

大陆官方源不应依赖海外代理。

## 7. 某个 web_list 一直 no items matched

先暂停该源。

常见原因：
- 官网改版
- URL 路径变了
- 页面改成 JavaScript 动态加载
- CSS selector 失效
- allowUrlPrefixes 不再匹配

进入后台：
“信源 → 编辑 / 预览抓取”

不要为了让它“有数据”直接放宽到抓全站链接。

## 8. 36氪 RSS 抓不到

官方存在 RSS，但部分网络环境会触发安全检测。

先在实际部署服务器测试：

```bash
curl -I https://36kr.com/feed
```

若仍被拦截：
- 暂不启用
- 或通过经过验证的外部采集器进入 ingest API

不要因为官方提供 RSS 就假设所有服务器都能稳定直接抓。

## 9. 财政部为什么没直接进正式 seed

财政部正文分布在多个 `*.mof.gov.cn` 子域。

单一前缀会漏内容；手写大量子域容易长期失效。

因此当前保留为候选，后续应使用更稳的统一接口或域名后缀过滤能力。

这不是系统未完成。

## 10. 深交所为什么还没正式启用

页面结构与请求方式仍需部署环境验证。

交付版本不为了凑信源数量使用未经验证配置。

## 11. 我的关注换电脑后不见了

当前个人情报设置保存在浏览器 localStorage。

使用：
- 导出配置
- 导入配置

迁移到新浏览器。

服务器端新闻数据不会因此丢失。

## 12. 首页布局恢复不了

进入“编辑首页”，点击：

“恢复默认”

默认顺序：
1. 我的重点关注
2. 今日热点
3. 精选时间线

## 13. Docker build 慢

中国大陆：

```bash
docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
```

Docker Hub 本身慢时，还需要配置 Docker 镜像加速。

## 14. 数据库 migration 失败

不要继续启动新版本 API / worker。

正确顺序：

```bash
docker compose stop api worker web
docker compose run --rm setup
```

看 setup 日志解决 migration。

确认成功后再：

```bash
docker compose up -d
```

## 15. 升级后出现异常

先确认运行的代码版本：

```bash
git rev-parse HEAD
```

再检查：

```bash
docker compose ps
docker compose logs --tail=200 setup
docker compose logs --tail=200 api
docker compose logs --tail=200 worker
docker compose logs --tail=200 web
```

不要在不知道错误来源时删除数据库或数据卷。
