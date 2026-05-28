import z from "zod";
import {
  companySchema,
  configurationSchema,
  departmentSchema,
  employeeDocumentSchema,
  employeeProfileSchema,
  employerSchema,
  jobRoleSchema,
  moduleSchema,
  projectMemberSchema,
  projectSchema,
  roleSchema,
  taskCommentSchema,
  taskSchema,
  transferPromotionSchema,
  eodReportSchema,
  monthlyEodReviewSchema,
  recruitmentSchema,
  recruitmentIntakeSchema,
  userSchema,
  workLocationSchema,
  attendanceSchema,
} from "@/lib/validators";

export type Role = z.infer<typeof roleSchema>;

export type Module = z.infer<typeof moduleSchema>;

export type JobRole = z.infer<typeof jobRoleSchema>;

export type Department = z.infer<typeof departmentSchema>;

export type User = z.infer<typeof userSchema>;

export type Configuration = z.infer<typeof configurationSchema>

export type Company = z.infer<typeof companySchema>;

export type Employer = z.infer<typeof employerSchema> & {
  companyName?: string;
};

export type RecruitmentApplication = z.infer<typeof recruitmentSchema>;
export type RecruitmentIntake = z.infer<typeof recruitmentIntakeSchema>;

export type WorkLocation = z.infer<typeof workLocationSchema>;

export type TransferPromotion = z.infer<typeof transferPromotionSchema> & {
  employeeName?: string;
  fromLocationName?: string;
  toLocationName?: string;
};

export type EmployeeDocument = z.infer<typeof employeeDocumentSchema> & {
  applicantName?: string;
  ownerName?: string;
  ownerCode?: string;
  reviewedByName?: string;
};

export type EmployeeProfile = z.infer<typeof employeeProfileSchema> & {
  companyName?: string;
  departmentName?: string;
  jobRoleName?: string;
  managerName?: string;
  workLocationName?: string;
  projectNames?: string[];
};

export type Project = z.infer<typeof projectSchema>
export type ProjectMember = z.infer<typeof projectMemberSchema>
export type Task = z.infer<typeof taskSchema>
export type TaskComment = z.infer<typeof taskCommentSchema>
export type Attendance = z.infer<typeof attendanceSchema> & {
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
};
export type EodReport = z.infer<typeof eodReportSchema> & {
  employeeName?: string;
  employeeCode?: string;
  managerName?: string;
  attendanceStatus?: string;
};
export type MonthlyEodReview = z.infer<typeof monthlyEodReviewSchema> & {
  employeeName?: string;
  employeeCode?: string;
  managerName?: string;
};
