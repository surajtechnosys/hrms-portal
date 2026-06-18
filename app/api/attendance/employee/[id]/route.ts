import { getEmployeeAttendanceRecords } from "@/lib/actions/attendance";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await getEmployeeAttendanceRecords(id);

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
