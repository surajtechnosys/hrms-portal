"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { interviewDefaultValues } from "@/lib/constants";
import { isCurrentEmployeeHr } from "@/lib/employee-job-role";
import { APP_NAME } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { sendSystemEmail } from "@/lib/email";
import { formatError } from "@/lib/utils";
import { interviewSchema } from "@/lib/validators";
import type { InterviewRecord, RecruitmentIntake } from "@/types";
import {
  getRecruitmentIntakeById,
  getRecruitmentIntakeInterviewApplicants,
  updateRecruitmentIntakePipelineStatus,
} from "./recruitment-intake";

type ActionResponse = {
  success: boolean;
  message: string;
};

type InterviewActionResponse = ActionResponse & {
  data?: InterviewRecord;
};

type InterviewDashboardStats = {
  totalScheduled: number;
  interviewsToday: number;
  pendingFeedback: number;
  completed: number;
  selectedCandidates: number;
  rejectedCandidates: number;
  upcoming: number;
};

type RecruitmentPipelineStatus = NonNullable<RecruitmentIntake["pipelineStatus"]>;

type InterviewWorkspace = {
  records: InterviewRecord[];
  stats: InterviewDashboardStats;
  canManageAll: boolean;
  isHrUser: boolean;
  currentEmployeeId: string;
};

type ActorContext = {
  id: string;
  name: string;
  role: string;
  email: string;
  isHrUser: boolean;
  canManageAll: boolean;
  employeeId: string;
};

export type InterviewerOption = {
  id: string;
  employeeName: string;
  employeeCode: string;
  jobRoleName: string;
};

type InterviewCreateApplicantOption = {
  id: string;
  requestId: string;
  candidateName: string;
  profilePost: string;
  pipelineStatus?: string;
  suggestedRound?: string;
  previousRoundCount?: number;
  latestInterviewStatus?: string;
  latestRecommendation?: string | null;
};

export type SelectedInterviewCandidateOption = {
  applicantId: string;
  requestId: string;
  interviewId: string;
  candidateName: string;
  profilePost: string;
  email: string;
  mobileNumber: string;
  skillsLevel: string;
  totalExperience: string;
  relevantExperience: string;
  qualification: string;
  interviewRound: string;
  status: string;
  recommendation: string | null;
  sourceInterviewApplicantId: string;
};

const dataFilePath = path.join(process.cwd(), "lib", "data", "interviews.json");

async function ensureDataFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

