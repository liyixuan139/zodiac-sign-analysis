/* =====================================================================
   星语 · WebMCP 工具注册
   =====================================================================
   WebMCP (Web Model Context Protocol) 让 AI 助手能直接调用网站暴露的工具，
   而不是像人类一样靠点击、输入去猜页面。本文件通过浏览器 API
   document.modelContext.registerTool() 注册 7 个工具：

   只读分析：
     list_zodiac_signs   列出全部 12 星座（供 AI 先确认星座写法）
     analyze_birthday    生日 → 星座全维度档案 + 今日运势
     daily_fortune       星座 + 日期 → 当日运势
     pair_compatibility  两个星座 → 缘分指数与相处建议
   有状态动作（读写浏览器本地存储，让 AI 真正"操作"网站）：
     set_birthday        保存用户生日，生日当天自动提醒 + 庆祝（若当天即生日则直接触发）
     get_birthday        读取已保存的生日
     clear_birthday      删除已保存的生日

   兼容环境：
     - ChatGPT 桌面版内置浏览器（原生支持）
     - Chrome 149+（Origin Trial，或 chrome://flags/#enable-webmcp-testing）
   普通浏览器：document.modelContext 不存在，本文件静默跳过，不影响任何功能。
   ===================================================================== */
(function () {
  "use strict";

  const D = window.SIGNS_DATA;
  if (!D) return;

  const mc = document.modelContext || navigator.modelContext;
  const supported = !!mc && typeof mc.registerTool === "function";

  // 暴露状态，供页面徽章 / 控制台使用
  window.__WEBMCP_SUPPORTED = supported;
  window.__WEBMCP_TOOLS = [];

  const badge = document.getElementById("webmcpBadge");
  if (badge) badge.hidden = !supported;

  // 工具定义不依赖 WebMCP 环境，始终构建 ——
  // AI 在支持的环境里注册并调用；普通浏览器则由 webmcp-demo.js 做「手动试玩」。
  // 两边复用同一批 execute，保证 AI 调用与页面试玩结果完全一致。
  const { SIGNS, getSignKey, fortuneFor, computePair, resolveSign, parseDate, fmtDate, DIM_KEYS } = D;

  const pad2 = n => String(n).padStart(2, "0");
  const todayStr = () => {
    const n = new Date();
    return n.getFullYear() + "-" + pad2(n.getMonth() + 1) + "-" + pad2(n.getDate());
  };

  const signSummary = k => ({
    key: k, name: SIGNS[k].name, en: SIGNS[k].en, symbol: SIGNS[k].symbol,
    element: SIGNS[k].element, elName: SIGNS[k].elName,
    dateRange: SIGNS[k].dateRange, planet: SIGNS[k].planet
  });

  const badSign = input => ({
    error: "无法识别星座「" + input + "」。支持 key（aries / leo）、中文名（白羊座 / 白羊）、英文（Aries）、符号（♈）。可先调用 list_zodiac_signs 查看全部星座的写法。"
  });

  // 生日相关：读写 app.js 暴露的 window.__ZODIAC_BD__（浏览器本地存储）
  const BD = () => window.__ZODIAC_BD__;

  // 校验真实存在的 YYYY-MM-DD 日期，返回归一化对象；不合法返回 null
  function validDate(s) {
    const m = String(s).trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (y < 1900 || y > 2100) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return { y, m: mo, d, str: y + "-" + pad2(mo) + "-" + pad2(d) };
  }

  const tools = [
    {
      name: "list_zodiac_signs",
      description: "列出本站支持的全部 12 个星座：英文 key、中文名、英文名、符号、元素、日期区间与守护星。供 AI 在调用其他星座相关工具前确认星座写法。",
      inputSchema: { type: "object", properties: {}, required: [] },
      annotations: { readOnlyHint: true },
      execute() {
        return { signs: Object.keys(SIGNS).map(signSummary) };
      }
    },
    {
      name: "analyze_birthday",
      description: "根据出生日期（YYYY-MM-DD）判断所属星座，并返回该星座的完整档案：性格、爱情、事业、健康、幸运信息、性格五维数据，以及当天的运势。",
      inputSchema: {
        type: "object",
        properties: {
          birthday: { type: "string", format: "date", description: "出生日期，格式 YYYY-MM-DD，例如 1996-08-15" }
        },
        required: ["birthday"]
      },
      annotations: { readOnlyHint: true },
      execute({ birthday }) {
        if (!birthday) return { error: "缺少 birthday 参数，格式 YYYY-MM-DD，例如 1996-08-15" };
        const m = String(birthday).trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (!m) return { error: "生日格式不正确：「" + birthday + "」，请用 YYYY-MM-DD，例如 1996-08-15" };
        const key = getSignKey(+m[2], +m[3]);
        const s = SIGNS[key];
        const date = todayStr();
        const f = fortuneFor(key, date);
        return {
          sign: signSummary(key),
          intro: s.intro,
          personality: s.personality,
          love: s.love,
          career: s.career,
          health: s.health,
          lucky: s.lucky,
          traits: s.traits,
          todayFortune: { date, score: f.score, lvl: f.lvl, color: f.color, text: f.text, hint: f.hint }
        };
      }
    },
    {
      name: "daily_fortune",
      description: "查询某个星座在指定日期（默认今天）的运势，返回综合指数（0-100）、运势等级、简短运势正文与幸运小贴士。",
      inputSchema: {
        type: "object",
        properties: {
          sign: { type: "string", description: "星座：key（aries / leo）、中文名（白羊座 / 白羊）、英文（Aries）或符号（♈）" },
          date: { type: "string", format: "date", description: "查询日期 YYYY-MM-DD，缺省为今天，例如 2026-08-26" }
        },
        required: ["sign"]
      },
      annotations: { readOnlyHint: true },
      execute({ sign, date }) {
        const key = resolveSign(sign);
        if (!key) return badSign(sign);
        let ds = date;
        if (!ds) {
          ds = todayStr();
        } else {
          const d = parseDate(String(ds));
          if (!d) return { error: "日期格式不正确：「" + ds + "」，请用 YYYY-MM-DD，例如 2026-08-26" };
          ds = fmtDate(d);
        }
        const f = fortuneFor(key, ds);
        return {
          sign: { key, name: SIGNS[key].name, symbol: SIGNS[key].symbol },
          date: ds,
          score: f.score, lvl: f.lvl, color: f.color, text: f.text, hint: f.hint
        };
      }
    },
    {
      name: "pair_compatibility",
      description: "测试两个星座的缘分与契合度，返回缘分指数（0-100）、元素关系、五维契合度评分与相处建议。",
      inputSchema: {
        type: "object",
        properties: {
          sign_a: { type: "string", description: "星座 A：key（aries / leo）、中文名（白羊座 / 白羊）、英文（Aries）或符号（♈）" },
          sign_b: { type: "string", description: "星座 B：key（leo / taurus）、中文名（狮子座）、英文（Leo）或符号（♌）" }
        },
        required: ["sign_a", "sign_b"]
      },
      annotations: { readOnlyHint: true },
      execute({ sign_a, sign_b }) {
        const aKey = resolveSign(sign_a);
        const bKey = resolveSign(sign_b);
        if (!aKey) return badSign(sign_a);
        if (!bKey) return badSign(sign_b);
        const r = computePair(aKey, bKey);
        return {
          A: { key: aKey, name: r.A.name, symbol: r.A.symbol, element: r.A.element },
          B: { key: bKey, name: r.B.name, symbol: r.B.symbol, element: r.B.element },
          overall: r.overall,
          rel: r.rel,
          dims: DIM_KEYS.map((k, i) => ({ dim: k, score: r.dims[i] })),
          verdict: { label: r.verdict.label, advice: r.verdict.advice, color: r.verdict.color }
        };
      }
    },

    /* ---- 生日管理（有状态动作）：让 AI 真正"操作"网站，而非只读查询 ---- */
    {
      name: "set_birthday",
      description: "把用户的生日保存到本站（浏览器本地存储）。保存后生日当天页面会自动推送提醒并弹出庆祝动画。返回确认信息、所属星座、距下一次生日的天数；若当天正是生日，还会直接触发庆祝效果。",
      inputSchema: {
        type: "object",
        properties: {
          birthday: { type: "string", format: "date", description: "出生日期，格式 YYYY-MM-DD，例如 1996-08-15" }
        },
        required: ["birthday"]
      },
      annotations: { readOnlyHint: false },
      execute({ birthday }) {
        if (!birthday) return { error: "缺少 birthday 参数，格式 YYYY-MM-DD，例如 1996-08-15" };
        const v = validDate(birthday);
        if (!v) return { error: "生日格式不正确：「" + birthday + "」。请用 YYYY-MM-DD 且为真实存在的日期，例如 1996-08-15" };
        const bd = BD();
        if (!bd) return { error: "当前环境不支持本地存储，无法保存生日" };
        bd.set(v.str);
        const key = getSignKey(v.m, v.d);
        const today = bd.isToday(v.str);
        if (today && typeof playCelebration === "function") { try { playCelebration(); } catch (e) {} }
        if (typeof renderBirthdayUI === "function") { try { renderBirthdayUI(); } catch (e) {} }
        return {
          ok: true,
          birthday: v.str,
          sign: signSummary(key),
          isBirthdayToday: today,
          daysToNextBirthday: bd.daysToNext(v.str),
          note: today
            ? "今天是你的生日！已触发庆祝动画与推送 🎉"
            : "生日已保存，到生日当天页面会自动提醒与庆祝。"
        };
      }
    },
    {
      name: "get_birthday",
      description: "读取本站已保存的用户生日（若有）。返回生日、所属星座与距下一次生日的天数；若尚未设置则提示可调用 set_birthday。",
      inputSchema: { type: "object", properties: {}, required: [] },
      annotations: { readOnlyHint: true },
      execute() {
        const bd = BD();
        if (!bd) return { error: "当前环境不支持本地存储" };
        const stored = bd.get();
        if (!stored) {
          return { birthday: null, set: false, hint: "尚未设置生日，可调用 set_birthday 保存。设置后生日当天会收到提醒与庆祝。" };
        }
        const v = validDate(stored);
        const key = v ? getSignKey(v.m, v.d) : null;
        return {
          birthday: stored,
          set: true,
          sign: key ? signSummary(key) : null,
          isBirthdayToday: bd.isToday(stored),
          daysToNextBirthday: bd.daysToNext(stored)
        };
      }
    },
    {
      name: "clear_birthday",
      description: "删除本站已保存的用户生日，关闭生日提醒与庆祝功能。返回删除确认。",
      inputSchema: { type: "object", properties: {}, required: [] },
      annotations: { readOnlyHint: false },
      execute() {
        const bd = BD();
        if (!bd) return { error: "当前环境不支持本地存储" };
        const had = bd.get();
        bd.clear();
        if (typeof renderBirthdayUI === "function") { try { renderBirthdayUI(); } catch (e) {} }
        return { ok: true, hadBirthday: !!had, removed: had || null, note: had ? "已删除生日提醒。" : "本来就没有设置生日，无需删除。" };
      }
    }
  ];

  /* 把工具清单与执行器挂到全局，供 webmcp-demo.js 的「手动试玩」面板使用 */
  window.__WEBMCP_TOOL_API__ = tools.map(t => ({
    name: t.name,
    description: t.description,
    readOnly: !!(t.annotations && t.annotations.readOnlyHint),
    execute: t.execute
  }));

  // 环境不支持 WebMCP：到此为止，不再尝试注册，页面其他功能不受影响
  if (!supported) return;

  (async function register() {
    for (const tool of tools) {
      try {
        await mc.registerTool(tool);
        window.__WEBMCP_TOOLS.push(tool.name);
        console.log("[WebMCP] 已注册工具：" + tool.name);
      } catch (e) {
        console.warn("[WebMCP] 注册失败：" + tool.name, e);
      }
    }
    if (badge) {
      badge.hidden = false;
      badge.title = "已注册工具：" + window.__WEBMCP_TOOLS.join("、");
    }
    document.dispatchEvent(new CustomEvent("webmcp:registered", { detail: { tools: window.__WEBMCP_TOOLS } }));
  })();
})();
