/* =====================================================================
   星语 · WebMCP 手动试玩面板
   =====================================================================
   网页右侧/底部「🤖 WebMCP」tab 的内容构建脚本。

   思路：webmcp.js 会把 7 个工具的执行器挂到 window.__WEBMCP_TOOL_API__
   （无论浏览器是否支持 WebMCP）。本文件按这份清单渲染出「工具卡」，
   访客填好参数点「试玩」，调用的是和 AI（ChatGPT / Chrome）完全相同的那份
   execute —— 所以手动点出来的结果，就是 AI 调用时返回的数据。
   ===================================================================== */
(function () {
  "use strict";

  const D = window.SIGNS_DATA;
  const api = window.__WEBMCP_TOOL_API__;
  const box = document.getElementById("wmcpTools");
  if (!D || !api || !box) return;

  const { SIGNS, TRAITS, ELEMENT_ICON, getSignKey } = D;

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad2 = n => String(n).padStart(2, "0");
  const todayStr = () => {
    const n = new Date();
    return n.getFullYear() + "-" + pad2(n.getMonth() + 1) + "-" + pad2(n.getDate());
  };
  const signOpts = Object.keys(SIGNS)
    .map(k => `<option value="${k}">${SIGNS[k].symbol} ${SIGNS[k].name}</option>`).join("");

  /* ---------- 每个工具的展示元信息 ---------- */
  const META = {
    list_zodiac_signs: { icon: "🪐", tag: "只读", hint: "无需填参数 —— AI 通常会先调用它，确认星座的写法再动手。" },
    analyze_birthday: { icon: "🎂", tag: "只读", hint: "输入生日，得到星座完整档案 + 今日运势。" },
    daily_fortune: { icon: "🔮", tag: "只读", hint: "星座 + 日期（日期可留空 = 今天），返回当日运势。" },
    pair_compatibility: { icon: "💞", tag: "只读", hint: "两个星座 → 缘分指数、五维契合与相处建议。" },
    set_birthday: { icon: "💾", tag: "动作", hint: "保存后真实写入浏览器 —— 生日当天页面会自动弹庆祝（🎂 生日提醒 tab 同步更新）。" },
    get_birthday: { icon: "🔍", tag: "只读", hint: "读取本站已保存的生日（若有）。" },
    clear_birthday: { icon: "🗑️", tag: "动作", hint: "删除已保存的生日，关闭提醒与庆祝。" }
  };
  const R_NAMES = ["list_zodiac_signs", "analyze_birthday", "daily_fortune", "pair_compatibility"];
  const B_NAMES = ["set_birthday", "get_birthday", "clear_birthday"];

  /* ---------- 表单控件 ---------- */
  const today = todayStr();

  function fieldsFor(name) {
    switch (name) {
      case "analyze_birthday":
        return `<label class="wmcp-f">🎂 生日
          <input type="date" id="wmc_analyze_birthday" value="${today}"></label>`;
      case "daily_fortune":
        return `<label class="wmcp-f">🔮 星座 <select id="wmc_df_sign">${signOpts}</select></label>
          <label class="wmcp-f">📅 日期 <input type="date" id="wmc_df_date" value="${today}"></label>
          <span class="wmcp-hint">日期留空 = 今天</span>`;
      case "pair_compatibility":
        return `<label class="wmcp-f">💜 我 <select id="wmc_pa_a">${signOpts}</select></label>
          <span class="vs-badge" style="font-size:13px">×</span>
          <label class="wmcp-f">💙 对方 <select id="wmc_pa_b">${signOpts}</select></label>`;
      case "set_birthday":
        return `<label class="wmcp-f">🎂 生日
          <input type="date" id="wmc_set_birthday" value="${today}"></label>`;
      default:
        return ""; // list / get / clear 无参数
    }
  }

  function readParams(name) {
    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
    switch (name) {
      case "analyze_birthday": return { birthday: val("wmc_analyze_birthday") };
      case "daily_fortune": {
        const date = val("wmc_df_date");
        return date ? { sign: val("wmc_df_sign"), date } : { sign: val("wmc_df_sign") };
      }
      case "pair_compatibility":
        return { sign_a: val("wmc_pa_a"), sign_b: val("wmc_pa_b") };
      case "set_birthday": return { birthday: val("wmc_set_birthday") };
      default: return {};
    }
  }

  /* ---------- 结果渲染：把 AI 视角的返回值翻译成好看的样子 ---------- */
  const chip = (txt) => `<span class="chip"><b>${txt}</b></span>`;

  const wrow = (k, v, cls) =>
    `<div class="wmrow"><span class="k">${k}</span><span class="v ${cls || ""}">${v}</span></div>`;

  const miniCard = (title, text) =>
    `<div class="card section-card"><div class="card-title">${title}</div><p>${esc(text)}</p></div>`;

  // items: [{ label, value }]，value 为 0-100 分数（条宽由此驱动）
  const dimRows = items => items.map((it, i) =>
    `<div class="dim-row">
       <div class="dim-label"><span>${it.label}</span><b>${it.value}</b></div>
       <div class="meter"><div class="meter-fill" data-score="${it.value}"></div></div>
     </div>`).join("");

  // 通用「运势」结果块（daily_fortune 与 analyze_birthday 共用）
  function fortuneBlock(o, titleHtml) {
    return `<div class="wmcp-fort">
      ${titleHtml ? `<div class="wmcp-fort-h">${titleHtml}</div>` : ""}
      <div class="meter-label"><span>综合指数</span>
        <span class="lvl-chip" style="color:${o.color};background:${o.color}22">${o.lvl}</span></div>
      <div class="meter"><div class="meter-fill" data-score="${o.score}"
        style="background:linear-gradient(90deg,${o.color},${o.color}88)"></div></div>
      <p class="fortune-text"><span class="q">“</span>${esc(o.text)}</p>
      <p class="wmcp-hint">💡 小贴士：${esc(o.hint)}</p>
    </div>`;
  }

  function renderList(res) {
    return `<p class="wmcp-caption">本站共支持 ${res.signs.length} 个星座（AI 用它来确认写法）</p>
      <div class="sign-grid">${res.signs.map(s =>
        `<div class="sign-mini" data-element="${s.element}" style="cursor:default">
           <div class="sym">${s.symbol}</div><div class="nm">${s.name}</div>
           <div class="en2">${s.en}</div>
           <div class="en2" style="margin-top:5px;color:var(--text-2)">${ELEMENT_ICON[s.element] || ""} ${s.elName}</div>
           <div class="en2">🗓 ${s.dateRange}</div>
           <div class="en2">🪐 ${s.planet}</div>
         </div>`).join("")}
      </div>`;
  }

  function renderDaily(res) {
    const s = res.sign;
    return fortuneBlock(res, `${s.symbol} ${s.name}<span class="wmcp-date">${res.date}</span>`);
  }

  function renderAnalyze(res) {
    const s = res.sign;
    return `<div class="wmcp-ana" data-element="${s.element}">
      <div class="wmcp-hero">
        <div class="wmcp-hero-sym">${s.symbol}</div>
        <div class="wmcp-hero-mid">
          <div class="wmcp-hero-name">${s.name} <span class="en">${s.en}</span></div>
          <div class="meta-row">
            ${chip(`${ELEMENT_ICON[s.element]} ${s.elName}`)}
            ${chip(`🗓 ${s.dateRange}`)}
            ${chip(`🪐 ${s.planet}`)}
          </div>
          <p class="sign-intro">${esc(s.intro)}</p>
        </div>
      </div>

      ${fortuneBlock(res.todayFortune, `今日运势<span class="wmcp-date">${res.todayFortune.date}</span>`)}

      <div class="grid-3">
        ${miniCard("💕 爱情运势", res.love)}
        ${miniCard("💼 事业运", res.career)}
        ${miniCard("🌿 健康提示", res.health)}
      </div>

      ${miniCard("✨ 性格特点", res.personality)}

      <div class="fortune-row">
        <div class="card section-card">
          <div class="card-title">🍀 幸运信息</div>
          <div class="lucky-list">
            <div class="lucky-item"><div class="lucky-icon">🔢</div>
              <div><div class="t">幸运数字</div><div class="v">${res.lucky.num}</div></div></div>
            <div class="lucky-item"><div class="lucky-icon">🎨</div>
              <div><div class="t">幸运颜色</div>
                <div class="v"><span class="swatch" style="background:${res.lucky.colorHex}"></span>${res.lucky.color}</div></div></div>
            <div class="lucky-item"><div class="lucky-icon">📅</div>
              <div><div class="t">幸运日期</div><div class="v">${res.lucky.date}</div></div></div>
            <div class="lucky-item"><div class="lucky-icon">🌸</div>
              <div><div class="t">幸运花</div><div class="v">${res.lucky.flower}</div></div></div>
          </div>
        </div>
        <div class="card section-card">
          <div class="card-title">📊 性格五维</div>
          ${dimRows(TRAITS.map((t, i) => ({ label: t, value: res.traits[i] })))}
        </div>
      </div>
    </div>`;
  }

  function renderPair(res) {
    const v = res.verdict;
    return `<div class="wmcp-pair">
      <div class="pair-sum">
        <span>${res.A.symbol} ${res.A.name}</span><span class="vsx">❤</span><span>${res.B.symbol} ${res.B.name}</span>
      </div>
      <div class="pair-rel">${ELEMENT_ICON[res.A.element]} ${res.A.name}（${res.A.element === "fire" ? "火" : res.A.element === "earth" ? "土" : res.A.element === "air" ? "风" : "水"}象） ×
        ${ELEMENT_ICON[res.B.element]} ${res.B.name}（${res.B.element === "fire" ? "火" : res.B.element === "earth" ? "土" : res.B.element === "air" ? "风" : "水"}象） · ${res.rel}</div>
      <div class="overall-line">
        <span class="overall-num">${res.overall}<small> / 100</small></span>
        <span class="lvl-chip" style="color:${v.color};background:${v.color}22">${v.label}</span>
      </div>
      <div class="meter"><div class="meter-fill" data-score="${res.overall}"
        style="background:linear-gradient(90deg,${v.color},${v.color}88)"></div></div>
      <p class="pair-advice">${esc(v.advice)}</p>
      <p class="wmcp-caption" style="margin-top:16px">五维契合度</p>
      ${dimRows(res.dims.map(o => ({ label: o.dim, value: o.score })))}
    </div>`;
  }

  function renderBirthday(res) {
    let rows = "";
    if (res.birthday) rows += wrow("📆 已保存生日", res.birthday);
    if (res.sign) rows += wrow("♈ 所属星座", `${res.sign.symbol} ${res.sign.name}`);
    if (typeof res.isBirthdayToday === "boolean")
      rows += wrow("🎉 今天", res.isBirthdayToday ? "是生日！庆祝中 ✨" : "不是生日", res.isBirthdayToday ? "is-today" : "");
    if (typeof res.daysToNextBirthday === "number")
      rows += wrow("⏳ 距下一次生日", `${res.daysToNextBirthday} 天`);
    if (res.hadBirthday) rows += wrow("🗑 已删除", res.removed);

    let note = "";
    if (res.ok) note = `<div class="wmcp-note ok">✅ ${esc(res.note || "已执行")}</div>`;
    else if (res.hint) note = `<div class="wmcp-note warn">ⓘ ${esc(res.hint)}</div>`;
    return `<div class="wmcp-bd-card">${rows}${note}</div>`;
  }

  function renderResult(name, res) {
    if (res && typeof res === "object" && res.error)
      return `<div class="wmcp-note warn">⚠️ ${esc(res.error)}</div>`;
    switch (name) {
      case "list_zodiac_signs": return renderList(res);
      case "analyze_birthday": return renderAnalyze(res);
      case "daily_fortune": return renderDaily(res);
      case "pair_compatibility": return renderPair(res);
      case "set_birthday":
      case "get_birthday":
      case "clear_birthday": return renderBirthday(res);
      default:
        return `<pre class="wmcp-raw">${esc(JSON.stringify(res, null, 2))}</pre>`;
    }
  }

  /* ---------- 工具卡骨架 ---------- */
  function cardOf(t) {
    const m = META[t.name];
    const fields = fieldsFor(t.name);
    const roCls = m.tag === "动作" ? "action" : "ro";
    return `<div class="card wmcp-tool">
      <div class="wmcp-t-h">
        <span class="wmcp-t-icon">${m.icon}</span>
        <div class="wmcp-t-meta">
          <div class="wmcp-t-name"><code>${t.name}</code><span class="wmcp-tag ${roCls}">${m.tag}</span></div>
          <div class="wmcp-t-desc">${esc(t.description)}</div>
        </div>
      </div>
      <div class="wmcp-t-ctl">
        ${fields ? `<div class="wmcp-fields">${fields}</div>` : `<span class="wmcp-hint">${m.hint}</span>`}
        <button class="wmcp-run" type="button" data-run="${t.name}">▶ 试玩</button>
      </div>
      <div class="wmcp-out" id="wmcout-${t.name}">
        <p class="wmcp-placeholder">点击「▶ 试玩」—— 跑的是 <code>webmcp.js</code> 中 AI 使用的那一份代码。</p>
      </div>
    </div>`;
  }

  /* ---------- 组装页面 + 绑定事件 ---------- */
  function build() {
    const groups = [
      ["📊 分析查询（AI 只读调用）", R_NAMES],
      ["🎂 生日状态（AI 可直接读写网页真实状态）", B_NAMES]
    ];
    let html = "";
    for (const [title, names] of groups) {
      const cards = names.map(n => api.find(t => t.name === n)).filter(Boolean);
      if (!cards.length) continue;
      html += `<h4 class="wmcp-group-title">${title}</h4>`;
      html += cards.map(cardOf).join("");
    }
    box.innerHTML = html;

    // 默认值
    const now = new Date();
    const todayKey = getSignKey(now.getMonth() + 1, now.getDate());
    const setSel = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    setSel("wmc_df_sign", todayKey);
    setSel("wmc_pa_a", "leo");
    setSel("wmc_pa_b", "aquarius");

    box.querySelectorAll(".wmcp-run").forEach(btn => {
      btn.addEventListener("click", () => runTool(btn.dataset.run));
    });
  }

  function runTool(name) {
    const tool = api.find(t => t.name === name);
    const out = document.getElementById("wmcout-" + name);
    if (!tool || !out || typeof tool.execute !== "function") return;
    let res;
    // 标记这次是「人类手动试玩」：工具若带页面联动（如 pair 同步主面板），会同步但不跳 tab
    window.__WEBMCP_DEMO_RUN__ = true;
    try {
      res = tool.execute(readParams(name));
    } catch (e) {
      res = { error: "执行出错：" + (e && e.message ? e.message : e) };
    } finally {
      delete window.__WEBMCP_DEMO_RUN__;
    }
    out.innerHTML = renderResult(name, res);
    requestAnimationFrame(() => {
      out.querySelectorAll(".meter-fill").forEach(f => { f.style.width = f.dataset.score + "%"; });
    });
  }

  /* 环境提示（用 webmcp.js 写好的状态） */
  (function env() {
    const el = document.getElementById("wmcpEnv");
    if (!el) return;
    const on = !!window.__WEBMCP_SUPPORTED;
    el.innerHTML = on
      ? `<span class="wmcp-env-pill ok">✓ 当前浏览器已开启 WebMCP —— AI 可直接调用下面这 7 个工具</span>`
      : `<span class="wmcp-env-pill">ⓘ 当前浏览器未开启 WebMCP：这里供人类手动试玩；
          AI 调用需 <b>ChatGPT 桌面版</b> 或 <b>Chrome</b>（chrome://flags/#enable-webmcp-testing 开启 WebMCP 测试）</span>`;
  })();

  build();
})();
