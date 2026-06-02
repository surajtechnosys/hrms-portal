export const DOCUMENT_REVIEW_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REUPLOAD_REQUESTED",
] as const;

export type DocumentReviewStatus =
  (typeof DOCUMENT_REVIEW_STATUSES)[number];

export function formatDocumentReviewStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function getDocumentReviewBadgeClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  if (status === "REUPLOAD_REQUESTED") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}
