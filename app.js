/* =====================================================
   星语 · 星座分析 - 页面逻辑（浏览器版）
   星座数据与纯函数在 data.js（UMD：浏览器与 Node 共用）
   ===================================================== */
"use strict";

const D = window.SIGNS_DATA;
const { SIGNS, TRAITS, ELEMENT_ICON, DIM_KEYS, getSignKey, fortuneFor, computePair, trendFor } = D;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad2 = n => String(n).padStart(2, "0");

/* ============ 星空背景 ============ */
(function makeStars() {
  const box = document.getElementById("stars");
  for (let i = 0; i < 80; i++) {
    const s = document.createElement("span");
    s.className = "star";
    const size = (Math.random() * 2 + 0.6).toFixed(1);
    s.style.cssText =
      "width:" + size + "px;height:" + size + "px;" +
      "left:" + Math.random() * 100 + "%;top:" + Math.random() * 100 + "%;" +
      "--dur:" + (3 + Math.random() * 5).toFixed(1) + "s;" +
      "--delay:" + (Math.random() * 5).toFixed(1) + "s;";
    box.appendChild(s);
  }
})();

/* ============ 雷达图 ============ */
function drawRadar(traits) {
  const svg = document.getElementById("radar");
  svg.innerHTML = "";
  const NS = "http://www.w3.org/2000/svg";
  const W = 340, H = 320, cx = W / 2, cy = H / 2 - 6, R = 108;
  const pts = (level) => traits.map((_, i) => {
    const a = -90 + i * 60;
    const r = R * level;
    return [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  });

  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  [0.25, 0.5, 0.75, 1].forEach(lv => {
    const p = pts(lv);
    svg.appendChild(el("polygon", { points: p.map(q => q.join(",")).join(" "), fill: "none", stroke: "rgba(255,255,255,0.07)" }));
  });

  for (let i = 0; i < 6; i++) {
    const a = -90 + i * 60;
    svg.appendChild(el("line", {
      x1: cx, y1: cy, x2: cx + R * Math.cos(a * Math.PI / 180), y2: cy + R * Math.sin(a * Math.PI / 180),
      stroke: "rgba(255,255,255,0.08)"
    }));
    const lx = cx + (R + 20) * Math.cos(a * Math.PI / 180);
    const ly = cy + (R + 20) * Math.sin(a * Math.PI / 180);
    const t = el("text", { x: lx, y: ly, "text-anchor": "middle", "dominant-baseline": "middle", fill: "var(--text-2)", "font-size": 12.5 });
    t.textContent = TRAITS[i];
    svg.appendChild(t);
  }

  const dataPts = traits.map((v, i) => {
    const a = -90 + i * 60;
    const r = R * v / 100;
    return [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  });
  svg.appendChild(el("polygon", {
    points: dataPts.map(p => p.join(",")).join(" "),
    fill: "var(--accent-soft)", stroke: "var(--accent)",
    "stroke-width": 2, "stroke-linejoin": "round"
  }));

  const tooltip = document.getElementById("tooltip");
  dataPts.forEach((p, i) => {
    const c = el("circle", { cx: p[0], cy: p[1], r: 5.5, fill: "var(--accent)", stroke: "var(--bg)", "stroke-width": 2 });
    c.style.cursor = "pointer";
    c.addEventListener("mousemove", (e) => {
      tooltip.style.left = e.clientX + 14 + "px";
      tooltip.style.top = e.clientY - 10 + "px";
      tooltip.style.opacity = 1;
      tooltip.innerHTML = TRAITS[i] + " <b>" + traits[i] + "</b>/100";
    });
    c.addEventListener("mouseleave", () => { tooltip.style.opacity = 0; });
    svg.appendChild(c);
  });
}

/* ============ 运势趋势图 ============ */
let trendDays = 7;
let _curKey = null;

function drawTrend(key) {
  const svg = document.getElementById("trendChart");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const W = 640, H = 260, padL = 38, padR = 30, padT = 20, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const data = trendFor(key, trendDays);
  const min = 40, max = 100;
  const x = i => padL + (data.length === 1 ? plotW / 2 : i * plotW / (data.length - 1));
  const y = s => padT + (max - s) / (max - min) * plotH;
  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  svg.innerHTML = "";

  // 横向网格线 + Y 轴刻度
  [50, 70, 90].forEach(v => {
    svg.appendChild(el("line", { x1: padL, y1: y(v), x2: W - padR, y2: y(v), stroke: "rgba(255,255,255,0.07)" }));
    const t = el("text", { x: padL - 8, y: y(v) + 3.5, "text-anchor": "end", fill: "var(--text-3)", "font-size": 10.5 });
    t.textContent = v;
    svg.appendChild(t);
  });
  const g0 = el("text", { x: padL - 8, y: y(40) + 3.5, "text-anchor": "end", fill: "var(--text-3)", "font-size": 10.5 });
  g0.textContent = 40;
  svg.appendChild(g0);

  // X 轴底部分隔线
  svg.appendChild(el("line", { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: "rgba(255,255,255,0.12)" }));

  // 面积
  const areaPath = "M" + x(0) + "," + (H - padB) + data.map((p, i) => "L" + x(i) + "," + y(p.score)).join("") + "L" + x(data.length - 1) + "," + (H - padB) + "Z";
  svg.appendChild(el("path", { d: areaPath, fill: "var(--accent-soft)" }));

  // 折线
  const linePath = data.map((p, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(p.score)).join("");
  svg.appendChild(el("path", { d: linePath, fill: "none", stroke: "var(--accent)", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));

  // 数据点
  const dotR = trendDays <= 7 ? 5 : 0;
  const dots = [];
  data.forEach((p, i) => {
    const c = el("circle", { cx: x(i), cy: y(p.score), r: dotR, fill: "var(--accent)", stroke: "var(--bg)", "stroke-width": 2 });
    svg.appendChild(c);
    dots.push(c);
  });
  // 每个点的数值标注（7 天全标；30 天隔 5 个标一次，今天必标）
  const labelEvery = trendDays <= 7 ? 1 : 5;
  data.forEach((p, i) => {
    if (i % labelEvery !== 0 && i !== data.length - 1) return;
    const t = el("text", {
      x: x(i), y: Math.max(y(p.score) - 9, padT + 9),
      "text-anchor": "middle", fill: "var(--text-2)", "font-size": 11, "font-weight": 600
    });
    t.textContent = p.score;
    svg.appendChild(t);
  });

  // 今天的标记：更大的圆点 + 「今天」标签（位于数字上方）
  const lastPt = data[data.length - 1];
  const lastDot = dots[dots.length - 1];
  lastDot.setAttribute("r", dotR + 2.5);
  const todayTag = el("text", {
    x: x(data.length - 1), y: Math.max(y(lastPt.score) - 26, padT + 26),
    "text-anchor": "middle", fill: "var(--accent)", "font-size": 10.5, "font-weight": 700
  });
  todayTag.textContent = "今天";
  svg.appendChild(todayTag);

  // X 轴日期标签
  data.forEach((p, i) => {
    if (i % labelEvery !== 0 && i !== data.length - 1) return;
    const t = el("text", { x: x(i), y: H - padB + 17, "text-anchor": "middle", fill: "var(--text-3)", "font-size": 10.5 });
    t.textContent = p.md;
    svg.appendChild(t);
    const t2 = el("text", { x: x(i), y: H - padB + 17, "text-anchor": "middle", fill: "var(--text-3)", "font-size": 10.5, opacity: 0 });
    t2.textContent = p.wd;
    svg.appendChild(t2);
  });

  // 交互层：十字准星 + 提示
  const crosshair = el("line", { x1: 0, y1: padT, x2: 0, y2: padT + plotH, stroke: "rgba(255,255,255,0.28)", "stroke-dasharray": "3 3", opacity: 0 });
  svg.appendChild(crosshair);
  const tooltip = document.getElementById("tooltip");
  const overlay = el("rect", { x: padL, y: padT, width: plotW, height: plotH, fill: "transparent" });
  overlay.style.cursor = "crosshair";
  overlay.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width * W;
    const idx = clamp(Math.round((sx - padL) / (plotW / (data.length - 1))), 0, data.length - 1);
    crosshair.setAttribute("x1", x(idx));
    crosshair.setAttribute("x2", x(idx));
    crosshair.setAttribute("opacity", 1);
    dots.forEach((d, i) => d.setAttribute("r", i === idx ? 6.5 : dotR));
    tooltip.style.left = e.clientX + 14 + "px";
    tooltip.style.top = e.clientY - 10 + "px";
    tooltip.style.opacity = 1;
    tooltip.innerHTML = data[idx].wd + " " + data[idx].md + "<br>运势 <b>" + data[idx].score + "</b>/100";
  });
  overlay.addEventListener("mouseleave", () => {
    crosshair.setAttribute("opacity", 0);
    dots.forEach(d => d.setAttribute("r", dotR));
    tooltip.style.opacity = 0;
  });
  svg.appendChild(overlay);
}

function setTrendDays(n) {
  trendDays = n;
  document.querySelectorAll(".range-btn").forEach(b => b.classList.toggle("active", +b.dataset.days === n));
  if (_curKey) drawTrend(_curKey);
}

/* ============ 配对测试 ============ */
function renderPair() {
  const aKey = document.getElementById("pairA").value;
  const bKey = document.getElementById("pairB").value;
  const r = computePair(aKey, bKey);
  const res = document.getElementById("pairResult");
  res.dataset.element = r.A.element;
  res.classList.add("show");
  res.scrollIntoView({ behavior: "smooth", block: "start" });

  document.getElementById("pairNames").innerHTML =
    '<span>' + r.A.symbol + ' ' + r.A.name + '</span><span class="vsx">❤</span><span>' + r.B.symbol + ' ' + r.B.name + '</span>';
  document.getElementById("pairEl").textContent =
    ELEMENT_ICON[r.A.element] + " " + r.A.elName + " × " + r.B.elName + " " + ELEMENT_ICON[r.B.element] + "　·　" + r.rel;
  const vd = document.getElementById("pairVerdict");
  vd.textContent = r.verdict.label + " · " + r.overall + "分";
  vd.style.color = r.verdict.color;
  vd.style.background = r.verdict.color + "22";
  document.getElementById("pairAdvice").textContent = r.verdict.advice;

  // 维度条
  document.getElementById("pairDimList").innerHTML = DIM_KEYS.map((k, i) => `
    <div class="dim-row">
      <div class="dim-label"><span>${k}</span><b>${r.dims[i]}</b></div>
      <div class="meter"><div class="meter-fill" data-score="${r.dims[i]}" style="background:linear-gradient(90deg,var(--accent),color-mix(in srgb, var(--accent) 55%, #fff))"></div></div>
    </div>`).join("");

  // 圆环动画
  const C = 389.6;
  requestAnimationFrame(() => {
    document.getElementById("ringBar").style.strokeDashoffset = C * (1 - r.overall / 100);
    const num = document.getElementById("ringNum");
    let cur = 0;
    const step = () => {
      cur += 2;
      num.textContent = Math.min(cur, r.overall);
      if (cur < r.overall) requestAnimationFrame(step);
    };
    step();
    document.querySelectorAll("#pairDimList .meter-fill").forEach(f => {
      f.style.width = f.dataset.score + "%";
    });
  });
}
function swapPair() {
  const a = document.getElementById("pairA"), b = document.getElementById("pairB");
  const t = a.value; a.value = b.value; b.value = t;
  renderPair();
}

/* ============ 生日提醒 ============ */
const BD_KEY = "zodiac_birthday_v1";
function getStoredBirthday() { try { return localStorage.getItem(BD_KEY); } catch (e) { return null; } }
function storeBirthday(v) { try { localStorage.setItem(BD_KEY, v); } catch (e) {} }
function clearBirthday() { try { localStorage.removeItem(BD_KEY); } catch (e) {} }

function isTodayBirthday(bdStr) {
  const [y, m, d] = bdStr.split("-").map(Number);
  const now = new Date();
  return now.getMonth() + 1 === m && now.getDate() === d;
}
function daysToNextBirthday(bdStr) {
  const [y, m, d] = bdStr.split("-").map(Number);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), m - 1, d);
  if (target < startOfToday) target = new Date(now.getFullYear() + 1, m - 1, d);
  // 闰年兜底：2月29日目标年份若非闰年，落到2月28日
  if (target.getMonth() !== m - 1) target = new Date(target.getFullYear(), m - 1, m === 2 ? 28 : 1);
  return Math.round((target - startOfToday) / 86400000);
}