async function readInterviewData(): Promise<InterviewRecord[]> {
  await ensureDataFile();
  const raw = await fs.readFile(dataFilePath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InterviewRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeInterviewData(data: InterviewRecord[]) {
  await ensureDataFile();
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
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

function getApplicantInterviewId(records: InterviewRecord[], applicantId: string) {
  const applicantRecords = records
    .filter((record) => record.applicantId === applicantId)
    .slice()
    .sort((left, right) =>
      (left.createdAt || left.updatedAt || "").localeCompare(
        right.createdAt || right.updatedAt || "",
      ),
    );

  return (
    applicantRecords.find((record) => record.interviewId?.trim())?.interviewId?.trim() ||
    ""
  );
}

const ROUND_ORDER = [
  "HR_ROUND",
  "TECHNICAL_ROUND_1",
  "TECHNICAL_ROUND_2",
  "MANAGERIAL_ROUND",
  "FINAL_HR_ROUND",
] as const;

function getSuggestedRound(records: InterviewRecord[]) {
  if (!records.length) {
    return "HR_ROUND";
  }

  const latestRecord = records
    .slice()
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0];
  const currentIndex = ROUND_ORDER.indexOf(
    (latestRecord?.interviewRound as (typeof ROUND_ORDER)[number]) || "HR_ROUND",
  );

  if (latestRecord?.recommendation === "PROCEED_TO_NEXT_ROUND" && currentIndex >= 0) {
    return ROUND_ORDER[Math.min(currentIndex + 1, ROUND_ORDER.length - 1)];
  }

  return latestRecord?.interviewRound || "HR_ROUND";
}

function getLatestApplicantInterview(
  records: InterviewRecord[],
  applicantId: string,
) {
  return records
    .filter((item) => item.applicantId === applicantId)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0];
}

function buildHistoryEntry(
  actor: ActorContext,
  action: string,
  description: string,
) {
  return {
    id: crypto.randomUUID(),
    action,
    description,
    actorId: actor.employeeId || actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    createdAt: new Date().toISOString(),
  };
}

function getRoundLabel(round: string) {
  return round.replaceAll("_", " ");
}

function formatTimeLabel(value: string) {
  const [hoursValue, minutesValue = "00"] = value.split(":");
  const hours = Number(hoursValue);
  const minutes = minutesValue.padStart(2, "0");
  const isPm = hours >= 12;
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${minutes} ${isPm ? "PM" : "AM"}`;
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = Number(month) - 1;
  const monthLabel = monthNames[monthIndex] || month;

  return `${day} ${monthLabel} ${year}`;
}

function buildInterviewScheduledEmail(record: InterviewRecord) {
  const subject = `${APP_NAME} interview scheduled for ${record.applicantName}`;
  const dateLabel = formatDateLabel(record.scheduledDate);
  const timeLabel = formatTimeLabel(record.scheduledTime);
  const roundLabel = getRoundLabel(record.interviewRound);
  const modeLabel = record.interviewMode.replaceAll("_", " ");
  const locationLabel = record.meetingLinkOrLocation || "To be shared";
  const feedbackLink = `${record.interviewMode === "ONLINE" ? "Join" : "Attend"} on time and keep this schedule handy.`;

  const text = [
    `Hello ${record.applicantName},`,
    "",
    `Your interview has been scheduled for ${roundLabel}.`,
    `Date: ${dateLabel}`,
    `Time: ${timeLabel}`,
    `Interviewer: ${record.interviewerName}${record.interviewerJobRole ? ` (${record.interviewerJobRole})` : ""}`,
    `Mode: ${modeLabel}`,
    `Location / Link: ${locationLabel}`,
    "",
    feedbackLink,
    "",
    "Regards,",
    APP_NAME,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${record.applicantName},</p>
      <p>Your interview has been scheduled for <strong>${roundLabel}</strong>.</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;width:100%;max-width:560px">
        <tr><td style="padding:8px 0;color:#64748b">Date</td><td style="padding:8px 0;font-weight:600">${dateLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Time</td><td style="padding:8px 0;font-weight:600">${timeLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Interviewer</td><td style="padding:8px 0;font-weight:600">${record.interviewerName}${record.interviewerJobRole ? ` (${record.interviewerJobRole})` : ""}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Mode</td><td style="padding:8px 0;font-weight:600">${modeLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Location / Link</td><td style="padding:8px 0;font-weight:600">${locationLabel}</td></tr>
      </table>
      <p>${feedbackLink}</p>
      <p>Regards,<br />${APP_NAME}</p>
    </div>
  `;

  return { subject, text, html };
}

async function notifyInterviewScheduled(record: InterviewRecord, email: string) {
  const emailContent = buildInterviewScheduledEmail(record);

  await sendSystemEmail({
    to: email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });
}

function normalizeInterviewRecord(
  input: InterviewRecord,
  records: InterviewRecord[],
): InterviewRecord {
  const now = new Date().toISOString();

  return {
    ...interviewDefaultValues,
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
    updatedAt: now,
  };
}

function isAdminRole(role?: string | null) {
  return !!role?.toLowerCase().includes("admin");
}

function isHrRole(role?: string | null) {
  return !!role?.toLowerCase().includes("hr");
}

async function getActorContext(): Promise<ActorContext | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const employee = await prisma.employeeProfile.findFirst({
    where: {
      email: session.user.email,
      status: "ACTIVE",
    },
    include: {
      jobRole: {
        select: {
          name: true,
        },
      },
    },
  });

  const isHrEmployee = session.user.role?.toLowerCase() === "employee"
    ? await isCurrentEmployeeHr()
    : false;

  return {
    id: session.user.id,
    name:
      employee?.employeeName ||
      session.user.firstName ||
      session.user.name ||
      session.user.username ||
      "User",
    role: employee?.jobRole?.name || session.user.role || "User",
    email: session.user.email,
    isHrUser: isHrEmployee || isHrRole(session.user.role) || isAdminRole(session.user.role),
    canManageAll: isHrEmployee || isHrRole(session.user.role) || isAdminRole(session.user.role),
    employeeId: employee?.id || session.user.id,
  };
}

