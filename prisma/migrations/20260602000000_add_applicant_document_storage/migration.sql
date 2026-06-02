-- CreateEnum
CREATE TYPE "EmployeeDocumentOwnerType" AS ENUM ('APPLICANT', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "EmployeeDocument"
ADD COLUMN "documentOwnerType" "EmployeeDocumentOwnerType" NOT NULL DEFAULT 'EMPLOYEE',
ADD COLUMN "applicantId" TEXT,
ADD COLUMN "candidateName" TEXT,
ADD COLUMN "documentPayload" JSONB,
ALTER COLUMN "employeeId" DROP NOT NULL;
