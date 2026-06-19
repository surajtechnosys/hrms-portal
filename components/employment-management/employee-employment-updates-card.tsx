import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { markEmploymentNotificationAsRead } from "@/lib/actions/employee-notifications";
import type { Notification } from "@prisma/client";
import Link from "next/link";

const formatDate = (value?: Date | null) =>
  value ? value.toLocaleDateString("en-GB") : "-";

export function EmployeeEmploymentUpdatesCard({
  notifications,
}: {
  notifications: Notification[];
}) {
  const handleMarkAsRead = async (formData: FormData) => {
    await markEmploymentNotificationAsRead(formData);
  };

  return (
    <Card
      id="employment-updates"
      className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-sm"
    >
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">
          Employment Updates
        </CardTitle>
        <CardDescription className="text-slate-500">
          Unread employment notifications from HR.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5">
        {notifications.length ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {notification.title}
                      </p>
                      <Badge className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100">
                        Unread
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="h-9 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                    <Link href="#employment-timeline">View Details</Link>
                  </Button>
                  <form action={handleMarkAsRead}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <Button
                      type="submit"
                      className="h-9 rounded-2xl bg-cyan-600 text-white hover:bg-cyan-700"
                    >
                      Mark as read
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No unread employment updates right now.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