function renderBirthdayUI() {
  const stored = getStoredBirthday();
  const status = document.getElementById("bdStatus");
  const setup = document.getElementById("bdSetup");
  if (!stored) {
    setup.style.display = "flex";
    status.hidden = true;
    return;
  }
  setup.style.display = "none";
  status.hidden = false;
  const today = isTodayBirthday(stored);
  status.innerHTML = `
    <div class="row"><span class="k">📆 已设置生日</span><span class="v">${stored}</span></div>
    <div class="row"><span class="k">🎉 今天</span>
      <span class="v ${today ? "is-today" : ""}">${today ? "是生日！庆祝中 ✨" : "不是生日"}</span></div>
    <div class="row"><span class="k">⏳ 距下一次生日</span><span class="v">${daysToNextBirthday(stored)} 天</span></div>
    <div class="row"><span class="k">🖥 系统通知</span><span class="v">${('Notification' in window && Notification.permission === 'granted') ? "已开启 ✅" : "未开启"}</span></div>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
      <button class="ghost-btn" onclick="playCelebration()">🎉 试玩庆祝效果</button>
      <button class="ghost-btn" onclick="editBirthday()">✏️ 修改日期</button>
      <button class="ghost-btn danger" onclick="removeBirthday()">🗑 关闭提醒</button>
    </div>
  `;
}
function editBirthday() {
  document.getElementById("bdSetup").style.display = "flex";
  document.getElementById("bdStatus").hidden = true;
}
function saveBirthdayUI() {
  const v = document.getElementById("bdInput").value;
  if (!v) return;
  storeBirthday(v);
  renderBirthdayUI();
  checkBirthday();
}
function removeBirthday() {
  clearBirthday();
  renderBirthdayUI();
}

