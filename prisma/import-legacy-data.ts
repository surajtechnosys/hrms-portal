import "dotenv/config";

import { promises as fs } from "fs";
import path from "path";
import { DocumentReviewStatus, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  toInterviewRecordDbInput,
  toRecruitmentApplicationDbInput,
  toRecruitmentIntakeDbInput,
} from "../lib/recruitment-db";
import type {
  EmployeeDocument,
  InterviewRecord,
  RecruitmentApplication,
  RecruitmentIntake,
} from "../types";

function getLegacyDataPath(fileName: string) {
  return path.join(process.cwd(), "lib", "data", fileName);
}

async function readLegacyFile<T>(fileName: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(getLegacyDataPath(fileName), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function normalizeRecruitmentIntake(input: RecruitmentIntake): RecruitmentIntake {
  const now = new Date().toISOString();

  return {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    resumeUrl: input.resumeUrl?.trim() || "",
    skills: input.skills.trim(),
    experience: input.experience.trim(),
    appliedPosition: input.appliedPosition.trim(),
    source: input.source,
    pipelineStatus: input.pipelineStatus || "APPLIED",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

function getApplicantPortalNumber(record: RecruitmentApplication) {
  const match = /^APP-(\d+)$/i.exec(record.applicantPortalId ?? "");
  return match ? Number(match[1]) : 0;
}

function getNextApplicantPortalNumber(records: RecruitmentApplication[]) {
  return (
    records.reduce((max, record) => {
      const value = getApplicantPortalNumber(record);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0) + 1
  );
}

function getNextRecruitmentSerialNumber(records: RecruitmentApplication[]) {
  return (
    records.reduce((max, record) => {
      const value = Number.parseInt(record.serialNumber ?? "", 10);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0) + 1
  );
}

function formatApplicantPortalId(value: number) {
  return `APP-${String(value).padStart(4, "0")}`;
}

function createApplicantIdentity(records: RecruitmentApplication[]) {
  const nextNumber = getNextApplicantPortalNumber(records);
  const applicantPortalId = formatApplicantPortalId(nextNumber);

  return {
    applicantPortalId,
    applicantUsername: applicantPortalId.toLowerCase(),
  };
}

function normalizeRecruitmentApplication(
  input: RecruitmentApplication,
  records: RecruitmentApplication[] = [],
): RecruitmentApplication {
  const now = new Date().toISOString();
  const identity =
    input.applicantPortalId && input.applicantUsername
      ? {
          applicantPortalId: input.applicantPortalId,
          applicantUsername: input.applicantUsername,
        }
      : createApplicantIdentity(records);

  return {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    sourceInterviewApplicantId: input.sourceInterviewApplicantId?.trim() || "",
    applicantPortalId: input.applicantPortalId || identity.applicantPortalId,
    applicantUsername: input.applicantUsername || identity.applicantUsername,
    applicantPasswordHash: input.applicantPasswordHash || "",
    applicantPortalEnabled: input.applicantPortalEnabled ?? false,
    applicantInvitedAt: input.applicantInvitedAt || "",
    applicantDocumentsSubmittedAt: input.applicantDocumentsSubmittedAt || "",
    serialNumber:
      input.serialNumber?.trim() ||
      (input.id ? "" : String(getNextRecruitmentSerialNumber(records))),
    requestId: input.requestId?.trim() || "",
    clientProjectName: input.clientProjectName?.trim() || "",
    requestReceivedDate: input.requestReceivedDate || "",
    requestApprovedBy: input.requestApprovedBy?.trim() || "",
    hrOwnerEmployeeNumber: input.hrOwnerEmployeeNumber?.trim() || "",
    hrOwnerName: input.hrOwnerName?.trim() || "",
    businessOwnerEmployeeNumber:
      input.businessOwnerEmployeeNumber?.trim() || "",
    businessOwnerName: input.businessOwnerName?.trim() || "",
    candidateName: input.candidateName.trim(),
    mobileNumber: input.mobileNumber.trim(),
    email: input.email?.trim() || "",
    currentLocation: input.currentLocation?.trim() || "",
    preferredLocation: input.preferredLocation?.trim() || "",
    noticePeriod: input.noticePeriod?.trim() || "",
    qualification: input.qualification?.trim() || "",
    skillsLevel: input.skillsLevel?.trim() || "",
    profilePost: input.profilePost.trim(),
    certification: input.certification?.trim() || "",
    totalExperience: input.totalExperience?.trim() || "",
    relevantExperience: input.relevantExperience?.trim() || "",
    currentCompany: input.currentCompany?.trim() || "",
    currentCtc: input.currentCtc?.trim() || "",
    expectedCtc: input.expectedCtc?.trim() || "",
    offeredCtc: input.offeredCtc?.trim() || "",
    profileSource: input.profileSource,
    profileReceiveDate: input.profileReceiveDate || "",
    internalScreeningDate: input.internalScreeningDate || "",
    internalScreeningCleared: input.internalScreeningCleared,
    profileSentToBusinessOwner: input.profileSentToBusinessOwner,
    profileSentToBusinessOwnerDate:
      input.profileSentToBusinessOwnerDate || "",
    profileConnectWithClientDate:
      input.profileConnectWithClientDate || "",
    interviewedByClient: input.interviewedByClient,
    clientInterviewDate: input.clientInterviewDate || "",
    feedbackDate: input.feedbackDate || "",
    internalStatus: input.internalStatus,
    clientFinalStatus: input.clientFinalStatus,
    pipelineStatus: input.pipelineStatus || "APPLIED",
    updatedToCandidateDate: input.updatedToCandidateDate || "",
    offeredDate: input.offeredDate || "",
    offerAccepted: input.offerAccepted,
    reasonIfOfferNotAccepted:
      input.reasonIfOfferNotAccepted?.trim() || "",
    agreedJoiningDate: input.agreedJoiningDate || "",
    joined: input.joined,
    reasonIfNotJoined: input.reasonIfNotJoined?.trim() || "",
    actualJoiningDate: input.actualJoiningDate || "",
    joiningDetailsShared: input.joiningDetailsShared,
    joiningDetailsSharedDate: input.joiningDetailsSharedDate || "",
    remarks: input.remarks?.trim() || "",
    status: input.status,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

function getInterviewNumber(record: InterviewRecord) {
  const match = /^INT-(\d+)$/i.exec(record.interviewId ?? "");
  return match ? Number(match[1]) : 0;
}

function getNextInterviewId(records: InterviewRecord[]) {
  const next =
    records.reduce((max, record) => {
      const value = getInterviewNumber(record);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0) + 1;

  return `INT-${String(next).padStart(4, "0")}`;
}

function normalizeInterviewRecord(
  input: InterviewRecord,
  records: InterviewRecord[],
): InterviewRecord {
  const now = new Date().toISOString();

  return {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    interviewId: input.interviewId || getNextInterviewId(records),
    interviewerJobRole: input.interviewerJobRole || "",
    feedback: input.feedback || "",
    ratingScore:
      typeof input.ratingScore === "number" && Number.isFinite(input.ratingScore)
        ? input.ratingScore
        : null,
    recommendation: input.recommendation ?? null,
    strengths: input.strengths || "",
    weaknesses: input.weaknesses || "",
    completedAt: input.completedAt || "",
    history: input.history || [],
    statusNote: input.statusNote || "",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

function normalizeApplicantDocument(input: EmployeeDocument): EmployeeDocument {
  const now = new Date().toISOString();

  return {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    documentOwnerType: "APPLICANT",
    applicantId: input.applicantId?.trim() || "",
    applicantCode: input.applicantCode?.trim() || "",
    candidateName: input.candidateName?.trim() || "",
    employeeId: "",
    employeeCode: "",
    employeeName: "",
    linkedEmployeeId: input.linkedEmployeeId?.trim() || "",
    linkedEmployeeCode: input.linkedEmployeeCode?.trim() || "",
    linkedEmployeeName: input.linkedEmployeeName?.trim() || "",
    aadhaarNumber: input.aadhaarNumber.trim(),
    aadhaarFileUrl: input.aadhaarFileUrl || "",
    panNumber: input.panNumber.trim(),
    panFileUrl: input.panFileUrl || "",
    educationEntries: input.educationEntries ?? [],
    experienceType: input.experienceType,
    experienceEntries: input.experienceEntries ?? [],
    reviewStatus: input.reviewStatus ?? "PENDING",
    reviewRemark: input.reviewRemark?.trim() || "",
    reviewedByName: input.reviewedByName?.trim() || "",
    reviewedAt: input.reviewedAt || "",
    remark: input.remark?.trim() || "",
    status: input.status,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

function toDocumentReviewStatus(status?: string) {
  if (status === "APPROVED") return DocumentReviewStatus.APPROVED;
  if (status === "REJECTED") return DocumentReviewStatus.REJECTED;
  if (status === "REUPLOAD_REQUESTED") {
    return DocumentReviewStatus.REUPLOAD_REQUESTED;
  }

  return DocumentReviewStatus.PENDING;
}

function toApplicantDocumentDbInput(
  input: EmployeeDocument,
): Prisma.ApplicantDocumentUncheckedCreateInput {
  const normalized = normalizeApplicantDocument(input);

  return {
    id: normalized.id,
    documentOwnerType: "APPLICANT",
    applicantId: normalized.applicantId || null,
    candidateName: normalized.candidateName || null,
    employeeId: null,
    employeeCode: normalized.employeeCode || "",
    aadhaarNumber: normalized.aadhaarNumber,
    aadhaarFileUrl: normalized.aadhaarFileUrl || null,
    panNumber: normalized.panNumber,
    panFileUrl: normalized.panFileUrl || null,
    educationEntries: (normalized.educationEntries ?? []) as Prisma.InputJsonValue,
    experienceType: normalized.experienceType,
    experienceEntries: (normalized.experienceEntries ?? []) as Prisma.InputJsonValue,
    reviewStatus: toDocumentReviewStatus(normalized.reviewStatus),
    reviewRemark: normalized.reviewRemark || null,
    reviewedAt: normalized.reviewedAt ? new Date(normalized.reviewedAt) : null,
    remark: normalized.remark || null,
    status: normalized.status,
    documentPayload: normalized as Prisma.InputJsonValue,
  };
}

async function importRecruitmentIntakes() {
  const records = (await readLegacyFile<RecruitmentIntake>("recruitment-intake.json")).map(
    normalizeRecruitmentIntake,
  );

  for (const record of records) {
    const {
      id,
      createdAt,
      updatedAt,
      ...updateData
    } = toRecruitmentIntakeDbInput(record);
    void id;
    void createdAt;
    void updatedAt;

    await prisma.recruitmentIntake.upsert({
      where: { id: record.id ?? "" },
      update: updateData,
      create: toRecruitmentIntakeDbInput(record),
    });
  }

  return records.length;
}

async function importRecruitmentApplications() {
  const sourceRecords = await readLegacyFile<RecruitmentApplication>(
    "recruitment-applications.json",
  );
  const records: RecruitmentApplication[] = [];

  for (const record of sourceRecords) {
    records.push(normalizeRecruitmentApplication(record, [...sourceRecords, ...records]));
  }

  for (const record of records) {
    const {
      id,
      createdAt,
      updatedAt,
      ...updateData
    } = toRecruitmentApplicationDbInput(record);
    void id;
    void createdAt;
    void updatedAt;

    await prisma.recruitmentApplication.upsert({
      where: { id: record.id ?? "" },
      update: updateData,
      create: toRecruitmentApplicationDbInput(record),
    });
  }

  return records.length;
}

async function importInterviews() {
  const sourceRecords = await readLegacyFile<InterviewRecord>("interviews.json");
  const records: InterviewRecord[] = [];

  for (const record of sourceRecords) {
    records.push(normalizeInterviewRecord(record, [...sourceRecords, ...records]));
  }

  for (const record of records) {
    const {
      id,
      createdAt,
      updatedAt,
      ...updateData
    } = toInterviewRecordDbInput(record);
    void id;
    void createdAt;
    void updatedAt;

    await prisma.interviewRecord.upsert({
      where: { id: record.id ?? "" },
      update: updateData,
      create: toInterviewRecordDbInput(record),
    });
  }

  return records.length;
}

async function importApplicantDocuments() {
  const records = (await readLegacyFile<EmployeeDocument>("applicant-documents.json")).map(
    normalizeApplicantDocument,
  );

  for (const record of records) {
    const payload = toApplicantDocumentDbInput(record);

    await prisma.applicantDocument.upsert({
      where: { id: record.id ?? "" },
      update: {
        documentOwnerType: payload.documentOwnerType,
        applicantId: payload.applicantId,
        candidateName: payload.candidateName,
        employeeId: null,
        employeeCode: payload.employeeCode,
        aadhaarNumber: payload.aadhaarNumber,
        aadhaarFileUrl: payload.aadhaarFileUrl,
        panNumber: payload.panNumber,
        panFileUrl: payload.panFileUrl,
        educationEntries: payload.educationEntries,
        experienceType: payload.experienceType,
        experienceEntries: payload.experienceEntries,
        reviewStatus: payload.reviewStatus,
        reviewRemark: payload.reviewRemark,
        reviewedAt: payload.reviewedAt,
        remark: payload.remark,
        status: payload.status,
        documentPayload: payload.documentPayload,
      },
      create: {
        ...payload,
        createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
        updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined,
      },
    });
  }

  return records.length;
}

async function logSummary() {
  const [intakes, applications, interviews, documents] = await Promise.all([
    prisma.recruitmentIntake.count(),
    prisma.recruitmentApplication.count(),
    prisma.interviewRecord.count(),
    prisma.applicantDocument.count({
      where: { documentOwnerType: "APPLICANT" },
    }),
  ]);

  console.log("Imported totals:");
  console.log(`- recruitment intake: ${intakes}`);
  console.log(`- recruitment applications: ${applications}`);
  console.log(`- interviews: ${interviews}`);
  console.log(`- applicant documents: ${documents}`);
}

async function main() {
  const intakeCount = await importRecruitmentIntakes();
  const applicationCount = await importRecruitmentApplications();
  const interviewCount = await importInterviews();
  const documentCount = await importApplicantDocuments();

  console.log("Legacy JSON import completed.");
  console.log(`- recruitment intake imported: ${intakeCount}`);
  console.log(`- recruitment applications imported: ${applicationCount}`);
  console.log(`- interviews imported: ${interviewCount}`);
  console.log(`- applicant documents imported: ${documentCount}`);
  await logSummary();
}

main()
  .catch((error) => {
    console.error("Legacy import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
