import type { DailyLog, Quest } from "./types";

export const LOGS_KEY = "shade.dailyLogs";
export const QUESTS_KEY = "shade.quests";

export const defaultQuests: Quest[] = [
  { id: "starbucks-solo", title: "ひとりでスタバに入る", stars: "★2", completed: false },
  { id: "vintage-store", title: "古着屋に入る", stars: "★2", completed: false },
  { id: "black-hoodie", title: "黒T / 黒パーカーが似合う", stars: "★1", completed: false },
  { id: "eyelash-salon", title: "まつ毛サロンに通う", stars: "★1", completed: false },
  { id: "upscale-place", title: "少し高めのレストラン・ホテルに入る", stars: "★2.5", completed: false },
  { id: "date", title: "女の子とデートする", stars: "★2〜3", completed: false },
  { id: "luxury-shop", title: "高級ショップで買い物する", stars: "★2〜3", completed: false },
  { id: "approached", title: "逆ナンされる", stars: "★5", completed: false },
  { id: "scouted", title: "芸能人スカウトに声をかけられる", stars: "★3〜5", completed: false },
  { id: "snap", title: "スナップ依頼される", stars: "★4", completed: false },
];

export const sampleLogs: DailyLog[] = [
  {
    id: "sample-1",
    date: "2026-05-16",
    createdAt: "2026-05-16T08:30:00.000Z",
    face: { skin: 4, hair: 4, eyebrows: 3, fatigue: 2, puffiness: 2 },
    body: { trained: true, weight: 68.4, posture: 4 },
    food: { sweets: false, juice: false, lowCarb: true, vegetables: true, water: 2.1 },
    mind: { mental: 4, confidence: 3, stress: 2 },
    presence: { blackFit: 4, composedOutside: 3, ignoredGaze: 4, enteredStores: 3 },
    memo: {
      note: "黒のスウェットにシルバーアクセ。余計な色を足さない方が落ち着く。",
      good: "姿勢を意識して歩けた。コンビニで目線が下がらなかった。",
      tomorrow: "寝る前のスマホを30分減らして肌の疲れを落とす。",
    },
  },
  {
    id: "sample-2",
    date: "2026-05-15",
    createdAt: "2026-05-15T09:20:00.000Z",
    face: { skin: 3, hair: 3, eyebrows: 3, fatigue: 3, puffiness: 3 },
    body: { trained: false, weight: 68.8, posture: 3 },
    food: { sweets: true, juice: false, lowCarb: false, vegetables: true, water: 1.4 },
    mind: { mental: 3, confidence: 3, stress: 3 },
    presence: { blackFit: 3, composedOutside: 3, ignoredGaze: 2, enteredStores: 3 },
    memo: {
      note: "夕方から顔の疲れが出た。",
      good: "古着屋の前で立ち止まれた。次は入る。",
      tomorrow: "昼に水を買う。肩を開いて歩く。",
    },
  },
];
