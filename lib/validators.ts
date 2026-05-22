import {
  ExperienceType,
  MovementType,
  Status,
  ProjectStatus,
  TaskStatus,
  Priority,
  AttendanceStatus,
} from "@prisma/client";
import { z } from "zod";
import { DOCUMENT_REVIEW_STATUSES } from "./document-review";

const EOD_APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
const employeeDocumentOwnerTypes = ["APPLICANT", "EMPLOYEE"] as const;
const recruitmentBinaryStatuses = ["YES", "NO"] as const;
const recruitmentTriStatuses = [
  "YES",
  "NO",
  "NOT_APPLICABLE",
] as const;
const recruitmentPipelineStatuses = [
  "PENDING",
  "REJECTED",
  "SELECTED",
  "ON_HOLD",
  "BACK_OUT",
] as const;
const recruitmentProfileSources = [
  "INTERNAL",
  "CONSULTANCY",
  "OTHER",
] as const;

/* ---------------- AUTH ---------------- */
export const loginFormSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(6, "Password should be at least 6 characters long"),
});

/* ---------------- ROLE ---------------- */
export const roleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Role name is required"),
  remark: z.string().nullable().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

/* ---------------- Module ---------------- */
export const moduleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  route: z.string().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- JOB ROLE ---------------- */
export const jobRoleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().nullable().optional(),
  remark: z.string().nullable().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- DEPARTMENT ---------------- */
export const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().nullable().optional(),
  remark: z.string().nullable().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- WORK LOCATION ---------------- */
export const workLocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Work location name is required"),
  code: z.string().min(1, "Location code is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional(),
  remark: z.string().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- TRANSFER & PROMOTION ---------------- */
export const transferPromotionSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "Employee is required"),
  movementType: z.nativeEnum(MovementType),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  currentDesignation: z.string().optional(),
  newDesignation: z.string().optional(),
  effectiveDate: z.string().min(1, "Effective date is required"),
  reason: z.string().min(1, "Reason is required"),
  remark: z.string().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- EMPLOYEE ID & DOCS ---------------- */
export const employeeDocumentSchema = z
  .object({
    id: z.string().optional(),
    documentOwnerType: z.enum(employeeDocumentOwnerTypes).default("APPLICANT"),

    applicantId: z.string().optional(),
    applicantCode: z.string().optional(),
    candidateName: z.string().optional(),
    employeeId: z.string().optional(),
    employeeCode: z.string().optional(),
    employeeName: z.string().optional(),
    linkedEmployeeId: z.string().optional(),
    linkedEmployeeCode: z.string().optional(),
    linkedEmployeeName: z.string().optional(),

    // ---------------- DOCUMENTS ----------------
    aadhaarNumber: z.string().min(1, "Aadhaar number is required"),
    aadhaarFileUrl: z.string().optional(),

    panNumber: z.string().min(1, "PAN number is required"),
    panFileUrl: z.string().optional(),

    // ---------------- EDUCATION ----------------
    educationEntries: z
      .array(
        z.object({
          degree: z.string().optional(),
          college: z.string().optional(),
          year: z.string().optional(),
          marks: z.coerce.number().optional(),
          marksheetFileUrl: z.string().optional(),
        }),
      )
      .optional(),

    // ---------------- EXPERIENCE ----------------
    experienceType: z.nativeEnum(ExperienceType),

    experienceEntries: z
      .array(
        z.object({
          totalExperience: z.string().optional(),
          previousCompanyName: z.string().optional(),
          experienceLetterFileUrl: z.string().optional(),
          salarySlip1FileUrl: z.string().optional(),
          salarySlip2FileUrl: z.string().optional(),
          salarySlip3FileUrl: z.string().optional(),
        }),
      )
      .optional(),

    // ---------------- COMMON ----------------
    reviewStatus: z.enum(DOCUMENT_REVIEW_STATUSES).optional(),
    reviewRemark: z.string().optional(),
    reviewedByName: z.string().optional(),
    reviewedAt: z.string().nullable().optional(),
    remark: z.string().optional(),
    status: z.nativeEnum(Status),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.documentOwnerType === "APPLICANT") {
      if (!data.applicantId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Applicant is required",
          path: ["applicantId"],
        });
      }

      if (!data.applicantCode?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Request ID is required",
          path: ["applicantCode"],
        });
      }

      if (!data.candidateName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Candidate name is required",
          path: ["candidateName"],
        });
      }
    }

    // Education validation
    data.educationEntries?.forEach((entry, index) => {
      if (!entry.degree?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Degree is required",
          path: ["educationEntries", index, "degree"],
        });
      }

      if (!entry.college?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "College is required",
          path: ["educationEntries", index, "college"],
        });
      }
    });

    // Experience validation
    if (data.experienceType !== ExperienceType.EXPERIENCED) {
      return;
    }

    if (!data.experienceEntries?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one experience card is required",
        path: ["experienceEntries"],
      });
      return;
    }

    data.experienceEntries.forEach((entry, index) => {
      if (!entry.totalExperience?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Total experience is required",
          path: ["experienceEntries", index, "totalExperience"],
        });
      }

      if (!entry.previousCompanyName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Previous company name is required",
          path: ["experienceEntries", index, "previousCompanyName"],
        });
      }
    });
  });

