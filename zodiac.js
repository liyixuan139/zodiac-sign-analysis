#!/usr/bin/env node
/* =====================================================
   星语 · 星座分析 - 命令行版
   数据与纯函数与网页版共用 data.js（同一份数据源）
   用法：
     node zodiac.js                   查看默认星座(今天) + 今日运势
     node zodiac.js <日期|星座>        查看指定星座/生日完整档案
     node zodiac.js list              列出十二星座
     node zodiac.js pair <A> <B>      星座配对测试
     node zodiac.js trend <日期|星座>  近 7 天运势趋势
   日期支持：2026-8-18 / 2026/8/18 / 8-18 / 8/18 / now
   星座支持：白羊座 / 白羊 / aries / Aries / ♈
   ===================================================== */
"use strict";

const {
  SIGNS, TRAITS, ELEMENT_ICON, FORTUNES, FORTUNE_HINT,
  ELEMENT_PAIR, DIM_KEYS, VERDICTS,
  getSignKey, fortuneFor, trendFor, elementRel, computePair, hashStr,
  parseDate, resolveSign, resolveKey, fmtDate
} = require("./data.js");

/* ============ ANSI 颜色（非 TTY 时自动关闭） ============ */
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor ? "\x1b[" + code + "m" + s + "\x1b[0m" : s);
const C = {
  bold: s => c(1, s), dim: s => c(2, s),
  red: s => c(31, s), green: s => c(32, s), yellow: s => c(33, s),
  blue: s => c(34, s), magenta: s => c(35, s), cyan: s => c(36, s)
};
const EL_COLOR = { fire: C.red, earth: C.green, air: C.yellow, water: C.blue };

function bar(score, width) {
  width = width || 20;
  const filled = Math.round(score / 100 * width);
  const block = useColor ? "█" : "#";
  const dot = useColor ? "░" : "·";
  return block.repeat(filled) + dot.repeat(Math.max(0, width - filled));
}
const pad = (s, n) => String(s).padEnd(n);

function fmtMD(d) {
  return (d.getMonth() + 1) + "/" + d.getDate();
}

/* ============ 输出 ============ */
function printProfile(key, dateStr) {
  const s = SIGNS[key];
  const ec = EL_COLOR[s.element];
  const f = fortuneFor(key, dateStr);
  const fColor = { "超级幸运日": C.yellow, "运势不错": C.green, "平稳顺遂": C.blue, "稍加留意": C.red, "韬光养晦": C.red }[f.lvl] || C.dim;

  console.log("");
  console.log("  " + ec(s.symbol + " " + s.name) + "  " + C.dim("(" + s.en + ")"));
  console.log("  " + ec(ELEMENT_ICON[s.element] + " " + s.elName) +
    C.dim("  ·  🪐 守护星 " + s.planet) +
    C.dim("  ·  📅 " + s.dateRange));
  console.log("  " + C.dim(s.intro));
  console.log("");

  console.log("  " + C.bold("今日运势") + "  " + C.dim(dateStr));
  console.log("  " + bar(f.score) + "  " + C.bold(String(f.score)) + "/100  " + fColor(f.lvl));
  console.log("  " + f.text);
  console.log("  " + C.dim("💡 " + f.hint));

  const sec = (t, body) => { console.log(""); console.log("  " + C.bold(t)); console.log("  " + body); };
  sec("📝 性格特点", s.personality);
  sec("💕 爱情运势", s.love);
  sec("💼 事业运", s.career);
  sec("🌿 健康提示", s.health);

  console.log("");
  console.log("  " + C.bold("🍀 幸运信息"));
  console.log("  数字 " + s.lucky.num + C.dim("  ·  ") + "颜色 " +
    s.lucky.color + C.dim("（") + s.lucky.colorHex + C.dim("）") + C.dim("  ·  ") + "日期 " + s.lucky.date +
    C.dim("  ·  ") + "花 " + s.lucky.flower);

  console.log("");
  console.log("  " + C.bold("💞 最佳配对"));
  const mates = s.match.map(n => {
    const mk = Object.keys(SIGNS).find(k => SIGNS[k].name === n);
    return EL_COLOR[SIGNS[mk].element](SIGNS[mk].symbol + " " + n);
  });
  console.log("  " + mates.join("   "));
  console.log("");
}

