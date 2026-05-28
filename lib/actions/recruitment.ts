"use server";

import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { RecruitmentApplication } from "@/types";
import { APP_NAME, SERVER_URL } from "../constants";
import { sendSystemEmail } from "../email";
import { formatError } from "../utils";
import { recruitmentSchema } from "../validators";

type ActionResponse = {
  success: boolean;
  message: string;
};

type RecruitmentActionResponse = ActionResponse & {
  data?: RecruitmentApplication;
};

export type RecruitmentApplicantOption = {
  id: string;
  requestId: string;
  candidateName: string;
  profilePost: string;
};

const dataFilePath = path.join(
  process.cwd(),
  "lib",
  "data",
  "recruitment-applications.json",
);

async function ensureDataFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

async function readRecruitmentData(): Promise<RecruitmentApplication[]> {
  await ensureDataFile();
  const raw = await fs.readFile(dataFilePath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as RecruitmentApplication[])
      : [];
  } catch {
    return [];
  }
}

async function writeRecruitmentData(data: RecruitmentApplication[]) {
  await ensureDataFile();
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
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

function ensureApplicantIdentity(
  record: RecruitmentApplication,
  records: RecruitmentApplication[],
) {
  if (record.applicantPortalId && record.applicantUsername) {
    return record;
  }

  const identity = createApplicantIdentity(records);

  return {
    ...record,
    applicantPortalId: record.applicantPortalId || identity.applicantPortalId,
    applicantUsername: record.applicantUsername || identity.applicantUsername,
    applicantPortalEnabled: record.applicantPortalEnabled ?? false,
  };
}

function ensureApplicantIdentities(records: RecruitmentApplication[]) {
  const nextRecords: RecruitmentApplication[] = [];
  let changed = false;

  for (const record of records) {
    const nextRecord = ensureApplicantIdentity(record, [
      ...records,
      ...nextRecords,
    ]);
    nextRecords.push(nextRecord);
    changed =
      changed ||
      nextRecord.applicantPortalId !== record.applicantPortalId ||
      nextRecord.applicantUsername !== record.applicantUsername;
  }

  return { records: nextRecords, changed };
}

function generateApplicantPassword() {
  return `App@${randomBytes(4).toString("hex")}`;
}

function getApplicantPortalUrl() {
  return `${SERVER_URL.replace(/\/$/, "")}/applicant-dashboard`;
}

function buildApplicantInviteEmail(input: {
  applicantName: string;
  applicantPortalId: string;
  applicantUsername: string;
  password: string;
}) {
  const portalUrl = getApplicantPortalUrl();
  const subject = `${APP_NAME} pre-onboarding document portal access`;
  const text = [
    `Hello ${input.applicantName},`,
    "",
    "You have been selected for the next step in the pre-onboarding process.",
    "Please log in to the applicant portal and submit your documents.",
    "",
    `Applicant ID: ${input.applicantPortalId}`,
    `Username: ${input.applicantUsername}`,
    `Password: ${input.password}`,
    `Portal: ${portalUrl}`,
    "",
    "Regards,",
    APP_NAME,
  ].join("\n");
  const html = `
    <p>Hello ${input.applicantName},</p>
    <p>You have been selected for the next step in the pre-onboarding process. Please log in to the applicant portal and submit your documents.</p>
    <p><strong>Applicant ID:</strong> ${input.applicantPortalId}</p>
    <p><strong>Username:</strong> ${input.applicantUsername}</p>
    <p><strong>Password:</strong> ${input.password}</p>
    <p><a href="${portalUrl}">Open applicant portal</a></p>
    <p>Regards,<br />${APP_NAME}</p>
  `;

  return { subject, text, html };
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
    applicantPortalId: input.applicantPortalId || identity.applicantPortalId,
    applicantUsername:
      input.applicantUsername || identity.applicantUsername,
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
    updatedAt: now,
  };
}

export async function getRecruitmentApplications(): Promise<
  RecruitmentApplication[]
> {
  try {
    const rawRecords = await readRecruitmentData();
    const { records, changed } = ensureApplicantIdentities(rawRecords);

    if (changed) {
      await writeRecruitmentData(records);
    }

    return records.sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || ""),
    );
  } catch {
    return [];
  }
}

export async function getRecruitmentApplicantOptions(): Promise<
  RecruitmentApplicantOption[]
