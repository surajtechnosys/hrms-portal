import { Prisma, Status } from "@prisma/client";

import type {
  InterviewRecord,
  RecruitmentApplication,
  RecruitmentIntake,
} from "@/types";

function emptyStringToNull(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function nullableDateToDate(value?: string | Date | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dateToString(value?: Date | null) {
  return value?.toISOString() ?? "";
}

export function mapRecruitmentIntakeRecord(
  record: Prisma.RecruitmentIntakeGetPayload<object>,
): RecruitmentIntake {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    resumeUrl: record.resumeUrl ?? "",
    skills: record.skills,
    experience: record.experience,
    appliedPosition: record.appliedPosition,
    source: record.source as RecruitmentIntake["source"],
    pipelineStatus:
      (record.pipelineStatus || "APPLIED") as RecruitmentIntake["pipelineStatus"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toRecruitmentIntakeDbInput(
  input: RecruitmentIntake,
): Prisma.RecruitmentIntakeUncheckedCreateInput {
  return {
    id: input.id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    resumeUrl: emptyStringToNull(input.resumeUrl),
    skills: input.skills.trim(),
    experience: input.experience.trim(),
    appliedPosition: input.appliedPosition.trim(),
    source: input.source,
    pipelineStatus: input.pipelineStatus || "APPLIED",
    createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    updatedAt: input.updatedAt ? new Date(input.updatedAt) : undefined,
  };
}

export function mapRecruitmentApplicationRecord(
  record: Prisma.RecruitmentApplicationGetPayload<object>,
): RecruitmentApplication {
  return {
    id: record.id,

    sourceInterviewApplicantId: record.sourceInterviewApplicantId ?? "",

    applicantPortalId: record.applicantPortalId ?? "",
    applicantUsername: record.applicantUsername ?? "",
    applicantPasswordHash: record.applicantPasswordHash ?? "",

    applicantPortalEnabled: record.applicantPortalEnabled,

    applicantInvitedAt: dateToString(record.applicantInvitedAt),

    applicantDocumentsSubmittedAt: dateToString(
      record.applicantDocumentsSubmittedAt,
    ),

    serialNumber: record.serialNumber ?? "",
    requestId: record.requestId ?? "",
    clientProjectName: record.clientProjectName ?? "",

    requestReceivedDate: dateToString(
      record.requestReceivedDate,
    ),

    requestApprovedBy: record.requestApprovedBy ?? "",

    hrOwnerEmployeeNumber:
      record.hrOwnerEmployeeNumber ?? "",

    hrOwnerName: record.hrOwnerName ?? "",

    businessOwnerEmployeeNumber:
      record.businessOwnerEmployeeNumber ?? "",

    businessOwnerName:
      record.businessOwnerName ?? "",

    candidateName: record.candidateName,

    gender: record.gender ?? "",

    dateOfBirth: dateToString(
      record.dateOfBirth,
    ),

    mobileNumber: record.mobileNumber,

    email: record.email ?? "",

    currentLocation: record.currentLocation ?? "",

    preferredLocation:
      record.preferredLocation ?? "",

    noticePeriod: record.noticePeriod ?? "",

    qualification: record.qualification ?? "",

    skillsLevel: record.skillsLevel ?? "",

    profilePost: record.profilePost,

    certification: record.certification ?? "",

    totalExperience:
      record.totalExperience ?? "",

    relevantExperience:
      record.relevantExperience ?? "",

    currentCompany: record.currentCompany ?? "",

    currentCtc: record.currentCtc ?? "",

    expectedCtc: record.expectedCtc ?? "",

    offeredCtc: record.offeredCtc ?? "",

    profileSource:
      (record.profileSource as RecruitmentApplication["profileSource"]) ??
      undefined,

    profileReceiveDate: dateToString(
      record.profileReceiveDate,
    ),

    internalScreeningDate:
      record.internalScreeningDate ?? "",

    internalScreeningCleared:
      (record.internalScreeningCleared as RecruitmentApplication["internalScreeningCleared"]) ??
      undefined,

    profileSentToBusinessOwner:
      (record.profileSentToBusinessOwner as RecruitmentApplication["profileSentToBusinessOwner"]) ??
      undefined,

    profileSentToBusinessOwnerDate: dateToString(
      record.profileSentToBusinessOwnerDate,
    ),

    profileConnectWithClientDate: dateToString(
      record.profileConnectWithClientDate,
    ),

    interviewedByClient:
      (record.interviewedByClient as RecruitmentApplication["interviewedByClient"]) ??
      undefined,

    clientInterviewDate: dateToString(
      record.clientInterviewDate,
    ),

    feedbackDate: dateToString(
      record.feedbackDate,
    ),

    internalStatus:
      (record.internalStatus as RecruitmentApplication["internalStatus"]) ??
      undefined,

    clientFinalStatus:
      (record.clientFinalStatus as RecruitmentApplication["clientFinalStatus"]) ??
      undefined,

    pipelineStatus:
      (record.pipelineStatus as RecruitmentApplication["pipelineStatus"]) ??
      undefined,

    updatedToCandidateDate: dateToString(
      record.updatedToCandidateDate,
    ),

    offeredDate: dateToString(
      record.offeredDate,
    ),

    offerAccepted:
      (record.offerAccepted as RecruitmentApplication["offerAccepted"]) ??
      undefined,

    reasonIfOfferNotAccepted:
      record.reasonIfOfferNotAccepted ?? "",

    agreedJoiningDate: dateToString(
      record.agreedJoiningDate,
    ),

    joined:
      (record.joined as RecruitmentApplication["joined"]) ??
      undefined,

    reasonIfNotJoined:
      record.reasonIfNotJoined ?? "",

    actualJoiningDate: dateToString(
      record.actualJoiningDate,
    ),

    joiningDetailsShared:
      (record.joiningDetailsShared as RecruitmentApplication["joiningDetailsShared"]) ??
      undefined,

    joiningDetailsSharedDate: dateToString(
      record.joiningDetailsSharedDate,
    ),

    remarks: record.remarks ?? "",

    status: record.status,

    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toRecruitmentApplicationDbInput(
  input: RecruitmentApplication,
): Prisma.RecruitmentApplicationUncheckedCreateInput {
  return {
    id: input.id,

    sourceInterviewApplicantId: emptyStringToNull(input.sourceInterviewApplicantId),

    applicantPortalId: emptyStringToNull(input.applicantPortalId),
    applicantUsername: emptyStringToNull(input.applicantUsername),
    applicantPasswordHash: emptyStringToNull(input.applicantPasswordHash),

    applicantPortalEnabled: input.applicantPortalEnabled ?? false,

    applicantInvitedAt: nullableDateToDate(input.applicantInvitedAt),

    applicantDocumentsSubmittedAt: nullableDateToDate(
      input.applicantDocumentsSubmittedAt,
    ),

    serialNumber: emptyStringToNull(input.serialNumber),
    requestId: emptyStringToNull(input.requestId),
    clientProjectName: emptyStringToNull(input.clientProjectName),

    requestReceivedDate: nullableDateToDate(
      input.requestReceivedDate,
    ),

    requestApprovedBy: emptyStringToNull(input.requestApprovedBy),

    hrOwnerEmployeeNumber: emptyStringToNull(
      input.hrOwnerEmployeeNumber,
    ),

    hrOwnerName: emptyStringToNull(input.hrOwnerName),

    businessOwnerEmployeeNumber: emptyStringToNull(
      input.businessOwnerEmployeeNumber,
    ),

    businessOwnerName: emptyStringToNull(
      input.businessOwnerName,
    ),

    candidateName: input.candidateName.trim(),

    gender: emptyStringToNull(input.gender),

    dateOfBirth: nullableDateToDate(
      input.dateOfBirth,
    ),

    mobileNumber: input.mobileNumber.trim(),

    email: emptyStringToNull(input.email),

    currentLocation: emptyStringToNull(input.currentLocation),

    preferredLocation: emptyStringToNull(
      input.preferredLocation,
    ),

    noticePeriod: emptyStringToNull(input.noticePeriod),

    qualification: emptyStringToNull(input.qualification),

    skillsLevel: emptyStringToNull(input.skillsLevel),

    profilePost: input.profilePost.trim(),

    certification: emptyStringToNull(input.certification),

    totalExperience: emptyStringToNull(input.totalExperience),

    relevantExperience: emptyStringToNull(
      input.relevantExperience,
    ),

    currentCompany: emptyStringToNull(input.currentCompany),

    currentCtc: emptyStringToNull(input.currentCtc),

    expectedCtc: emptyStringToNull(input.expectedCtc),

    offeredCtc: emptyStringToNull(input.offeredCtc),

    profileSource: emptyStringToNull(input.profileSource),

    profileReceiveDate: nullableDateToDate(
      input.profileReceiveDate,
    ),

    internalScreeningDate: emptyStringToNull(
      input.internalScreeningDate,
    ),

    internalScreeningCleared: emptyStringToNull(
      input.internalScreeningCleared,
    ),

    profileSentToBusinessOwner: emptyStringToNull(
      input.profileSentToBusinessOwner,
    ),

    profileSentToBusinessOwnerDate: nullableDateToDate(
      input.profileSentToBusinessOwnerDate,
    ),

    profileConnectWithClientDate: nullableDateToDate(
      input.profileConnectWithClientDate,
    ),

    interviewedByClient: emptyStringToNull(
      input.interviewedByClient,
    ),

    clientInterviewDate: nullableDateToDate(
      input.clientInterviewDate,
    ),

    feedbackDate: nullableDateToDate(
      input.feedbackDate,
    ),

    internalStatus: emptyStringToNull(input.internalStatus),

    clientFinalStatus: emptyStringToNull(
      input.clientFinalStatus,
    ),

    pipelineStatus:
      emptyStringToNull(input.pipelineStatus) || "APPLIED",

    updatedToCandidateDate: nullableDateToDate(
      input.updatedToCandidateDate,
    ),

    offeredDate: nullableDateToDate(
      input.offeredDate,
    ),

    offerAccepted: emptyStringToNull(
      input.offerAccepted,
    ),

    reasonIfOfferNotAccepted: emptyStringToNull(
      input.reasonIfOfferNotAccepted,
    ),

    agreedJoiningDate: nullableDateToDate(
      input.agreedJoiningDate,
    ),

    joined: emptyStringToNull(input.joined),

    reasonIfNotJoined: emptyStringToNull(
      input.reasonIfNotJoined,
    ),

    actualJoiningDate: nullableDateToDate(
      input.actualJoiningDate,
    ),

    joiningDetailsShared: emptyStringToNull(
      input.joiningDetailsShared,
    ),

    joiningDetailsSharedDate: nullableDateToDate(
      input.joiningDetailsSharedDate,
    ),

    remarks: emptyStringToNull(input.remarks),

    status: input.status || Status.ACTIVE,

    createdAt: input.createdAt
      ? new Date(input.createdAt)
      : undefined,

    updatedAt: input.updatedAt
      ? new Date(input.updatedAt)
      : undefined,
  };
}

export function mapInterviewRecord(
  record: Prisma.InterviewRecordGetPayload<object>,
): InterviewRecord {
  return {
    id: record.id,
    interviewId: record.interviewId,
    applicantId: record.applicantId,
    applicantName: record.applicantName,
    appliedPosition: record.appliedPosition,
    interviewRound: record.interviewRound as InterviewRecord["interviewRound"],
    interviewerId: record.interviewerId,
    interviewerName: record.interviewerName,
    interviewerJobRole: record.interviewerJobRole ?? "",
    scheduledDate: record.scheduledDate,
    scheduledTime: record.scheduledTime,
    interviewMode: record.interviewMode as InterviewRecord["interviewMode"],
    meetingLinkOrLocation: record.meetingLinkOrLocation,
    status: record.status as InterviewRecord["status"],
    feedback: record.feedback ?? "",
    ratingScore: record.ratingScore,
    recommendation:
      (record.recommendation as InterviewRecord["recommendation"]) ?? null,
    strengths: record.strengths ?? "",
    weaknesses: record.weaknesses ?? "",
    createdBy: record.createdBy ?? "",
    createdByName: record.createdByName ?? "",
    updatedBy: record.updatedBy ?? "",
    updatedByName: record.updatedByName ?? "",
    completedAt: dateToString(record.completedAt),
    history: Array.isArray(record.history)
      ? (record.history as InterviewRecord["history"])
      : [],
    statusNote: record.statusNote ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toInterviewRecordDbInput(
  input: InterviewRecord,
): Prisma.InterviewRecordUncheckedCreateInput {
  return {
    id: input.id,
    interviewId: input.interviewId ?? "",
    applicantId: input.applicantId,
    applicantName: input.applicantName.trim(),
    appliedPosition: input.appliedPosition.trim(),
    interviewRound: input.interviewRound,
    interviewerId: input.interviewerId,
    interviewerName: input.interviewerName.trim(),
    interviewerJobRole: emptyStringToNull(input.interviewerJobRole),
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    interviewMode: input.interviewMode,
    meetingLinkOrLocation: input.meetingLinkOrLocation.trim(),
    status: input.status,
    feedback: emptyStringToNull(input.feedback),
    ratingScore:
      typeof input.ratingScore === "number" && Number.isFinite(input.ratingScore)
        ? input.ratingScore
        : null,
    recommendation: input.recommendation ?? null,
    strengths: emptyStringToNull(input.strengths),
    weaknesses: emptyStringToNull(input.weaknesses),
    createdBy: emptyStringToNull(input.createdBy),
    createdByName: emptyStringToNull(input.createdByName),
    updatedBy: emptyStringToNull(input.updatedBy),
    updatedByName: emptyStringToNull(input.updatedByName),
    completedAt: nullableDateToDate(input.completedAt),
    history: (input.history ?? []) as Prisma.InputJsonValue,
    statusNote: emptyStringToNull(input.statusNote),
    createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    updatedAt: input.updatedAt ? new Date(input.updatedAt) : undefined,
  };
}