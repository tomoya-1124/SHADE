import type { CategoryScores, DailyLog, Quest } from "./types";

const rounded = (value: number) => Math.round(value);
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const positiveBooleanScore = (value: boolean) => (value ? 100 : 45);
const negativeBooleanScore = (value: boolean) => (value ? 35 : 100);
const fivePoint = (value: number) => (value / 5) * 100;
const inverseFivePoint = (value: number) => ((6 - value) / 5) * 100;

export function calculateScores(log: DailyLog): CategoryScores {
  const face = average([
    fivePoint(log.face.skin),
    fivePoint(log.face.hair),
    fivePoint(log.face.eyebrows),
    inverseFivePoint(log.face.fatigue),
    inverseFivePoint(log.face.puffiness),
  ]);

  const body = average([
    positiveBooleanScore(log.body.trained),
    fivePoint(log.body.posture),
  ]);

  const food = average([
    negativeBooleanScore(log.food.sweets),
    negativeBooleanScore(log.food.juice),
    positiveBooleanScore(log.food.lowCarb),
    positiveBooleanScore(log.food.vegetables),
    log.food.water ? Math.min(100, (log.food.water / 2) * 100) : 60,
  ]);

  const mind = average([
    fivePoint(log.mind.mental),
    fivePoint(log.mind.confidence),
    inverseFivePoint(log.mind.stress),
  ]);

  const presence = average([
    fivePoint(log.presence.blackFit),
    fivePoint(log.presence.composedOutside),
    fivePoint(log.presence.ignoredGaze),
    fivePoint(log.presence.enteredStores),
  ]);

  const total = average([face, body, food, mind, presence]);

  return {
    face: rounded(face),
    body: rounded(body),
    food: rounded(food),
    mind: rounded(mind),
    presence: rounded(presence),
    total: rounded(total),
  };
}

export function sortLogsByDate(logs: DailyLog[]) {
  return [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function getPresenceTrend(logs: DailyLog[], limit = 7) {
  return sortLogsByDate(logs)
    .slice(0, limit)
    .reverse()
    .map((log) => ({ date: log.date.slice(5), score: calculateScores(log).presence, total: calculateScores(log).total }));
}

export function getScoreDelta(after: CategoryScores, before: CategoryScores): CategoryScores {
  return {
    face: after.face - before.face,
    body: after.body - before.body,
    food: after.food - before.food,
    mind: after.mind - before.mind,
    presence: after.presence - before.presence,
    total: after.total - before.total,
  };
}

export function getQuestDifficulty(quest: Quest) {
  const values = quest.stars.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [1];
  return Math.max(...values);
}