function printList() {
  console.log("");
  console.log("  " + C.bold("✨ 十二星座速览"));
  console.log("");
  Object.keys(SIGNS).forEach(k => {
    const s = SIGNS[k];
    const ec = EL_COLOR[s.element];
    console.log("  " + ec(s.symbol) + " " + pad(s.name, 5) + " " + C.dim(pad(s.en, 12)) +
      C.dim(s.dateRange) + "  " + ec(ELEMENT_ICON[s.element] + " " + s.elName));
  });
  console.log("");
}

function printPair(aKey, bKey) {
  const r = computePair(aKey, bKey);
  const ecA = EL_COLOR[r.A.element], ecB = EL_COLOR[r.B.element];
  console.log("");
  console.log("  " + ecA(r.A.symbol + " " + r.A.name) + "  " + C.dim("×") + "  " + ecB(r.B.symbol + " " + r.B.name));
  console.log("  " + C.dim(r.A.elName + " · " + r.B.elName + "  ·  ") + r.rel);
  console.log("");
  console.log("  " + C.bold("缘分指数") + "  " + bar(r.overall) + "  " + C.bold(String(r.overall)) + "/100");
  console.log("  " + (r.overall >= 80 ? C.green(r.verdict.label) : C.yellow(r.verdict.label)) + "  ·  " + C.dim(r.verdict.advice));
  console.log("");
  console.log("  " + C.bold("五维契合度"));
  DIM_KEYS.forEach((k, i) => {
    console.log("  " + pad(k, 6) + bar(r.dims[i], 16) + "  " + C.bold(String(r.dims[i])));
  });
  console.log("");
}

function printTrend(key) {
  const s = SIGNS[key];
  const data = trendFor(key, 7);
  const todayDs = fmtDate(new Date());
  console.log("");
  console.log("  " + C.bold("📈 " + s.name + " 近 7 天运势") + "  " + C.dim("（截至 " + todayDs + "）"));
  console.log("");
  data.forEach(p => {
    const isToday = p.ds === todayDs;
    const prefix = isToday ? "→" : " ";
    const dayStr = C.dim(p.md) + " " + C.dim(p.wd);
    console.log("  " + prefix + " " + pad(dayStr, 14) + bar(p.score) +
      "  " + (isToday ? C.bold(C.yellow(String(p.score))) : String(p.score)));
  });
  console.log("");
}

function usage() {
  console.log("");
  console.log("  " + C.bold("🌌 星语 · 星座分析 CLI"));
  console.log("");
  console.log("  用法：");
  console.log("    node zodiac.js                     今天星座档案 + 今日运势");
  console.log("    node zodiac.js <日期|星座>         指定日期/星座的完整档案");
  console.log("    node zodiac.js list                列出十二星座");
  console.log("    node zodiac.js pair <A> <B>        星座配对测试");
  console.log("    node zodiac.js trend <日期|星座>   近 7 天运势趋势");
  console.log("");
  console.log("  日期：2026-8-18 / 2026/8/18 / 8-18 / 8/18 / now");
  console.log("  星座：白羊座 / 白羊 / aries / Aries / ♈");
  console.log("");
}

/* ============ 主入口 ============ */
(function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") return usage();

  if (cmd === "list") return printList();

  if (cmd === "pair") {
    const aKey = resolveKey(args[1]);
    const bKey = resolveKey(args[2]);
    if (!aKey || !bKey) {
      console.error(C.red("✗ 无法识别参数，请使用星座名或日期。"));
      return usage();
    }
    return printPair(aKey, bKey);
  }

  if (cmd === "trend") {
    const key = resolveKey(args[1]);
    if (!key) {
      console.error(C.red("✗ 无法识别参数，请使用星座名或日期。"));
      return usage();
    }
    return printTrend(key);
  }

  const key = resolveKey(cmd);
  if (!key) {
    console.error(C.red("✗ 无法识别「" + cmd + "」，请使用星座名或日期。"));
    return usage();
  }

  const d = parseDate(cmd);
  const dateStr = d ? fmtDate(d) : fmtDate(new Date());
  printProfile(key, dateStr);
})();
