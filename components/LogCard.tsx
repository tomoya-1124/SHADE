import { calculateScores } from "@/lib/scoring";
import type { DailyLog } from "@/lib/types";
import { Card, Pill } from "./ui";

export function LogCard({ log, expanded = false, onToggle }: { log: DailyLog; expanded?: boolean; onToggle?: () => void }) {
  const scores = calculateScores(log);

  return (
    <Card className="space-y-4">
      <button className="flex w-full items-center justify-between gap-4 text-left" onClick={onToggle} type="button">
        <div>
          <p className="text-sm text-slate-500">{log.date}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Presence Score {scores.total}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-2xl font-semibold text-white">{scores.total}</div>
      </button>
      <div className="flex flex-wrap gap-2">
        <Pill>Face {scores.face}</Pill>
        <Pill>Body {scores.body}</Pill>
        <Pill>Mind {scores.mind}</Pill>
        <Pill>Food {scores.food}</Pill>
        <Pill>Presence {scores.presence}</Pill>
      </div>
      {expanded ? (
        <div className="grid gap-4 border-t border-white/10 pt-4 text-sm text-slate-300 md:grid-cols-3">
          <div><span className="text-slate-500">Memo</span><p className="mt-1">{log.memo.note || "—"}</p></div>
          <div><span className="text-slate-500">Good</span><p className="mt-1">{log.memo.good || "—"}</p></div>
          <div><span className="text-slate-500">Tomorrow</span><p className="mt-1">{log.memo.tomorrow || "—"}</p></div>
        </div>
      ) : null}
    </Card>
  );
}
