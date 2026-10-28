# 自在星球

线上家园。核心理念是 AI创造自由：以道驭AI，以创造得自由。七维自我探索卡点亮「我的家园」的七个维度。社群身份是自由创造者。线上不做商业展示，也不做撮合。

**正式域名**：[https://www.zizaiplanet.com](https://www.zizaiplanet.com)（apex `zizaiplanet.com` 同步）。`wrangler.toml` 的 `APP_URL` 请设为该 https 地址。旧域 `https://xq.p01.ccwu.cc` 仍可作为备用入口，对外链接与分享以正式域名为准。

## 技术选择

Cloudflare 现在建议用 [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) 把 Next.js App Router 跑在 Workers 上，而不是再用 OpenNext。vinext 用 Vite 实现 Next.js 的路由、服务端组件、Server Actions 和 Route Handlers，并通过 `@cloudflare/vite-plugin` 在本地 workerd 里访问 D1、KV、R2。

OpenNext 仍然适合已经建在 `@opennextjs/cloudflare` 上的旧项目。这个仓库是新的，所以走 vinext，同时保留 Wrangler 配置（`create-vinext-app --legacy-wrangler-cloudflare-init`），这样 D1 迁移和 `wrangler.toml` 还是你熟悉的那一套。

| 能力 | 绑定 |
| --- | --- |
| 数据 | D1 `DB` |
| 会话缓存 | KV `SESSION`（登录会话会写入；D1 仍是登录状态的来源） |
| 社区图片 | R2 `MEDIA` |
| 七维对话与社区审核 | `LLM_API_KEY` 指向 OpenAI 兼容接口；没有密钥时，安家按原话整理，发帖用关键词规则审核 |

## 本地运行

需要 Node.js 22+。

```bash
npm install
cp .dev.vars.example .dev.vars   # 仓库里已有一份本地用的 .dev.vars
npm run dev
```

打开 [http://127.0.0.1:4317](http://127.0.0.1:4317)。`predev` 会把迁移和种子数据应用到本地 D1。

页头标志读取 `public/logo.png`，旁边是「自在星球」和 `ZIZAI PLANET`。部署前请把品牌新 Logo 覆盖这个文件。组件按圆形容器完整显示图片。

`/join` 这一页按顺序填写：用户名、手机号、邮箱、密码、再确认一次。手机号必填，须是 11 位中国大陆号码。注册后是自由创造者。已经有账号时，页内「已有账号登录」用邮箱和密码回来。`admin@zizaiplanet.com` 用这组邮箱和手机号注册后可以进入运营后台。密码在家园后台修改。

```bash
npm test                 # 个人画像 / 七维规则
npm run db:migrate       # 只迁移本地库
npm run db:seed          # 重放种子（INSERT OR IGNORE，不覆盖已有行）
npm run build            # 生产构建
npm run start            # 用构建产物在本地 Wrangler 里预览
```

## 可以走通的路径

1. 首页是品牌首屏：主标题落在「AI时代，以创造获得人生自由」，口号是「AI自由创造，创造自由生活」，入驻按钮是「成为自由创造者」。`/about` 写品牌宣言、使命愿景与边界，并写明线上不做撮合、不为交易背书。顶栏仍是：认识自己、AI分身、我的向往、星球生活志、AI能量站、关于我们。
2. `/explore` 七维自我探索卡：一次一维，每维两题（感受 + 具体小事）。有原话即点亮；三维点亮后出现临时个人画像；七维都有原话则生成完整个人画像。更深路径：`/explore/chat` 站内七维自我探索对话，对接 OpenAI 兼容大模型（DeepSeek / 通义 / 智谱 / Moonshot / OpenAI / 自定义），按七维 Skill 自适应对话并尽量回写家园画像。也可下载 `/skills/seven-dimensions-skill.zip` 到自己的 Harness。
3. `/join` 用用户名、手机号、邮箱和密码注册。手机号必填。注册成功后身份是自由创造者。再次进入走同一页的「已有账号登录」。登录后在 `/garden` 看家园，在 `/garden/settings` 改用户名、改密码、看七维探索卡和自己的帖子。这是个人后台。
4. `/energy`、`/journal` 有种子内容，可领取或收藏到家园。
5. `/community` 发帖后先自动审核。没有明显违规就公开；没通过会给作者一句原因，公开页打不开。公开帖可以复制链接或系统分享，微信里打开仍是这篇帖子，页上还能再转发。
6. `/tea` 可以看茶局、报名或取消。提议会先审核，通过后提议人从自由创造者成为茶主。
7. `/admin` 由运营管理员处理举报、茶局、七维对话模型，并发布文章和资源。

站内登录后的身份只有三种：自由创造者（`member`）、茶主（`host`）、运营管理员（`admin`）。没登录的人不是其中任何一种。对外只改称呼，库里的角色仍是 `member`、`host`、`admin`。

不做：3D 家园、积分、排行、连签、私信、支付、招商。

## 部署到 Cloudflare

先把本地开发跑通。没有明确要求时不要部署。

目标账号是 `p01030736399@gmail.com`。`npx wrangler login` 之后用 `npx wrangler whoami` 核对邮箱，再创建 D1、KV、R2。登错账号时先 `npx wrangler logout`，不要把资源建到别的账户里。

1. `npx wrangler login`（登录上面的邮箱）
2. 创建资源，并把返回的 id 写进 `wrangler.toml`（换掉占位 id）：

```bash
npx wrangler d1 create zizai-planet
npx wrangler kv namespace create SESSION
npx wrangler r2 bucket create zizai-media
```

KV 还要一个预览 id：`npx wrangler kv namespace create SESSION --preview`，填到 `preview_id`。

3. 正式环境关掉登录链接预览，并换掉会话密钥：

```bash
# wrangler.toml 里 MAGIC_LINK_PREVIEW = "false"
npx wrangler secret put SESSION_SECRET
```

可选：

```bash
npx wrangler secret put LLM_API_KEY
npx wrangler secret put LLM_BASE_URL    # 默认 https://api.openai.com/v1
npx wrangler secret put LLM_MODEL
npx wrangler secret put MAIL_WEBHOOK_URL
npx wrangler secret put TURNSTILE_SECRET_KEY
```

`TURNSTILE_SITE_KEY` 和 `APP_URL`、`ADMIN_EMAILS` 放在 `[vars]`。站点密钥也可以只在需要时再加。`MAIL_WEBHOOK_URL` 会收到 `{ "email", "url" }`。没有它、又关闭了预览时，登录链接不会显示，也不会发出。

4. 迁移并播种远程库，然后部署：

```bash
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
```

`npm run deploy` 使用 vinext 的 `vinext-cloudflare deploy`。构建会把 `wrangler.toml` 里的绑定带到 `dist/server/wrangler.json`。

Workers 预览地址是公开的，除非你另外加 Access。生产域名在 Cloudflare 面板或 `wrangler.toml` 的 `routes` 里接。部署前把本地库的新迁移也应用到远程：`npm run db:migrate:remote`。

## 七维自我探索方案与 PDF

七维点亮（或对话生成画像）后，`/explore` 与 `/garden` 会展示「我的自我探索方案」，汇总向往定位、生活现状与向往、同频关系、想成为的自己与下一步。

- 下载：`GET /api/explore/plan?format=pdf` → `自在星球-七维自我探索方案.pdf`（`application/pdf`）
- JSON：`GET /api/explore/plan?format=json`
- 中文字体：`public/fonts/NotoSansSC-Plan.ttf`（约 1.2MB，GB2312 一级常用字预子集）
- PDF 生成：`embedFont(planFont, { subset: false })`。不要嵌入全量 Noto SC（数 MB → Worker 1102）；不要用 pdf-lib `{ subset: true }`（CJK 字距会散开）。Workers 禁止对拉取的字节做 `WebAssembly.compile`，故不在请求时跑 harfbuzz 动态子集。
- 重建底库：`./scripts/rebuild-plan-font.sh /path/to/NotoSansSC-Regular.ttf`
- 企业微信活码：默认 `public/community-wecom-qr.png`；运营可在 `/admin` 上传更换（存 R2 MEDIA，写入 `site_settings.community_wecom_qr_url`，方案页与 PDF 自动使用）

## 微信分享

帖子详情页输出 Open Graph（`og:title`、`og:description`、`og:image`、`og:url`）。图片用帖子配图，没有配图时用站点 logo。请把 `APP_URL` 设成正式域名 `https://www.zizaiplanet.com`，微信抓取才拿得到绝对链接。

页面上有「复制链接」和「系统分享」。在微信内打开公开帖子后，右上角可以再次转发给朋友，打开的仍是这篇可读帖子。

还没有接入微信公众号 JS-SDK。以后若要自定义分享卡片，需要公众号 AppId，并在服务端用票据签名。当前没有 AppId，所以先走链接和 Open Graph。

## 环境变量

见 `.dev.vars.example`。没有 `LLM_API_KEY`（及分服务商密钥）时：维度卡只引用用户原话；`/explore/chat` 仍可打开，走演示模式并提示「未配置密钥」。

七维自我探索对话用 OpenAI Chat Completions 兼容接口；服务商默认值可在 `/admin` 保存到 D1，密钥仍用 wrangler secrets。P01 生产配置示例：

```bash
npx wrangler secret put LLM_API_KEY          # 通用密钥
# 可选
npx wrangler secret put LLM_BASE_URL         # 自定义网关，默认按所选预设
npx wrangler secret put LLM_MODEL
npx wrangler secret put LLM_DEFAULT_PRESET   # deepseek | ark | qwen | zhipu | moonshot | openai | custom
npx wrangler secret put LLM_API_KEY_DEEPSEEK
npx wrangler secret put LLM_API_KEY_ARK      # 火山方舟 Coding Plan
npx wrangler secret put LLM_PRESETS          # JSON 覆盖 baseUrl/model/apiKey
```

模型如果被调用做维度润色，关键词必须是回答里的连续子串，摘要必须含有原话，否则丢弃，退回规则整理。身份结论不交给模型编写。
