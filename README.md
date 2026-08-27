# 🌌 星语 · 星座分析

一个简单有趣的星座分析小工具，包含 **网页版** 与 **命令行版**，两者共享同一份星座数据。

> 仅供娱乐参考 · 星象之说，图个乐子 ✦

---

## ✨ 功能

### 网页版（`index.html`）

- **星座分析**：输入生日，自动识别星座，展示性格雷达图、今日运势、性格/爱情/事业/健康、幸运信息、最佳配对
- **📈 运势趋势**：近 7 天 / 30 天运势折线图，悬停查看每日运势
- **💞 配对测试**：任意两个星座的缘分指数、五维契合度、配对建议
- **🎂 生日当天推送**：生日保存在浏览器本地，生日当天自动弹出庆祝动画、系统通知与横幅，并显示倒计时
- **🤖 WebMCP 工具**：在支持 WebMCP 的浏览器（ChatGPT 桌面版 / Chrome 149+）中，AI 助手可直接调用本站的星座分析、运势查询与配对功能（详见下文 [WebMCP](#-webmcp让-ai-直接调用本站参赛亮点)）

### 命令行版（`zodiac.js`）

| 命令 | 说明 |
|------|------|
| `node zodiac.js` | 今天的星座档案 + 今日运势 |
| `node zodiac.js <日期\|星座>` | 指定日期 / 星座的完整档案 |
| `node zodiac.js list` | 列出十二星座 |
| `node zodiac.js pair <A> <B>` | 星座配对测试 |
| `node zodiac.js trend <日期\|星座>` | 近 7 天运势趋势 |

**日期格式**：`2026-8-18` / `2026/8/18` / `8-18` / `8/18` / `now`

**星座写法**：`白羊座` / `白羊` / `aries` / `Aries` / `♈` 均可

```bash
# 示例
node zodiac.js                      # 今天是什么星座 + 运势
node zodiac.js 1994-8-18            # 查看 1994 年 8 月 18 日出生的星座档案
node zodiac.js 白羊座               # 直接查看白羊座档案
node zodiac.js list                 # 列出十二星座
node zodiac.js pair 白羊 天秤       # 白羊 × 天秤 配对测试
node zodiac.js pair 1994-8-18 2000-5-20   # 也可以直接用生日测配对
node zodiac.js trend 双鱼           # 双鱼座近 7 天运势趋势
```

---

## 📂 文件结构

```
D:\claude\zsa
├── index.html      网页版入口（双击即可打开，或由后端托管）
├── style.css       网页样式
├── app.js          网页交互逻辑
├── webmcp.js       WebMCP 工具注册（AI 可直接调用本站功能，纯前端）
├── data.js         共享数据模块（UMD，浏览器 / Node / 后端共用）
│                   十二星座资料、运势算法、配对计算、趋势计算、输入解析
├── zodiac.js       Node 命令行版
├── api/index.js    Express 后端（托管网页 + /api 接口，也是 Vercel 函数入口）
├── vercel.json     Vercel 路由配置
├── netlify.toml    Netlify 部署配置（发布目录 public/）
├── public/         Netlify 发布的网页文件（与根目录前端同步）
├── package.json    项目元信息 + 后端依赖
└── README.md       本说明
```

### 数据模块 `data.js`

`data.js` 是唯一的「数据源」：

- 网页版：在 `index.html` 中先加载 `data.js`，把数据挂到 `window.SIGNS_DATA`，再由 `app.js` 消费
- 命令行版：`zodiac.js` 通过 `require("./data.js")` 获取同样的数据

所有运势结果均由 **哈希算法确定性生成**——同一天、同一星座，结果永远一致，稳定可复现。

---

## 🚀 使用

### 网页版

直接双击 `index.html` 用浏览器打开即可，无需安装任何东西。

### 命令行版

需要安装 [Node.js](https://nodejs.org)（≥ 14）：

```bash
cd D:\claude
node zodiac.js
```

若想全局使用 `zodiac` 命令（可选）：

```bash
cd D:\claude
npm link
zodiac 白羊座
```

---

## 🤖 WebMCP：让 AI 直接调用本站（参赛亮点）

本站在支持 WebMCP（Web Model Context Protocol）的浏览器中，通过 `document.modelContext.registerTool()` 注册 **7 个工具**（4 个只读分析 + 3 个生日管理动作工具），AI 助手可以像调用 API 一样直接使用网站功能，无需模拟点击：

| 工具 | 作用 | 参数示例 |
|------|------|----------|
| `list_zodiac_signs` | 列出全部 12 星座 | （无参数） |
| `analyze_birthday` | 生日 → 星座全维度档案 + 今日运势 | `birthday: "1996-08-15"` |
| `daily_fortune` | 星座 + 日期 → 当日运势 | `sign: "狮子座", date: "2026-08-26"` |
| `pair_compatibility` | 两个星座 → 缘分指数与建议 | `sign_a: "白羊", sign_b: "leo"` |
| `set_birthday` | **保存**用户生日到本站，生日当天自动提醒 + 庆祝（当天即生日则直接触发） | `birthday: "1996-08-15"` |
| `get_birthday` | 读取已保存的生日与星座 | （无参数） |
| `clear_birthday` | 删除已保存的生日 | （无参数） |

最后 3 个是**有状态的动作工具**：AI 不只是查询，而是真正"操作"网站——帮你把生日存下来，网站就会在生日当天推送提醒、弹出庆祝动画。

星座参数对 AI 很友好：**key（aries）/ 中文名（白羊座）/ 英文（Aries）/ 符号（♈）** 均可识别。

### 在 AI 里怎么用

打开支持 WebMCP 的浏览器访问本站后，直接对 AI 说，例如：

> 「帮我看一下 1996 年 8 月 15 日出生的人是什么星座，今天运势怎么样？」
> 「狮子座和双子座配不配？」
> 「帮我把生日设为 8 月 15 日，以后到生日记得提醒我」
> 「白羊座今天适合做什么？」

AI 会调用本站工具当场给出结果，而不是读网页文本猜；设置生日这类动作会直接写进浏览器本地存储，当场改变网站体验。

### 支持环境与检测

- **ChatGPT 桌面版内置浏览器**：原生支持
- **Chrome 149+**：开启 Origin Trial，或在地址栏输入 `chrome://flags/#enable-webmcp-testing` 设为 Enabled
- 页面顶部会显示绿色徽章「🤖 AI 助手已连接」表示工具注册成功
- 普通浏览器 `document.modelContext` 不存在，`webmcp.js` 静默跳过，**不影响任何现有功能**

实现见 `webmcp.js`（纯前端、无外部依赖、MIT 协议）。

---

## ⚙️ 原理小记

| 模块 | 实现方式 |
|------|----------|
| 星座判断 | 按月份边界表取「最后一个已到起始日」的区间，兼容所有日期边界（含 2/19 双鱼、8/23 处女等交界日） |
| 今日运势 | `hashStr(星座 + 日期) % 61 + 40` 得到 40–100 的稳定分值 |
| 运势趋势 | 对最近 N 天逐日求哈希分值，绘制折线 + 面积图 |
| 配对指数 | 元素相性表 + 经典配对加成 + 五维偏移，取平均得总分 |
| 生日提醒 | 浏览器 `localStorage` 本地存储，`Notification` API 推送 |

---

## 🚀 在线部署

**🌍 当前线上链接（永久免费 · 点开即用）：** https://enchanting-cannoli-1e82f7.netlify.app

> 说明：当前站点用 Netlify Drop 部署，已通过 GitHub 账号登录 Netlify 认领并设为公开，可长期使用。下面的 Vercel 方案是可选项（能额外启用 `/api` 接口）。

### 方案 A：Vercel（可启用 /api 后端）

后端既托管网页，也提供 `/api` 接口。部署后即可获得一个公网 https 链接，发给别人点开就能用。

> ⚠️ `*.vercel.app` 域名在中国大陆部分网络环境下无法访问（被屏蔽）。主要分享给国内用户时请使用上面的 Netlify 链接。

```bash
# 1. 安装 Vercel CLI（首次需注册一个 Vercel 账号，邮箱即可）
npm i -g vercel

# 2. 在项目目录部署
cd D:\claude\zsa
vercel --prod
```

部署完成后会输出 `https://xxx.vercel.app` 链接，分享即可。以后更新后重新运行 `vercel --prod` 即可覆盖。

### 本地运行后端（便于调试 / 自己用）

```bash
cd D:\claude\zsa
npm install
npm start          # 打开 http://localhost:3000
```

---

## 📡 API 文档

所有接口返回统一格式：`{ "ok": true, "data": ... }`；出错时返回 `{ "ok": false, "error": "..." }`（状态码 400 / 404）。接口已开启 CORS，可直接跨域调用。

| 接口 | 说明 | 示例 |
|------|------|------|
| `GET /api/signs` | 十二星座列表 | `/api/signs` |
| `GET /api/sign/:query` | 星座档案 + 运势（默认今天，`?date=` 指定日期），query 支持星座 key / 中文名 / 符号 / 生日 | `/api/sign/aries`、`/api/sign/1994-8-18?date=1994-8-18` |
| `GET /api/fortune/:query?date=` | 指定日期运势（缺省今天） | `/api/fortune/白羊座?date=2026-8-18` |
| `GET /api/trend/:query?days=` | 运势趋势（7 或 30，缺省 7） | `/api/trend/双鱼?days=30` |
| `GET /api/pair?A=&B=` | 配对测试（A/B 支持星座或生日） | `/api/pair?A=白羊&B=天秤` |
| `GET /api/resolve?q=` | 任意输入解析为星座 key | `/api/resolve?q=♈` |
| `GET /api/health` | 健康检查 | `/api/health` |

**星座写法**：`白羊座` / `白羊` / `aries` / `Aries` / `♈` 均可；日期写法：`2026-8-18` / `8-18`。

```bash
# 命令行直接调用示例
curl "https://你的域名.vercel.app/api/sign/1994-8-18"
curl "https://你的域名.vercel.app/api/pair?A=白羊&B=天秤"
```

> 提示：网页版本身是纯前端、自给自足，不依赖 API；API 供程序化调用与未来扩展使用。

---

## ⚠️ 免责声明

星座分析结果仅供娱乐参考，不代表任何科学结论。请理性看待，开心就好～