> {
  const records = await getRecruitmentApplications();

  return records.map((item) => ({
    id: item.id ?? "",
    requestId: item.requestId || item.serialNumber || "",
    candidateName: item.candidateName,
    profilePost: item.profilePost,
  }));
}

export async function createRecruitmentApplication(
  data: RecruitmentApplication,
): Promise<ActionResponse> {
  try {
    const parsed = recruitmentSchema.parse(data);
    const records = await readRecruitmentData();
    const nextRecord = normalizeRecruitmentApplication(parsed, records);

    records.push(nextRecord);
    await writeRecruitmentData(records);

    revalidatePath("/recruitment");

    return {
      success: true,
      message: "Pre-onboarding candidate created successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getRecruitmentApplicationById(id: string) {
  try {
    const records = await getRecruitmentApplications();
    const record = records.find((item) => item.id === id);

    if (!record) {
      return {
        success: false,
        message: "Pre-onboarding candidate not found",
      };
    }

    return {
      success: true,
      data: record,
      message: "Pre-onboarding candidate fetched successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getCurrentApplicantApplication() {
  try {
    const session = await auth();

    if (
      session?.user?.accountType !== "applicant" &&
      session?.user?.role !== "applicant"
    ) {
      return {
        success: false,
        message: "Applicant session not found",
      };
    }

    return getRecruitmentApplicationById(session.user.id);
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function markApplicantDocumentsSubmitted(applicantId: string) {
  const records = await readRecruitmentData();
  const index = records.findIndex((item) => item.id === applicantId);

  if (index === -1) {
    return;
  }

  records[index] = normalizeRecruitmentApplication({
    ...records[index],
    applicantDocumentsSubmittedAt: new Date().toISOString(),
  }, records);

  await writeRecruitmentData(records);
  revalidatePath("/recruitment");
  revalidatePath("/applicant-dashboard");
}

export async function updateRecruitmentApplication(
  data: RecruitmentApplication,
  id: string,
): Promise<ActionResponse> {
  try {
    const parsed = recruitmentSchema.parse(data);
    const records = await readRecruitmentData();
    const index = records.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "Pre-onboarding candidate not found",
      };
    }

    records[index] = normalizeRecruitmentApplication({
      ...parsed,
      id,
      createdAt: records[index].createdAt,
      applicantPortalId: records[index].applicantPortalId,
      applicantUsername: records[index].applicantUsername,
      applicantPasswordHash: records[index].applicantPasswordHash,
      applicantPortalEnabled: records[index].applicantPortalEnabled,
      applicantInvitedAt: records[index].applicantInvitedAt,
      applicantDocumentsSubmittedAt: records[index].applicantDocumentsSubmittedAt,
    }, records);

    await writeRecruitmentData(records);

    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/edit/${id}`);

    return {
      success: true,
      message: "Pre-onboarding candidate updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function sendApplicantPortalInvite(
  id: string,
): Promise<RecruitmentActionResponse> {
  try {
    const rawRecords = await readRecruitmentData();
    const { records } = ensureApplicantIdentities(rawRecords);
    const index = records.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "Pre-onboarding candidate not found",
      };
    }

    const applicant = ensureApplicantIdentity(records[index], records);

    if (!applicant.email) {
      return {
        success: false,
        message: "Candidate email is required before sending portal access",
      };
    }

    const password = generateApplicantPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    const emailContent = buildApplicantInviteEmail({
      applicantName: applicant.candidateName,
      applicantPortalId: applicant.applicantPortalId ?? "",
      applicantUsername: applicant.applicantUsername ?? "",
      password,
    });

    await sendSystemEmail({
      to: applicant.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    const nextRecord = normalizeRecruitmentApplication({
      ...applicant,
      applicantPasswordHash: passwordHash,
      applicantPortalEnabled: true,
      applicantInvitedAt: new Date().toISOString(),
    }, records);

    records[index] = nextRecord;
    await writeRecruitmentData(records);

    revalidatePath("/recruitment");

    return {
      success: true,
      message: "Pre-onboarding portal access sent successfully",
      data: nextRecord,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function deleteRecruitmentApplication(
  id: string,
): Promise<ActionResponse> {
  try {
    const records = await readRecruitmentData();
    const nextRecords = records.filter((item) => item.id !== id);

    await writeRecruitmentData(nextRecords);
    revalidatePath("/recruitment");

    return {
      success: true,
      message: "Pre-onboarding candidate deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
