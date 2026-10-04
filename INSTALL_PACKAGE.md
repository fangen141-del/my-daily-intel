# 我的每日情报台 Delivery v1.0.0 — 安装包使用说明

这个安装包是正式交付版本，对应仓库：
https://github.com/fangen141-del/my-daily-intel

## Windows

1. 先安装 Docker Desktop。
2. 解压整个安装包。
3. 双击：
   `install/start-windows.bat`
4. 第一次运行会生成 `.env` 并打开记事本。
5. 至少填写：
   - `LLM_API_KEY`
   - 确认 `LLM_BASE_URL`
   - 确认 `LLM_MODEL`
6. 保存 `.env`。
7. 再次双击 `install/start-windows.bat`。
8. 打开：
   - 前台：http://localhost:3000
   - 后台：http://localhost:3000/admin

> 管理员密码在 `.env` 的 `ADMIN_PASSWORD`。如果该值为空，请按项目部署文档生成安全密码与密钥后再正式使用。

## macOS / Linux

1. 安装 Docker Desktop / Docker Engine。
2. 解压。
3. 在项目根目录运行：

```bash
chmod +x install/start-macos-linux.sh
bash install/start-macos-linux.sh
```

4. 第一次会生成 `.env`。
5. 编辑 `.env`，填写模型信息。
6. 再运行同一个命令。

## 中国大陆

脚本构建时已经使用：

`https://registry.npmmirror.com`

如果 Docker Hub 本身较慢，还需要给 Docker 配置镜像加速。

如果海外信源无法抓取，可在 `.env` 设置：

```dotenv
EGRESS_PROXY_URL=http://你的代理地址:端口
```

## 正式部署

更完整的说明见：

- `docs/my-daily-intel/DELIVERY_V1.md`
- `docs/my-daily-intel/DEPLOY_MAINLAND.md`
- `docs/my-daily-intel/FIRST_DEPLOY_CHECKLIST.md`
- `docs/my-daily-intel/TROUBLESHOOTING.md`

## 注意

这不是 Windows 原生 .exe / macOS .dmg 桌面软件。

它是 Docker 化的完整网页应用安装包，包括：
- Web
- API
- Worker
- PostgreSQL
- 个人情报模块
- 正式交付文档
