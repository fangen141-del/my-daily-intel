# 我的每日情报台：中国大陆部署手册

本文件对应仓库：

`https://github.com/fangen141-del/my-daily-intel`

目标不是重新搭一个简化版，而是部署当前已经通过完整 CI 的正式 `main`。

## 一、推荐部署方式

推荐：Docker Compose。

服务器建议：
- Linux
- 2 核以上
- 4 GB 内存以上
- 20 GB 以上可用磁盘
- Docker + Docker Compose

当前架构会启动：
- PostgreSQL
- setup（迁移 + seed）
- API
- worker
- web
- 可选 Caddy HTTPS

## 二、拉取

```bash
git clone https://github.com/fangen141-del/my-daily-intel.git
cd my-daily-intel
```

如果以后更新：

```bash
git pull
```

不要用上游 `KKKKhazix/AIHOT` 的地址覆盖本仓库。

## 三、生成环境变量

机器有 Node.js 24.11+：

```bash
node scripts/init-env.ts --llm-key 你的模型APIKey
```

会生成 `.env` 并自动生成：
- ADMIN_PASSWORD
- SESSION_SECRET
- IMG_PROXY_SIGN_SECRET
- POSTGRES_PASSWORD

如果服务器没有 Node：

```bash
cp .env.example .env
```

然后自己填写这些值。

随机密钥可用：

```bash
openssl rand -hex 32
```

## 四、中国大陆优先模型

可以使用任何 OpenAI 兼容接口。

### DeepSeek

```dotenv
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=...
LLM_MODEL=deepseek-flash
LLM_EXTRA_JSON={"thinking":{"type":"disabled"}}
```

### 阿里云百炼 / 千问

```dotenv
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=...
LLM_MODEL=qwen3.8-flash
LLM_EXTRA_JSON={"enable_thinking":false}
```

### 智谱

```dotenv
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=...
LLM_MODEL=glm-5.3-flash
```

第一阶段建议先用一个稳定、便宜的模型把完整链路跑通，不要一开始给每个步骤分配不同模型。

## 五、服务器在中国大陆时

构建使用国内 npm 镜像：

```bash
docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
docker compose up -d
```

如果 Docker Hub 拉取慢，应先在服务器 Docker 配置镜像加速。

海外信源抓不到时，可只给采集器设置：

```dotenv
EGRESS_PROXY_URL=http://你的代理地址:端口
```

该配置用于抓信源与图片，不要求模型 API 走代理。

大陆官方和大陆媒体信源应优先采用服务器可直接访问的地址。

## 六、本机先跑

`.env`：

```dotenv
SITE_URL=http://localhost:3000
```

启动：

```bash
docker compose up -d --build
```

打开：

- 网站：http://localhost:3000
- 后台：http://localhost:3000/admin

查看状态：

```bash
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 worker
docker compose logs --tail=100 web
```

## 七、正式服务器

如果暂时使用 IP：

```dotenv
SITE_URL=http://你的服务器IP:3000
```

正式域名 + HTTPS：

```dotenv
SITE_URL=https://你的域名
SITE_DOMAIN=你的域名
PORT=127.0.0.1:3000
TRUST_PROXY=true
```

然后：

```bash
docker compose --profile https up -d --build
```

如果已经有 Nginx，不需要再开 Caddy；把 Nginx 反代到 `127.0.0.1:3000`。

中国大陆公开网站使用域名上线前需按实际情况完成 ICP 备案；备案号填到 `site/site.ts` 的 `SITE.icp`。

## 八、第一次启动怎么判断正常

第一轮不要只看网页有没有打开。

必须同时检查：

1. `db` healthy。
2. `setup` 正常退出（0）。
3. `api` 正常运行。
4. `worker` 正常运行。
5. `web` 正常运行。
6. `/admin` 可以登录。
7. 后台“信源”可以看到 seed 的信源。
8. worker 开始产生抓取运行记录。
9. 有内容进入“全部动态”。
10. 模型处理后有内容进入“精选”。

常用命令：

```bash
docker compose ps
docker compose logs --tail=200 setup
docker compose logs --tail=200 worker
```

## 九、先关自动花钱，再调信源

首次配置大陆信源时，可以先在 `.env`：

```dotenv
COLLECT_ENABLED=false
MODEL_CALLS_ENABLED=false
```

这样先检查网页、后台和配置。

需要手动“预览抓取”真实外站时，再理解该操作本身仍可能访问外部服务。

正式开始跑：

```dotenv
COLLECT_ENABLED=true
MODEL_CALLS_ENABLED=true
```

修改后重启：

```bash
docker compose up -d
```

## 十、信源上线顺序

不要一次塞 50 个源。

推荐：

第一批：
- 中国政府网
- 国家统计局
- 国家发展改革委
- 财政部
- 中国证监会
- 深交所

第二批：
- 权威财经媒体
- 科技与创业媒体
- 行业媒体

第三批：
- 微信公众号
- 社交平台
- 个人作者
- 自己维护的外部采集器

每个源必须先在后台“预览抓取”，确认：
- 抓到的是文章，不是菜单
- 标题正确
- 链接正确
- 发布时间正确
- 没有大量重复
- 不会把分页、导航、广告当文章

## 十一、更新正式站

更新前先备份数据库。

```bash
git pull
docker compose build
docker compose stop api worker web
docker compose run --rm setup
docker compose up -d
```

如果 migration 失败，不要继续启动旧 API/worker。

## 十二、当前个人情报数据的边界

“我的关注”、专家规则、权重、影响对象、首页布局等个人设置当前保存在浏览器本地。

因此：
- 换浏览器不会自动同步
- 换电脑不会自动同步
- 需要使用“导出配置 / 导入配置”迁移
- 这些个人规则不会上传到服务器

公开新闻、事件、来源、日报等仍由服务器统一处理。
