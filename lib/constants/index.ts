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
  documentContext: "SELF_SERVICE" as const,
  sourceInterviewApplicantId: "",
  applicantId: "",
  applicantCode: "",
  candidateName: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  mobileNumber: "",
  employeeId: "",
  employeeCode: "",
  employeeName: "",
  linkedEmployeeId: "",
  linkedEmployeeCode: "",
  linkedEmployeeName: "",
  appliedPosition: "",
  skillsLevel: "",
  totalExperience: "",
  relevantExperience: "",
  qualification: "",
  maritalStatus: "",
  nationality: "",

  // ---------------- DOCUMENTS ----------------
  passportPhotoFileUrl: "",
  passportPhotoStatus: "PENDING_REVIEW" as const,
  aadhaarNumber: "",
  aadhaarFileUrl: "",
  aadhaarStatus: "PENDING_REVIEW" as const,
  panNumber: "",
  panFileUrl: "",
  panStatus: "PENDING_REVIEW" as const,
  passportFileUrl: "",
  passportStatus: "PENDING_REVIEW" as const,
  drivingLicenseFileUrl: "",
  drivingLicenseStatus: "PENDING_REVIEW" as const,
  voterIdFileUrl: "",
  voterIdStatus: "PENDING_REVIEW" as const,
  currentAddress: "",
  permanentAddress: "",
  city: "",
  state: "",
  postalCode: "",
  addressProofFileUrl: "",
  addressProofStatus: "PENDING_REVIEW" as const,

  // ---------------- EDUCATION ----------------
  highestQualification: "",
  institutionName: "",
  passingYear: "",
  class10MarksheetFileUrl: "",
  class10MarksheetStatus: "PENDING_REVIEW" as const,
  class12MarksheetFileUrl: "",
  class12MarksheetStatus: "PENDING_REVIEW" as const,
  highestQualificationFileUrl: "",
  highestQualificationStatus: "PENDING_REVIEW" as const,
  additionalDegreesFileUrl: "",
  additionalDegreesStatus: "PENDING_REVIEW" as const,
  professionalCertificationsFileUrl: "",
  professionalCertificationsStatus: "PENDING_REVIEW" as const,
  educationEntries: [],

  // ---------------- EXPERIENCE ----------------
  experienceType: ExperienceType.FRESHER,
  experienceEntries: [],
  experienceLetterFileUrl: "",
  experienceLetterStatus: "PENDING_REVIEW" as const,
  relievingLetterFileUrl: "",
  relievingLetterStatus: "PENDING_REVIEW" as const,
  salarySlip1FileUrl: "",
  salarySlip2FileUrl: "",
  salarySlip3FileUrl: "",
  salarySlipsStatus: "PENDING_REVIEW" as const,
  previousOfferLetterFileUrl: "",
  previousOfferLetterStatus: "PENDING_REVIEW" as const,
  promotionAppraisalLettersFileUrl: "",
  promotionAppraisalLettersStatus: "PENDING_REVIEW" as const,
  uanNumber: "",

  // ---------------- BANKING ----------------
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  bankProofFileUrl: "",
  bankProofStatus: "PENDING_REVIEW" as const,

  // ---------------- PF / UAN ----------------
  pfPassbookFileUrl: "",
  pfPassbookStatus: "PENDING_REVIEW" as const,
  pfTransferDocumentsFileUrl: "",
  pfTransferDocumentsStatus: "PENDING_REVIEW" as const,

  // ---------------- EMERGENCY ----------------
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactNumber: "",

  // ---------------- DECLARATION ----------------
  declarationInfoAccurate: false,
  declarationAuthorizeVerification: false,
  declarationAgreePolicies: false,

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
  sourceInterviewApplicantId: "",
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
  pipelineStatus: "APPLIED" as const,
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

export const interviewDefaultValues = {
  interviewId: "",
  applicantId: "",
  applicantName: "",
  appliedPosition: "",
  interviewRound: "HR_ROUND" as const,
  interviewerId: "",
  interviewerName: "",
  interviewerJobRole: "",
  scheduledDate: "",
  scheduledTime: "",
  interviewMode: "ONLINE" as const,
  meetingLinkOrLocation: "",
  status: "SCHEDULED" as const,
  feedback: "",
  ratingScore: 0,
  recommendation: null,
  strengths: "",
  weaknesses: "",
  createdBy: "",
  createdByName: "",
  updatedBy: "",
  updatedByName: "",
  completedAt: "",
  history: [],
  statusNote: "",
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

export const recruitmentIntakeDefaultValues = {
  name: "",
  email: "",
  phone: "",
  resumeUrl: "",
  skills: "",
  experience: "",
  appliedPosition: "",
  source: "LINKEDIN" as const,
  pipelineStatus: "APPLIED" as const,
};