/* 庆祝：彩带 + 横幅 + 系统通知 */
function playCelebration() {
  const banner = document.getElementById("bdBanner");
  banner.hidden = false;
  banner.animate([{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "none" }], { duration: 450 });

  const box = document.getElementById("confetti");
  const colors = ["#ff8a5c", "#f4d35e", "#66bb6a", "#6db7f0", "#f48fb1", "#ce93d8", "#ffffff"];
  for (let i = 0; i < 130; i++) {
    const p = document.createElement("span");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = (2.2 + Math.random() * 2.6).toFixed(2) + "s";
    p.style.animationDelay = (Math.random() * 1.2).toFixed(2) + "s";
    p.style.transform = "rotate(" + Math.random() * 360 + "deg)";
    box.appendChild(p);
    setTimeout(() => p.remove(), 6500);
  }

  try {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("🎂 生日快乐！", { body: "今天是你的生日，愿所有好运都奔向你～" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
          if (p === "granted") new Notification("🎂 生日快乐！", { body: "愿所有好运都奔向你～" });
        });
      }
    }
  } catch (e) { /* file:// 下通知可能受限，忽略 */ }
}

function checkBirthday() {
  const stored = getStoredBirthday();
  if (stored && isTodayBirthday(stored)) {
    playCelebration();
    // 每 3 小时再检查一次（页面长时间开着也有效）
    setTimeout(checkBirthday, 3 * 3600 * 1000);
  }
}

