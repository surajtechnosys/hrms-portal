import type { DocumentReviewStatus } from "./document-review";

export const DOCUMENT_VERIFICATION_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "REUPLOAD_REQUESTED",
] as const;

export type DocumentVerificationStatus =
  (typeof DOCUMENT_VERIFICATION_STATUSES)[number];

export type ReviewableDocumentField = {
  key: string;
  statusKey: string;
  label: string;
  section: string;
  previewKind: "image" | "file";
};

export const REVIEWABLE_DOCUMENT_FIELDS: ReviewableDocumentField[] = [
  {
    key: "passportPhotoFileUrl",
    statusKey: "passportPhotoStatus",
    label: "Passport Photograph",
    section: "Identity documents",
    previewKind: "image",
  },
  {
    key: "aadhaarFileUrl",
    statusKey: "aadhaarStatus",
    label: "Aadhaar Card",
    section: "Identity documents",
    previewKind: "file",
  },
  {
    key: "panFileUrl",
    statusKey: "panStatus",
    label: "PAN Card",
    section: "Identity documents",
    previewKind: "file",
  },
  {
    key: "passportFileUrl",
    statusKey: "passportStatus",
    label: "Passport",
    section: "Identity documents",
    previewKind: "file",
  },
  {
    key: "drivingLicenseFileUrl",
    statusKey: "drivingLicenseStatus",
    label: "Driving License",
    section: "Identity documents",
    previewKind: "file",
  },
  {
    key: "voterIdFileUrl",
    statusKey: "voterIdStatus",
    label: "Voter ID",
    section: "Identity documents",
    previewKind: "file",
  },
  {
    key: "addressProofFileUrl",
    statusKey: "addressProofStatus",
    label: "Address Proof",
    section: "Identity documents",
    previewKind: "file",
  },
  {
    key: "class10MarksheetFileUrl",
    statusKey: "class10MarksheetStatus",
    label: "Class 10 Marksheet",
    section: "Education documents",
    previewKind: "file",
  },
  {
    key: "class12MarksheetFileUrl",
    statusKey: "class12MarksheetStatus",
    label: "Class 12 Marksheet",
    section: "Education documents",
    previewKind: "file",
  },
  {
    key: "highestQualificationFileUrl",
    statusKey: "highestQualificationStatus",
    label: "Highest Qualification Degree / Certificate",
    section: "Education documents",
    previewKind: "file",
  },
  {
    key: "additionalDegreesFileUrl",
    statusKey: "additionalDegreesStatus",
    label: "Additional Degrees",
    section: "Education documents",
    previewKind: "file",
  },
  {
    key: "professionalCertificationsFileUrl",
    statusKey: "professionalCertificationsStatus",
    label: "Professional Certifications",
    section: "Education documents",
    previewKind: "file",
  },
  {
    key: "experienceLetterFileUrl",
    statusKey: "experienceLetterStatus",
    label: "Experience Letter",
    section: "Experience documents",
    previewKind: "file",
  },
  {
    key: "relievingLetterFileUrl",
    statusKey: "relievingLetterStatus",
    label: "Relieving Letter",
    section: "Experience documents",
    previewKind: "file",
  },
  {
    key: "salarySlip1FileUrl",
    statusKey: "salarySlipsStatus",
    label: "Salary Slip 1",
    section: "Experience documents",
    previewKind: "file",
  },
  {
    key: "salarySlip2FileUrl",
    statusKey: "salarySlipsStatus",
    label: "Salary Slip 2",
    section: "Experience documents",
    previewKind: "file",
  },
  {
    key: "salarySlip3FileUrl",
    statusKey: "salarySlipsStatus",
    label: "Salary Slip 3",
    section: "Experience documents",
    previewKind: "file",
  },
  {
    key: "previousOfferLetterFileUrl",
    statusKey: "previousOfferLetterStatus",
    label: "Previous Offer Letter",
    section: "Experience documents",
    previewKind: "file",
  },
  {
    key: "promotionAppraisalLettersFileUrl",
    statusKey: "promotionAppraisalLettersStatus",
    label: "Promotion / Appraisal Letters",
    section: "Experience documents",
    previewKind: "file",
  },
  {
    key: "bankProofFileUrl",
    statusKey: "bankProofStatus",
    label: "Bank Proof",
    section: "Banking documents",
    previewKind: "file",
  },
  {
    key: "pfPassbookFileUrl",
    statusKey: "pfPassbookStatus",
    label: "PF Passbook",
    section: "PF / UAN documents",
    previewKind: "file",
  },
  {
    key: "pfTransferDocumentsFileUrl",
    statusKey: "pfTransferDocumentsStatus",
    label: "PF Transfer Documents",
    section: "PF / UAN documents",
    previewKind: "file",
  },
];

export function getDocumentVerificationBadgeClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  if (status === "REUPLOAD_REQUESTED") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export function formatDocumentVerificationStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function getReviewableDocumentSections() {
  return Array.from(
    new Map(
      REVIEWABLE_DOCUMENT_FIELDS.map((field) => [
        field.section,
        {
          title: field.section,
          items: REVIEWABLE_DOCUMENT_FIELDS.filter(
            (item) => item.section === field.section,
          ),
        },
      ]),
    ).values(),
  );
}

export function getUploadedReviewableDocumentFields(
  record: Record<string, unknown>,
) {
  return REVIEWABLE_DOCUMENT_FIELDS.map((field) => {
    const fileUrl = typeof record[field.key] === "string" ? (record[field.key] as string) : "";
    const status =
      typeof record[field.statusKey] === "string"
        ? (record[field.statusKey] as DocumentVerificationStatus)
        : "PENDING_REVIEW";

    return {
      ...field,
      fileUrl,
      status,
      uploaded: Boolean(fileUrl.trim()),
    };
  });
}

export function getNextDocumentOverallStatus(
  statuses: Array<string | null | undefined>,
) : DocumentReviewStatus {
  if (!statuses.length) {
    return "PENDING";
  }

  if (statuses.some((status) => status === "REUPLOAD_REQUESTED")) {
    return "REUPLOAD_REQUESTED";
  }

  if (statuses.some((status) => status === "REJECTED")) {
    return "REJECTED";
  }

  if (statuses.some((status) => status === "PENDING_REVIEW")) {
    return "PENDING";
  }

  return "APPROVED";
}
