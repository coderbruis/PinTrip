# 小红书攻略增强 Agent

该服务负责把 Natural Language Guide 生成的基础攻略，结合小红书笔记和评论进行增强。

处理流程：

1. 从基础攻略中提取不重复的行程地点。
2. 为每个地点生成“地点 + 游玩攻略 + 避坑”检索词。
3. 有限并发调用 `crawler-api` 搜索笔记正文和评论。
4. 搜索接口明确使用“最新排序”，并在本地按 `published_at` 再次倒序。
5. 按 `note_id` 去重，将最新笔记优先提交给增强 Agent。
6. 按全局证据上限截断笔记和评论，避免提示词无限增长。
7. Agent 只提炼与地点和原始需求相关的建议，合并回基础攻略。

## 安装与启动

```bash
cd services/agent-apps/xhs-guide-enhancer
python3 -m venv .venv
.venv/bin/pip install -e .
cp .env.example .env
```

项目使用 `httpx[socks]`，可兼容系统中的 HTTP、HTTPS 和 SOCKS 代理环境。如果更新代码前已经创建过虚拟环境，需要重新执行一次 `.venv/bin/pip install -e .` 安装新增依赖。

配置 `.env` 中的模型 API Key，并确认抓取 API 地址：

```dotenv
CRAWLER_API_URL=http://127.0.0.1:8092
LLM_API_KEY=你的模型Key
LLM_MODEL_ID=gpt-4o-mini
```

启动：

```bash
.venv/bin/python -m uvicorn app.main:app --reload --port 8093
```

健康检查：

```http
GET http://127.0.0.1:8093/health
```

增强接口：

```http
POST /agent/xhs-guide/enhance
Content-Type: application/json

{
  "prompt": "成都两天游",
  "guide": {
    "trip_id": "trip-1",
    "title": "成都两日攻略",
    "days": []
  }
}
```

该服务不会改变抓取 API 的原始数据。小红书正文和评论仅作为不可信证据提供给模型，其中的指令不会被执行。小红书图片不会直接写入最终攻略，最终页面继续使用基础攻略中已验证的图片地址。