/* ============ 主分析流程 ============ */
function analyze() {
  const input = document.getElementById("birthday");
  if (!input.value) { input.focus(); return; }
  const [y, m, d] = input.value.split("-").map(Number);
  const key = getSignKey(m, d);
  _curKey = key;
  render(key);
  document.getElementById("result").classList.add("show");
  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
}

function render(key) {
  const s = SIGNS[key];
  const result = document.getElementById("result");
  result.dataset.element = s.element;

  document.getElementById("hero").dataset.symbol = s.symbol;
  document.getElementById("hero").innerHTML = `
    <div class="symbol">${s.symbol}</div>
    <h2>${s.name}</h2>
    <div class="en">${s.en}</div>
    <div class="meta-row">
      <span class="chip"><span class="dot"></span><b>${ELEMENT_ICON[s.element]} ${s.elName}</b></span>
      <span class="chip">🗓 <b>${s.dateRange}</b></span>
      <span class="chip">🪐 守护星 <b>${s.planet}</b></span>
    </div>
    <p class="sign-intro">${s.intro}</p>
  `;

  drawRadar(s.traits);
  drawTrend(key);

  const now = new Date();
  const todayStr = now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate());
  const f = fortuneFor(key, todayStr);
  document.getElementById("fortuneCard").innerHTML = `
    <div class="card-title">今日运势<span class="fortune-date">${now.getMonth() + 1}/${now.getDate()}</span></div>
    <div class="meter-label"><span>综合指数</span><span class="lvl-chip" style="color:${f.color};background:${f.color}22">${f.lvl}</span></div>
    <div class="meter"><div class="meter-fill" style="background:linear-gradient(90deg,${f.color},${f.color}88)" data-score="${f.score}"></div></div>
    <p class="fortune-text"><span class="q">“</span>${f.text}</p>
    <p class="fortune-text" style="margin-top:6px;color:var(--text-3);font-size:13px;">💡 小贴士：${f.hint}</p>
  `;

  document.getElementById("personalityCard").innerHTML = `
    <div class="card-title">性格特点</div><p>${s.personality}</p>
  `;
  document.getElementById("loveCard").innerHTML = `
    <div class="card-title">💕 爱情运势</div><p>${s.love}</p>
  `;
  document.getElementById("careerCard").innerHTML = `
    <div class="card-title">💼 事业运</div><p>${s.career}</p>
  `;
  document.getElementById("healthCard").innerHTML = `
    <div class="card-title">🌿 健康提示</div><p>${s.health}</p>
  `;

  const l = s.lucky;
  document.getElementById("luckyCard").innerHTML = `
    <div class="card-title">🍀 幸运信息</div>
    <div class="lucky-list">
      <div class="lucky-item"><div class="lucky-icon">🔢</div><div><div class="t">幸运数字</div><div class="v">${l.num}</div></div></div>
      <div class="lucky-item"><div class="lucky-icon">🎨</div><div><div class="t">幸运颜色</div><div class="v"><span class="swatch" style="background:${l.colorHex}"></span>${l.color}</div></div></div>
      <div class="lucky-item"><div class="lucky-icon">📅</div><div><div class="t">幸运日期</div><div class="v">${l.date}</div></div></div>
      <div class="lucky-item"><div class="lucky-icon">🌸</div><div><div class="t">幸运花</div><div class="v">${l.flower}</div></div></div>
    </div>
  `;

  document.getElementById("matchCard").innerHTML = `
    <div class="card-title">💞 最佳配对</div>
    <div class="match-chips">
      ${s.match.map(n => {
        const mk = Object.keys(SIGNS).find(k => SIGNS[k].name === n);
        return `<span class="match-chip" onclick="showMatch('${mk}')"><span class="m-sym">${SIGNS[mk].symbol}</span>${n}</span>`;
      }).join("")}
    </div>
  `;

  requestAnimationFrame(() => {
    document.querySelectorAll(".meter-fill").forEach(fill => {
      fill.style.width = fill.dataset.score + "%";
    });
  });

  document.querySelectorAll(".sign-mini").forEach(el => {
    el.style.borderColor = el.dataset.key === key ? "var(--accent)" : "var(--card-border)";
  });
}

