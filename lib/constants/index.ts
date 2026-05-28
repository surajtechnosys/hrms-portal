import {
  ExperienceType,
  MovementType,
  ProjectStatus,
  Status,
} from "@prisma/client";

export const APP_NAME = process.env.NEXT_APP_APP_NAME ?? "HRMS";

export const APP_DESCRIPTION = process.env.NEXT_APP_DESCRIPTION ?? "HRMS";

export const SERVER_URL =
  process.env.NEXT_APP_SERVER_URL ?? "http://localhost:3000";

/* ---------------- COMMON ---------------- */
export const formatDate = (date?: Date | null) =>
  date ? date.toISOString().split("T")[0] : "";

/* ---------------- ROLE ---------------- */
export const roleDefaultValues = {
  name: "",
  remark: "",
  status: Status.ACTIVE,
};

/* ---------------- USER ---------------- */
export const userDefaultValues = {
  username: "",
  password: "",
  firstName: "",
  lastName: "",
  email: "",
  status: Status.ACTIVE,
  remark: "",
  roleId: "",
};

/* ---------------- MODULE ---------------- */
export const moduleDefaultValues = {
  name: "",
  description: "",
  route: "",
  status: Status.ACTIVE,
};

/* ---------------- JOB ROLE ---------------- */
export const jobRoleDefaultValues = {
  name: "",
  code: "",
  description: "",
  remark: "",
  status: Status.ACTIVE,
};

/* ---------------- DEPARTMENT ---------------- */
export const departmentDefaultValues = {
  name: "",
  code: "",
  description: "",
  remark: "",
  status: Status.ACTIVE,
};

/* ---------------- WORK LOCATION ---------------- */
export const workLocationDefaultValues = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  remark: "",
  status: Status.ACTIVE,
};

/* ---------------- TRANSFER & PROMOTION ---------------- */
export const transferPromotionDefaultValues = {
  employeeId: "",
  movementType: MovementType.TRANSFER,
  fromLocationId: "",
  toLocationId: "",
  currentDesignation: "",
  newDesignation: "",
  effectiveDate: "",
  reason: "",
  remark: "",
  status: Status.ACTIVE,
};

/* ---------------- EMPLOYEE ID & DOCS ---------------- */
export const employeeDocumentDefaultValues = {
  documentOwnerType: "APPLICANT" as const,
  applicantId: "",
  applicantCode: "",
  candidateName: "",
  employeeId: "",
  employeeCode: "",
  employeeName: "",
  linkedEmployeeId: "",
  linkedEmployeeCode: "",
  linkedEmployeeName: "",

  // ---------------- DOCUMENTS ----------------
  aadhaarNumber: "",
  aadhaarFileUrl: "",
  panNumber: "",
  panFileUrl: "",

  // ---------------- EDUCATION ----------------
  educationEntries: [],

  // ---------------- EXPERIENCE ----------------
  experienceType: ExperienceType.FRESHER,
  experienceEntries: [],

  // ---------------- COMMON ----------------
  reviewStatus: "PENDING",
  reviewRemark: "",
  reviewedByName: "",
  reviewedAt: "",
  remark: "",
  status: Status.ACTIVE,
};

/* ---------------- EMPLOYEE PROFILE ---------------- */
export const employeeProfileDefaultValues = {
  sourceApplicantDocumentId: "",
  managerId: "",
  employeeName: "",
  employeeCode: "",
  email: "",
  password: "",
  companyId: "",
  phone: "",
  alternatePhone: "",
  gender: "",
  dateOfBirth: "",
  joiningDate: "",
  departmentId: "",
  jobRoleId: "",
  workLocationId: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  remark: "",
  status: Status.ACTIVE,
};

/* ---------------- COMPANY ---------------- */
export const companyDefaultValues = {
  companyName: "",
  companyCode: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  remark: "",
  status: Status.ACTIVE,
};

/* ---------------- EMPLOYER ---------------- */
export const employerDefaultValues = {
  companyId: "",
  employerName: "",
  employerCode: "",
  email: "",
  phone: "",
  password: "",
  designation: "",
  address: "",
  remark: "",
  status: Status.ACTIVE,
};

export const recruitmentDefaultValues = {
  applicantPortalId: "",
  applicantUsername: "",
  applicantPasswordHash: "",
  applicantPortalEnabled: false,
  applicantInvitedAt: "",
  applicantDocumentsSubmittedAt: "",
  serialNumber: "",
  requestId: "",
  clientProjectName: "",
  requestReceivedDate: "",
  requestApprovedBy: "",
  hrOwnerEmployeeNumber: "",
  hrOwnerName: "",
  businessOwnerEmployeeNumber: "",
  businessOwnerName: "",
  candidateName: "",
  gender: "",
  dateOfBirth: "",
  mobileNumber: "",
  email: "",
  currentLocation: "",
  preferredLocation: "",
  noticePeriod: "",
  qualification: "",
  skillsLevel: "",
  profilePost: "",
  certification: "",
  totalExperience: "",
  relevantExperience: "",
  currentCompany: "",
  currentCtc: "",
  expectedCtc: "",
  offeredCtc: "",
  profileSource: undefined,
  profileReceiveDate: "",
  internalScreeningDate: "",
  internalScreeningCleared: undefined,
  profileSentToBusinessOwner: undefined,
  profileSentToBusinessOwnerDate: "",
  profileConnectWithClientDate: "",
  interviewedByClient: undefined,
  clientInterviewDate: "",
  feedbackDate: "",
  internalStatus: undefined,
  clientFinalStatus: undefined,
  updatedToCandidateDate: "",
  offeredDate: "",
  offerAccepted: undefined,
  reasonIfOfferNotAccepted: "",
  agreedJoiningDate: "",
  joined: undefined,
  reasonIfNotJoined: "",
  actualJoiningDate: "",
  joiningDetailsShared: undefined,
  joiningDetailsSharedDate: "",
  remarks: "",
  status: Status.ACTIVE,
};

export const projectDefaultValues = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: ProjectStatus.ACTIVE,
  createdById: "",
}

export const projectMemberDefaultValues = {
  projectId: "",
  employeeId: "",
  employeeIds: [],
  assignedAt: "",
}
