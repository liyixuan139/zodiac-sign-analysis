/* =====================================================================
   星语 · 共享数据模块
   同一份数据 / 纯函数，浏览器 (window.SIGNS_DATA) 与 Node (require) 共用
   ===================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SIGNS_DATA = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad2 = n => String(n).padStart(2, "0");

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /* ---------------- 星座数据 ---------------- */
  const SIGNS = {
    aries: {
      name: "白羊座", en: "Aries", symbol: "♈", element: "fire",
      elName: "火象星座", dateRange: "3.21 – 4.19", planet: "火星",
      traits: [92, 55, 70, 40, 95, 48],
      intro: "热情似火、行动力爆棚的开拓者，天生的「先做了再说」。",
      personality: "热情似火，行动力爆棚，典型的「先做了再说」。直率坦荡，心里藏不住事，说话不过夜。有强烈的竞争心和领导欲，是天生的开拓者与冲锋者。缺点也很明显——容易冲动急躁，常常三分钟热度。",
      love: "喜欢直接而热烈的感情，追求过程充满激情，主动出击绝不拖泥带水。恋爱中的白羊像一颗小太阳，给足对方能量。但记得慢下来，给对方留一点呼吸的空间。",
      career: "适合挑战性强、节奏快的领域，如销售、创业、竞技、市场。执行力一流，能带头冲锋陷阵，但需要一个细心的搭档帮忙收尾善后。",
      health: "精力旺盛但容易透支，注意头部、眼睛和血压。少熬夜，多安排有氧运动，让旺盛的精力有地方释放。",
      lucky: { num: 9, color: "红色", colorHex: "#ff5252", date: "周二", flower: "玫瑰" },
      match: ["狮子座", "射手座", "双子座"]
    },
    taurus: {
      name: "金牛座", en: "Taurus", symbol: "♉", element: "earth",
      elName: "土象星座", dateRange: "4.20 – 5.20", planet: "金星",
      traits: [50, 65, 58, 78, 35, 92],
      intro: "稳重踏实、慢热长情的可靠伙伴，把日子过成细水长流。",
      personality: "稳重踏实，慢热却长情。对美食与物质有天然的热爱，审美一直在线。固执是他们的标签——认定的事九头牛也拉不回，但靠谱得让人安心，是朋友眼里最可靠的定海神针。",
      love: "细水长流型选手，不玩虚的，习惯用行动表达爱意。很会照顾人，舍得为喜欢的人花钱花心思。占有欲略强，渴望稳定而长久的关系。",
      career: "适合金融、财务、设计、餐饮、地产等需要耐心与审美的领域。稳扎稳打，一步一个脚印，是团队里让所有人放心的中坚力量。",
      health: "注意咽喉、颈椎和体重管理。久坐时要常起来活动，饮食上少吃甜腻，多亲近自然。",
      lucky: { num: 6, color: "绿色", colorHex: "#66bb6a", date: "周五", flower: "郁金香" },
      match: ["处女座", "摩羯座", "巨蟹座"]
    },
    gemini: {
      name: "双子座", en: "Gemini", symbol: "♊", element: "air",
      elName: "风象星座", dateRange: "5.21 – 6.21", planet: "水星",
      traits: [75, 60, 95, 72, 80, 40],
      intro: "好奇心爆棚的信息永动机，机智健谈，永远不在一个地方停留太久。",
      personality: "好奇心爆棚的「信息永动机」，机智健谈、反应极快，话题永远接得上。双面性是他的神秘标签——上一秒还在嘻嘻哈哈，下一秒就陷入沉思。缺点是注意力容易分散，专注力是终身课题。",
      love: "追求有趣又聪明的伴侣，靠「聊得来」发电。感情里需要新鲜感，讨厌枯燥与套路，喜欢对方不断制造小惊喜。",
      career: "适合传媒、写作、市场、公关、翻译等与人打交道的行业。多才多艺，一个人能顶一个团队，是活跃气氛的一把好手。",
      health: "注意肺部、呼吸道和神经紧张。别给自己同时安排太多事，规律作息，让高速运转的脑子有停机时间。",
      lucky: { num: 5, color: "黄色", colorHex: "#ffd54f", date: "周三", flower: "百合" },
      match: ["天秤座", "水瓶座", "白羊座"]
    },
    cancer: {
      name: "巨蟹座", en: "Cancer", symbol: "♋", element: "water",
      elName: "水象星座", dateRange: "6.22 – 7.22", planet: "月亮",
      traits: [45, 95, 68, 55, 38, 85],
      intro: "温柔细腻、情感丰沛的守护者，把在乎的人牢牢护进壳里。",
      personality: "温柔细腻，情感丰沛，是典型的「家」文化代表。共情力一流，像个温暖而柔软的壳，把人护在怀里。外表坚硬、内心柔软，极度念旧，一件旧物能讲出一整段故事。",
      love: "爱得深沉而细腻，愿意为对方付出一切。天生缺乏安全感，需要被频繁确认「你还在」。是居家过日子的完美伴侣，把爱揉进一日三餐。",
      career: "适合教育、护理、餐饮、人力资源、室内设计等温馨领域。敏锐的感知力让他们天生擅长照顾他人情绪。",
      health: "注意肠胃与情绪问题，压力大时容易把情绪一口口吃进肚子里。多倾诉、多走动，别让情绪发酵。",
      lucky: { num: 2, color: "银色", colorHex: "#c0c0c8", date: "周一", flower: "白玫瑰" },
      match: ["天蝎座", "双鱼座", "金牛座"]
    },
    leo: {
      name: "狮子座", en: "Leo", symbol: "♌", element: "fire",
      elName: "火象星座", dateRange: "7.23 – 8.22", planet: "太阳",
      traits: [88, 70, 90, 52, 78, 75],
      intro: "自带光环的王者，慷慨大方，光芒四射却有点小傲娇。",
      personality: "天生自带光环，慷慨大方，自带王者气场。爱面子、讲义气，喜欢被赞美与尊重。光芒四射的外表下其实是只渴望顺毛的大猫——傲娇，但真诚得可爱。",
      love: "轰轰烈烈，把恋爱过成偶像剧。付出真挚且大方，恨不得把全世界最好玩的东西都捧到你面前，但也极要面子，需要伴侣发自内心的崇拜与认可。",
      career: "适合领导岗、演艺、演讲、公关等舞台中央的角色。有魄力、有格局、能扛事，是天生的明星与带头大哥。",
      health: "注意心脏、背部与睡眠。情绪起伏大时要学会放松，别死撑硬扛，把压力说出来。",
      lucky: { num: 1, color: "金色", colorHex: "#ffd700", date: "周日", flower: "向日葵" },
      match: ["白羊座", "射手座", "天秤座"]
    },
    virgo: {
      name: "处女座", en: "Virgo", symbol: "♍", element: "earth",
      elName: "土象星座", dateRange: "8.23 – 9.22", planet: "水星",
      traits: [62, 45, 55, 95, 42, 90],
      intro: "追求完美的细节控，理性自律，嘴硬心软的代表。",
      personality: "追求完美的细节控，理性、自律、讲究，连误差都要精确到小数点。嘴上挑剔，心里却是为了让一切更好。典型的「嘴上说着随便，心里全是要求」，对自己比对别人更狠。",
      love: "爱一个人就体现在细节里——会记住你说过的每一句话。容易挑剔，但挑剔背后是希望你更好。追求精神上纯粹的契合，宁缺毋滥。",
      career: "适合医疗、会计、数据分析、编程、编辑等需要精细与严谨的行业。是让领导放心的完美主义者，交到他手里的活儿永远干净漂亮。",
      health: "注意肠胃、消化系统与神经衰弱。给自己留点「不完美」的余地，允许偶尔摆烂，反而更健康。",
      lucky: { num: 5, color: "米色", colorHex: "#e8dcc8", date: "周三", flower: "薰衣草" },
      match: ["金牛座", "摩羯座", "巨蟹座"]
    },
    libra: {
      name: "天秤座", en: "Libra", symbol: "♎", element: "air",
      elName: "风象星座", dateRange: "9.23 – 10.23", planet: "金星",
      traits: [55, 68, 92, 75, 50, 58],
      intro: "优雅和气的社交达人，天生的和平主义者与美学主义者。",
      personality: "优雅和气，天生的社交达人。审美极佳，追求一切平衡与和谐，是朋友间的调解大师。最大的软肋是——选择困难症晚期，中午吃什么都能纠结半小时。",
      love: "浪漫温柔，懂得仪式感，恋爱体验满分。也正因为太在意平衡，容易犹豫不决，需要对方坚定地牵起他的手往前带。",
      career: "适合公关、外交、设计、法律、时尚等靠品味吃饭的行业。是团队里最好的润滑剂，让所有人相处舒服。",
      health: "注意肾脏、腰部与皮肤。别为琐事反复纠结，学会果断，犹豫本身也是一种消耗。",
      lucky: { num: 6, color: "淡粉色", colorHex: "#f8bdd0", date: "周五", flower: "玫瑰" },
      match: ["双子座", "水瓶座", "狮子座"]
    },
    scorpio: {
      name: "天蝎座", en: "Scorpio", symbol: "♏", element: "water",
      elName: "水象星座", dateRange: "10.24 – 11.22", planet: "冥王星",
      traits: [80, 75, 62, 85, 60, 95],
      intro: "神秘而炽烈的深井，洞察力惊人，一出手就是王炸。",
      personality: "神秘而炽烈，洞察力惊人，像一口望不见底的深井。爱憎分明，占有欲与意志力都极强。不轻易交心，可一旦认定，就是一辈子的事。",
      love: "爱得刻骨铭心，轰轰烈烈不留余地。忠诚且深情，但强烈的占有欲容易让另一半感到窒息。学会信任与放手，是天蝎一生的功课。",
      career: "适合侦查、研究、金融、心理咨询、外科等需要深度与专注的领域。擅长蛰伏蓄力，一出手就是王炸。",
      health: "注意生殖系统、泌尿与情绪积压。心事别总一个人扛，多释放内心压力，学会向外求助。",
      lucky: { num: 8, color: "深紫红", colorHex: "#ab4a7a", date: "周二", flower: "曼珠沙华" },
      match: ["巨蟹座", "双鱼座", "摩羯座"]
    },
    sagittarius: {
      name: "射手座", en: "Sagittarius", symbol: "♐", element: "fire",
      elName: "火象星座", dateRange: "11.23 – 12.21", planet: "木星",
      traits: [85, 58, 88, 45, 98, 52],
      intro: "自由奔放的乐天派，永远在路上，心大得装下整个宇宙。",
      personality: "自由奔放，乐观豁达，永远在路上。爱笑爱玩，讨厌一切束缚，是朋友圈里的开心果。粗线条却真诚，心大得能装下整个宇宙，生气也超不过三秒。",
      love: "喜欢能一起看世界的人，把恋爱过成一场场旅行。需要充分的空间感，最怕被「拴住」，但真爱上会不计回报地付出。",
      career: "适合旅行、外贸、教育、出版、体育等「移动办公」领域。天生的乐观与冲劲，能把整个团队都带动起来。",
      health: "注意肝脏、大腿与运动损伤。爱玩是好事，但别透支身体，规律作息才能玩得更久。",
      lucky: { num: 3, color: "紫色", colorHex: "#b388ff", date: "周四", flower: "满天星" },
      match: ["白羊座", "狮子座", "水瓶座"]
    },
    capricorn: {
      name: "摩羯座", en: "Capricorn", symbol: "♑", element: "earth",
      elName: "土象星座", dateRange: "12.22 – 1.19", planet: "土星",
      traits: [78, 40, 50, 92, 48, 96],
      intro: "稳重内敛的目标机器，现实主义的卷王，大器晚成。",
      personality: "稳重内敛，目标感极强，是现实主义的「卷王」。看似高冷难接近，其实内心藏着冷幽默。责任感爆棚、说到做到，属于大器晚成、越老越香的类型。",
      love: "爱得很现实也很认真，会把对方郑重地规划进未来里。不善表达但行动满分，追求事业与感情都稳步向上的踏实感。",
      career: "适合管理、建筑、政务、科研等长期主义赛道。耐力一流，抗压能力惊人，是能笑到最后的人。",
      health: "注意骨骼、膝盖、牙齿与压力性胃病。工作再忙也别把压力带进梦里，该休息就休息。",
      lucky: { num: 4, color: "棕色", colorHex: "#a1887f", date: "周六", flower: "兰花" },
      match: ["金牛座", "处女座", "天蝎座"]
    },
    aquarius: {
      name: "水瓶座", en: "Aquarius", symbol: "♒", element: "air",
      elName: "风象星座", dateRange: "1.20 – 2.18", planet: "天王星",
      traits: [70, 48, 75, 90, 85, 65],
      intro: "特立独行的未来主义者，脑洞大开的「外星人」。",
      personality: "特立独行，思想超前，是朋友眼中「来自外星」的存在。对朋友掏心掏肺，对感情却总是慢半拍。理性冷静，脑洞大开，讨厌一切俗套与说教。",
      love: "需要精神共鸣的灵魂伴侣，信奉先做朋友、再做恋人。不喜欢黏腻，给足自由才能长久，爱得清醒而特别。",
      career: "适合科技、互联网、公益、艺术、航空等前沿领域。是团队的「点子王」与革新者，擅长做第一个吃螃蟹的人。",
      health: "注意血液循环、小腿与失眠。作息混乱是最大敌人，试着固定睡点，给大脑充电。",
      lucky: { num: 4, color: "电光蓝", colorHex: "#4fc3f7", date: "周六", flower: "蓝色妖姬" },
      match: ["双子座", "天秤座", "射手座"]
    },
    pisces: {
      name: "双鱼座", en: "Pisces", symbol: "♓", element: "water",
      elName: "水象星座", dateRange: "2.19 – 3.20", planet: "海王星",
      traits: [40, 98, 78, 38, 55, 60],
      intro: "浪漫多情的梦境制造机，温柔到能感知所有人的情绪。",
      personality: "浪漫多情，想象力爆棚，是行走的梦境制造机。温柔善良，共情能力强到能真切感受到别人的情绪。容易多愁善感，需要一个务实的人轻轻拉一把。",
      love: "把恋爱过成偶像剧，投入时奋不顾身。很会制造浪漫，却也容易为爱受伤。需要足够的安全感与温柔的包容。",
      career: "适合艺术、音乐、影视、设计、心理咨询等梦幻领域。灵感是天赋的超能力，别浪费在乏味的事务上。",
      health: "注意双脚、睡眠与情绪波动。少胡思乱想，多晒太阳，把心情晒得亮堂堂。",
      lucky: { num: 7, color: "海蓝色", colorHex: "#4dd0e1", date: "周四", flower: "风信子" },
      match: ["巨蟹座", "天蝎座", "金牛座"]
    }
  };

  const TRAITS = ["行动力", "感性", "社交力", "理性", "冒险精神", "坚持力"];
  const ELEMENT_ICON = { fire: "🔥", earth: "⛰️", air: "🌬️", water: "🌊" };

  const FORTUNES = [
    "今天适合大胆表达自己的想法，机会可能正主动找上门。",
    "财运在线，但冲动消费要克制，攒下来的才是自己的。",
    "人际磁场很强，多参加聚会，说不定会遇到意想不到的贵人。",
    "工作和学习中保持专注，稳扎稳打更容易做出成绩。",
    "今天宜休养生息，给自己留一段安静的独处时光。",
    "勇敢迈出舒适区，一次小小的尝试可能带来大大的惊喜。",
    "倾听比表达更重要，今天会有人需要你的温柔。",
    "别被琐事带偏节奏，把最重要的一件事做好就赢了。"
  ];
  const FORTUNE_HINT = [
    "适合穿幸运色的衣物", "适合谈重要合作或表白", "适合开启新计划",
    "适合整理房间与思绪", "适合与老朋友重聚", "适合把灵感记下来",
    "适合早睡，明天更有能量", "适合大胆预约一场旅行"
  ];

  /* ---------------- 配对 ---------------- */
  const ELEMENT_PAIR = {
    "fire-fire": 78, "fire-earth": 58, "fire-air": 84, "fire-water": 62,
    "earth-fire": 58, "earth-earth": 80, "earth-air": 56, "earth-water": 82,
    "air-fire": 84, "air-earth": 56, "air-air": 76, "air-water": 60,
    "water-fire": 62, "water-earth": 82, "water-air": 60, "water-water": 79
  };
  const DIM_KEYS = ["情感契合", "沟通默契", "激情火花", "信任感", "日常相处"];
  const VERDICTS = [
    { min: 90, label: "天生一对", color: "#ff8a5c", advice: "你们的默契像出自同一本剧本，遇到彼此就对了。保持真诚，别让日常的磨合消磨掉初见的心动。" },
    { min: 80, label: "十分来电", color: "#f4d35e", advice: "火花四溅的组合，在一起总有聊不完的话题。注意别都太强势，偶尔把主角的位置让给对方。" },
    { min: 70, label: "趣味搭档", color: "#7ecb8b", advice: "彼此欣赏又各有天地，相处轻松又有趣。多创造共同的经历，感情会越来越牢靠。" },
    { min: 60, label: "渐入佳境", color: "#6db7f0", advice: "性格差异让关系充满张力，也意味着更多成长空间。多沟通、少较劲，慢慢找到彼此的节奏。" },
    { min: 50, label: "需要磨合", color: "#b388ff", advice: "三观和节奏需要更多对齐，别急着推进关系。给彼此时间和空间，真诚永远是唯一的解药。" },
    { min: 0,  label: "相敬如宾", color: "#898781", advice: "你们像两条各自发光的平行线，尊重与距离并存。若非深爱，做长久的朋友也许更舒适。" }
  ];

  /* ---------------- 纯函数 ---------------- */
  function getSignKey(m, d) {
    const bounds = [
      [1, 20, "aquarius"], [2, 19, "pisces"], [3, 21, "aries"],
      [4, 20, "taurus"], [5, 21, "gemini"], [6, 22, "cancer"],
      [7, 23, "leo"], [8, 23, "virgo"], [9, 23, "libra"],
      [10, 24, "scorpio"], [11, 23, "sagittarius"], [12, 22, "capricorn"]
    ];
    // 取最后一个「已到起始日」的区间作为结果（区间按日期升序排列）
    let key = "capricorn";
    for (const [bm, bd, k] of bounds) {
      if (m > bm || (m === bm && d >= bd)) key = k;
    }
    return key;
  }

  function fortuneFor(key, dateStr) {
    const score = 40 + hashStr(key + dateStr) % 61;
    const fi = hashStr(key + "|" + dateStr) % FORTUNES.length;
    const hi = hashStr(key + "||" + dateStr) % FORTUNE_HINT.length;
    let lvl, color;
    if (score >= 90)      { lvl = "超级幸运日"; color = "#ffd54f"; }
    else if (score >= 75) { lvl = "运势不错";    color = "#66bb6a"; }
    else if (score >= 60) { lvl = "平稳顺遂";    color = "#4fc3f7"; }
    else if (score >= 45) { lvl = "稍加留意";    color = "#ff8a5c"; }
    else                  { lvl = "韬光养晦";    color = "#e57373"; }
    return { score, lvl, color, text: FORTUNES[fi], hint: FORTUNE_HINT[hi] };
  }

  function trendFor(key, days) {
    const out = [];
    const now = new Date();
    const WD = ["日", "一", "二", "三", "四", "五", "六"];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const ds = d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
      const score = fortuneFor(key, ds).score;
      out.push({ ds, wd: "周" + WD[d.getDay()], md: (d.getMonth() + 1) + "/" + d.getDate(), score });
    }
    return out;
  }

  function elementRel(a, b) {
    if (a.element === b.element) return "同象相吸，默契天成";
    const c = a.element + "-" + b.element;
    const map = {
      "fire-air": "火借风势，一拍即合", "air-fire": "火借风势，一拍即合",
      "earth-water": "土润水养，相得益彰", "water-earth": "土润水养，相得益彰",
      "fire-earth": "热情与务实，需要互相包容", "earth-fire": "热情与务实，需要互相包容",
      "earth-air": "现实与理想，磨合是主题", "air-earth": "现实与理想，磨合是主题",
      "air-water": "理性与感性，互补又疏离", "water-air": "理性与感性，互补又疏离",
      "fire-water": "水火相冲，爱得轰轰烈烈", "water-fire": "水火相冲，爱得轰轰烈烈"
    };
    return map[c] || "";
  }

  function computePair(aKey, bKey) {
    const A = SIGNS[aKey], B = SIGNS[bKey];
    const core = ELEMENT_PAIR[A.element + "-" + B.element] + (A.match.includes(B.name) ? 12 : 0);
    const dims = DIM_KEYS.map((_, i) => clamp(core + (hashStr(A.name + "·" + B.name + "·" + i) % 13 - 6), 35, 99));
    const overall = Math.round(dims.reduce((x, y) => x + y, 0) / 5);
    const verdict = VERDICTS.find(v => overall >= v.min);
    return { A, B, overall, dims, verdict, rel: elementRel(A, B) };
  }

  /* ---------------- 输入解析（CLI 与后端共用） ---------------- */
  function parseDate(input) {
    const s = String(input == null ? "" : input).trim();
    const now = new Date();
    if (!s || s === "now" || s === "今天" || s === "今日") return now;
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[-/](\d{1,2})$/);
    if (m) return new Date(now.getFullYear(), +m[1] - 1, +m[2]);
    return null;
  }

  function resolveSign(input) {
    const s = String(input == null ? "" : input).trim();
    if (!s) return null;
    if (SIGNS[s]) return s;
    const low = s.toLowerCase();
    for (const k of Object.keys(SIGNS)) {
      const v = SIGNS[k];
      if (v.name === s) return k;
      if (v.en.toLowerCase() === low) return k;
      if (v.symbol === s) return k;
      if (v.name.replace("座", "") === s) return k;
    }
    return null;
  }

  /* 先按日期解析，否则按星座名解析 */
  function resolveKey(input) {
    const d = parseDate(input);
    if (d) return getSignKey(d.getMonth() + 1, d.getDate());
    return resolveSign(input);
  }

  function fmtDate(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  return {
    SIGNS, TRAITS, ELEMENT_ICON, FORTUNES, FORTUNE_HINT, ELEMENT_PAIR, DIM_KEYS, VERDICTS,
    getSignKey, fortuneFor, trendFor, elementRel, computePair, hashStr,
    parseDate, resolveSign, resolveKey, fmtDate
  };
});
