"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  getCurrentSession,
  signInWithMagicLink,
  signOut,
  type AuthSession,
} from "@/lib/auth";
import {
  fetchDailyLogsFromSupabase,
  insertDailyLogToSupabase,
  type SupabaseDailyLogResult,
} from "@/lib/dailyLogsRepository";
import { uploadLogImage } from "@/lib/logImagesStorage";
import {
  calculateScores,
  getQuestDifficulty,
  getScoreDelta,
  sortLogsByDate,
} from "@/lib/scoring";
import { defaultQuests, LOGS_KEY, QUESTS_KEY, sampleLogs } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type {
  CategoryScores,
  DailyLog,
  LogPhoto,
  Quest,
  Score,
} from "@/lib/types";
import { LogCard } from "./LogCard";
import { LogPhotoView } from "./LogPhoto";
import { PresenceTrend } from "./PresenceTrend";
import { ScoreRing } from "./ScoreRing";
import { Button, Card, FieldLabel, Pill, TextArea, TextInput } from "./ui";

type Tab = "dashboard" | "new" | "quests" | "logs";
type FormState = Omit<DailyLog, "id" | "createdAt">;
type SyncNotice = SupabaseDailyLogResult & { id: number };

const today = () => new Date().toISOString().slice(0, 10);
const scoreOptions: Score[] = [1, 2, 3, 4, 5];
const scoreKeys = ["face", "body", "mind", "food", "presence"] as const;
const userLogsKey = (userId: string) => `${LOGS_KEY}.${userId}`;

const scoreLabels: Record<(typeof scoreKeys)[number] | "total", string> = {
  total: "Total",
  face: "Face",
  body: "Body",
  mind: "Mind",
  food: "Food",
  presence: "Presence",
};

const initialForm = (): FormState => ({
  date: today(),
  photo: undefined,
  face: { skin: 3, hair: 3, eyebrows: 3, fatigue: 3, puffiness: 3 },
  body: { trained: false, weight: undefined, posture: 3 },
  food: {
    sweets: false,
    juice: false,
    lowCarb: false,
    vegetables: false,
    water: undefined,
  },
  mind: { mental: 3, confidence: 3, stress: 3 },
  presence: {
    blackFit: 3,
    composedOutside: 3,
    ignoredGaze: 3,
    enteredStores: 3,
  },
  memo: { note: "", good: "", tomorrow: "" },
});

function parseStoredArray<T>(value: string | null, fallback: T[]): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function mergeQuests(stored: Quest[]) {
  return defaultQuests.map((quest) => ({
    ...quest,
    ...stored.find((item) => item.id === quest.id),
  }));
}

