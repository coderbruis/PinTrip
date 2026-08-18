# PinTrip 抓取 API

该服务提供 PinTrip Agent 所需的最小数据接口：

- 根据关键词搜索小红书笔记；
- 获取完整的笔记标题和正文；
- 按需获取并扁平化一级、二级评论。

本 API 没有复制 Spider_XHS 的签名或登录代码，而是通过 Git Submodule 固定上游源码版本，并由可替换的数据源适配器完成隔离。当前接入仅用于本地学习和技术验证；Spider_XHS README 禁止商业化使用，其他用途需要先取得作者授权。

默认子模块目录为 `vendor/Spider_XHS`。将来替换成 PinTrip 自研抓取实现时，只需新增或替换 Provider，不需要修改 Agent 和 API 调用契约。

## 初始化

首次克隆 PinTrip 时建议直接初始化子模块：

```bash
git clone --recurse-submodules <PinTrip仓库地址>
```

已有 PinTrip 工作目录执行：

```bash
git submodule update --init --recursive
```

安装 crawler-api 及 Spider_XHS 的 Python、Node.js 依赖：

```bash
cd services/crawler-api
python -m venv .venv
.venv/bin/pip install -e .
.venv/bin/pip install -r vendor/Spider_XHS/requirements.txt
npm ci --prefix vendor/Spider_XHS
cp .env.example .env
```

Spider_XHS 当前要求 Python 3.10+ 和 Node.js 20+。可用下面的命令确认子模块固定版本：

```bash
git submodule status services/crawler-api/vendor/Spider_XHS
```

## 配置

在 `.env` 中选择登录方式，支持 `cookie`、`qrcode` 和 `phone`：

```dotenv
XHS_LOGIN_TYPE=cookie
XHS_COOKIES=your_complete_xhs_cookie
```

- `cookie`：默认模式。`XHS_COOKIES` 必须是包含 `a1` 和 `web_session` 的完整 Cookie。
- `qrcode`：不需要配置 `XHS_COOKIES`。首个抓取请求会在 crawler-api 的启动终端显示二维码，使用小红书 App 扫码并在手机上确认。
- `phone`：不需要配置 `XHS_COOKIES`。首个抓取请求会在 crawler-api 的启动终端提示输入手机号和短信验证码。

扫码或手机号登录得到的会话会由当前 crawler-api 进程复用；服务重启后需要重新登录。交互式登录要求以前台单进程方式启动服务，不适合无终端的后台进程或多 Worker 部署。生产或无人值守环境建议使用安全保存的完整 Cookie。

默认自动加载 `vendor/Spider_XHS`。只有需要使用其他已授权源码目录时才覆盖：

```dotenv
SPIDER_XHS_PATH=/absolute/path/to/Spider_XHS
```

代理为可选配置，格式为 JSON 对象：

```dotenv
XHS_REQUEST_PROXIES_JSON={"http":"http://127.0.0.1:7890","https":"http://127.0.0.1:7890"}
```

启动 API：

```bash
.venv/bin/python -m uvicorn app.main:app --reload --port 8092
```

## Agent 调用契约

```http
POST /crawl/xhs/search
Content-Type: application/json

{
  "keyword": "成都旅行",
  "limit": 20,
  "sort_by": 1,
  "note_type": 0,
  "include_comments": true
}
```

`sort_by` 支持：`0` 综合排序、`1` 最新、`2` 最多点赞、`3` 最多评论、`4` 最多收藏。

`note_type` 支持：`0` 不限、`1` 视频、`2` 图文。

响应中的 `notes` 已经过标准化处理。每篇笔记包含 import-guide Agent 所需的 `note_id`、`title`、`content` 和 `tags` 字段，同时包含作者、互动数量、媒体地址及扁平化后的 `comments` 列表。二级评论通过 `parent_comment_id` 指向所属的一级评论。

当前接口采用同步调用，并将单次抓取数量限制为最多 100 篇笔记。长期定时抓取、数据持久化和断点续传应在独立的任务或 Worker 层实现，不应嵌入 Agent 请求中。

## 更新固定版本

上游接口和签名可能变化。更新前应在独立分支完成接口和抓取验证：

```bash
git -C vendor/Spider_XHS fetch origin
git -C vendor/Spider_XHS checkout <已验证的commit>
git add vendor/Spider_XHS
```

不要直接长期跟随上游 `master`，否则本地环境和 CI 可能在不同时间获得不兼容实现。
