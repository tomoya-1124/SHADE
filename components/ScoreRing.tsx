export function ScoreRing({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const dimension = size === "lg" ? "h-32 w-32" : "h-20 w-20";
  const text = size === "lg" ? "text-4xl" : "text-xl";
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${dimension} grid place-items-center rounded-full border border-white/10 bg-[conic-gradient(from_210deg,var(--tw-gradient-stops))] from-shade-blue via-slate-500 to-white/10 p-[1px]`}
        style={{ background: `conic-gradient(from 220deg, #6c8cff ${score * 3.6}deg, rgba(255,255,255,0.09) 0deg)` }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-shade-charcoal">
          <span className={`${text} font-semibold text-white`}>{score}</span>
        </div>
      </div>
      <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</span>
    </div>
  );
}
