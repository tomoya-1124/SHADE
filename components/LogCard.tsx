import { calculateScores } from "@/lib/scoring";
import type { DailyLog } from "@/lib/types";
import { LogPhotoView } from "./LogPhoto";
import { Card, Pill } from "./ui";

const scoreRows = [
  ["Face", "face"],
  ["Body", "body"],
  ["Mind", "mind"],
  ["Food", "food"],
  ["Presence", "presence"],
] as const;

function ValueRow({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "—";
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{display}</span>
    </div>
  );
}

export function LogCard({ log, expanded = false, onToggle }: { log: DailyLog; expanded?: boolean; onToggle?: () => void }) {
  const scores = calculateScores(log);

  return (
    <Card className="space-y-4">
      <button className="flex w-full items-center justify-between gap-4 text-left" onClick={onToggle} type="button">
        <div className="flex min-w-0 items-center gap-3">
          <LogPhotoView photo={log.photo} className="h-16 w-16 shrink-0" label="No image" />
          <div className="min-w-0">
            <p className="text-sm text-slate-500">{log.date}</p>
            <h3 className="mt-1 truncate text-lg font-semibold text-white">Presence Score {scores.total}</h3>
          </div>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-2xl font-semibold text-white">{scores.total}</div>
      </button>
      <div className="flex flex-wrap gap-2">
        {scoreRows.map(([label, key]) => <Pill key={key}>{label} {scores[key]}</Pill>)}
      </div>
      {expanded ? (
        <div className="space-y-5 border-t border-white/10 pt-4">
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <LogPhotoView photo={log.photo} className="h-72 w-full" label="No photo recorded" />
            <div className="grid gap-3 sm:grid-cols-2">
              <ValueRow label="肌" value={log.face.skin} />
              <ValueRow label="髪" value={log.face.hair} />
              <ValueRow label="眉" value={log.face.eyebrows} />
              <ValueRow label="疲労感" value={log.face.fatigue} />
              <ValueRow label="むくみ" value={log.face.puffiness} />
              <ValueRow label="筋トレ" value={log.body.trained} />
              <ValueRow label="体重" value={log.body.weight ? `${log.body.weight}kg` : undefined} />
              <ValueRow label="姿勢" value={log.body.posture} />
              <ValueRow label="お菓子" value={log.food.sweets} />
              <ValueRow label="ジュース" value={log.food.juice} />
              <ValueRow label="炭水化物控えめ" value={log.food.lowCarb} />
              <ValueRow label="野菜" value={log.food.vegetables} />
              <ValueRow label="水分量" value={log.food.water ? `${log.food.water}L` : undefined} />
              <ValueRow label="メンタル" value={log.mind.mental} />
              <ValueRow label="自信" value={log.mind.confidence} />
              <ValueRow label="ストレス" value={log.mind.stress} />
              <ValueRow label="黒服" value={log.presence.blackFit} />
              <ValueRow label="堂々感" value={log.presence.composedOutside} />
              <ValueRow label="人目" value={log.presence.ignoredGaze} />
              <ValueRow label="店に入りやすさ" value={log.presence.enteredStores} />
            </div>
          </div>
          <div className="grid gap-4 text-sm text-slate-300 md:grid-cols-3">
            <div><span className="text-slate-500">今日のメモ</span><p className="mt-1 leading-6">{log.memo.note || "—"}</p></div>
            <div><span className="text-slate-500">今日の良かった点</span><p className="mt-1 leading-6">{log.memo.good || "—"}</p></div>
            <div><span className="text-slate-500">明日の修正点</span><p className="mt-1 leading-6">{log.memo.tomorrow || "—"}</p></div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
