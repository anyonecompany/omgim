import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  indeterminate = false,
  className,
}: {
  value?: number;
  indeterminate?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-grey-100",
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : pct}
    >
      {indeterminate ? (
        <span className="absolute inset-y-0 left-0 w-1/3 animate-[omgim-indeterminate_1.6s_ease-in-out_infinite] rounded-full bg-brand" />
      ) : (
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-200 ease-[var(--ease-standard)]"
          style={{ width: `${pct}%` }}
        />
      )}
      <style>{`
        @keyframes omgim-indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
