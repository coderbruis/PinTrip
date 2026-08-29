# PinTrip XHS Service

该服务在一个 Python/FastAPI 进程内完成小红书内容抓取和攻略增强，不再依赖单独运行的 `crawler-api`。

处理流程：

1. 从基础攻略中提取不重复的行程地点。
2. 为每个地点生成检索关键词。
3. 通过内部 `SpiderXhsProvider` 有限并发抓取笔记正文及评论。
4. 按 `published_at` 倒序并按 `note_id` 去重。
5. 在证据上限内调用 GuideMerger Agent 增强基础攻略。
6. 校验攻略结构和旅行天数，失败时由 Web 保留基础攻略。

## 安装

先初始化 Spider_XHS 子模块：

```bash
git submodule update --init --recursive
```

安装 Spider_XHS 和 XHS Service 依赖：

```bash
cd services/agent-apps/xhs-guide-enhancer
python3 -m venv .venv
.venv/bin/pip install -e .
.venv/bin/pip install -r vendor/Spider_XHS/requirements.txt
npm ci --prefix vendor/Spider_XHS
cp .env.example .env
```

## 配置

```dotenv
LLM_API_KEY=你的模型Key
LLM_MODEL_ID=gpt-4o-mini
# LLM_BASE_URL=https://你的模型服务地址/v1

# cookie / qrcode / phone
XHS_LOGIN_TYPE=qrcode
# 仅 cookie 模式需要，必须包含 a1 和 web_session
# XHS_COOKIES=你的完整Cookie
```

扫码和手机号登录会在服务终端中交互进行，登录会话在当前 XHS Service 进程内复用。

## 启动

```bash
.venv/bin/python -m uvicorn app.main:app \
  --host 127.0.0.1 \
  --port 8092 \
  --reload
```

也可以在仓库根目录运行：

```bash
pnpm dev:xhs
```

核心接口：

```http
GET  /health
POST /agent/xhs-guide/enhance
```

Spider_XHS 只通过内部 provider 使用，不再暴露 `/crawl/xhs/search` HTTP 接口。小红书内容被视为不可信证据，笔记中的指令不会执行，小红书图片也不会直接写入最终攻略。
