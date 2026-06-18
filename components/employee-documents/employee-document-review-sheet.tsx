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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeDocument } from "@/types";
import type { DocumentReviewStatus } from "@/lib/document-review";
import {
  Check,
  ExternalLink,
  FileText,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";

import {
  DOCUMENT_VERIFICATION_STATUSES,
  type DocumentVerificationStatus,
  formatDocumentVerificationStatus,
  getDocumentVerificationBadgeClass,
  getNextDocumentOverallStatus,
  getReviewableDocumentSections,
  REVIEWABLE_DOCUMENT_FIELDS,
} from "@/lib/employee-document-review";

type DocumentReviewSheetProps = {
  document: EmployeeDocument | null;
  open: boolean;
  canReview: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: (
    id: string,
    input: {
      reviewRemark: string;
      overallStatus: DocumentReviewStatus;
      statusUpdates: Record<string, DocumentVerificationStatus>;
    },
  ) => void;
};

type ReviewEntry = {
  key: string;
  statusKey: string;
  label: string;
  section: string;
  previewKind: "image" | "file";
  fileUrl: string;
  status: DocumentVerificationStatus;
  uploaded: boolean;
};

function buildInitialStatuses(document: EmployeeDocument | null) {
  if (!document) {
    return {};
  }

  return REVIEWABLE_DOCUMENT_FIELDS.reduce(
    (accumulator, field) => {
      const currentStatus = document[
        field.statusKey as keyof EmployeeDocument
      ] as DocumentVerificationStatus | undefined;

      accumulator[field.statusKey] = currentStatus ?? "PENDING_REVIEW";
      return accumulator;
    },
    {} as Record<string, DocumentVerificationStatus>,
  );
}

function previewLinkLabel() {
  return "Open file";
}

function isImagePreview(field: ReviewEntry) {
  return (
    field.previewKind === "image" ||
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(field.fileUrl)
  );
}

function ReviewableFileCard({
  field,
  canReview,
  isSubmitting,
  onStatusChange,
}: {
  field: ReviewEntry;
  canReview: boolean;
  isSubmitting: boolean;
  onStatusChange: (statusKey: string, status: DocumentVerificationStatus) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{field.label}</p>
          <p className="mt-1 text-xs text-slate-500">
            {field.uploaded ? "Uploaded file available for verification" : "Not uploaded yet"}
          </p>
        </div>
        <Badge className={getDocumentVerificationBadgeClass(field.status)}>
          {formatDocumentVerificationStatus(field.status)}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {field.uploaded ? (
          isImagePreview(field) ? (
            <Image
              src={field.fileUrl}
              alt={field.label}
              width={960}
              height={540}
              unoptimized
              className="h-56 w-full rounded-2xl border border-slate-200 object-contain bg-slate-50"
            />
          ) : (
            <a
              href={field.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-700"
            >
              <FileText className="h-4 w-4" />
              {previewLinkLabel()}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No file uploaded for this document.
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Verification status
          </p>
          <Select
            value={field.status}
            onValueChange={(value) =>
              onStatusChange(field.statusKey, value as DocumentVerificationStatus)
            }
            disabled={!canReview || isSubmitting}
          >
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_VERIFICATION_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatDocumentVerificationStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
  const [draftStatuses, setDraftStatuses] = React.useState<
    Record<string, DocumentVerificationStatus>
  >(buildInitialStatuses(document));
  const [draftRemark, setDraftRemark] = React.useState(
    document?.reviewRemark ?? "",
  );

  const reviewEntries = React.useMemo<ReviewEntry[]>(() => {
    if (!document) {
      return [];
    }

    return REVIEWABLE_DOCUMENT_FIELDS.map((field) => {
      const fileUrl = String(
        document[field.key as keyof EmployeeDocument] ?? "",
      );
      const status =
        draftStatuses[field.statusKey] ||
        (document[field.statusKey as keyof EmployeeDocument] as DocumentVerificationStatus) ||
        "PENDING_REVIEW";

      return {
        ...field,
        fileUrl,
        status,
        uploaded: Boolean(fileUrl.trim()),
      };
    });
  }, [draftStatuses, document]);

  const reviewableEntries = reviewEntries.filter(
    (entry) => entry.uploaded || entry.status !== "PENDING_REVIEW",
  );
  const pendingEntries = reviewableEntries.filter(
    (entry) => entry.status === "PENDING_REVIEW",
  );
  const overallStatus = getNextDocumentOverallStatus(
    reviewableEntries.map((entry) => entry.status),
  );
  const sections = getReviewableDocumentSections();
  const activeRemark = draftRemark ?? document?.reviewRemark ?? "";
  const canSubmitReview =
    !!document &&
    canReview &&
    !isSubmitting &&
    reviewableEntries.length > 0 &&
    pendingEntries.length === 0;

  const submitReview = () => {
    if (!document) {
      return;
    }

    onReview(document.id!, {
      reviewRemark: activeRemark,
      overallStatus,
      statusUpdates: reviewEntries.reduce((accumulator, entry) => {
        accumulator[entry.statusKey] = entry.status;
        return accumulator;
      }, {} as Record<string, DocumentVerificationStatus>),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:!max-w-5xl">
        <SheetHeader className="space-y-3 pr-10">
          <div className="flex flex-wrap items-center gap-3">
            <SheetTitle className="text-xl">
              {document?.ownerName ||
                document?.employeeName ||
                document?.candidateName ||
                "Document"}
            </SheetTitle>
            <Badge
              className={getDocumentVerificationBadgeClass(
                document?.reviewStatus ?? "PENDING",
              )}
            >
              {document?.reviewStatus ?? "PENDING"}
            </Badge>
            <Badge className={getDocumentVerificationBadgeClass(overallStatus)}>
              Live: {overallStatus}
            </Badge>
          </div>
          <SheetDescription>
            Review each uploaded document individually, then submit the final
            outcome so the applicant can be notified by email.
          </SheetDescription>
        </SheetHeader>

        {document ? (
          <div className="space-y-6 p-4 pt-0">
            <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="text-slate-500">
                  {document.documentOwnerType === "EMPLOYEE"
                    ? "Employee ID"
                    : "Applicant ID"}
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {document.ownerCode ||
                    document.employeeCode ||
                    document.applicantCode ||
                    document.applicantId ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  {document.documentOwnerType === "EMPLOYEE"
                    ? "Employee Name"
                    : "Candidate Name"}
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {document.ownerName ||
                    document.employeeName ||
                    document.candidateName ||
                    "-"}
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
              {document.documentOwnerType === "APPLICANT" &&
              document.linkedEmployeeCode ? (
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
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Personal information
              </h3>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Date of Birth</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.dateOfBirth || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Gender</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.gender || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Mobile Number</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.mobileNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Marital Status</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.maritalStatus || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Nationality</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.nationality || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Applied Position</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.appliedPosition || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Qualification</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.qualification || "-"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Address information
              </h3>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-slate-500">Current Address</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.currentAddress || "-"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-slate-500">Permanent Address</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.permanentAddress || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">City</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.city || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">State</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.state || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Postal Code</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.postalCode || "-"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Declaration
              </h3>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:grid-cols-3">
                <div>
                  <p className="text-slate-500">Information Accurate</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.declarationInfoAccurate ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Verification Authorized</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.declarationAuthorizeVerification ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Policies Accepted</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {document.declarationAgreePolicies ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </section>

            {sections.map((section) => {
              const fields = reviewEntries.filter(
                (entry) => entry.section === section.title,
              );

              if (!fields.length) {
                return null;
              }

              return (
                <section key={section.title} className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {section.title}
                  </h3>
                  <div className="grid gap-4">
                    {fields.map((field) => (
                      <ReviewableFileCard
                        key={field.key}
                        field={field}
                        canReview={canReview}
                        isSubmitting={isSubmitting}
                        onStatusChange={(statusKey, status) =>
                          setDraftStatuses((current) => ({
                            ...current,
                            [statusKey]: status,
                          }))
                        }
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Review note
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add a short approval, rejection, or reupload remark for the applicant.
                  </p>
                </div>
                <Badge className={getDocumentVerificationBadgeClass(overallStatus)}>
                  Final outcome: {overallStatus}
                </Badge>
              </div>
              <Textarea
                value={activeRemark}
                onChange={(event) => setDraftRemark(event.target.value)}
                placeholder="Write a review remark"
                className="min-h-28 rounded-2xl"
                disabled={!canReview || isSubmitting}
              />
              {pendingEntries.length > 0 ? (
                <p className="text-sm text-amber-700">
                  {pendingEntries.length} uploaded document
                  {pendingEntries.length > 1 ? "s are" : " is"} still pending
                  review.
                </p>
              ) : null}
            </section>
          </div>
        ) : null}

        {document && canReview && (
          <div className="border-t border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!canSubmitReview}
                onClick={submitReview}
              >
                <Check className="mr-2 h-4 w-4" />
                Submit Review
              </Button>
              {document.reviewStatus === "APPROVED" &&
              !document.linkedEmployeeId ? (
                <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
                  <Link
                    href={`/employee-profiles/create?applicantDocumentId=${document.id}`}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Employee Profile
                  </Link>
                </Button>
              ) : document.reviewStatus === "APPROVED" &&
                document.linkedEmployeeId ? (
                <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                  {document.linkedEmployeeCode
                    ? `Linked to ${document.linkedEmployeeCode}`
                    : "Converted"}
                </div>
              ) : null}
              <Button
                variant="destructive"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
