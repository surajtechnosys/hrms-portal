-- CreateTable
CREATE TABLE "EmploymentReview" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "oldEmployeeType" "EmployeeType" NOT NULL,
    "newEmployeeType" "EmployeeType" NOT NULL,
    "oldEndDate" TIMESTAMP(3),
    "newEndDate" TIMESTAMP(3),
    "remarks" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmploymentReview_employeeId_idx" ON "EmploymentReview"("employeeId");

-- CreateIndex
CREATE INDEX "EmploymentReview_createdAt_idx" ON "EmploymentReview"("createdAt");

-- AddForeignKey
ALTER TABLE "EmploymentReview" ADD CONSTRAINT "EmploymentReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