function canViewInterview(record: InterviewRecord, actor: ActorContext) {
  return actor.canManageAll || record.interviewerId === actor.employeeId;
}

function getDashboardStats(records: InterviewRecord[]): InterviewDashboardStats {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  return {
    totalScheduled: records.filter((item) =>
      ["SCHEDULED", "RESCHEDULED", "IN_PROGRESS"].includes(item.status),
    ).length,
    interviewsToday: records.filter((item) => item.scheduledDate === today).length,
    pendingFeedback: records.filter((item) =>
      ["COMPLETED", "IN_PROGRESS"].includes(item.status) &&
      !item.feedback?.trim(),
    ).length,
    completed: records.filter((item) => item.status === "COMPLETED").length,
    selectedCandidates: records.filter((item) => item.recommendation === "SELECTED")
      .length,
    rejectedCandidates: records.filter((item) => item.recommendation === "REJECTED")
      .length,
    upcoming: records.filter((item) => {
      const schedule = new Date(`${item.scheduledDate}T${item.scheduledTime || "00:00"}`);
      return schedule >= now && ["SCHEDULED", "RESCHEDULED"].includes(item.status);
    }).length,
  };
}

async function syncApplicantPipelineFromInterview(record: InterviewRecord) {
  const statusMap: Record<string, RecruitmentPipelineStatus> = {
    SCHEDULED: "INTERVIEW_SCHEDULED",
    RESCHEDULED: "INTERVIEW_SCHEDULED",
    IN_PROGRESS: "INTERVIEW_IN_PROGRESS",
    COMPLETED: "INTERVIEW_COMPLETED",
    CANCELLED: "SHORTLISTED",
    NO_SHOW: "INTERVIEW_COMPLETED",
  };

  let pipelineStatus: RecruitmentPipelineStatus =
    statusMap[record.status] || "SHORTLISTED";

  if (record.recommendation === "SELECTED") {
    pipelineStatus = "SELECTED";
  } else if (record.recommendation === "REJECTED") {
    pipelineStatus = "REJECTED";
  } else if (record.recommendation === "PROCEED_TO_NEXT_ROUND") {
    pipelineStatus = "SHORTLISTED";
  } else if (record.recommendation === "ON_HOLD") {
    pipelineStatus = "INTERVIEW_COMPLETED";
  }

  await updateRecruitmentIntakePipelineStatus(record.applicantId, pipelineStatus);
}

export async function getInterviewerOptions(): Promise<InterviewerOption[]> {
  try {
    const employees = await prisma.employeeProfile.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ employeeName: "asc" }, { employeeCode: "asc" }],
      include: {
        jobRole: {
          select: {
            name: true,
          },
        },
      },
    });

    return employees.map((employee) => ({
      id: employee.id,
      employeeName: employee.employeeName,
      employeeCode: employee.employeeCode,
      jobRoleName: employee.jobRole?.name || "",
    }));
  } catch {
    return [];
  }
}

export async function getInterviewWorkspace(): Promise<InterviewWorkspace> {
  const actor = await getActorContext();

  if (!actor) {
    return {
      records: [],
      stats: getDashboardStats([]),
      canManageAll: false,
      isHrUser: false,
      currentEmployeeId: "",
    };
  }

  const records = (await readInterviewData())
    .filter((record) => canViewInterview(record, actor))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  return {
    records,
    stats: getDashboardStats(records),
    canManageAll: actor.canManageAll,
    isHrUser: actor.isHrUser,
    currentEmployeeId: actor.employeeId,
  };
}