/* ---------------- EMPLOYEE PROFILE ---------------- */
export const employeeProfileSchema = z.object({
  id: z.string().optional(),
  sourceApplicantDocumentId: z.string().optional(),
  managerId: z.union([z.string().uuid(), z.literal("")]).optional(),
  employeeName: z.string().trim().min(1, "Employee name is required"),
  employeeCode: z.string().optional(),
  email: z.string().min(1, "Email Id is required"),
  password: z.union([
    z.string().min(6, "Password should be at least 6 characters long"),
    z.literal(""),
  ]),
  companyId: z.string().min(1, "Company is required"),
  phone: z.string().min(1, "Phone is required"),
  alternatePhone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
  departmentId: z.string().optional(),
  jobRoleId: z.string().optional(),
  workLocationId: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  remark: z.string().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- USER ---------------- */
export const userSchema = z.object({
  id: z.string().optional(),
  password: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  status: z.nativeEnum(Status),
  roleId: z.string().min(1, "Role is required"),
  remark: z.string().optional(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const createUserSchema = userSchema.extend({
  password: z.string().min(1, "Password is required"),
});

/* ---------------- COMPANY ---------------- */
export const companySchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  companyCode: z.string().min(1, "Company code is required"),
  email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),
  phone: z.string().min(1, "Phone is required"),
  website: z.string().optional(),
  address: z.string().optional(),
  remark: z.string().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- EMPLOYER ---------------- */
export const employerSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().min(1, "Company is required"),
  employerName: z.string().min(1, "Employer name is required"),
  employerCode: z.string().min(1, "Employer code is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  password: z.union([
    z.string().min(6, "Password should be at least 6 characters long"),
    z.literal(""),
  ]),
  designation: z.string().optional(),
  address: z.string().optional(),
  remark: z.string().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const createEmployerSchema = employerSchema.extend({
  password: z.string().min(6, "Password should be at least 6 characters long"),
});

/* ---------------- RECRUITMENT ---------------- */
export const recruitmentSchema = z.object({
  id: z.string().optional(),
  applicantPortalId: z.string().optional(),
  applicantUsername: z.string().optional(),
  applicantPasswordHash: z.string().optional(),
  applicantPortalEnabled: z.boolean().optional(),
  applicantInvitedAt: z.string().nullable().optional(),
  applicantDocumentsSubmittedAt: z.string().nullable().optional(),
  serialNumber: z.string().optional(),
  requestId: z.string().min(1, "Request ID is required"),
  clientProjectName: z
    .string()
    .min(1, "Client / Project Name is required"),
  requestReceivedDate: z.string().optional(),
  requestApprovedBy: z.string().optional(),
  hrOwnerEmployeeNumber: z.string().optional(),
  hrOwnerName: z.string().optional(),
  businessOwnerEmployeeNumber: z.string().optional(),
  businessOwnerName: z.string().optional(),
  candidateName: z.string().min(1, "Candidate Name is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  email: z.union([
    z.string().email("Invalid email address"),
    z.literal(""),
  ]),
  currentLocation: z.string().optional(),
  preferredLocation: z.string().optional(),
  noticePeriod: z.string().optional(),
  qualification: z.string().optional(),
  skillsLevel: z.string().optional(),
  profilePost: z.string().min(1, "Profile / Post is required"),
  certification: z.string().optional(),
  totalExperience: z.string().optional(),
  relevantExperience: z.string().optional(),
  currentCompany: z.string().optional(),
  currentCtc: z.string().optional(),
  expectedCtc: z.string().optional(),
  offeredCtc: z.string().optional(),
  profileSource: z.enum(recruitmentProfileSources).optional(),
  profileReceiveDate: z.string().optional(),
  internalScreeningDate: z.string().optional(),
  internalScreeningCleared: z.enum(recruitmentBinaryStatuses).optional(),
  profileSentToBusinessOwner: z.enum(recruitmentTriStatuses).optional(),
  profileSentToBusinessOwnerDate: z.string().optional(),
  profileConnectWithClientDate: z.string().optional(),
  interviewedByClient: z.enum(recruitmentTriStatuses).optional(),
  clientInterviewDate: z.string().optional(),
  feedbackDate: z.string().optional(),
  internalStatus: z.enum(recruitmentPipelineStatuses).optional(),
  clientFinalStatus: z.enum(recruitmentPipelineStatuses).optional(),
  updatedToCandidateDate: z.string().optional(),
  offeredDate: z.string().optional(),
  offerAccepted: z.enum(recruitmentTriStatuses).optional(),
  reasonIfOfferNotAccepted: z.string().optional(),
  agreedJoiningDate: z.string().optional(),
  joined: z.enum(recruitmentTriStatuses).optional(),
  reasonIfNotJoined: z.string().optional(),
  actualJoiningDate: z.string().optional(),
  joiningDetailsShared: z.enum(recruitmentTriStatuses).optional(),
  joiningDetailsSharedDate: z.string().optional(),
  remarks: z.string().optional(),
  status: z.nativeEnum(Status),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- CONFIGURATION ---------------- */
export const configurationSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  logo: z.any().optional(),
  favicon: z.any().optional(),
  email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),
  password: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().positive().optional(),
  smtpSecure: z.boolean().optional(),
  smtpFromName: z.string().optional(),
});

/* ---------------- PROJECT ---------------- */
export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Project is required"),
  description: z.string().optional(),
  startDate: z.union([z.date().min(1, "Start Date is required"), z.string().nullable()]),
  endDate: z.union([z.date().min(1, "Start Date is required"), z.string().nullable()]),
  status: z.enum(Object.values(ProjectStatus)),
  createdById: z.string().min(1, "CreatedBy is required"),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- PROJECT MEMBER ---------------- */
export const projectMemberSchema = z
  .object({
    id: z.string().optional(),
    projectId: z.string().min(1, "Project is required"),
    employeeId: z.string().optional(),
    employeeIds: z.array(z.string()).optional(),
    assignedAt: z.union([z.date().optional(), z.string().nullable()]),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.employeeId || data.employeeIds?.length) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one employee is required",
      path: ["employeeIds"],
    });
  });

