import { redirect } from "next/navigation";

import InterviewDataTable from "@/components/interviews/interview-data-table";
import { getInterviewWorkspace } from "@/lib/actions/interviews";
import { auth } from "@/auth";

export default async function InterviewsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const workspace = await getInterviewWorkspace();

  return (
    <InterviewDataTable
      data={workspace.records}
      stats={workspace.stats}
      canManageAll={workspace.canManageAll}
      showStats={workspace.canManageAll}
    />
  );
}
