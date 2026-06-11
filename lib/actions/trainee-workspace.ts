"use server";

import { AttendanceStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { Trainee } from "@/types";
import { isAdminRole, getUserPermissions } from "../rbac";
import { prisma } from "../prisma";
import { formatError } from "../utils";
import {
  getMonthRange,
  resolveAttendanceStatus,
  toDateInput,
  toDateOnly,
} from "../attendance-utils";
import { isCurrentEmployeeHr } from "../employee-job-role";
import { getTraineeById } from "./trainees";

type ActionResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

export type TraineeAttendanceRecord = {
  id: string;
  traineeId: string;
  traineeName: string;
  traineeCode: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: number | null;
  status: AttendanceStatus;
  isLate: boolean;
  isHalfDay: boolean;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

export type TraineeTaskRecord = {
  id: string;
  traineeId: string;
  traineeName: string;
  traineeCode: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
  remarks: string;
  submissionUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TraineeAssessmentRecord = {
  id: string;
  traineeId: string;
  assessmentName: string;
  score: number;
  maxScore: number;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

export type TraineeEvaluationRecord = {
  id: string;
  traineeId: string;
  technicalSkills: number;
  communication: number;
  learningAbility: number;
  discipline: number;
  teamwork: number;
  problemSolving: number;
  trainerRemarks: string;
  recommendation: string;
  createdAt: string;
  updatedAt: string;
};

export type TraineeTrainingMaterialRecord = {
  id: string;
  traineeId: string;
  title: string;
  description: string;
  materialType: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

type TraineeWorkspaceSummary = {
  trainingProgress: number;
  attendancePercentage: number;
  pendingTasks: number;
  averageAssessmentScore: number;
  trainingEndDate: string;
  trainerRemarks: string;
  recommendation: string;
};

type TraineeWorkspaceData = {
  trainee: Trainee;
  summary: TraineeWorkspaceSummary;
  attendance: TraineeAttendanceRecord[];
  tasks: TraineeTaskRecord[];
  assessments: TraineeAssessmentRecord[];
  evaluations: TraineeEvaluationRecord[];
  materials: TraineeTrainingMaterialRecord[];
};

async function requireHrAccess() {
  const user = await getUserPermissions();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!isAdminRole(user.role?.name) && !(await isCurrentEmployeeHr())) {
    throw new Error("Forbidden");
  }

  return user;
}

async function requireCurrentTrainee() {
  const session = await auth();

  if (session?.user?.accountType !== "trainee" || !session.user.id) {
    throw new Error("Unauthorized");
  }

  const trainee = await getTraineeById(session.user.id);

  if (!trainee) {
    throw new Error("Trainee not found");
  }

  return trainee;
}

function mapAttendanceRecord(
  record: Prisma.TraineeAttendanceGetPayload<{
    include: {
      trainee: true;
    };
  }>,
): TraineeAttendanceRecord {
  return {
    id: record.id,
    traineeId: record.traineeId,
    traineeName: record.trainee.fullName,
    traineeCode: record.trainee.traineeCode,
    date: toDateInput(record.date),
    checkIn: record.checkIn?.toISOString() ?? "",
    checkOut: record.checkOut?.toISOString() ?? "",
    workingHours: record.workingHours,
    status: record.status as AttendanceStatus,
    isLate: record.isLate,
    isHalfDay: record.isHalfDay,
    remarks: record.remarks ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapTaskRecord(
  record: Prisma.TraineeTaskGetPayload<{
    include: {
      trainee: true;
    };
  }>,
): TraineeTaskRecord {
  return {
    id: record.id,
    traineeId: record.traineeId,
    traineeName: record.trainee.fullName,
    traineeCode: record.trainee.traineeCode,
    title: record.title,
    description: record.description ?? "",
    dueDate: record.dueDate?.toISOString().slice(0, 10) ?? "",
    priority: record.priority,
    status: record.status,
    remarks: record.remarks ?? "",
    submissionUrl: record.submissionUrl ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapAssessmentRecord(record: Prisma.TraineeAssessmentGetPayload<object>): TraineeAssessmentRecord {
  return {
    id: record.id,
    traineeId: record.traineeId,
    assessmentName: record.assessmentName,
    score: record.score,
    maxScore: record.maxScore,
    remarks: record.remarks ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapEvaluationRecord(record: Prisma.TraineeEvaluationGetPayload<object>): TraineeEvaluationRecord {
  return {
    id: record.id,
    traineeId: record.traineeId,
    technicalSkills: record.technicalSkills,
    communication: record.communication,
    learningAbility: record.learningAbility,
    discipline: record.discipline,
    teamwork: record.teamwork,
    problemSolving: record.problemSolving,
    trainerRemarks: record.trainerRemarks ?? "",
    recommendation: record.recommendation,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapMaterialRecord(
  record: Prisma.TraineeTrainingMaterialGetPayload<{
    include: {
      trainee: true;
    };
  }>,
): TraineeTrainingMaterialRecord {
  return {
    id: record.id,
    traineeId: record.traineeId ?? "",
    title: record.title,
    description: record.description ?? "",
    materialType: record.materialType,
    url: record.url ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function summaryFromRecords(params: {
  trainee: Trainee;
  attendance: TraineeAttendanceRecord[];
  tasks: TraineeTaskRecord[];
  assessments: TraineeAssessmentRecord[];
  evaluations: TraineeEvaluationRecord[];
}): TraineeWorkspaceSummary {
  const completedTasks = params.tasks.filter((task) => task.status === "DONE").length;
  const attendanceDenominator = params.attendance.filter(
    (record) => record.status !== AttendanceStatus.HOLIDAY,
  ).length;
  const attendancePercentage = attendanceDenominator
    ? Math.round(
        (params.attendance.filter(
          (record) => record.status === AttendanceStatus.PRESENT,
        ).length /
          attendanceDenominator) *
          100,
      )
    : params.trainee.attendancePercentage ?? 0;
  const averageAssessmentScore = params.assessments.length
    ? Math.round(
        (params.assessments.reduce((sum, item) => sum + item.score, 0) /
          params.assessments.length) * 10,
      ) / 10
    : 0;
  const latestEvaluation = params.evaluations[0];

  return {
    trainingProgress: params.trainee.trainingProgress ?? 0,
    attendancePercentage,
    pendingTasks: Math.max(0, params.tasks.length - completedTasks),
    averageAssessmentScore,
    trainingEndDate: params.trainee.trainingEndDate || "-",
    trainerRemarks: latestEvaluation?.trainerRemarks || params.trainee.evaluationRemarks || "Pending",
    recommendation:
      latestEvaluation?.recommendation || params.trainee.evaluationRecommendation || "Pending",
  };
}

export async function getTraineeWorkspaceData(
  traineeId: string,
): Promise<TraineeWorkspaceData | null> {
  await requireHrAccess();

  const trainee = await getTraineeById(traineeId);
  if (!trainee) {
    return null;
  }

  const [attendance, tasks, assessments, evaluations, materials] =
    await Promise.all([
      prisma.traineeAttendance.findMany({
        where: { traineeId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { trainee: true },
      }),
      prisma.traineeTask.findMany({
        where: { traineeId },
        orderBy: [{ createdAt: "desc" }],
        include: { trainee: true },
      }),
      prisma.traineeAssessment.findMany({
        where: { traineeId },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.traineeEvaluation.findMany({
        where: { traineeId },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.traineeTrainingMaterial.findMany({
        where: { traineeId },
        orderBy: [{ createdAt: "desc" }],
        include: { trainee: true },
      }),
    ]);

  const mappedAttendance = attendance.map(mapAttendanceRecord);
  const mappedTasks = tasks.map(mapTaskRecord);
  const mappedAssessments = assessments.map(mapAssessmentRecord);
  const mappedEvaluations = evaluations.map(mapEvaluationRecord);
  const mappedMaterials = materials.map(mapMaterialRecord);

  return {
    trainee,
    summary: summaryFromRecords({
      trainee,
      attendance: mappedAttendance,
      tasks: mappedTasks,
      assessments: mappedAssessments,
      evaluations: mappedEvaluations,
    }),
    attendance: mappedAttendance,
    tasks: mappedTasks,
    assessments: mappedAssessments,
    evaluations: mappedEvaluations,
    materials: mappedMaterials,
  };
}

export async function getCurrentTraineeWorkspaceData() {
  const trainee = await requireCurrentTrainee();

  const [attendance, tasks, assessments, evaluations, materials] =
    await Promise.all([
      prisma.traineeAttendance.findMany({
        where: { traineeId: trainee.id },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { trainee: true },
      }),
      prisma.traineeTask.findMany({
        where: { traineeId: trainee.id },
        orderBy: [{ createdAt: "desc" }],
        include: { trainee: true },
      }),
      prisma.traineeAssessment.findMany({
        where: { traineeId: trainee.id },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.traineeEvaluation.findMany({
        where: { traineeId: trainee.id },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.traineeTrainingMaterial.findMany({
        where: { traineeId: trainee.id },
        orderBy: [{ createdAt: "desc" }],
        include: { trainee: true },
      }),
    ]);

  const mappedAttendance = attendance.map(mapAttendanceRecord);
  const mappedTasks = tasks.map(mapTaskRecord);
  const mappedAssessments = assessments.map(mapAssessmentRecord);
  const mappedEvaluations = evaluations.map(mapEvaluationRecord);
  const mappedMaterials = materials.map(mapMaterialRecord);

  return {
    trainee,
    summary: summaryFromRecords({
      trainee,
      attendance: mappedAttendance,
      tasks: mappedTasks,
      assessments: mappedAssessments,
      evaluations: mappedEvaluations,
    }),
    attendance: mappedAttendance,
    tasks: mappedTasks,
    assessments: mappedAssessments,
    evaluations: mappedEvaluations,
    materials: mappedMaterials,
  };
}

export async function upsertTraineeAttendance(input: {
  traineeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
  remarks?: string;
}) {
  try {
    await requireHrAccess();

    const date = toDateOnly(input.date);
    const existing = await prisma.traineeAttendance.findUnique({
      where: {
        traineeId_date: {
          traineeId: input.traineeId,
          date,
        },
      },
    });

    const now = new Date();
    const checkIn = input.checkIn
      ? new Date(input.checkIn)
      : existing?.checkIn ?? now;
    const checkOut = input.checkOut
      ? new Date(input.checkOut)
      : existing?.checkOut ?? null;
    const calculated = resolveAttendanceStatus(checkIn, checkOut, input.status);

    await prisma.traineeAttendance.upsert({
      where: {
        traineeId_date: {
          traineeId: input.traineeId,
          date,
        },
      },
      update: {
        checkIn,
        checkOut,
        workingHours: calculated.workingHours,
        status: calculated.status,
        isLate: calculated.isLate,
        isHalfDay: calculated.isHalfDay,
        remarks: input.remarks ?? existing?.remarks ?? null,
      },
      create: {
        traineeId: input.traineeId,
        date,
        checkIn,
        checkOut,
        workingHours: calculated.workingHours,
        status: calculated.status,
        isLate: calculated.isLate,
        isHalfDay: calculated.isHalfDay,
        remarks: input.remarks ?? null,
      },
    });

    revalidatePath(`/trainees/${input.traineeId}`);
    revalidatePath("/trainees");
    revalidatePath("/trainee-dashboard/attendance");

    return {
      success: true,
      message: "Trainee attendance saved successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function createTraineeTask(input: {
  traineeId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  remarks?: string;
  submissionUrl?: string;
}): Promise<ActionResponse> {
  try {
    await requireHrAccess();

    await prisma.traineeTask.create({
      data: {
        traineeId: input.traineeId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        priority: input.priority || "MEDIUM",
        status: input.status || "TODO",
        remarks: input.remarks?.trim() || null,
        submissionUrl: input.submissionUrl?.trim() || null,
      },
    });

    revalidatePath(`/trainees/${input.traineeId}/tasks`);
    revalidatePath(`/trainees/${input.traineeId}`);
    revalidatePath("/trainee-dashboard/tasks");

    return { success: true, message: "Task created successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateTraineeTaskStatus(input: {
  taskId: string;
  status: string;
  remarks?: string;
  submissionUrl?: string;
}): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const task = await prisma.traineeTask.findUnique({
      where: { id: input.taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const canEdit = session.user.accountType === "trainee"
      ? session.user.id === task.traineeId
      : !!(await requireHrAccess());

    if (!canEdit) {
      throw new Error("Forbidden");
    }

    await prisma.traineeTask.update({
      where: { id: input.taskId },
      data: {
        status: input.status,
        remarks: input.remarks?.trim() || task.remarks,
        submissionUrl: input.submissionUrl?.trim() || task.submissionUrl,
      },
    });

    revalidatePath(`/trainees/${task.traineeId}/tasks`);
    revalidatePath(`/trainees/${task.traineeId}`);
    revalidatePath("/trainee-dashboard/tasks");

    return { success: true, message: "Task updated successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function createTraineeAssessment(input: {
  traineeId: string;
  assessmentName: string;
  score: number;
  maxScore: number;
  remarks?: string;
}): Promise<ActionResponse> {
  try {
    await requireHrAccess();

    await prisma.traineeAssessment.create({
      data: {
        traineeId: input.traineeId,
        assessmentName: input.assessmentName.trim(),
        score: input.score,
        maxScore: input.maxScore,
        remarks: input.remarks?.trim() || null,
      },
    });

    revalidatePath(`/trainees/${input.traineeId}/assessments`);
    revalidatePath(`/trainees/${input.traineeId}`);
    revalidatePath("/trainee-dashboard/assessments");

    return { success: true, message: "Assessment recorded successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function createTraineeEvaluation(input: {
  traineeId: string;
  technicalSkills: number;
  communication: number;
  learningAbility: number;
  discipline: number;
  teamwork: number;
  problemSolving: number;
  trainerRemarks?: string;
  recommendation: string;
}): Promise<ActionResponse> {
  try {
    await requireHrAccess();

    await prisma.traineeEvaluation.create({
      data: {
        traineeId: input.traineeId,
        technicalSkills: input.technicalSkills,
        communication: input.communication,
        learningAbility: input.learningAbility,
        discipline: input.discipline,
        teamwork: input.teamwork,
        problemSolving: input.problemSolving,
        trainerRemarks: input.trainerRemarks?.trim() || null,
        recommendation: input.recommendation,
      },
    });

    revalidatePath(`/trainees/${input.traineeId}/evaluations`);
    revalidatePath(`/trainees/${input.traineeId}`);
    revalidatePath("/trainee-dashboard");

    return { success: true, message: "Evaluation saved successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function createTraineeMaterial(input: {
  traineeId: string;
  title: string;
  description?: string;
  materialType: string;
  url: string;
}): Promise<ActionResponse> {
  try {
    await requireHrAccess();

    await prisma.traineeTrainingMaterial.create({
      data: {
        traineeId: input.traineeId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        materialType: input.materialType,
        url: input.url.trim(),
      },
    });

    revalidatePath(`/trainees/${input.traineeId}/materials`);
    revalidatePath(`/trainees/${input.traineeId}`);
    revalidatePath("/trainee-dashboard/materials");

    return { success: true, message: "Training material added successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getTraineeMonthAttendance(
  traineeId: string,
  year?: number,
  month?: number,
) {
  const trainee = await getTraineeById(traineeId);
  if (!trainee) {
    return null;
  }

  const today = new Date();
  const currentYear = year ?? today.getFullYear();
  const currentMonth = month ?? today.getMonth() + 1;
  const { start, end, daysInMonth } = getMonthRange(currentYear, currentMonth);

  const records = await prisma.traineeAttendance.findMany({
    where: {
      traineeId,
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { date: "asc" },
  });

  const days: Record<number, string> = {};
  for (let day = 1; day <= daysInMonth; day += 1) {
    days[day] = "";
  }

  let present = 0;
  let leaves = 0;
  let absents = 0;
  let halfDays = 0;

  for (const record of records) {
    const day = record.date.getUTCDate();
    days[day] = record.status;

    if (record.status === AttendanceStatus.PRESENT) present += 1;
    if (record.status === AttendanceStatus.LEAVE) leaves += 1;
    if (record.status === AttendanceStatus.ABSENT) absents += 1;
    if (record.status === AttendanceStatus.HALF_DAY) halfDays += 1;
  }

  return {
    year: currentYear,
    month: currentMonth,
    daysInMonth,
    trainee,
    rows: [
      {
        traineeId,
        traineeName: trainee.fullName,
        traineeCode: trainee.traineeCode,
        days,
        totals: {
          present,
          leaves,
          absents,
          halfDays,
        },
      },
    ],
  };
}
