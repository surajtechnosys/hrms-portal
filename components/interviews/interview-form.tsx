"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { createInterview, submitInterviewFeedback, updateInterview } from "@/lib/actions/interviews";
import { interviewDefaultValues } from "@/lib/constants";
import { interviewSchema } from "@/lib/validators";
import type { InterviewRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ApplicantOption = {
  id: string;
  requestId: string;
  candidateName: string;
  profilePost: string;
  pipelineStatus?: string;
  suggestedRound?: string;
  previousRoundCount?: number;
  latestInterviewStatus?: string;
  latestRecommendation?: string | null;
};

type InterviewerOption = {
  id: string;
  employeeName: string;
  employeeCode: string;
  jobRoleName: string;
};

type Props = {
  data?: InterviewRecord;
  update: boolean;
  canManageAll: boolean;
  isAssignedInterviewer: boolean;
  initialApplicantId?: string;
  applicants: ApplicantOption[];
  interviewers: InterviewerOption[];
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const roundOptions = [
  "HR_ROUND",
  "TECHNICAL_ROUND_1",
  "TECHNICAL_ROUND_2",
  "MANAGERIAL_ROUND",
  "FINAL_HR_ROUND",
] as const;

const roundLabels: Record<(typeof roundOptions)[number], string> = {
  HR_ROUND: "HR Round",
  TECHNICAL_ROUND_1: "Technical Round 1",
  TECHNICAL_ROUND_2: "Technical Round 2",
  MANAGERIAL_ROUND: "Managerial Round",
  FINAL_HR_ROUND: "Final HR Round",
};

export default function InterviewForm({
  data,
  update,
  canManageAll,
  isAssignedInterviewer,
  initialApplicantId,
  applicants,
  interviewers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const form = useForm<
    z.input<typeof interviewSchema>,
    undefined,
    z.output<typeof interviewSchema>
  >({
    resolver: zodResolver(interviewSchema),
    defaultValues: data || interviewDefaultValues,
  });

  const applicantId = useWatch({
    control: form.control,
    name: "applicantId",
  });

  const selectedApplicant = applicants.find((item) => item.id === applicantId);
  const showFeedbackEditor = !canManageAll && isAssignedInterviewer;
  const showHrFeedbackSummary = canManageAll && Boolean(
    data?.feedback?.trim() ||
    data?.strengths?.trim() ||
    data?.weaknesses?.trim() ||
    data?.recommendation ||
    typeof data?.ratingScore === "number",
  );

  React.useEffect(() => {
    if (update || !canManageAll || !initialApplicantId) {
      return;
    }

    if (form.getValues("applicantId") === initialApplicantId) {
      return;
    }

    const applicant = applicants.find((item) => item.id === initialApplicantId);

    if (!applicant) {
      return;
    }

    form.setValue("applicantId", initialApplicantId, { shouldDirty: true });
  }, [applicants, canManageAll, form, initialApplicantId, update]);

  React.useEffect(() => {
    if (!canManageAll || !applicantId) {
      return;
    }

    const applicant = applicants.find((item) => item.id === applicantId);

    if (!applicant) {
      return;
    }

    form.setValue("applicantName", applicant.candidateName);
    form.setValue("appliedPosition", applicant.profilePost);

    if (
      !update &&
      applicant.suggestedRound &&
      roundOptions.includes(
        applicant.suggestedRound as (typeof roundOptions)[number],
      )
    ) {
      form.setValue(
        "interviewRound",
        applicant.suggestedRound as (typeof roundOptions)[number],
      );
    }
  }, [applicantId, applicants, canManageAll, form, update]);

  const submit = (values: z.output<typeof interviewSchema>) => {
    startTransition(async () => {
      const response = canManageAll
        ? update && data?.id
          ? await updateInterview(values, data.id)
          : await createInterview(values)
        : data?.id
          ? await submitInterviewFeedback(data.id, {
              feedback: values.feedback,
              ratingScore: values.ratingScore,
              strengths: values.strengths,
              weaknesses: values.weaknesses,
              recommendation: values.recommendation,
              status: values.status,
              statusNote: values.statusNote,
            })
          : null;

      if (!response?.success) {
        toast.error("Error", {
          description: response?.message || "Unable to save interview",
        });
        return;
      }

      toast.success("Success", { description: response.message });
      router.push("/interviews");
      router.refresh();
    });
  };

  const applyRecommendationPreset = (
    recommendation: "PROCEED_TO_NEXT_ROUND" | "SELECTED" | "REJECTED" | "ON_HOLD",
  ) => {
    const scoreMap = {
      PROCEED_TO_NEXT_ROUND: 7,
      SELECTED: 9,
      REJECTED: 4,
      ON_HOLD: 6,
    } as const;

    form.setValue("recommendation", recommendation, { shouldDirty: true });
    form.setValue("status", "COMPLETED", { shouldDirty: true });

    if (!form.getValues("ratingScore")) {
      form.setValue("ratingScore", scoreMap[recommendation], {
        shouldDirty: true,
      });
    }
  };

  const setSchedulePreset = (dateOffset: number, time: string) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + dateOffset);

    form.setValue("scheduledDate", nextDate.toISOString().slice(0, 10), {
      shouldDirty: true,
    });
    form.setValue("scheduledTime", time, { shouldDirty: true });
    form.setValue("status", "SCHEDULED", { shouldDirty: true });
  };

  const applyModePreset = (mode: "ONLINE" | "OFFLINE") => {
    form.setValue("interviewMode", mode, { shouldDirty: true });

    if ((form.getValues("meetingLinkOrLocation") || "").trim()) {
      return;
    }

    form.setValue(
      "meetingLinkOrLocation",
      mode === "ONLINE"
        ? "Video meeting link to be shared before the round"
        : "Noida Office - Interview room to be confirmed",
      { shouldDirty: true },
    );
  };

  const renderInput = (
    name: keyof z.input<typeof interviewSchema>,
    label: string,
    placeholder: string,
    type = "text",
    readOnly = false,
    disabled = false,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              className={fieldClass}
              {...field}
              value={(field.value as string | number | undefined) ?? ""}
              readOnly={readOnly}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderTextArea = (
    name: keyof z.input<typeof interviewSchema>,
    label: string,
    placeholder: string,
    disabled = false,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className="min-h-28 rounded-2xl border-slate-200 bg-white px-4 py-3 shadow-sm"
              {...field}
              value={(field.value as string | undefined) ?? ""}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderDetail = (label: string, value?: string | number | null) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-slate-900">
        {value !== undefined && value !== null && String(value).trim()
          ? String(value)
          : "-"}
      </p>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-6">
            {canManageAll ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Interview Schedule
                    </h3>
                    <p className="text-sm text-slate-500">
                      Plan rounds with guided presets and less manual typing.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="applicantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applicant</FormLabel>
                        <Select
                          value={(field.value as string | undefined) ?? ""}
                          onValueChange={(value) => field.onChange(value)}
                          disabled={update}
                        >
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select shortlisted applicant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {applicants.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.candidateName} - {item.profilePost}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderInput(
                    "applicantName",
                    "Applicant Name",
                    "Auto-filled",
                    "text",
                    true,
                    true,
                  )}
                  {renderInput(
                    "appliedPosition",
                    "Applied Position",
                    "Auto-filled",
                    "text",
                    true,
                    true,
                  )}

                  <FormField
                    control={form.control}
                    name="interviewRound"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interview Round</FormLabel>
                        <Select
                          value={(field.value as string | undefined) ?? ""}
                          onValueChange={(value) => field.onChange(value)}
                          disabled={!canManageAll}
                        >
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select round" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roundOptions.map((item) => (
                              <SelectItem key={item} value={item}>
                                {roundLabels[item]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interviewerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Interviewer</FormLabel>
                        <Select
                          value={(field.value as string | undefined) ?? ""}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const interviewer = interviewers.find(
                              (item) => item.id === value,
                            );
                            form.setValue(
                              "interviewerName",
                              interviewer?.employeeName || "",
                            );
                            form.setValue(
                              "interviewerJobRole",
                              interviewer?.jobRoleName || "",
                            );
                          }}
                          disabled={!canManageAll}
                        >
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select interviewer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {interviewers.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.employeeName} ({item.employeeCode})
                                {item.jobRoleName ? ` - ${item.jobRoleName}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderInput(
                    "interviewerName",
                    "Interviewer Name",
                    "Auto-filled",
                    "text",
                    true,
                    true,
                  )}
                  {renderInput(
                    "interviewerJobRole",
                    "Interviewer Role",
                    "Auto-filled",
                    "text",
                    true,
                    true,
                  )}
                  {renderInput(
                    "scheduledDate",
                    "Scheduled Date",
                    "Select date",
                    "date",
                    false,
                    !canManageAll,
                  )}
                  {renderInput(
                    "scheduledTime",
                    "Scheduled Time",
                    "Select time",
                    "time",
                    false,
                    !canManageAll,
                  )}

                  <FormField
                    control={form.control}
                    name="interviewMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interview Mode</FormLabel>
                        <Select
                          value={(field.value as string | undefined) ?? ""}
                          onValueChange={(value) => field.onChange(value)}
                          disabled={!canManageAll}
                        >
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ONLINE">Online</SelectItem>
                            <SelectItem value="OFFLINE">Offline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderInput(
                    "meetingLinkOrLocation",
                    "Meeting Link / Location",
                    "Paste the meeting link or interview location",
                    "text",
                    false,
                    !canManageAll,
                  )}

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={(field.value as string | undefined) ?? ""}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              "SCHEDULED",
                              "RESCHEDULED",
                              "IN_PROGRESS",
                              "COMPLETED",
                              "CANCELLED",
                              "NO_SHOW",
                            ].map((item) => (
                              <SelectItem key={item} value={item}>
                                {item.replaceAll("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedApplicant ? (
                  <div className="mt-5 rounded-[28px] border border-cyan-100 bg-[linear-gradient(180deg,rgba(236,253,255,0.9),rgba(255,255,255,1))] p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-cyan-900">
                        <Sparkles className="size-4" />
                        Smart Scheduling Helpers
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Recruitment history aware
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Suggested Round
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {roundLabels[
                            (selectedApplicant.suggestedRound as keyof typeof roundLabels) ||
                              "HR_ROUND"
                          ]}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Previous Rounds
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {selectedApplicant.previousRoundCount || 0}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Latest Outcome
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {(selectedApplicant.latestRecommendation ||
                            selectedApplicant.latestInterviewStatus ||
                            "New candidate").replaceAll("_", " ")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Quick Schedule
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-cyan-100 bg-cyan-50/60 text-slate-700 hover:border-cyan-200 hover:bg-cyan-100"
                            onClick={() => setSchedulePreset(0, "11:00")}
                          >
                            Today 11:00
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-cyan-100 bg-cyan-50/60 text-slate-700 hover:border-cyan-200 hover:bg-cyan-100"
                            onClick={() => setSchedulePreset(1, "11:00")}
                          >
                            Tomorrow 11:00
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-cyan-100 bg-cyan-50/60 text-slate-700 hover:border-cyan-200 hover:bg-cyan-100"
                            onClick={() => setSchedulePreset(1, "15:00")}
                          >
                            Tomorrow 15:00
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Quick Mode Setup
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50"
                            onClick={() => applyModePreset("ONLINE")}
                          >
                            Set Online
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50"
                            onClick={() => applyModePreset("OFFLINE")}
                          >
                            Set Offline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-slate-900">
                      Applicant Details
                    </h3>
                    <p className="text-xs text-slate-500">
                      Review the candidate and interview context. Scheduling stays with HR.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {renderDetail("Interview ID", form.getValues("interviewId"))}
                  {renderDetail("Applicant Name", form.getValues("applicantName"))}
                  {renderDetail("Applied Position", form.getValues("appliedPosition"))}
                  {renderDetail(
                    "Interview Round",
                    roundLabels[
                      (form.getValues("interviewRound") as keyof typeof roundLabels) ||
                        "HR_ROUND"
                    ] || form.getValues("interviewRound"),
                  )}
                  {renderDetail(
                    "Assigned Interviewer",
                    form.getValues("interviewerName"),
                  )}
                  {renderDetail(
                    "Interviewer Role",
                    form.getValues("interviewerJobRole"),
                  )}
                  {renderDetail("Scheduled Date", form.getValues("scheduledDate"))}
                  {renderDetail("Scheduled Time", form.getValues("scheduledTime"))}
                  {renderDetail("Current Status", form.getValues("status")?.replaceAll("_", " "))}
                  {renderDetail(
                    "Interview Mode",
                    form.getValues("interviewMode")?.replaceAll("_", " "),
                  )}
                </div>

                <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-900">
                    Meeting Link / Location
                  </p>
                  <p className="mt-1.5 text-sm text-slate-700">
                    {form.getValues("meetingLinkOrLocation") || "-"}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Recruitment-linked applicant",
                    "Review candidate, conduct round, submit feedback",
                    "Managed by HR only",
                  ].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {showFeedbackEditor ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-700 text-white shadow-md">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-slate-900">
                      Feedback & Decision
                    </h3>
                    <p className="text-xs text-slate-500">
                      Use shortcuts to update the interview faster and submit a cleaner response.
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border border-emerald-100 bg-[linear-gradient(180deg,rgba(240,253,244,0.8),rgba(255,255,255,1))] p-3.5">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white bg-white p-3.5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Quick Interview Actions
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-2xl border-emerald-100 bg-emerald-50/70 px-3 text-xs font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-100"
                          onClick={() =>
                            form.setValue("status", "IN_PROGRESS", {
                              shouldDirty: true,
                            })
                          }
                        >
                          Start Interview
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-2xl border-emerald-100 bg-emerald-50/70 px-3 text-xs font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-100"
                          onClick={() =>
                            form.setValue("status", "COMPLETED", {
                              shouldDirty: true,
                            })
                          }
                        >
                          Mark Completed
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-2xl border-emerald-100 bg-emerald-50/70 px-3 text-xs font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-100"
                          onClick={() =>
                            form.setValue("status", "NO_SHOW", {
                              shouldDirty: true,
                            })
                          }
                        >
                          Mark No Show
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white bg-white p-3.5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Recommendation Shortcuts
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-2xl border-cyan-100 bg-cyan-50/60 px-3 text-xs font-medium text-slate-700 hover:border-cyan-200 hover:bg-cyan-100"
                          onClick={() =>
                            applyRecommendationPreset("PROCEED_TO_NEXT_ROUND")
                          }
                        >
                          Next Round
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-2xl border-cyan-100 bg-cyan-50/60 px-3 text-xs font-medium text-slate-700 hover:border-cyan-200 hover:bg-cyan-100"
                          onClick={() => applyRecommendationPreset("SELECTED")}
                        >
                          Select
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-2xl border-cyan-100 bg-cyan-50/60 px-3 text-xs font-medium text-slate-700 hover:border-cyan-200 hover:bg-cyan-100"
                          onClick={() => applyRecommendationPreset("REJECTED")}
                        >
                          Reject
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-2xl border-cyan-100 bg-cyan-50/60 px-3 text-xs font-medium text-slate-700 hover:border-cyan-200 hover:bg-cyan-100"
                          onClick={() => applyRecommendationPreset("ON_HOLD")}
                        >
                          On Hold
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            value={(field.value as string | undefined) ?? ""}
                            onValueChange={(value) => field.onChange(value)}
                            disabled={!showFeedbackEditor}
                          >
                            <FormControl>
                              <SelectTrigger className={fieldClass}>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["IN_PROGRESS", "COMPLETED", "NO_SHOW"].map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item.replaceAll("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ratingScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating Score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              step="1"
                              className={fieldClass}
                              value={
                                (field.value as number | string | null | undefined) ??
                                ""
                              }
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                                )
                              }
                              disabled={!showFeedbackEditor}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="recommendation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recommendation</FormLabel>
                          <Select
                            value={(field.value as string | undefined) ?? ""}
                            onValueChange={(value) => field.onChange(value)}
                            disabled={!showFeedbackEditor}
                          >
                            <FormControl>
                              <SelectTrigger className={fieldClass}>
                                <SelectValue placeholder="Select recommendation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PROCEED_TO_NEXT_ROUND">
                                Proceed to Next Round
                              </SelectItem>
                              <SelectItem value="SELECTED">Selected</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                              <SelectItem value="ON_HOLD">On Hold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {renderTextArea(
                    "feedback",
                    "Feedback",
                    "Summarize the interview discussion and candidate response quality.",
                    !showFeedbackEditor,
                  )}
                  {renderTextArea(
                    "strengths",
                    "Strengths",
                    "Capture candidate strengths, standout examples, and role fit.",
                    !showFeedbackEditor,
                  )}
                  {renderTextArea(
                    "weaknesses",
                    "Weaknesses",
                    "Capture concerns, gaps, or risks noticed during the round.",
                    !showFeedbackEditor,
                  )}
                  {renderTextArea(
                    "statusNote",
                    "Interviewer Note",
                    "Add any final note for HR before you submit the round outcome.",
                    !showFeedbackEditor,
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ecfeff_100%)] p-5">
              <h3 className="text-lg font-semibold text-slate-950">
                Access Summary
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  {canManageAll
                    ? "You have HR access. Use this view to schedule, reschedule, cancel, and monitor interviews. Feedback submission is reserved for the assigned interviewer."
                    : "You are viewing this interview as the assigned interviewer. Recruitment records remain locked, and your workspace is focused on fast response submission."}
                </p>
                <p>
                  Applicant records remain linked to Recruitment through `applicantId`, so no duplicate applicant entries are created here.
                </p>
              </div>
            </div>

            {showHrFeedbackSummary ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-950">
                  Interviewer Response
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rating
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {typeof data?.ratingScore === "number"
                        ? data.ratingScore
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Recommendation
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {(data?.recommendation || "Pending").replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Feedback
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {data?.feedback || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Strengths
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {data?.strengths || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Weaknesses
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {data?.weaknesses || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Interviewer Note
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {data?.statusNote || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {data?.history?.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-950">
                  Audit Trail
                </h3>
                <div className="mt-4 space-y-3">
                  {data.history.slice().reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {entry.action.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {entry.description}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                        {entry.actorName || "System"} - {entry.createdAt || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            disabled={isPending}
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : canManageAll ? (
              update ? "Update Interview" : "Schedule Interview"
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
