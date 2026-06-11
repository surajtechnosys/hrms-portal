import Link from "next/link";

import { Button } from "@/components/ui/button";

type TraineeAttendanceNavProps = {
  active: "overview" | "action" | "history" | "sheet";
};

const items = [
  { key: "overview", label: "Overview", href: "/trainee-dashboard/attendance" },
  { key: "action", label: "Attendance Action", href: "/trainee-dashboard/attendance/action" },
  { key: "history", label: "Attendance History", href: "/trainee-dashboard/attendance/history" },
  { key: "sheet", label: "Monthly Sheet", href: "/trainee-dashboard/attendance/sheet" },
] as const;

export function TraineeAttendanceNav({ active }: TraineeAttendanceNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Button
          key={item.key}
          asChild
          variant={active === item.key ? "default" : "outline"}
          className={
            active === item.key
              ? "bg-cyan-600 text-white hover:bg-cyan-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </div>
  );
}
