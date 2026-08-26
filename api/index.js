/* =====================================================
   星语 · 星座分析 - Express 后端（自包含）
   同时托管网页静态文件与 /api 接口，数据与 CLI / 网页共用 data.js
   本地：node api/index.js          →  http://localhost:3000
   线上：Vercel 以本文件为 Serverless 函数入口（不 listen）
   ===================================================== */
"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const {
  SIGNS, TRAITS, ELEMENT_ICON, DIM_KEYS, VERDICTS,
  getSignKey, fortuneFor, trendFor, elementRel, computePair, hashStr,
  parseDate, resolveSign, resolveKey, fmtDate
} = require("../data");

const app = express();

/* ---------------- 中间件 ---------------- */
app.use(cors());                       // 允许任意来源跨域调用 /api
app.use(express.json());               // 预留 POST 能力

/* 统一响应包装：{ ok:true, data } / { ok:false, error } */
const ok = (res, data) => res.json({ ok: true, data });
const fail = (res, status, msg) => res.status(status).json({ ok: false, error: msg });

/* 严格解析参数：空值/缺失 → null（避免 parseDate("") 误当成「今天」） */
function resolveParam(v) {
  const s = String(v == null ? "" : v).trim();
  return s ? resolveKey(s) : null;
}

/* ================= 星座列表 ================= */
app.get("/api/signs", (req, res) => {
  const list = Object.keys(SIGNS).map(k => {
    const s = SIGNS[k];
    return {
      key: k, name: s.name, en: s.en, symbol: s.symbol,
      element: s.element, elName: s.elName,
      dateRange: s.dateRange, planet: s.planet, intro: s.intro
    };
  });
  ok(res, list);
});

/* ================= 星座档案 + 运势 =================
   query 支持：星座 key（aries）/ 中文名（白羊座/白羊）/ 符号（♈）/ 生日（1994-8-18）
   fortune 默认取今天，可用 ?date=YYYY-M-D 指定日期 */
app.get("/api/sign/:query", (req, res) => {
  const key = resolveParam(req.params.query);
  if (!key) return fail(res, 400, "无法识别「" + req.params.query + "」，支持星座名或日期，如 aries / 白羊座 / 1994-8-18");
  let dateStr = fmtDate(new Date());
  if (req.query.date) {
    const d = parseDate(String(req.query.date));
    if (!d) return fail(res, 400, "日期格式不正确：「" + req.query.date + "」，支持 2026-8-18 / 8-18");
    dateStr = fmtDate(d);
  }
  ok(res, { sign: SIGNS[key], fortune: fortuneFor(key, dateStr) });
});

/* ================= 指定日期运势 ================= */
app.get("/api/fortune/:query", (req, res) => {
  const key = resolveParam(req.params.query);
  if (!key) return fail(res, 400, "无法识别「" + req.params.query + "」，支持星座名或日期");
  let dateStr = fmtDate(new Date());
  if (req.query.date) {
    const d = parseDate(String(req.query.date));
    if (!d) return fail(res, 400, "日期格式不正确：「" + req.query.date + "」，支持 2026-8-18 / 8-18");
    dateStr = fmtDate(d);
  }
  ok(res, fortuneFor(key, dateStr));
});

/* ================= 运势趋势 ================= */
app.get("/api/trend/:query", (req, res) => {
  const key = resolveParam(req.params.query);
  if (!key) return fail(res, 400, "无法识别「" + req.params.query + "」，支持星座名或日期");
  let days = parseInt(req.query.days, 10);
  if (!days || days < 2) days = 7;
  if (days > 365) days = 365;
  ok(res, trendFor(key, days));
});

/* ================= 配对测试 ================= */
app.get("/api/pair", (req, res) => {
  const aKey = resolveParam(req.query.A);
  const bKey = resolveParam(req.query.B);
  if (!aKey || !bKey) {
    return fail(res, 400, "无法识别星座 A 或 B，支持星座名或日期，如 /api/pair?A=白羊&B=天秤");
  }
  ok(res, computePair(aKey, bKey));
});

/* ================= 任意输入 → 星座 key ================= */
app.get("/api/resolve", (req, res) => {
  const q = String(req.query.q == null ? "" : req.query.q).trim();
  if (!q) return fail(res, 400, "缺少参数 q，用法：/api/resolve?q=白羊座");
  const key = resolveKey(q);
  if (!key) return fail(res, 400, "无法识别「" + q + "」");
  ok(res, { key, name: SIGNS[key].name });
});

/* ================= 健康检查 ================= */
app.get("/api/health", (req, res) => {
  ok(res, { status: "ok", signs: Object.keys(SIGNS).length });
});

/* 未匹配到的 /api 路由 → 404 */
app.use("/api", (req, res) => fail(res, 404, "接口不存在：" + req.method + " " + req.originalUrl));

/* ---------------- 静态文件（网页） ----------------
   本地：从项目根目录读取 index.html 等
   线上：静态文件由 Vercel 文件系统直接托管，此中间件兜底 */
app.use(express.static(path.join(__dirname, "..")));

/* ---------------- 启动 ---------------- */
module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log("🌌 星语 · 已启动：http://localhost:" + port);
    console.log("   API 示例：/api/signs  /api/sign/aries  /api/pair?A=白羊&B=天秤");
  });
}