function showMatch(key) {
  const input = document.getElementById("birthday");
  const sample = { aries: [4, 1], taurus: [5, 1], gemini: [6, 1], cancer: [7, 1],
    leo: [8, 1], virgo: [9, 1], libra: [10, 1], scorpio: [11, 1],
    sagittarius: [12, 1], capricorn: [1, 1], aquarius: [2, 1], pisces: [3, 1] }[key];
  const now = new Date();
  input.value = now.getFullYear() + "-" + pad2(sample[0]) + "-" + pad2(sample[1]);
  analyze();
}

/* ============ 十二星座速览 ============ */
(function buildGrid() {
  const grid = document.getElementById("signGrid");
  Object.keys(SIGNS).forEach(k => {
    const s = SIGNS[k];
    const d = document.createElement("div");
    d.className = "sign-mini";
    d.dataset.key = k;
    d.innerHTML = `<div class="sym">${s.symbol}</div><div class="nm">${s.name}</div><div class="en2">${s.en}</div>`;
    d.addEventListener("click", () => showMatch(k));
    grid.appendChild(d);
  });
})();

/* ============ 配对下拉框 ============ */
(function buildPairSelects() {
  const opts = Object.keys(SIGNS).map(k => `<option value="${k}">${SIGNS[k].symbol} ${SIGNS[k].name}</option>`).join("");
  document.getElementById("pairA").innerHTML = opts;
  document.getElementById("pairB").innerHTML = opts;
  document.getElementById("pairA").addEventListener("change", renderPair);
  document.getElementById("pairB").addEventListener("change", renderPair);
})();

/* ============ 标签页切换 ============ */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-page").forEach(p => p.classList.toggle("active", p.id === "tab-" + btn.dataset.tab));
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* ============ 初始化 ============ */
(function init() {
  const now = new Date();
  document.getElementById("birthday").value =
    now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate());
  document.getElementById("bdInput").value =
    "1990-01-01";
  document.getElementById("birthday").addEventListener("keydown", (e) => {
    if (e.key === "Enter") analyze();
  });
  renderBirthdayUI();
  analyze();
  checkBirthday();
})();
