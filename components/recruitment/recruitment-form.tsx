"use client";

import React from "react";
import { Status } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import {
  createRecruitmentApplication,
  updateRecruitmentApplication,
} from "@/lib/actions/recruitment";
import { recruitmentDefaultValues } from "@/lib/constants";
import { recruitmentSchema } from "@/lib/validators";
import { RecruitmentApplication } from "@/types";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";

type Props = {
  data?: RecruitmentApplication;
  update: boolean;
  nextSerialNumber?: string;
  selectedCandidates?: SelectedInterviewCandidateOption[];
};

type SelectedInterviewCandidateOption = {
  applicantId: string;
  requestId: string;
  interviewId: string;
  candidateName: string;
  profilePost: string;
  email: string;
  mobileNumber: string;
  skillsLevel: string;
  totalExperience: string;
  relevantExperience: string;
  qualification: string;
  interviewRound: string;
  status: string;
  recommendation: string | null;
  sourceInterviewApplicantId: string;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const RecruitmentForm = ({
  data,
  update,
  nextSerialNumber,
  selectedCandidates = [],
}: Props) => {
  const router = useRouter();
  const id = data?.id;
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof recruitmentSchema>>({
    resolver: zodResolver(recruitmentSchema),
      defaultValues:
      data ||
      {
        ...recruitmentDefaultValues,
        serialNumber: nextSerialNumber ?? recruitmentDefaultValues.serialNumber,
      },
  });

  const selectedInterviewApplicantId = useWatch({
    control: form.control,
    name: "sourceInterviewApplicantId",
  });

  const selectedInterviewCandidate = selectedCandidates.find(
    (item) => item.sourceInterviewApplicantId === selectedInterviewApplicantId,
  );

  const onSubmit: SubmitHandler<
    z.infer<typeof recruitmentSchema>
  > = async (values) => {
    startTransition(async () => {
      const res =
        update && id
          ? await updateRecruitmentApplication(values, id)
          : await createRecruitmentApplication(values);

      if (!res?.success) {
        toast.error("Error", { description: res?.message });
        return;
      }

      toast.success("Success", { description: res.message });
      router.push("/recruitment");
      router.refresh();
    });
  };

  React.useEffect(() => {
    if (update || !selectedInterviewCandidate) {
      return;
    }

    form.setValue(
      "requestId",
      selectedInterviewCandidate.requestId || selectedInterviewCandidate.applicantId,
    );
    form.setValue("candidateName", selectedInterviewCandidate.candidateName || "");
    form.setValue("profilePost", selectedInterviewCandidate.profilePost || "");
    form.setValue("email", selectedInterviewCandidate.email || "");
    form.setValue("mobileNumber", selectedInterviewCandidate.mobileNumber || "");
    form.setValue("skillsLevel", selectedInterviewCandidate.skillsLevel || "");
    form.setValue("totalExperience", selectedInterviewCandidate.totalExperience || "");
    form.setValue("relevantExperience", selectedInterviewCandidate.relevantExperience || "");
    form.setValue("qualification", selectedInterviewCandidate.qualification || "");
    form.setValue("pipelineStatus", "SELECTED");
    form.setValue("remarks", `Selected from interview ${selectedInterviewCandidate.interviewId || ""}`.trim());
  }, [form, selectedInterviewCandidate, update]);

  const renderInput = (
    name: keyof z.infer<typeof recruitmentSchema>,
    label: string,
    placeholder: string,
    type = "text",
    readOnly = false,
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
              readOnly={readOnly}
              value={(field.value as string | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderSelect = (
    name: keyof z.infer<typeof recruitmentSchema>,
    label: string,
    options: { label: string; value: string }[],
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={(field.value as string | undefined) ?? ""}
            onValueChange={(value) => field.onChange(value)}
          >
            <FormControl>
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!update ? (
          <div className="rounded-3xl border border-cyan-100 bg-[linear-gradient(180deg,rgba(240,253,255,0.88),rgba(255,255,255,1))] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Selected Interview Candidate
                </h3>
                <p className="text-sm text-slate-500">
                  Pull a selected interview candidate and prefill the data already captured earlier.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sourceInterviewApplicantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fetch From Interview</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => field.onChange(value)}
                      disabled={!selectedCandidates.length}
                    >
                      <FormControl>
                        <SelectTrigger className={fieldClass}>
                          <SelectValue placeholder="Select selected interview candidate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border border-cyan-100">
                        {selectedCandidates.map((item) => (
                          <SelectItem
                            key={item.sourceInterviewApplicantId}
                            value={item.sourceInterviewApplicantId}
                          >
                            {item.candidateName} - {item.profilePost}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                {selectedCandidates.length
                  ? "Only interview records marked as selected are shown here. The candidate data is copied into this form so the remaining onboarding details can be completed manually."
                  : "No selected interview candidates are available yet."}
              </div>
            </div>

            {selectedInterviewCandidate ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Candidate
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedInterviewCandidate.candidateName}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Position
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedInterviewCandidate.profilePost || "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Interview ID
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedInterviewCandidate.interviewId || "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Decision
                  </p>
                  <Badge className="mt-2 rounded-full bg-emerald-100 text-emerald-700">
                    {(selectedInterviewCandidate.recommendation || "SELECTED").replaceAll("_", " ")}
                  </Badge>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Candidate Details
              </h3>
              <p className="text-sm text-slate-500">
                Basic candidate information.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {renderInput(
              "serialNumber",
              "Sl. No.",
              "Auto-generated",
              "text",
              true,
            )}
            {renderInput("candidateName", "Candidate Name", "Enter candidate name")}
            {renderInput("profilePost", "Applied Position", "Enter applied position")}
            {renderInput("email", "Email", "Enter email address", "email")}
            {renderInput("mobileNumber", "Mobile Number", "Enter mobile number")}
            {renderInput("skillsLevel", "Skills Level", "Enter skills summary")}
            {renderInput("totalExperience", "Total Experience", "Enter total experience")}
            {renderInput(
              "relevantExperience",
              "Relevant Experience",
              "Enter relevant experience",
            )}
            {renderInput("qualification", "Qualification", "Enter qualification")}
            {renderInput("gender", "Gender", "Enter gender")}
            {renderInput("dateOfBirth", "DOB", "Select date of birth", "date")}
            {renderInput(
              "currentLocation",
              "Current Location",
              "Enter current location",
            )}
            {renderInput("currentCtc", "Current CTC", "Enter current CTC")}
            {renderInput("expectedCtc", "Expected CTC", "Enter expected CTC")}
            {renderSelect("pipelineStatus", "Pipeline Status", [
              { label: "Applied", value: "APPLIED" },
              { label: "Screening", value: "SCREENING" },
              { label: "Shortlisted", value: "SHORTLISTED" },
              { label: "Interview Scheduled", value: "INTERVIEW_SCHEDULED" },
              { label: "Interview In Progress", value: "INTERVIEW_IN_PROGRESS" },
              { label: "Interview Completed", value: "INTERVIEW_COMPLETED" },
              { label: "Selected", value: "SELECTED" },
              { label: "Rejected", value: "REJECTED" },
              { label: "Offer Pending", value: "OFFER_PENDING" },
            ])}
            {renderSelect("status", "Status", [
              { label: "Active", value: Status.ACTIVE },
              { label: "Inactive", value: Status.INACTIVE },
            ])}
            {renderInput("remarks", "Remarks", "Enter remarks")}
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
            ) : update ? (
              "Update Pre-Onboarding"
            ) : (
              "Create Pre-Onboarding"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RecruitmentForm;
