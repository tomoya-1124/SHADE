import type { DailyLog } from "@/lib/types";
import { getPresenceTrend } from "@/lib/scoring";
import { Card } from "./ui";

export function PresenceTrend({ logs }: { logs: DailyLog[] }) {
  const trend = getPresenceTrend(logs, 7);
  const max = Math.max(100, ...trend.map((item) => item.score));

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-shade-blue/80">Presence Trend</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">直近{trend.length || 0}件の推移</h2>
      </div>
      {trend.length ? (
        <div className="flex h-40 items-end gap-2 rounded-3xl border border-white/10 bg-black/20 p-4 sm:gap-3">
          {trend.map((item) => (
            <div key={item.date} className="flex h-full flex-1 flex-col justify-end gap-2">
              <div className="flex flex-1 items-end rounded-full bg-white/[0.04] p-1">
                <div
                  className="w-full rounded-full bg-gradient-to-t from-shade-blue/70 to-slate-200/80"
                  style={{ height: `${Math.max(8, (item.score / max) * 100)}%` }}
                  title={`Presence ${item.score}`}
                />
              </div>
              <div className="text-center text-[10px] text-slate-500">{item.date}</div>
              <div className="text-center text-xs font-semibold text-slate-200">{item.score}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-slate-500">ログを作成するとPresenceの推移が表示されます。</p>
      )}
    </Card>
  );
}
