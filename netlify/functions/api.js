/* =====================================================
   星语 · 星座分析 - Netlify Function（后端 API）
   与 Express 版（api/index.js）共用同一套 data.js 纯函数
   路由：由 netlify.toml 把 /api/* 重写到 /.netlify/functions/api
   ===================================================== */
"use strict";

const {
  SIGNS, TRAITS, ELEMENT_ICON, DIM_KEYS, VERDICTS,
  getSignKey, fortuneFor, trendFor, elementRel, computePair, hashStr,
  parseDate, resolveSign, resolveKey, fmtDate
} = require("../../data");

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*"
};

const ok = (data) => ({
  statusCode: 200, headers: JSON_HEADERS,
  body: JSON.stringify({ ok: true, data })
});

const fail = (status, msg) => ({
  statusCode: status, headers: JSON_HEADERS,
  body: JSON.stringify({ ok: false, error: msg })
});

/* 严格解析参数：空值/缺失 → null（避免 parseDate("") 误当成「今天」） */
function resolveParam(v) {
  const s = String(v == null ? "" : v).trim();
  return s ? resolveKey(s) : null;
}

exports.handler = async (event) => {
  /* CORS 预检 */
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
      body: ""
    };
  }
  if (event.httpMethod !== "GET") return fail(405, "仅支持 GET");

  /* event.path 可能是原始 /api/xxx，也可能是函数自身路径，两种都去掉前缀 */
  let path = event.path || "/";
  path = path.replace(/^\/api/, "").replace(/^\/\.netlify\/functions\/api/, "");

  const q = event.queryStringParameters || {};
  const seg = path.split("/").filter(Boolean);   // ["sign","aries"]
  const route = seg[0] || "";
  const arg = seg[1];

  switch (route) {
    /* ============ 健康检查 ============ */
    case "health":
      return ok({ status: "ok", signs: Object.keys(SIGNS).length });

    /* ============ 星座列表 ============ */
    case "signs":
      return ok(Object.keys(SIGNS).map(k => {
        const s = SIGNS[k];
        return {
          key: k, name: s.name, en: s.en, symbol: s.symbol,
          element: s.element, elName: s.elName,
          dateRange: s.dateRange, planet: s.planet, intro: s.intro
        };
      }));

    /* ============ 星座档案 + 运势 ============ */
    case "sign": {
      const key = resolveParam(arg);
      if (!key) return fail(400, "无法识别「" + arg + "」，支持星座名或日期，如 aries / 白羊座 / 1994-8-18");
      let dateStr = fmtDate(new Date());
      if (q.date) {
        const d = parseDate(String(q.date));
        if (!d) return fail(400, "日期格式不正确：「" + q.date + "」，支持 2026-8-18 / 8-18");
        dateStr = fmtDate(d);
      }
      return ok({ sign: SIGNS[key], fortune: fortuneFor(key, dateStr) });
    }

    /* ============ 指定日期运势 ============ */
    case "fortune": {
      const key = resolveParam(arg);
      if (!key) return fail(400, "无法识别「" + arg + "」，支持星座名或日期");
      let dateStr = fmtDate(new Date());
      if (q.date) {
        const d = parseDate(String(q.date));
        if (!d) return fail(400, "日期格式不正确：「" + q.date + "」，支持 2026-8-18 / 8-18");
        dateStr = fmtDate(d);
      }
      return ok(fortuneFor(key, dateStr));
    }

    /* ============ 运势趋势 ============ */
    case "trend": {
      const key = resolveParam(arg);
      if (!key) return fail(400, "无法识别「" + arg + "」，支持星座名或日期");
      let days = parseInt(q.days, 10);
      if (!days || days < 2) days = 7;
      if (days > 365) days = 365;
      return ok(trendFor(key, days));
    }

    /* ============ 配对测试 ============ */
    case "pair": {
      const aKey = resolveParam(q.A);
      const bKey = resolveParam(q.B);
      if (!aKey || !bKey) {
        return fail(400, "无法识别星座 A 或 B，支持星座名或日期，如 /api/pair?A=白羊&B=天秤");
      }
      return ok(computePair(aKey, bKey));
    }

    /* ============ 任意输入 → 星座 key ============ */
    case "resolve": {
      const s = String(q.q == null ? "" : q.q).trim();
      if (!s) return fail(400, "缺少参数 q，用法：/api/resolve?q=白羊座");
      const key = resolveKey(s);
      if (!key) return fail(400, "无法识别「" + s + "」");
      return ok({ key, name: SIGNS[key].name });
    }

    default:
      return fail(404, "接口不存在：/api" + path);
  }
};
