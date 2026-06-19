import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getEmployeeTypeLabel,
  type EmploymentReviewTimelineItem,
} from "@/lib/employee-employment";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB");
}

export function EmploymentHistoryCard({
  reviews,
}: {
  reviews: EmploymentReviewTimelineItem[];
}) {
  return (
    <Card
      id="employment-history"
      className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-sm"
    >
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">
          Employment History
        </CardTitle>
        <CardDescription className="text-slate-500">
          Newest review entries first, including the type transition and who
          performed the change.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5">
        {reviews.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Previous Type</TableHead>
                <TableHead>New Type</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium text-slate-900">
                    {formatDate(review.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200">
                      {review.actionLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>{getEmployeeTypeLabel(review.oldEmployeeType)}</TableCell>
                  <TableCell>{getEmployeeTypeLabel(review.newEmployeeType)}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-slate-600">
                    <span className="line-clamp-3">
                      {review.remarks || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {review.reviewedByName || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
            No employment reviews have been recorded for this employee yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
