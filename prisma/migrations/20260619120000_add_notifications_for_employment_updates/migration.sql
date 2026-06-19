CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "employmentReviewId" UUID,
    "action" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_employmentReviewId_key" ON "Notification"("employmentReviewId");
CREATE INDEX "Notification_employeeId_readAt_createdAt_idx" ON "Notification"("employeeId", "readAt", "createdAt");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_employmentReviewId_fkey"
FOREIGN KEY ("employmentReviewId") REFERENCES "EmploymentReview"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
