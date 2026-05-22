"use client";

import * as React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeDocument } from "@/types";
import { Check, ExternalLink, X } from "lucide-react";

type DocumentReviewSheetProps = {
  document: EmployeeDocument | null;
  open: boolean;
  canReview: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: (id: string, status: "APPROVED" | "REJECTED", remark: string) => void;
};

function reviewBadgeClass(status: EmployeeDocument["reviewStatus"]) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function previewLabel(value: string) {
  return value.startsWith("data:") ? "Uploaded file preview" : "Open file";
}

function FilePreview({
  title,
  value,
}: {
  title: string;
  value?: string | null | undefined;
}) {
  if (!value) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {title}: not uploaded
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800"
        >
          {previewLabel(value)}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <Image
          src={value}
          alt={title}
          width={720}
          height={420}
          unoptimized
          className="h-56 w-full object-contain"
        />
      </div>
    </div>
  );
}

export function EmployeeDocumentReviewSheet({
  document,
  open,
  canReview,
  isSubmitting,
  onOpenChange,
  onReview,
}: DocumentReviewSheetProps) {
  const [remarkByDocument, setRemarkByDocument] = React.useState<
    Record<string, string>
  >({});

  const status = document?.reviewStatus ?? "PENDING";
  const pending = status === "PENDING";
  const educationEntries = document?.educationEntries ?? [];
  const experienceEntries = document?.experienceEntries ?? [];
  const activeRemark =
    document?.id
      ? (remarkByDocument[document.id] ?? document.reviewRemark ?? "")
      : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:!max-w-3xl">
        <SheetHeader className="space-y-3 pr-10">
          <div className="flex flex-wrap items-center gap-3">
            <SheetTitle className="text-xl">
              {document?.ownerName || document?.employeeName || document?.candidateName || "Document"}
            </SheetTitle>
            <Badge className={reviewBadgeClass(status)}>{status}</Badge>
          </div>
          <SheetDescription>
            Review the uploaded identity files, education proofs, and experience
            attachments before approving or rejecting the record.
          </SheetDescription>
        </SheetHeader>

        {document ? (
          <div className="space-y-6 p-4 pt-0">
            <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="text-slate-500">
                  {document.documentOwnerType === "EMPLOYEE"
                    ? "Employee ID"
                    : "Request ID"}
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {document.ownerCode || document.employeeCode || document.applicantCode || "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  {document.documentOwnerType === "EMPLOYEE"
                    ? "Employee Name"
                    : "Candidate Name"}
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {document.ownerName || document.employeeName || document.candidateName || "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Experience Type</p>
                <p className="mt-1 font-medium text-slate-900">
                  {document.experienceType.replaceAll("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Review Remark</p>
                <p className="mt-1 font-medium text-slate-900">
                  {document.reviewRemark || "-"}
                </p>
              </div>
              {document.documentOwnerType === "APPLICANT" && document.linkedEmployeeCode ? (
                <div>
                  <p className="text-slate-500">Linked Employee</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.linkedEmployeeName} ({document.linkedEmployeeCode})
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-slate-500">Last Updated</p>
                <p className="mt-1 font-medium text-slate-900">
                  {document.updatedAt
                    ? new Date(document.updatedAt).toLocaleString("en-IN")
                    : "-"}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Identity documents
                </h3>
              </div>
              <div className="grid gap-4">
                <FilePreview title="Aadhaar Card" value={document.aadhaarFileUrl ?? null} />
                <FilePreview title="PAN Card" value={document.panFileUrl ?? null} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Education entries
              </h3>
              <div className="space-y-3">
                {educationEntries.length ? (
                  educationEntries.map((entry, index) => (
                    <div
                      key={`${entry.degree || "education"}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase text-slate-500">Degree</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {entry.degree || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-500">College</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {entry.college || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-500">Year</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {entry.year || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-500">Marks</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {typeof entry.marks === "number" ? entry.marks : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <FilePreview
                          title={`Marksheet ${index + 1}`}
                          value={entry.marksheetFileUrl ?? null}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No education records uploaded.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Experience entries
              </h3>
              <div className="space-y-3">
                {experienceEntries.length ? (
                  experienceEntries.map((entry, index) => (
                    <div
                      key={`${entry.previousCompanyName || "experience"}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            Total Experience
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {entry.totalExperience || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            Previous Company
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {entry.previousCompanyName || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4">
                        <FilePreview
                          title={`Experience Letter ${index + 1}`}
                          value={entry.experienceLetterFileUrl ?? null}
                        />
                        <FilePreview
                          title={`Salary Slip 1 ${index + 1}`}
                          value={entry.salarySlip1FileUrl ?? null}
                        />
                        <FilePreview
                          title={`Salary Slip 2 ${index + 1}`}
                          value={entry.salarySlip2FileUrl ?? null}
                        />
                        <FilePreview
                          title={`Salary Slip 3 ${index + 1}`}
                          value={entry.salarySlip3FileUrl ?? null}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No experience records uploaded.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Review note
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add a short approval or rejection note for the applicant.
                </p>
              </div>
              <Textarea
                value={activeRemark}
                onChange={(event) => {
                  if (!document?.id) return;

                  setRemarkByDocument((current) => ({
                    ...current,
                    [document.id!]: event.target.value,
                  }));
                }}
                placeholder="Write a review remark"
                className="min-h-28 rounded-2xl"
                disabled={!canReview || !pending || isSubmitting}
              />
            </section>
          </div>
        ) : null}

        {document && canReview && pending && (
          <div className="border-t border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting}
                onClick={() =>
                  onReview(document.id!, "APPROVED", activeRemark)
                }
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                disabled={isSubmitting}
                onClick={() =>
                  onReview(document.id!, "REJECTED", activeRemark)
                }
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
