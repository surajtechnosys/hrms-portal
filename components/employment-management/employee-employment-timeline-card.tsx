import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getEmployeeTypeLabel,
  getEmploymentReviewActionLabel,
} from "@/lib/employee-employment";
import type { EmploymentReview } from "@prisma/client";

const formatDate = (value?: Date | null) =>
  value ? value.toLocaleDateString("en-GB") : "-";

export function EmployeeEmploymentTimelineCard({
  reviews,
}: {
  reviews: EmploymentReview[];
}) {
  return (
    <Card
      id="employment-timeline"
      className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-sm"
    >
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">
          Employment Timeline
        </CardTitle>
        <CardDescription className="text-slate-500">
          Newest employment changes first.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5">
        {reviews.length ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(review.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {getEmploymentReviewActionLabel(review.action)}
                    </p>
                  </div>
                  <Badge className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100">
                    {review.reviewedByName || "Unknown"}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Previous Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {getEmployeeTypeLabel(review.oldEmployeeType)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      New Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {getEmployeeTypeLabel(review.newEmployeeType)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Previous End Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(review.oldEndDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      New End Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(review.newEndDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Remarks
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                      {review.remarks || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Performed By
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {review.reviewedByName || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No employment history is available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
