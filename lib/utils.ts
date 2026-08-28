export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatRate(min?: number | null, max?: number | null) {
  if (!min && !max) return "—";
  if (min && max) return `$${min}–$${max}/hr`;
  return `$${min || max}/hr`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
};
export function priorityColor(p: string) {
  return PRIORITY_COLORS[p] || "bg-slate-100 text-slate-600";
}

const REQUIREMENT_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  FILLED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-600",
};
export function requirementStatusColor(s: string) {
  return REQUIREMENT_STATUS_COLORS[s] || "bg-slate-100 text-slate-600";
}

const SUBMISSION_STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-600",
  INTERNAL_REVIEW: "bg-slate-100 text-slate-600",
  SUBMITTED_TO_CLIENT: "bg-blue-100 text-blue-700",
  INTERVIEW_SCHEDULED: "bg-indigo-100 text-indigo-700",
  INTERVIEWED: "bg-indigo-100 text-indigo-700",
  OFFER: "bg-purple-100 text-purple-700",
  PLACED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-slate-100 text-slate-500",
};
export function submissionStatusColor(s: string) {
  return SUBMISSION_STATUS_COLORS[s] || "bg-slate-100 text-slate-600";
}

export function humanize(s: string) {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
