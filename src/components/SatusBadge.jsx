import { cn } from "@/lib/utils";

// Color-coded badge for a ticket's queue status.
// waiting = amber, called = green, done = gray.
const STATUS_STYLES = {
  waiting: "bg-amber-100 text-amber-700 border-amber-200",
  called: "bg-emerald-100 text-emerald-700 border-emerald-200",
  done: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        STATUS_STYLES[status] || STATUS_STYLES.waiting
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}