"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

import { type RecruitmentIntake } from "@/types";
import { formatError } from "../utils";
import { recruitmentIntakeSchema } from "../validators";

type ActionResponse = {
  success: boolean;
  message: string;
};

const dataFilePath = path.join(
  process.cwd(),
  "lib",
  "data",
  "recruitment-intake.json",
);

async function ensureDataFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

async function readRecruitmentIntakeData(): Promise<RecruitmentIntake[]> {
  await ensureDataFile();
  const raw = await fs.readFile(dataFilePath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecruitmentIntake[]) : [];
  } catch {
    return [];
  }
}

async function writeRecruitmentIntakeData(data: RecruitmentIntake[]) {
  await ensureDataFile();
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getFileValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : undefined;
}

function normalizeSource(value: string) {
  return value.trim().toUpperCase();
}

async function saveResumeUpload(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Resume must be a PDF file");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "recruitment-intake");
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, fileName), buffer);

  return `/uploads/recruitment-intake/${fileName}`;
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
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

function buildIntakeRecordFromForm(
  formData: FormData,
  currentRecord?: RecruitmentIntake,
) {
  const resumeFile = getFileValue(formData, "resumeFile");
  const currentResumeUrl = getStringValue(formData, "currentResumeUrl");
  const resumeUrl = resumeFile
    ? undefined
    : currentRecord?.resumeUrl || currentResumeUrl || undefined;

  const parsed = recruitmentIntakeSchema.parse({
    id: getStringValue(formData, "id") || undefined,
    name: getStringValue(formData, "name"),
    email: getStringValue(formData, "email"),
    phone: getStringValue(formData, "phone"),
    resumeUrl,
    skills: getStringValue(formData, "skills"),
    experience: getStringValue(formData, "experience"),
    appliedPosition: getStringValue(formData, "appliedPosition"),
    source: normalizeSource(getStringValue(formData, "source")),
    createdAt: currentRecord?.createdAt || undefined,
  });

  return { parsed, resumeFile };
}

export async function getRecruitmentIntakes(): Promise<RecruitmentIntake[]> {
  try {
    const records = await readRecruitmentIntakeData();
    return records.sort((a, b) =>
      (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""),
    );
  } catch {
    return [];
  }
}

export async function getRecruitmentIntakeById(id: string) {
  try {
    const records = await getRecruitmentIntakes();
    const record = records.find((item) => item.id === id);

    if (!record) {
      return {
        success: false,
        message: "Recruitment record not found",
      };
    }

    return {
      success: true,
      data: record,
      message: "Recruitment record fetched successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function createRecruitmentIntake(
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const records = await readRecruitmentIntakeData();
    const { parsed, resumeFile } = buildIntakeRecordFromForm(formData);

    if (!resumeFile) {
      return {
        success: false,
        message: "Resume PDF is required",
      };
    }

    const resumeUrl = await saveResumeUpload(resumeFile);
    const nextRecord = normalizeRecruitmentIntake(
      {
        ...parsed,
        resumeUrl,
      },
    );

    records.push(nextRecord);
    await writeRecruitmentIntakeData(records);

    revalidatePath("/recruitment-intake");

    return {
      success: true,
      message: "Recruitment record created successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateRecruitmentIntake(
  formData: FormData,
  id: string,
): Promise<ActionResponse> {
  try {
    const records = await readRecruitmentIntakeData();
    const index = records.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "Recruitment record not found",
      };
    }

    const { parsed, resumeFile } = buildIntakeRecordFromForm(
      formData,
      records[index],
    );

    const resumeUrl = resumeFile
      ? await saveResumeUpload(resumeFile)
      : records[index].resumeUrl;

    records[index] = normalizeRecruitmentIntake(
      {
        ...parsed,
        id,
        createdAt: records[index].createdAt,
        resumeUrl,
      },
    );

    await writeRecruitmentIntakeData(records);
    revalidatePath("/recruitment-intake");
    revalidatePath(`/recruitment-intake/edit/${id}`);

    return {
      success: true,
      message: "Recruitment record updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function deleteRecruitmentIntake(id: string): Promise<ActionResponse> {
  try {
    const records = await readRecruitmentIntakeData();
    const nextRecords = records.filter((item) => item.id !== id);

    await writeRecruitmentIntakeData(nextRecords);
    revalidatePath("/recruitment-intake");

    return {
      success: true,
      message: "Recruitment record deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
