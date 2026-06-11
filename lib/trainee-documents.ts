import { sanitizeStoredFileUrl } from "./document-uploads";

type TraineeDocumentField = string | null | undefined;

type TraineeEducationEntry = {
  marksheetFileUrl?: string | null;
};

type TraineeExperienceEntry = {
  experienceLetterFileUrl?: string | null;
  salarySlip1FileUrl?: string | null;
  salarySlip2FileUrl?: string | null;
  salarySlip3FileUrl?: string | null;
};

type DocumentSource = {
  aadhaarFileUrl?: TraineeDocumentField;
  panFileUrl?: TraineeDocumentField;
  passportPhotoFileUrl?: TraineeDocumentField;
  passportFileUrl?: TraineeDocumentField;
  drivingLicenseFileUrl?: TraineeDocumentField;
  voterIdFileUrl?: TraineeDocumentField;
  addressProofFileUrl?: TraineeDocumentField;
  class10MarksheetFileUrl?: TraineeDocumentField;
  class12MarksheetFileUrl?: TraineeDocumentField;
  highestQualificationFileUrl?: TraineeDocumentField;
  additionalDegreesFileUrl?: TraineeDocumentField;
  professionalCertificationsFileUrl?: TraineeDocumentField;
  experienceLetterFileUrl?: TraineeDocumentField;
  relievingLetterFileUrl?: TraineeDocumentField;
  salarySlip1FileUrl?: TraineeDocumentField;
  salarySlip2FileUrl?: TraineeDocumentField;
  salarySlip3FileUrl?: TraineeDocumentField;
  previousOfferLetterFileUrl?: TraineeDocumentField;
  promotionAppraisalLettersFileUrl?: TraineeDocumentField;
  bankProofFileUrl?: TraineeDocumentField;
  pfPassbookFileUrl?: TraineeDocumentField;
  pfTransferDocumentsFileUrl?: TraineeDocumentField;
  educationEntries?: TraineeEducationEntry[] | null;
  experienceEntries?: TraineeExperienceEntry[] | null;
};

export type TraineeDocumentSummaryItem = {
  key: string;
  label: string;
  urls: string[];
};

function uniqueUrls(urls: Array<string | undefined | null>) {
  return Array.from(
    new Set(urls.map((url) => sanitizeStoredFileUrl(url)).filter(Boolean)),
  );
}

function collectEducationUrls(
  entries?: DocumentSource["educationEntries"] | null,
) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return uniqueUrls(entries.map((entry) => entry?.marksheetFileUrl ?? ""));
}

function collectExperienceUrls(
  entries?: DocumentSource["experienceEntries"] | null,
) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const urls: Array<string | undefined | null> = [];

  for (const entry of entries) {
    urls.push(entry?.experienceLetterFileUrl ?? "");
    urls.push(entry?.salarySlip1FileUrl ?? "");
    urls.push(entry?.salarySlip2FileUrl ?? "");
    urls.push(entry?.salarySlip3FileUrl ?? "");
  }

  return uniqueUrls(urls);
}

export function buildTraineeDocumentUrls(source: unknown) {
  const normalized = (source ?? {}) as Partial<DocumentSource>;

  return uniqueUrls([
    normalized.aadhaarFileUrl,
    normalized.panFileUrl,
    normalized.passportPhotoFileUrl,
    normalized.passportFileUrl,
    normalized.drivingLicenseFileUrl,
    normalized.voterIdFileUrl,
    normalized.addressProofFileUrl,
    normalized.class10MarksheetFileUrl,
    normalized.class12MarksheetFileUrl,
    normalized.highestQualificationFileUrl,
    normalized.additionalDegreesFileUrl,
    normalized.professionalCertificationsFileUrl,
    normalized.experienceLetterFileUrl,
    normalized.relievingLetterFileUrl,
    normalized.salarySlip1FileUrl,
    normalized.salarySlip2FileUrl,
    normalized.salarySlip3FileUrl,
    normalized.previousOfferLetterFileUrl,
    normalized.promotionAppraisalLettersFileUrl,
    normalized.bankProofFileUrl,
    normalized.pfPassbookFileUrl,
    normalized.pfTransferDocumentsFileUrl,
    ...collectEducationUrls(normalized.educationEntries),
    ...collectExperienceUrls(normalized.experienceEntries),
  ]);
}

export function buildTraineeDocumentSummary(source: unknown): TraineeDocumentSummaryItem[] {
  const normalized = (source ?? {}) as Partial<DocumentSource>;
  const educationUrls = collectEducationUrls(normalized.educationEntries);
  const experienceUrls = collectExperienceUrls(normalized.experienceEntries);

  return [
    { key: "aadhaar", label: "Aadhaar", urls: uniqueUrls([normalized.aadhaarFileUrl]) },
    { key: "pan", label: "PAN", urls: uniqueUrls([normalized.panFileUrl]) },
    {
      key: "passport-photo",
      label: "Passport Photo",
      urls: uniqueUrls([normalized.passportPhotoFileUrl]),
    },
    {
      key: "address-proof",
      label: "Address Proof",
      urls: uniqueUrls([
        normalized.addressProofFileUrl,
        normalized.drivingLicenseFileUrl,
        normalized.voterIdFileUrl,
        normalized.passportFileUrl,
      ]),
    },
    {
      key: "education",
      label: "Education Documents",
      urls: educationUrls,
    },
    {
      key: "experience",
      label: "Experience Documents",
      urls: uniqueUrls([
        normalized.experienceLetterFileUrl,
        normalized.relievingLetterFileUrl,
        normalized.salarySlip1FileUrl,
        normalized.salarySlip2FileUrl,
        normalized.salarySlip3FileUrl,
        normalized.previousOfferLetterFileUrl,
        normalized.promotionAppraisalLettersFileUrl,
        ...experienceUrls,
      ]),
    },
  ];
}