/* ---------------- TASK ---------------- */
export const taskSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  assignedToId: z.string().min(1, "Assigned Employee is required"),

  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),

  status: z.enum(Object.values(TaskStatus)),
  priority: z.enum(Object.values(Priority)),

  startDate: z.union([z.date().min(1, "Start Date is required"), z.string().nullable()]),
  dueDate: z.union([z.date().min(1, "Due Date is required"), z.string().nullable()]),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- TASK COMMENT ---------------- */
export const taskCommentSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  employeeId: z.string().min(1, "Employee is required"),
  comment: z.string().min(1, "Comment is required"),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- ATTENDANCE ---------------- */
export const attendanceSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "Employee is required"),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  workingHours: z.coerce.number().nullable().optional(),
  status: z.nativeEnum(AttendanceStatus),
  isLate: z.boolean().optional(),
  isHalfDay: z.boolean().optional(),
  remarks: z.string().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/* ---------------- EOD REPORTING ---------------- */
export const eodReportSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().optional(),
  reportDate: z.string().min(1, "Report date is required"),
  linkedTaskIds: z.array(z.string()).optional(),
  accomplishments: z.string().trim().min(1, "Accomplishments are required"),
  plans: z.string().optional(),
  blockers: z.string().optional(),
  managerStatus: z.enum(EOD_APPROVAL_STATUSES).optional(),
  managerRemark: z.string().optional(),
  reviewedByManagerId: z.string().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const monthlyEodReviewSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "Employee is required"),
  year: z.coerce.number().int().min(2000),
  month: z.coerce.number().int().min(1).max(12),
  managerStatus: z.enum(EOD_APPROVAL_STATUSES).optional(),
  managerRemark: z.string().optional(),
  hrStatus: z.enum(EOD_APPROVAL_STATUSES).optional(),
  hrRemark: z.string().optional(),
  reviewedByHrEmail: z.string().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
