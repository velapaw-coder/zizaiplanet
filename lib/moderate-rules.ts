const GROUPS: Array<{ label: string; words: string[] }> = [
  { label: "色情", words: ["色情", "裸聊", "约炮", "援交", "黄片", "成人视频"] },
  { label: "暴力", words: ["杀人", "砍死", "炸死", "血腥屠杀"] },
  { label: "诈骗", words: ["刷单", "稳赚不赔", "杀猪盘", "内部名额", "保证收益", "高额返利"] },
  { label: "辱骂", words: ["傻逼", "脑残", "操你妈", "废物东西"] },
  { label: "广告引流", words: ["加微信", "加薇信", "加v信", "私聊领", "点击购买", "扫码进群", "代购"] },
];

export function ruleModeration(text: string): { pass: boolean; reason: string } {
  const hay = text.toLowerCase();
  for (const group of GROUPS) {
    if (group.words.some((word) => hay.includes(word.toLowerCase()))) {
      return { pass: false, reason: `这段里有${group.label}相关的内容，先不公开。` };
    }
  }
  if (/加\s*[微vV薇]\s*信/.test(text) || /(?:vx|v信)\s*[:：]?\s*[a-z0-9_-]{4,}/i.test(text)) {
    return { pass: false, reason: "这段里有广告引流，先不公开。" };
  }
  return { pass: true, reason: "" };
}
