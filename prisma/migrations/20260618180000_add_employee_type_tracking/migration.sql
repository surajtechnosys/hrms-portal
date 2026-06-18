-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('EMPLOYEE', 'PROBATIONER', 'TRAINEE');

-- AlterTable
ALTER TABLE "EmployeeProfile"
ADD COLUMN     "employeeType" "EmployeeType" NOT NULL DEFAULT 'EMPLOYEE',
ADD COLUMN     "probationStartDate" TIMESTAMP(3),
ADD COLUMN     "probationEndDate" TIMESTAMP(3),
ADD COLUMN     "trainingStartDate" TIMESTAMP(3),
ADD COLUMN     "trainingEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "EmployeeProfile_employeeType_idx" ON "EmployeeProfile"("employeeType");

-- CreateIndex
CREATE INDEX "EmployeeProfile_probationEndDate_idx" ON "EmployeeProfile"("probationEndDate");

-- CreateIndex
CREATE INDEX "EmployeeProfile_trainingEndDate_idx" ON "EmployeeProfile"("trainingEndDate");
