import { createSignedImageUrl } from "./logImagesStorage";
import { calculateScores } from "./scoring";
import { supabase } from "./supabase";
import type { DailyLog, LogPhoto, Score } from "./types";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type DailyLogRow = {
  id: string;
  user_id: string | null;
  date: string;
  face_score: number;
  body_score: number;
  mind_score: number;
  food_score: number;
  presence_score: number;
  total_score: number;
  memo: string | null;
  good_point: string | null;
  improvement: string | null;
  raw_data: Json;
  created_at: string | null;
};

type DailyLogInsert = {
  id?: string;
  user_id?: string | null;
  date: string;
  face_score: number;
  body_score: number;
  mind_score: number;
  food_score: number;
  presence_score: number;
  total_score: number;
  memo?: string | null;
  good_point?: string | null;
  improvement?: string | null;
  raw_data: Json;
  created_at?: string | null;
};

export type SupabaseDailyLogResult = {
  status: "success" | "error" | "skipped";
  message: string;
};

export type SupabaseDailyLogFetchResult = SupabaseDailyLogResult & {
  logs: DailyLog[];
};

const isScore = (value: unknown): value is Score =>
  typeof value === "number" &&
  value >= 1 &&
  value <= 5 &&
  Number.isInteger(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const textOrEmpty = (value: unknown) =>
  typeof value === "string" ? value : "";

function fallbackLog(row: DailyLogRow): DailyLog {
  return {
    id: row.id,
    date: row.date,
    createdAt: row.created_at ?? new Date().toISOString(),
    face: { skin: 3, hair: 3, eyebrows: 3, fatigue: 3, puffiness: 3 },
    body: { trained: false, posture: 3 },
    food: { sweets: false, juice: false, lowCarb: false, vegetables: false },
    mind: { mental: 3, confidence: 3, stress: 3 },
    presence: {
      blackFit: 3,
      composedOutside: 3,
      ignoredGaze: 3,
      enteredStores: 3,
    },
    memo: {
      note: row.memo ?? "",
      good: row.good_point ?? "",
      tomorrow: row.improvement ?? "",
    },
  };
}

export function dailyLogToSupabaseInsert(
  log: DailyLog,
  userId: string,
): DailyLogInsert {
  const scores = calculateScores(log);

  return {
    id: log.id,
    user_id: userId,
    date: log.date,
    face_score: scores.face,
    body_score: scores.body,
    mind_score: scores.mind,
    food_score: scores.food,
    presence_score: scores.presence,
    total_score: scores.total,
    memo: log.memo.note ?? "",
    good_point: log.memo.good ?? "",
    improvement: log.memo.tomorrow ?? "",
    raw_data: log as unknown as Json,
    created_at: log.createdAt,
  };
}

export async function dailyLogFromSupabaseRow(
  row: DailyLogRow,
): Promise<DailyLog> {
  if (!isRecord(row.raw_data)) return fallbackLog(row);

  const raw = row.raw_data;
  const face = isRecord(raw.face) ? raw.face : {};
  const body = isRecord(raw.body) ? raw.body : {};
  const food = isRecord(raw.food) ? raw.food : {};
  const mind = isRecord(raw.mind) ? raw.mind : {};
  const presence = isRecord(raw.presence) ? raw.presence : {};
  const memo = isRecord(raw.memo) ? raw.memo : {};
  const photo = await restorePhoto(raw.photo);

  return {
    id: row.id,
    date: row.date,
    createdAt:
      row.created_at ??
      (textOrEmpty(raw.createdAt) || new Date().toISOString()),
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
      vegetables:
        typeof food.vegetables === "boolean" ? food.vegetables : false,
      water: typeof food.water === "number" ? food.water : undefined,
    },
    mind: {
      mental: isScore(mind.mental) ? mind.mental : 3,
      confidence: isScore(mind.confidence) ? mind.confidence : 3,
      stress: isScore(mind.stress) ? mind.stress : 3,
    },
    presence: {
      blackFit: isScore(presence.blackFit) ? presence.blackFit : 3,
      composedOutside: isScore(presence.composedOutside)
        ? presence.composedOutside
        : 3,
      ignoredGaze: isScore(presence.ignoredGaze) ? presence.ignoredGaze : 3,
      enteredStores: isScore(presence.enteredStores)
        ? presence.enteredStores
        : 3,
    },
    memo: {
      note: row.memo ?? textOrEmpty(memo.note),
      good: row.good_point ?? textOrEmpty(memo.good),
      tomorrow: row.improvement ?? textOrEmpty(memo.tomorrow),
    },
  };
}

async function restorePhoto(value: unknown): Promise<LogPhoto | undefined> {
  if (!isRecord(value)) return undefined;

  const storagePath = textOrEmpty(value.storagePath) || undefined;
  const signedUrl = storagePath
    ? await createSignedImageUrl(storagePath)
    : textOrEmpty(value.signedUrl) || undefined;
  const publicUrl = textOrEmpty(value.publicUrl) || undefined;
  const dataUrl = textOrEmpty(value.dataUrl) || undefined;

  if (!storagePath && !signedUrl && !publicUrl && !dataUrl) return undefined;

  return {
    dataUrl,
    storagePath,
    publicUrl,
    signedUrl,
    name: textOrEmpty(value.name),
    type: textOrEmpty(value.type),
    size: typeof value.size === "number" ? value.size : 0,
  };
}

export async function fetchDailyLogsFromSupabase(
  userId: string,
): Promise<SupabaseDailyLogFetchResult> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { status: "error", message: error.message, logs: [] };
  }

  const rows = (data ?? []) as DailyLogRow[];

  return {
    status: "success",
    message: `Supabaseから${rows.length}件のDaily Logを取得しました。`,
    logs: await Promise.all(rows.map(dailyLogFromSupabaseRow)),
  };
}

export async function insertDailyLogToSupabase(
  log: DailyLog,
  userId: string,
): Promise<SupabaseDailyLogResult> {
  const { error } = await supabase
    .from("daily_logs")
    .insert(dailyLogToSupabaseInsert(log, userId));

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message: "Supabaseに保存しました",
  };
}
