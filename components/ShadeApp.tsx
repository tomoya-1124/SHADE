"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { calculateScores, sortLogsByDate } from "@/lib/scoring";
import { defaultQuests, LOGS_KEY, QUESTS_KEY, sampleLogs } from "@/lib/storage";
import type { DailyLog, Quest, Score } from "@/lib/types";
import { LogCard } from "./LogCard";
import { ScoreRing } from "./ScoreRing";
import { Button, Card, FieldLabel, Pill, TextArea, TextInput } from "./ui";

type Tab = "dashboard" | "new" | "quests" | "logs";

type FormState = Omit<DailyLog, "id" | "createdAt">;

const today = () => new Date().toISOString().slice(0, 10);
const scoreOptions: Score[] = [1, 2, 3, 4, 5];

const initialForm = (): FormState => ({
  date: today(),
  face: { skin: 3, hair: 3, eyebrows: 3, fatigue: 3, puffiness: 3 },
  body: { trained: false, weight: undefined, posture: 3 },
  food: { sweets: false, juice: false, lowCarb: false, vegetables: false, water: undefined },
  mind: { mental: 3, confidence: 3, stress: 3 },
  presence: { blackFit: 3, composedOutside: 3, ignoredGaze: 3, enteredStores: 3 },
  memo: { note: "", good: "", tomorrow: "" },
});

