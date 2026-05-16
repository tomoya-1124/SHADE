import { calculateScores } from "./scoring";
import { isSupabaseConfigured, supabase, type Database, type Json } from "./supabase";
import type { DailyLog, Score } from "./types";

type DailyLogRow = Database["public"]["Tables"]["daily_logs"]["Row"];
type DailyLogInsert = Database["public"]["Tables"]["daily_logs"]["Insert"];

export type SupabaseDailyLogResult = {
  status: "success" | "error" | "skipped";
  message: string;
};

export type SupabaseDailyLogFetchResult = SupabaseDailyLogResult & {
  logs: DailyLog[];
};

const isScore = (value: unknown): value is Score => typeof value === "number" && value >= 1 && value <= 5 && Number.isInteger(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const textOrEmpty = (value: unknown) => (typeof value === "string" ? value : "");

function fallbackLog(row: DailyLogRow): DailyLog {
  return {
    id: row.id,
    date: row.date,
    createdAt: row.created_at ?? new Date().toISOString(),
    face: { skin: 3, hair: 3, eyebrows: 3, fatigue: 3, puffiness: 3 },
    body: { trained: false, posture: 3 },
    food: { sweets: false, juice: false, lowCarb: false, vegetables: false },
    mind: { mental: 3, confidence: 3, stress: 3 },
    presence: { blackFit: 3, composedOutside: 3, ignoredGaze: 3, enteredStores: 3 },
    memo: {
      note: row.memo ?? "",
      good: row.good_point ?? "",
      tomorrow: row.improvement ?? "",
    },
  };
}

export function dailyLogToSupabaseInsert(log: DailyLog): DailyLogInsert {
  const scores = calculateScores(log);

  return {
    id: log.id,
    user_id: null,
    date: log.date,
    face_score: scores.face,
    body_score: scores.body,
    mind_score: scores.mind,
    food_score: scores.food,
    presence_score: scores.presence,
    total_score: scores.total,
    memo: log.memo.note || null,
    good_point: log.memo.good || null,
    improvement: log.memo.tomorrow || null,
    raw_data: log as unknown as Json,
    created_at: log.createdAt,
  };
}

export function dailyLogFromSupabaseRow(row: DailyLogRow): DailyLog {
  if (!isRecord(row.raw_data)) return fallbackLog(row);

  const raw = row.raw_data;
  const face = isRecord(raw.face) ? raw.face : {};
  const body = isRecord(raw.body) ? raw.body : {};
  const food = isRecord(raw.food) ? raw.food : {};
  const mind = isRecord(raw.mind) ? raw.mind : {};
  const presence = isRecord(raw.presence) ? raw.presence : {};
  const memo = isRecord(raw.memo) ? raw.memo : {};
  const photo = isRecord(raw.photo) && typeof raw.photo.dataUrl === "string"
    ? {
        dataUrl: raw.photo.dataUrl,
        name: textOrEmpty(raw.photo.name),
        type: textOrEmpty(raw.photo.type),
        size: typeof raw.photo.size === "number" ? raw.photo.size : 0,
      }
    : undefined;

  return {
    id: row.id,
    date: row.date,
    createdAt: row.created_at ?? (textOrEmpty(raw.createdAt) || new Date().toISOString()),
    photo,
    face: {
      skin: isScore(face.skin) ? face.skin : 3,
      hair: isScore(face.hair) ? face.hair : 3,
      eyebrows: isScore(face.eyebrows) ? face.eyebrows : 3,
      fatigue: isScore(face.fatigue) ? face.fatigue : 3,
      puffiness: isScore(face.puffiness) ? face.puffiness : 3,
    },
    body: {
      trained: typeof body.trained === "boolean" ? body.trained : false,
      weight: typeof body.weight === "number" ? body.weight : undefined,
      posture: isScore(body.posture) ? body.posture : 3,
    },
    food: {
      sweets: typeof food.sweets === "boolean" ? food.sweets : false,
      juice: typeof food.juice === "boolean" ? food.juice : false,
      lowCarb: typeof food.lowCarb === "boolean" ? food.lowCarb : false,
      vegetables: typeof food.vegetables === "boolean" ? food.vegetables : false,
      water: typeof food.water === "number" ? food.water : undefined,
    },
    mind: {
      mental: isScore(mind.mental) ? mind.mental : 3,
      confidence: isScore(mind.confidence) ? mind.confidence : 3,
      stress: isScore(mind.stress) ? mind.stress : 3,
    },
    presence: {
      blackFit: isScore(presence.blackFit) ? presence.blackFit : 3,
      composedOutside: isScore(presence.composedOutside) ? presence.composedOutside : 3,
      ignoredGaze: isScore(presence.ignoredGaze) ? presence.ignoredGaze : 3,
      enteredStores: isScore(presence.enteredStores) ? presence.enteredStores : 3,
    },
    memo: {
      note: row.memo ?? textOrEmpty(memo.note),
      good: row.good_point ?? textOrEmpty(memo.good),
      tomorrow: row.improvement ?? textOrEmpty(memo.tomorrow),
    },
  };
}

export async function fetchDailyLogsFromSupabase(): Promise<SupabaseDailyLogFetchResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { status: "skipped", message: "Supabase env is not configured. Using localStorage backup.", logs: [] };
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { status: "error", message: error.message, logs: [] };
  }

  return {
    status: "success",
    message: `Supabaseから${data.length}件のDaily Logを取得しました。`,
    logs: data.map(dailyLogFromSupabaseRow),
  };
}

export async function insertDailyLogToSupabase(log: DailyLog): Promise<SupabaseDailyLogResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { status: "skipped", message: "Supabase env is not configured. Saved to localStorage only." };
  }

  const { error } = await supabase
    .from("daily_logs")
    .insert(dailyLogToSupabaseInsert(log));

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", message: "SupabaseにもDaily Logを保存しました。" };
}