export async function getInterviewById(id: string): Promise<InterviewActionResponse> {
  try {
    const actor = await getActorContext();

    if (!actor) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const record = (await readInterviewData()).find((item) => item.id === id);

    if (!record || !canViewInterview(record, actor)) {
      return {
        success: false,
        message: "Interview record not found",
      };
    }

    return {
      success: true,
      message: "Interview record fetched successfully",
      data: record,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getInterviewCreateOptions() {
  const [applicants, interviewers, records] = await Promise.all([
    getRecruitmentIntakeInterviewApplicants(),
    getInterviewerOptions(),
    readInterviewData(),
  ]);

  const recordsByApplicant = records.reduce<Record<string, InterviewRecord[]>>(
    (accumulator, record) => {
      accumulator[record.applicantId] = accumulator[record.applicantId] || [];
      accumulator[record.applicantId].push(record);
      return accumulator;
    },
    {},
  );

  return {
    applicants: applicants.map((applicant): InterviewCreateApplicantOption => {
      const applicantRecords = recordsByApplicant[applicant.id] || [];
      const latestRecord = applicantRecords
        .slice()
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0];

      return {
        ...applicant,
        suggestedRound: getSuggestedRound(applicantRecords),
        previousRoundCount: applicantRecords.length,
        latestInterviewStatus: latestRecord?.status || "",
        latestRecommendation: latestRecord?.recommendation || null,
      };
    }),
    interviewers,
  };
}

export async function getSelectedInterviewCandidates(): Promise<
  SelectedInterviewCandidateOption[]
> {
  const actor = await getActorContext();

  if (!actor?.canManageAll) {
    return [];
  }

  const selectedRecords = (await readInterviewData())
    .filter((record) => record.recommendation === "SELECTED")
    .sort((left, right) =>
      (right.updatedAt || right.createdAt || "").localeCompare(
        left.updatedAt || left.createdAt || "",
      ),
    );

  const latestSelectedByApplicant = new Map<string, InterviewRecord>();

  for (const record of selectedRecords) {
    if (!latestSelectedByApplicant.has(record.applicantId)) {
      latestSelectedByApplicant.set(record.applicantId, record);
    }
  }

  const candidates = await Promise.all(
    [...latestSelectedByApplicant.values()].map(async (record) => {
      const intake = await getRecruitmentIntakeById(record.applicantId);
      const intakeData = intake.success && intake.data ? intake.data : null;

      return {
        applicantId: record.applicantId,
        requestId: intakeData?.id || record.applicantId,
        interviewId: record.interviewId || "",
        candidateName: intakeData?.name || record.applicantName || "",
        profilePost: intakeData?.appliedPosition || record.appliedPosition || "",
        email: intakeData?.email || "",
        mobileNumber: intakeData?.phone || "",
        skillsLevel: intakeData?.skills || "",
        totalExperience: intakeData?.experience || "",
        relevantExperience: intakeData?.experience || "",
        qualification: "",
        interviewRound: record.interviewRound,
        status: record.status,
        recommendation: record.recommendation || null,
        sourceInterviewApplicantId: record.applicantId,
      };
    }),
  );

  return candidates;
}

export async function createInterview(
  data: InterviewRecord,
): Promise<InterviewActionResponse> {
  try {
    const actor = await getActorContext();

    if (!actor?.canManageAll) {
      return {
        success: false,
        message: "Only HR can schedule interviews",
      };
    }

    const parsed = interviewSchema.parse(data);
    const applicant = await getRecruitmentIntakeById(parsed.applicantId);

    if (!applicant.success || !applicant.data) {
      return {
        success: false,
        message: "Linked applicant not found",
      };
    }

    if (!applicant.data.email?.trim()) {
      return {
        success: false,
        message: "Applicant email is required before scheduling an interview",
      };
    }

    const previousPipelineStatus = applicant.data.pipelineStatus || "APPLIED";

    const records = await readInterviewData();
    const latestApplicantInterview = getLatestApplicantInterview(records, parsed.applicantId);
    const applicantInterviewId = getApplicantInterviewId(records, parsed.applicantId);

    if (latestApplicantInterview?.recommendation === "SELECTED") {
      return {
        success: false,
        message: "This applicant is already marked as selected. No further interview rounds are needed.",
      };
    }

    if (latestApplicantInterview?.recommendation === "REJECTED") {
      return {
        success: false,
        message: "This applicant is already marked as rejected. Create a new round only after reopening the recruitment pipeline.",
      };
    }

    const nextRecord = normalizeInterviewRecord(
      {
        ...parsed,
        applicantName: applicant.data.name,
        appliedPosition: applicant.data.appliedPosition,
        interviewId: applicantInterviewId || getNextInterviewId(records),
        createdBy: actor.employeeId,
        createdByName: actor.name,
        updatedBy: actor.employeeId,
        updatedByName: actor.name,
        history: [
          buildHistoryEntry(
            actor,
            "INTERVIEW_CREATED",
            `Interview scheduled for ${parsed.interviewRound.replaceAll("_", " ")}.`,
          ),
        ],
      },
      records,
    );

    records.push(nextRecord);
    await writeInterviewData(records);
    await syncApplicantPipelineFromInterview(nextRecord);

    try {
      await notifyInterviewScheduled(nextRecord, applicant.data.email);
    } catch (error) {
      records.pop();
      await writeInterviewData(records);
      await updateRecruitmentIntakePipelineStatus(
        parsed.applicantId,
        previousPipelineStatus,
      );

      return {
        success: false,
        message: `Interview saved but notification email could not be sent: ${formatError(error)}`,
      };
    }

    revalidatePath("/interviews");

    return {
      success: true,
      message: "Interview scheduled successfully",
      data: nextRecord,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateInterview(
  data: InterviewRecord,
  id: string,
): Promise<InterviewActionResponse> {
  try {
    const actor = await getActorContext();

    if (!actor?.canManageAll) {
      return {
        success: false,
        message: "Only HR can manage interview schedules",
      };
    }

    const parsed = interviewSchema.parse(data);
    const records = await readInterviewData();
    const index = records.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "Interview record not found",
      };
    }

    const current = records[index];
    const auditEntries = [...(current.history || [])];

    if (
      current.scheduledDate !== parsed.scheduledDate ||
      current.scheduledTime !== parsed.scheduledTime
    ) {
      auditEntries.push(
        buildHistoryEntry(
          actor,
          "INTERVIEW_RESCHEDULED",
          `Interview moved to ${parsed.scheduledDate} at ${parsed.scheduledTime}.`,
        ),
      );
    }

    if (current.status !== parsed.status) {
      auditEntries.push(
        buildHistoryEntry(
          actor,
          "STATUS_UPDATED",
          `Interview status changed from ${current.status} to ${parsed.status}.`,
        ),
      );
    }

    records[index] = normalizeInterviewRecord(
      {
        ...current,
        ...parsed,
        id,
        interviewId: current.interviewId,
        createdAt: current.createdAt,
        createdBy: current.createdBy,
        createdByName: current.createdByName,
        updatedBy: actor.employeeId,
        updatedByName: actor.name,
        history: auditEntries,
      },
      records,
    );

    await writeInterviewData(records);
    await syncApplicantPipelineFromInterview(records[index]);

    revalidatePath("/interviews");
    revalidatePath(`/interviews/edit/${id}`);

    return {
      success: true,
      message: "Interview updated successfully",
      data: records[index],
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function submitInterviewFeedback(
  id: string,
  input: Pick<
    InterviewRecord,
    | "feedback"
    | "ratingScore"
    | "strengths"
    | "weaknesses"
    | "recommendation"
    | "status"
    | "statusNote"
  >,
): Promise<InterviewActionResponse> {
  try {
    const actor = await getActorContext();

    if (!actor) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const records = await readInterviewData();
    const index = records.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "Interview record not found",
      };
    }

    const current = records[index];

    if (!canViewInterview(current, actor) || current.interviewerId !== actor.employeeId) {
      return {
        success: false,
        message: "You can only submit feedback for interviews assigned to you",
      };
    }

    const nextStatus = input.status || "COMPLETED";
    const nextRecommendation = input.recommendation ?? current.recommendation ?? null;
    const nextRatingScore =
      typeof input.ratingScore === "number" ? input.ratingScore : current.ratingScore;
    const auditEntries = [...(current.history || [])];

    if (current.status !== nextStatus) {
      auditEntries.push(
        buildHistoryEntry(
          actor,
          "STATUS_UPDATED",
          `Interview status changed from ${current.status} to ${nextStatus}.`,
        ),
      );
    }

    if (current.recommendation !== nextRecommendation && nextRecommendation) {
      auditEntries.push(
        buildHistoryEntry(
          actor,
          "RECOMMENDATION_UPDATED",
          `Recommendation updated to ${nextRecommendation.replaceAll("_", " ")}.`,
        ),
      );
    }

    if ((input.statusNote || "").trim() && input.statusNote !== current.statusNote) {
      auditEntries.push(
        buildHistoryEntry(
          actor,
          "INTERVIEW_NOTE_UPDATED",
          "Interviewer note updated for HR review.",
        ),
      );
    }

    const feedbackSummaryParts = [
      input.feedback?.trim() ? "feedback captured" : "",
      input.strengths?.trim() ? "strengths noted" : "",
      input.weaknesses?.trim() ? "weaknesses noted" : "",
      typeof nextRatingScore === "number" ? `score ${nextRatingScore}/10` : "",
      nextRecommendation
        ? `recommendation ${nextRecommendation.replaceAll("_", " ")}`
        : "",
    ].filter(Boolean);

    auditEntries.push(
      buildHistoryEntry(
        actor,
        "FEEDBACK_SUBMITTED",
        feedbackSummaryParts.length
          ? `Interviewer submitted ${feedbackSummaryParts.join(", ")}.`
          : `Interviewer submitted an update with status ${nextStatus}.`,
      ),
    );

    const nextRecord = normalizeInterviewRecord(
      {
        ...current,
        feedback: input.feedback || "",
        ratingScore: nextRatingScore,
        strengths: input.strengths || "",
        weaknesses: input.weaknesses || "",
        recommendation: nextRecommendation,
        status: nextStatus,
        statusNote: input.statusNote || "",
        completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : current.completedAt,
        updatedBy: actor.employeeId,
        updatedByName: actor.name,
        history: auditEntries,
      },
      records,
    );

    records[index] = nextRecord;
    await writeInterviewData(records);
    await syncApplicantPipelineFromInterview(nextRecord);

    revalidatePath("/interviews");
    revalidatePath(`/interviews/edit/${id}`);

    return {
      success: true,
      message: "Feedback submitted successfully",
      data: nextRecord,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function cancelInterview(
  id: string,
  note: string,
): Promise<InterviewActionResponse> {
  try {
    const actor = await getActorContext();

    if (!actor?.canManageAll) {
      return {
        success: false,
        message: "Only HR can cancel interviews",
      };
    }

    const records = await readInterviewData();
    const index = records.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "Interview record not found",
      };
    }

    const current = records[index];
    const nextRecord = normalizeInterviewRecord(
      {
        ...current,
        status: "CANCELLED",
        statusNote: note,
        updatedBy: actor.employeeId,
        updatedByName: actor.name,
        history: [
          ...(current.history || []),
          buildHistoryEntry(actor, "INTERVIEW_CANCELLED", note || "Interview cancelled."),
        ],
      },
      records,
    );

    records[index] = nextRecord;
    await writeInterviewData(records);
    await syncApplicantPipelineFromInterview(nextRecord);

    revalidatePath("/interviews");

    return {
      success: true,
      message: "Interview cancelled successfully",
      data: nextRecord,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
