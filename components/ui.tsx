import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-glow backdrop-blur sm:p-5 ${className}`}>{children}</section>;
}

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white transition hover:border-shade-blue/50 hover:bg-shade-blue/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">{children}</label>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-slate-200 placeholder:text-slate-600 focus:border-shade-blue/60"
      {...props}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-shade-blue/60"
      {...props}
    />
  );
}

export function Pill({ children, active = false, className = "" }: { children: ReactNode; active?: boolean; className?: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${active ? "border-shade-blue/60 bg-shade-blue/15 text-blue-100" : "border-white/10 bg-white/5 text-slate-400"} ${className}`}>
      {children}
    </span>
  );
}