function ScoreInput({ label, value, onChange }: { label: string; value: Score; onChange: (value: Score) => void }) {
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

function ToggleInput({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${checked ? "border-shade-blue/60 bg-shade-blue/15 text-white" : "border-white/10 bg-black/20 text-slate-400"}`}
    >
      <span>{label}</span>
      <span className="text-xs uppercase tracking-[0.2em]">{checked ? "Yes" : "No"}</span>
    </button>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">Daily Log</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

export default function ShadeApp() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [quests, setQuests] = useState<Quest[]>(defaultQuests);
  const [form, setForm] = useState<FormState>(initialForm);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedLogs = window.localStorage.getItem(LOGS_KEY);
    const storedQuests = window.localStorage.getItem(QUESTS_KEY);
    setLogs(storedLogs ? JSON.parse(storedLogs) : sampleLogs);
    setQuests(storedQuests ? JSON.parse(storedQuests) : defaultQuests);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [hydrated, logs]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
  }, [hydrated, quests]);

  const orderedLogs = useMemo(() => sortLogsByDate(logs), [logs]);
  const latestLog = orderedLogs[0];
  const latestScores = latestLog ? calculateScores(latestLog) : null;
  const completedQuests = quests.filter((quest) => quest.completed).length;

  const saveLog = () => {
    const log: DailyLog = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLogs((current) => [log, ...current.filter((item) => item.date !== log.date)]);
    setForm(initialForm());
    setActiveTab("dashboard");
  };

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
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-black/30 p-6 backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-shade-blue">SHADE</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">Presenceを静かに研磨する。</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">美容、外見、生活習慣、行動変化を都市の夜のようなダークUIで記録する自己管理MVP。</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button key={item.id} onClick={() => setActiveTab(item.id)} className={activeTab === item.id ? "border-shade-blue/60 bg-shade-blue/20" : ""}>
                {item.label}
              </Button>
            ))}
          </nav>
        </header>

        {activeTab === "dashboard" && (
          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="flex flex-col gap-8 md:flex-row md:items-center md:justify-around">
              {latestScores ? <ScoreRing score={latestScores.total} label="Today Total" /> : <p>ログを作成してください。</p>}
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                {latestScores && [
                  ["Face", latestScores.face], ["Body", latestScores.body], ["Mind", latestScores.mind], ["Food", latestScores.food], ["Presence", latestScores.presence],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><span className="text-xl font-semibold text-white">{value}</span></div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-shade-blue" style={{ width: `${value}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">Quest Progress</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{completedQuests}/{quests.length}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">見た目のスコアだけでなく、社会空間に入る行動を蓄積する。</p>
              <div className="mt-5 flex flex-wrap gap-2">{quests.slice(0, 4).map((quest) => <Pill key={quest.id} active={quest.completed}>{quest.title}</Pill>)}</div>
            </Card>
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold text-white">Recent Logs</h2><Button onClick={() => setActiveTab("new")}>記録する</Button></div>
              <div className="grid gap-4 md:grid-cols-2">{orderedLogs.slice(0, 4).map((log) => <LogCard key={log.id} log={log} />)}</div>
            </div>
          </section>
        )}

        {activeTab === "new" && (
          <section className="space-y-5">
            <Card className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div><p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">Create</p><h2 className="mt-2 text-3xl font-semibold text-white">Daily Log</h2></div>
              <div className="w-full md:w-56"><FieldLabel>日付</FieldLabel><TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </Card>
            <FormSection title="Face">
              <ScoreInput label="肌スコア" value={form.face.skin} onChange={(skin) => setForm({ ...form, face: { ...form.face, skin } })} />
              <ScoreInput label="髪スコア" value={form.face.hair} onChange={(hair) => setForm({ ...form, face: { ...form.face, hair } })} />
              <ScoreInput label="眉スコア" value={form.face.eyebrows} onChange={(eyebrows) => setForm({ ...form, face: { ...form.face, eyebrows } })} />
              <ScoreInput label="疲労感" value={form.face.fatigue} onChange={(fatigue) => setForm({ ...form, face: { ...form.face, fatigue } })} />
              <ScoreInput label="むくみ" value={form.face.puffiness} onChange={(puffiness) => setForm({ ...form, face: { ...form.face, puffiness } })} />
            </FormSection>
            <FormSection title="Body">
              <ToggleInput label="筋トレした" checked={form.body.trained} onChange={(trained) => setForm({ ...form, body: { ...form.body, trained } })} />
              <div><FieldLabel>体重 optional</FieldLabel><TextInput type="number" step="0.1" placeholder="68.0" value={form.body.weight ?? ""} onChange={(e) => setForm({ ...form, body: { ...form.body, weight: e.target.value ? Number(e.target.value) : undefined } })} /></div>
              <ScoreInput label="姿勢スコア" value={form.body.posture} onChange={(posture) => setForm({ ...form, body: { ...form.body, posture } })} />
            </FormSection>
            <FormSection title="Food">
              <ToggleInput label="お菓子を食べた" checked={form.food.sweets} onChange={(sweets) => setForm({ ...form, food: { ...form.food, sweets } })} />
              <ToggleInput label="ジュースを飲んだ" checked={form.food.juice} onChange={(juice) => setForm({ ...form, food: { ...form.food, juice } })} />
              <ToggleInput label="炭水化物控えめ" checked={form.food.lowCarb} onChange={(lowCarb) => setForm({ ...form, food: { ...form.food, lowCarb } })} />
              <ToggleInput label="野菜を食べた" checked={form.food.vegetables} onChange={(vegetables) => setForm({ ...form, food: { ...form.food, vegetables } })} />
              <div><FieldLabel>水分量 optional (L)</FieldLabel><TextInput type="number" step="0.1" placeholder="2.0" value={form.food.water ?? ""} onChange={(e) => setForm({ ...form, food: { ...form.food, water: e.target.value ? Number(e.target.value) : undefined } })} /></div>
            </FormSection>
            <FormSection title="Mind">
              <ScoreInput label="メンタルスコア" value={form.mind.mental} onChange={(mental) => setForm({ ...form, mind: { ...form.mind, mental } })} />
              <ScoreInput label="自信スコア" value={form.mind.confidence} onChange={(confidence) => setForm({ ...form, mind: { ...form.mind, confidence } })} />
              <ScoreInput label="ストレス" value={form.mind.stress} onChange={(stress) => setForm({ ...form, mind: { ...form.mind, stress } })} />
            </FormSection>
            <FormSection title="Presence">
              <ScoreInput label="黒服が似合っていた感覚" value={form.presence.blackFit} onChange={(blackFit) => setForm({ ...form, presence: { ...form.presence, blackFit } })} />
              <ScoreInput label="外出時の堂々感" value={form.presence.composedOutside} onChange={(composedOutside) => setForm({ ...form, presence: { ...form.presence, composedOutside } })} />
              <ScoreInput label="人目が気にならなかった度" value={form.presence.ignoredGaze} onChange={(ignoredGaze) => setForm({ ...form, presence: { ...form.presence, ignoredGaze } })} />
              <ScoreInput label="店に入りやすかった度" value={form.presence.enteredStores} onChange={(enteredStores) => setForm({ ...form, presence: { ...form.presence, enteredStores } })} />
            </FormSection>
            <Card className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Memo</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div><FieldLabel>今日のメモ</FieldLabel><TextArea value={form.memo.note} onChange={(e) => setForm({ ...form, memo: { ...form.memo, note: e.target.value } })} /></div>
                <div><FieldLabel>今日の良かった点</FieldLabel><TextArea value={form.memo.good} onChange={(e) => setForm({ ...form, memo: { ...form.memo, good: e.target.value } })} /></div>
                <div><FieldLabel>明日の修正点</FieldLabel><TextArea value={form.memo.tomorrow} onChange={(e) => setForm({ ...form, memo: { ...form.memo, tomorrow: e.target.value } })} /></div>
              </div>
              <Button onClick={saveLog} className="w-full justify-center bg-shade-blue/25 py-3">保存する</Button>
            </Card>
          </section>
        )}

        {activeTab === "quests" && (
          <section className="grid gap-4 md:grid-cols-2">
            {quests.map((quest) => (
              <Card key={quest.id} className="flex items-center justify-between gap-4">
                <div><p className="text-lg font-semibold text-white">{quest.title}</p><p className="mt-1 text-sm text-shade-silver">{quest.stars}{quest.completedAt ? ` / ${quest.completedAt.slice(0, 10)}` : ""}</p></div>
                <Button onClick={() => setQuests((current) => current.map((item) => item.id === quest.id ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined } : item))} className={quest.completed ? "border-shade-blue/60 bg-shade-blue/20" : ""}>{quest.completed ? "Done" : "Mark"}</Button>
              </Card>
            ))}
          </section>
        )}

        {activeTab === "logs" && (
          <section className="space-y-4">
            <h2 className="text-3xl font-semibold text-white">Log一覧</h2>
            {orderedLogs.map((log) => <LogCard key={log.id} log={log} expanded={expandedLogId === log.id} onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)} />)}
          </section>
        )}
      </div>
    </main>
  );
}
