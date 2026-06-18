import { getMonthlyAttendance } from "@/lib/actions/attendance";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const participantId =
      searchParams.get("participantId") ||
      searchParams.get("employeeId") ||
      undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    const data = await getMonthlyAttendance({
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      participantId,
      departmentId,
    });

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to fetch attendance",
      },
      { status: 400 },
    );
  }
}