function getDashboardComments(scores: CategoryScores) {
  const comments: string[] = [];

  if (scores.presence >= 70)
    comments.push(
      "今日は社会空間に入れる状態です。姿勢と視線だけ維持してください。",
    );
  else
    comments.push(
      "Presenceはまだ上げ幅があります。大きく攻めず、入る店を一つだけ決めて動いてください。",
    );

  if (scores.face < 70)
    comments.push(
      "Faceの完成度が少し不安定です。睡眠・眉・肌の順で整えると修正しやすいです。",
    );
  if (scores.food >= 75)
    comments.push(
      "食事管理はかなり安定しています。見た目に出る土台は崩れていません。",
    );
  if (scores.mind < 55)
    comments.push(
      "Mindが低めです。今日は無理に攻めず、最低限の整えと記録に寄せてください。",
    );
  if (scores.total >= 80)
    comments.push(
      "全体のノイズが少ない日です。写真を残して、何が効いたか観察してください。",
    );

  return comments.slice(0, 4);
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Score;
  onChange: (value: Score) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-5 gap-2">
        {scoreOptions.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`rounded-2xl border py-2 text-sm transition ${value === score ? "border-shade-blue/70 bg-shade-blue/20 text-white" : "border-white/10 bg-black/20 text-slate-500 hover:text-slate-200"}`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-left text-sm transition ${checked ? "border-shade-blue/60 bg-shade-blue/15 text-white" : "border-white/10 bg-black/20 text-slate-400"}`}
    >
      <span>{label}</span>
      <span className="text-xs uppercase tracking-[0.2em]">
        {checked ? "Yes" : "No"}
      </span>
    </button>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">
          Daily Log
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function DifficultyBadge({ quest }: { quest: Quest }) {
  const difficulty = getQuestDifficulty(quest);
  const tone =
    difficulty >= 4
      ? "border-blue-300/40 bg-blue-300/10 text-blue-100"
      : difficulty >= 3
        ? "border-slate-300/30 bg-slate-200/10 text-slate-100"
        : "border-white/10 bg-white/5 text-slate-400";
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
    >
      {quest.stars}
      {difficulty >= 3 ? " / 高難度" : ""}
    </span>
  );
}

function Delta({ value }: { value: number }) {
  const sign = value > 0 ? "+" : "";
  const color =
    value > 0
      ? "text-blue-200"
      : value < 0
        ? "text-slate-500"
        : "text-slate-400";
  return (
    <span className={`text-sm font-semibold ${color}`}>
      {sign}
      {value}
    </span>
  );
}

function AuthScreen({
  email,
  notice,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  notice: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-shade-black text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(108,140,255,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6">
        <Card className="grid w-full gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.5em] text-shade-blue">
              SHADE AUTH
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              Presenceを静かに研磨する。
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-400">
              Daily Logを自分のアカウントに紐づけて保存します。Magic
              Linkでログインしてください。
            </p>
          </div>
          <form
            className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-5"
            onSubmit={onSubmit}
          >
            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button
              className="w-full justify-center bg-shade-blue/20 py-2.5"
              type="submit"
            >
              Magic Linkを送る
            </Button>
            {notice ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-slate-300">
                {notice}
              </p>
            ) : null}
          </form>
        </Card>
      </div>
    </main>
  );
}

function ComparisonPanel({
  before,
  after,
}: {
  before?: DailyLog;
  after?: DailyLog;
}) {
  if (!before || !after) {
    return (
      <p className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-slate-500">
        比較するログを2件選択してください。
      </p>
    );
  }

  const beforeScores = calculateScores(before);
  const afterScores = calculateScores(after);
  const delta = getScoreDelta(afterScores, beforeScores);

  const CardSide = ({
    label,
    log,
    scores,
  }: {
    label: string;
    log: DailyLog;
    scores: CategoryScores;
  }) => (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <h3 className="text-xl font-semibold text-white">{log.date}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 px-4 py-2 text-2xl font-semibold text-white">
          {scores.total}
        </div>
      </div>
      <LogPhotoView
        photo={log.photo}
        className="h-64 w-full"
        label="No photo"
      />
      <div className="grid gap-2">
        {scoreKeys.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2 text-sm"
          >
            <span className="text-slate-500">{scoreLabels[key]}</span>
            <span className="font-semibold text-slate-100">{scores[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <CardSide label="Before" log={before} scores={beforeScores} />
        <div className="grid place-items-center text-xs uppercase tracking-[0.26em] text-slate-500">
          vs
        </div>
        <CardSide label="After" log={after} scores={afterScores} />
      </div>
      <div className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-3 lg:grid-cols-6">
        {(["total", ...scoreKeys] as const).map((key) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-2xl bg-black/25 px-3 py-2"
          >
            <span className="text-xs text-slate-500">{scoreLabels[key]}</span>
            <Delta value={delta[key]} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShadeApp() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [quests, setQuests] = useState<Quest[]>(defaultQuests);
  const [form, setForm] = useState<FormState>(initialForm);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [markingQuestId, setMarkingQuestId] = useState<string | null>(null);
  const [questMemo, setQuestMemo] = useState("");
  const [compareBeforeId, setCompareBeforeId] = useState("");
  const [compareAfterId, setCompareAfterId] = useState("");
  const [syncNotice, setSyncNotice] = useState<SyncNotice | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [savingLog, setSavingLog] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      const currentSession = await getCurrentSession();
      if (!active) return;
      setSession(currentSession);
      setAuthReady(true);
    }

    void hydrateSession();

    const { data } = supabase.auth.onAuthStateChange(
      (_event: string, nextSession: AuthSession | null) => {
        setSession(
          nextSession
            ? {
                user: {
                  id: nextSession.user.id,
                  email: nextSession.user.email ?? undefined,
                },
              }
            : null,
        );
        setAuthReady(true);
      },
    );

    const subscription = data.subscription;

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchLogs = useCallback(
    async (userId: string, showNotice = true) => {
      setLogsLoading(true);
      setLogsError("");

      const result = await fetchDailyLogsFromSupabase(userId);

      if (result.status === "success") {
        setLogs(result.logs);
        if (showNotice) {
          setSyncNotice({
            id: Date.now(),
            status: result.status,
            message: result.message,
          });
        }
      } else {
        setLogsError(result.message);
        if (showNotice) {
          setSyncNotice({
            id: Date.now(),
            status: "error",
            message: `Supabase取得に失敗しました: ${result.message}`,
          });
        }
      }

      setLogsLoading(false);
      return result;
    },
    [],
  );

  useEffect(() => {
    if (!authReady || !session) return;

    let active = true;
    const userId = session.user.id;
    const storedLogs = parseStoredArray<DailyLog>(
      window.localStorage.getItem(userLogsKey(userId)) ??
        window.localStorage.getItem(LOGS_KEY),
      sampleLogs,
    );
    const storedQuests = parseStoredArray<Quest>(
      window.localStorage.getItem(QUESTS_KEY),
      defaultQuests,
    );

    setQuests(mergeQuests(storedQuests));

    async function hydrateDailyLogs() {
      const result = await fetchLogs(userId);
      if (!active) return;
      if (result.status !== "success") setLogs(storedLogs);
      setHydrated(true);
    }

    void hydrateDailyLogs();

    return () => {
      active = false;
    };
  }, [authReady, fetchLogs, session]);

  useEffect(() => {
    if (hydrated && session)
      window.localStorage.setItem(
        userLogsKey(session.user.id),
        JSON.stringify(logs),
      );
  }, [hydrated, logs, session]);

  useEffect(() => {
    if (hydrated)
      window.localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
  }, [hydrated, quests]);

  const orderedLogs = useMemo(() => sortLogsByDate(logs), [logs]);
  const latestLog = orderedLogs[0];
  const latestScores = latestLog ? calculateScores(latestLog) : null;
  const completedQuests = quests.filter((quest) => quest.completed).length;
  const beforeLog = orderedLogs.find((log) => log.id === compareBeforeId);
  const afterLog = orderedLogs.find((log) => log.id === compareAfterId);

  useEffect(() => {
    if (!orderedLogs.length) return;
    if (!compareAfterId) setCompareAfterId(orderedLogs[0].id);
    if (!compareBeforeId)
      setCompareBeforeId(orderedLogs[1]?.id ?? orderedLogs[0].id);
  }, [compareAfterId, compareBeforeId, orderedLogs]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("画像ファイルを選択してください。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const photo: LogPhoto = {
        dataUrl: reader.result,
        name: file.name,
        type: file.type,
        size: file.size,
      };
      setSelectedPhotoFile(file);
      setForm((current) => ({ ...current, photo }));
    };
    reader.onerror = () => setPhotoError("画像の読み込みに失敗しました。");
    reader.readAsDataURL(file);
  };

  const saveLog = async () => {
    setSavingLog(true);
    setLogsError("");

    const { data, error } = await supabase.auth.getUser();
    const user = data.user;

    if (error || !user) {
      setSavingLog(false);
      setSyncNotice({
        id: Date.now(),
        status: "error",
        message: "ログインが必要です。",
      });
      return;
    }

    let log: DailyLog = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (selectedPhotoFile) {
      const uploadResult = await uploadLogImage({
        file: selectedPhotoFile,
        userId: user.id,
        date: log.date,
      });
      if (uploadResult.status === "error") {
        setSavingLog(false);
        setSyncNotice({
          id: Date.now(),
          status: "error",
          message: `画像保存に失敗しました: ${uploadResult.message}`,
        });
        return;
      }
      if (uploadResult.photo) {
        log = {
          ...log,
          photo: { ...uploadResult.photo, dataUrl: form.photo?.dataUrl },
        };
      }
    }

    const result = await insertDailyLogToSupabase(log, user.id);

    if (result.status === "error") {
      setSavingLog(false);
      setSyncNotice({
        id: Date.now(),
        status: result.status,
        message: `保存失敗: ${result.message}`,
      });
      return;
    }

    const refetchResult = await fetchLogs(user.id, false);

    setForm(initialForm());
    setSelectedPhotoFile(null);
    setPhotoError("");
    setActiveTab("dashboard");
    setSyncNotice({
      id: Date.now(),
      status: refetchResult.status === "error" ? "error" : result.status,
      message:
        refetchResult.status === "error"
          ? `Supabaseには保存しましたが、再取得に失敗しました: ${refetchResult.message}`
          : result.message,
    });
    setSavingLog(false);
  };

  const startQuestMark = (quest: Quest) => {
    setMarkingQuestId(quest.id);
    setQuestMemo(quest.completionMemo ?? "");
  };

  const completeQuest = (questId: string) => {
    setQuests((current) =>
      current.map((item) =>
        item.id === questId
          ? {
              ...item,
              completed: true,
              completedAt: new Date().toISOString(),
              completionMemo: questMemo.trim(),
            }
          : item,
      ),
    );
    setMarkingQuestId(null);
    setQuestMemo("");
  };

  const resetQuest = (questId: string) => {
    setQuests((current) =>
      current.map((item) =>
        item.id === questId
          ? {
              ...item,
              completed: false,
              completedAt: undefined,
              completionMemo: undefined,
            }
          : item,
      ),
    );
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthNotice("送信中です。");
    const result = await signInWithMagicLink(authEmail);
    setAuthNotice(result.message);
  };

  const handleSignOut = async () => {
    const result = await signOut();
    setSyncNotice({
      id: Date.now(),
      status: result.status,
      message: result.message,
    });
    setLogs([]);
    setSession(null);
    setHydrated(false);
  };

  if (!authReady) {
    return (
      <AuthScreen
        email={authEmail}
        notice="認証状態を確認しています。"
        onEmailChange={setAuthEmail}
        onSubmit={handleMagicLink}
      />
    );
  }

  if (!session) {
    return (
      <AuthScreen
        email={authEmail}
        notice={authNotice}
        onEmailChange={setAuthEmail}
        onSubmit={handleMagicLink}
      />
    );
  }

  const navItems: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "new", label: "Daily Log" },
    { id: "quests", label: "Quest" },
    { id: "logs", label: "Logs" },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-shade-black text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(108,140,255,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_28%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-black/30 p-5 backdrop-blur sm:p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-shade-blue">
              SHADE
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              Presenceを静かに研磨する。
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              顔・髪・服・行動のログを接続し、外見と社会空間への入り方を観察する自己管理OS。
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-slate-400">
              {session.user.email ?? "Logged in"}
            </span>
            <Button onClick={handleSignOut}>Logout</Button>
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={
                  activeTab === item.id
                    ? "border-shade-blue/60 bg-shade-blue/20"
                    : ""
                }
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </header>

        {syncNotice ? (
          <div
            className={`flex items-start justify-between gap-4 rounded-3xl border p-4 text-sm shadow-glow ${syncNotice.status === "success" ? "border-shade-blue/40 bg-shade-blue/10 text-blue-100" : syncNotice.status === "error" ? "border-slate-400/30 bg-white/[0.04] text-slate-200" : "border-white/10 bg-black/25 text-slate-400"}`}
          >
            <p className="leading-6">{syncNotice.message}</p>
            <button
              type="button"
              className="text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-200"
              onClick={() => setSyncNotice(null)}
            >
              Close
            </button>
          </div>
        ) : null}

        {logsLoading ? (
          <div className="rounded-3xl border border-white/10 bg-black/25 p-4 text-sm text-slate-400">
            Daily Logを取得しています。
          </div>
        ) : null}

        {logsError ? (
          <div className="rounded-3xl border border-slate-400/30 bg-white/[0.04] p-4 text-sm text-slate-200">
            {logsError}
          </div>
        ) : null}

        {activeTab === "dashboard" && (
          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="flex flex-col gap-8 md:flex-row md:items-center md:justify-around">
              {latestScores ? (
                <ScoreRing score={latestScores.total} label="Today Total" />
              ) : (
                <p>ログを作成してください。</p>
              )}
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                {latestScores &&
                  scoreKeys.map((key) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-white/10 bg-black/25 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          {scoreLabels[key]}
                        </span>
                        <span className="text-xl font-semibold text-white">
                          {latestScores[key]}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-shade-blue"
                          style={{ width: `${latestScores[key]}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">
                Today Comment
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                冷静に観察する
              </h2>
              <div className="mt-4 space-y-3">
                {latestScores ? (
                  getDashboardComments(latestScores).map((comment) => (
                    <p
                      key={comment}
                      className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-300"
                    >
                      {comment}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    最初のログを保存すると、固定ロジックの状態コメントが表示されます。
                  </p>
                )}
              </div>
            </Card>
            <PresenceTrend logs={orderedLogs} />
            <Card>
              <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">
                Quest Progress
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                {completedQuests}/{quests.length}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                見た目のスコアだけでなく、社会空間に入る行動を蓄積する。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {quests.slice(0, 4).map((quest) => (
                  <Pill key={quest.id} active={quest.completed}>
                    {quest.title}
                  </Pill>
                ))}
              </div>
            </Card>
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">
                  Recent Logs
                </h2>
                <Button onClick={() => setActiveTab("new")}>記録する</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {orderedLogs.slice(0, 4).map((log) => (
                  <LogCard
                    key={log.id}
                    log={log}
                    expanded={expandedLogId === log.id}
                    onToggle={() =>
                      setExpandedLogId(expandedLogId === log.id ? null : log.id)
                    }
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "new" && (
          <section className="space-y-5">
            <Card className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">
                  Create
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Daily Log
                </h2>
              </div>
              <div className="w-full md:w-56">
                <FieldLabel>日付</FieldLabel>
                <TextInput
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </Card>
            <Card className="grid gap-5 lg:grid-cols-[320px_1fr]">
              <LogPhotoView
                photo={form.photo}
                className="h-80 w-full"
                label="Photo preview"
              />
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">
                    Photo
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    顔・髪型・コーデ・雰囲気
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    画像はData
                    URLに変換してlocalStorageへ保存します。未登録でもログは保存できます。
                  </p>
                </div>
                <TextInput
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photoError ? (
                  <p className="text-sm text-blue-200">{photoError}</p>
                ) : null}
                {form.photo ? (
                  <Button
                    onClick={() => {
                      setSelectedPhotoFile(null);
                      setForm({ ...form, photo: undefined });
                    }}
                  >
                    写真を外す
                  </Button>
                ) : null}
              </div>
            </Card>
            <FormSection title="Face">
              <ScoreInput
                label="肌スコア"
                value={form.face.skin}
                onChange={(skin) =>
                  setForm({ ...form, face: { ...form.face, skin } })
                }
              />
              <ScoreInput
                label="髪スコア"
                value={form.face.hair}
                onChange={(hair) =>
                  setForm({ ...form, face: { ...form.face, hair } })
                }
              />
              <ScoreInput
                label="眉スコア"
                value={form.face.eyebrows}
                onChange={(eyebrows) =>
                  setForm({ ...form, face: { ...form.face, eyebrows } })
                }
              />
              <ScoreInput
                label="疲労感"
                value={form.face.fatigue}
                onChange={(fatigue) =>
                  setForm({ ...form, face: { ...form.face, fatigue } })
                }
              />
              <ScoreInput
                label="むくみ"
                value={form.face.puffiness}
                onChange={(puffiness) =>
                  setForm({ ...form, face: { ...form.face, puffiness } })
                }
              />
            </FormSection>
            <FormSection title="Body">
              <ToggleInput
                label="筋トレした"
                checked={form.body.trained}
                onChange={(trained) =>
                  setForm({ ...form, body: { ...form.body, trained } })
                }
              />
              <div>
                <FieldLabel>体重 optional</FieldLabel>
                <TextInput
                  type="number"
                  step="0.1"
                  placeholder="68.0"
                  value={form.body.weight ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      body: {
                        ...form.body,
                        weight: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
              <ScoreInput
                label="姿勢スコア"
                value={form.body.posture}
                onChange={(posture) =>
                  setForm({ ...form, body: { ...form.body, posture } })
                }
              />
            </FormSection>
            <FormSection title="Food">
              <ToggleInput
                label="お菓子を食べた"
                checked={form.food.sweets}
                onChange={(sweets) =>
                  setForm({ ...form, food: { ...form.food, sweets } })
                }
              />
              <ToggleInput
                label="ジュースを飲んだ"
                checked={form.food.juice}
                onChange={(juice) =>
                  setForm({ ...form, food: { ...form.food, juice } })
                }
              />
              <ToggleInput
                label="炭水化物控えめ"
                checked={form.food.lowCarb}
                onChange={(lowCarb) =>
                  setForm({ ...form, food: { ...form.food, lowCarb } })
                }
              />
              <ToggleInput
                label="野菜を食べた"
                checked={form.food.vegetables}
                onChange={(vegetables) =>
                  setForm({ ...form, food: { ...form.food, vegetables } })
                }
              />
              <div>
                <FieldLabel>水分量 optional (L)</FieldLabel>
                <TextInput
                  type="number"
                  step="0.1"
                  placeholder="2.0"
                  value={form.food.water ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      food: {
                        ...form.food,
                        water: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
            </FormSection>
            <FormSection title="Mind">
              <ScoreInput
                label="メンタルスコア"
                value={form.mind.mental}
                onChange={(mental) =>
                  setForm({ ...form, mind: { ...form.mind, mental } })
                }
              />
              <ScoreInput
                label="自信スコア"
                value={form.mind.confidence}
                onChange={(confidence) =>
                  setForm({ ...form, mind: { ...form.mind, confidence } })
                }
              />
              <ScoreInput
                label="ストレス"
                value={form.mind.stress}
                onChange={(stress) =>
                  setForm({ ...form, mind: { ...form.mind, stress } })
                }
              />
            </FormSection>
            <FormSection title="Presence">
              <ScoreInput
                label="黒服が似合っていた感覚"
                value={form.presence.blackFit}
                onChange={(blackFit) =>
                  setForm({ ...form, presence: { ...form.presence, blackFit } })
                }
              />
              <ScoreInput
                label="外出時の堂々感"
                value={form.presence.composedOutside}
                onChange={(composedOutside) =>
                  setForm({
                    ...form,
                    presence: { ...form.presence, composedOutside },
                  })
                }
              />
              <ScoreInput
                label="人目が気にならなかった度"
                value={form.presence.ignoredGaze}
                onChange={(ignoredGaze) =>
                  setForm({
                    ...form,
                    presence: { ...form.presence, ignoredGaze },
                  })
                }
              />
              <ScoreInput
                label="店に入りやすかった度"
                value={form.presence.enteredStores}
                onChange={(enteredStores) =>
                  setForm({
                    ...form,
                    presence: { ...form.presence, enteredStores },
                  })
                }
              />
            </FormSection>
            <Card className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Memo</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>今日のメモ</FieldLabel>
                  <TextArea
                    value={form.memo.note}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        memo: { ...form.memo, note: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <FieldLabel>今日の良かった点</FieldLabel>
                  <TextArea
                    value={form.memo.good}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        memo: { ...form.memo, good: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <FieldLabel>明日の修正点</FieldLabel>
                  <TextArea
                    value={form.memo.tomorrow}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        memo: { ...form.memo, tomorrow: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <Button
                onClick={saveLog}
                disabled={savingLog}
                className="w-full justify-center bg-shade-blue/25 py-2.5"
              >
                {savingLog ? "保存中" : "保存する"}
              </Button>
            </Card>
          </section>
        )}

        {activeTab === "quests" && (
          <section className="grid gap-4 md:grid-cols-2">
            {quests.map((quest) => (
              <Card key={quest.id} className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {quest.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <DifficultyBadge quest={quest} />
                      {quest.completed ? <Pill active>Done</Pill> : null}
                    </div>
                  </div>
                  {quest.completed ? (
                    <Button onClick={() => resetQuest(quest.id)}>Reset</Button>
                  ) : (
                    <Button onClick={() => startQuestMark(quest)}>Mark</Button>
                  )}
                </div>
                {quest.completed ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-300">
                    <p className="text-slate-500">
                      達成日: {quest.completedAt?.slice(0, 10) ?? "—"}
                    </p>
                    <p className="mt-1">{quest.completionMemo || "メモなし"}</p>
                  </div>
                ) : null}
                {markingQuestId === quest.id ? (
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <FieldLabel>達成メモ</FieldLabel>
                    <TextArea
                      placeholder="緊張したが入れた / 店員対応が普通で安心した"
                      value={questMemo}
                      onChange={(e) => setQuestMemo(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => completeQuest(quest.id)}
                        className="bg-shade-blue/20"
                      >
                        達成保存
                      </Button>
                      <Button onClick={() => setMarkingQuestId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            ))}
          </section>
        )}

        {activeTab === "logs" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">
                  Archive
                </p>
                <h2 className="text-3xl font-semibold text-white">Log一覧</h2>
              </div>
              <Button onClick={() => setActiveTab("new")}>新規ログ</Button>
            </div>
            <PresenceTrend logs={orderedLogs} />
            <Card className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">
                  Before / After
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  変化を横並びで見る
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <FieldLabel>Before</FieldLabel>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 outline-none"
                    value={compareBeforeId}
                    onChange={(e) => setCompareBeforeId(e.target.value)}
                  >
                    {orderedLogs.map((log) => (
                      <option key={log.id} value={log.id}>
                        {log.date}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>After</FieldLabel>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 outline-none"
                    value={compareAfterId}
                    onChange={(e) => setCompareAfterId(e.target.value)}
                  >
                    {orderedLogs.map((log) => (
                      <option key={log.id} value={log.id}>
                        {log.date}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ComparisonPanel before={beforeLog} after={afterLog} />
            </Card>
            <div className="space-y-4">
              {orderedLogs.map((log) => (
                <LogCard
                  key={log.id}
                  log={log}
                  expanded={expandedLogId === log.id}
                  onToggle={() =>
                    setExpandedLogId(expandedLogId === log.id ? null : log.id)
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
