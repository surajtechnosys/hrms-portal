import type { InterviewRecord } from "@/types";

export const ROUND_SEQUENCE = [
  "HR_ROUND",
  "TECHNICAL_ROUND_1",
  "TECHNICAL_ROUND_2",
  "MANAGERIAL_ROUND",
  "FINAL_HR_ROUND",
] as const;

function getInterviewSortKey(record: InterviewRecord) {
  return (
    record.updatedAt ||
    record.createdAt ||
    (record.scheduledDate
      ? `${record.scheduledDate}T${record.scheduledTime || "00:00"}`
      : "")
  );
}

export function getRoundLabel(round?: string | null) {
  if (!round) {
    return "Interview Round";
  }

  return round.replaceAll("_", " ");
}

export function getRoundIndex(round?: string | null) {
  if (!round) {
    return -1;
  }

  return ROUND_SEQUENCE.indexOf(round as (typeof ROUND_SEQUENCE)[number]);
}

export function getLatestInterviewRecord(records: InterviewRecord[]) {
  return [...records].sort((left, right) =>
    getInterviewSortKey(right).localeCompare(getInterviewSortKey(left)),
  )[0];
}

export function canScheduleNextRound(record: InterviewRecord) {
  return (
    record.recommendation === "PROCEED_TO_NEXT_ROUND" &&
    record.status === "COMPLETED"
  );
}

export function groupInterviewRecordsByApplicant(records: InterviewRecord[]) {
  const grouped = records.reduce<Record<string, InterviewRecord[]>>(
    (accumulator, record) => {
      accumulator[record.applicantId] = accumulator[record.applicantId] || [];
      accumulator[record.applicantId].push(record);
      return accumulator;
    },
    {},
  );

  return Object.values(grouped)
    .map((applicantRecords) => {
      const sortedRecords = [...applicantRecords].sort((left, right) =>
        getInterviewSortKey(right).localeCompare(getInterviewSortKey(left)),
      );

      return {
        applicantId: sortedRecords[0].applicantId,
        records: sortedRecords,
        latestRecord: sortedRecords[0],
      };
    })
    .sort((left, right) =>
      getInterviewSortKey(right.latestRecord).localeCompare(
        getInterviewSortKey(left.latestRecord),
      ),
    );
}
