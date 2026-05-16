import type { LogPhoto } from "@/lib/types";

export function LogPhotoView({
  photo,
  label = "No photo",
  className = "",
}: {
  photo?: LogPhoto;
  label?: string;
  className?: string;
}) {
  const src = photo?.signedUrl || photo?.publicUrl || photo?.dataUrl;

  if (!src) {
    return (
      <div
        className={`grid place-items-center rounded-3xl border border-dashed border-white/10 bg-black/25 text-center text-xs uppercase tracking-[0.22em] text-slate-600 ${className}`}
      >
        {label}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={photo?.name || "Daily log photo"}
      className={`rounded-3xl border border-white/10 object-cover ${className}`}
    />
  );
}
