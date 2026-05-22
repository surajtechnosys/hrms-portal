"use client";

import React from "react";
import { Status } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
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
import { Textarea } from "../ui/textarea";

type Props = {
  data?: RecruitmentApplication;
  update: boolean;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const textAreaClass =
  "min-h-28 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const binaryOptions = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
] as const;

const triOptions = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "NOT_APPLICABLE", label: "Not Applicable" },
] as const;

const pipelineOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SELECTED", label: "Selected" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "BACK_OUT", label: "Back Out" },
] as const;

const profileSourceOptions = [
  { value: "INTERNAL", label: "Internal" },
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "OTHER", label: "Other" },
] as const;

const RecruitmentForm = ({ data, update }: Props) => {
  const router = useRouter();
  const id = data?.id;
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof recruitmentSchema>>({
    resolver: zodResolver(recruitmentSchema),
    defaultValues: data || recruitmentDefaultValues,
  });

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

  const renderInput = (
    name: keyof z.infer<typeof recruitmentSchema>,
    label: string,
    placeholder: string,
    type = "text",
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
    placeholder: string,
    options: readonly { value: string; label: string }[],
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={(field.value as string | undefined) ?? undefined}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
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
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Request and Ownership
              </h3>
              <p className="text-sm text-slate-500">
                Basic request, recruiter, and business owner details from the sheet.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {renderInput("serialNumber", "Sl. No.", "Enter serial number")}
            {renderInput("requestId", "Request ID", "Enter request ID")}
            {renderInput(
              "clientProjectName",
              "Client / Project Name",
              "Enter client or project name",
            )}
            {renderInput(
              "requestReceivedDate",
              "Request Received Date",
              "Select request received date",
              "date",
            )}
            {renderInput(
              "requestApprovedBy",
              "Request Approved By",
              "Enter approver name",
            )}
            {renderInput(
              "hrOwnerEmployeeNumber",
              "HR Owner Employee Number",
              "Enter HR owner employee number",
            )}
            {renderInput("hrOwnerName", "HR Owner Name", "Enter HR owner name")}
            {renderInput(
              "businessOwnerEmployeeNumber",
              "Business Owner Employee Number",
              "Enter business owner employee number",
            )}
            {renderInput(
              "businessOwnerName",
              "Business Owner Name",
              "Enter business owner name",
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-900">
              Candidate Details
            </h3>
            <p className="text-sm text-slate-500">
              Contact, role, skills, experience, and compensation details.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {renderInput("candidateName", "Candidate Name", "Enter candidate name")}
            {renderInput("mobileNumber", "Mob no.", "Enter mobile number")}
            {renderInput("email", "Email", "Enter email address", "email")}
            {renderInput(
              "currentLocation",
              "Current Location",
              "Enter current location",
            )}
            {renderInput(
              "preferredLocation",
              "Preferred Location",
              "Enter preferred location",
            )}
            {renderInput("noticePeriod", "NP", "Enter notice period")}
            {renderInput("qualification", "Qualification", "Enter qualification")}
            {renderInput("skillsLevel", "Skills Level", "Enter skills level")}
            {renderInput("profilePost", "Profile / Post", "Enter profile or post")}
            {renderInput("certification", "Certification", "Enter certification")}
            {renderInput("totalExperience", "Exp.", "Enter total experience")}
            {renderInput(
              "relevantExperience",
              "Relevant Exp",
              "Enter relevant experience",
            )}
            {renderInput("currentCompany", "Current company", "Enter current company")}
            {renderInput("currentCtc", "C.CTC", "Enter current CTC")}
            {renderInput("expectedCtc", "E.CTC", "Enter expected CTC")}
            {renderInput("offeredCtc", "Offered CTC", "Enter offered CTC")}
            {renderSelect(
              "profileSource",
              "Profile Sources (Internal / Consultancy)",
              "Select profile source",
              profileSourceOptions,
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-900">
              Screening and Interview
            </h3>
            <p className="text-sm text-slate-500">
              Dates, clearances, business-owner handoff, interview flow, and statuses.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {renderInput(
              "profileReceiveDate",
              "Profile receive date",
              "Select profile receive date",
              "date",
            )}
            {renderInput(
              "internalScreeningDate",
              "Internal screening date",
              "Select internal screening date",
              "date",
            )}
            {renderSelect(
              "internalScreeningCleared",
              "Internal Screening Cleared (Yes / No)",
              "Select screening status",
              binaryOptions,
            )}
            {renderSelect(
              "profileSentToBusinessOwner",
              "Profile Sent to Business Owner (Yes / No / Not Applicable)",
              "Select business owner handoff",
              triOptions,
            )}
            {renderInput(
              "profileSentToBusinessOwnerDate",
              "Profile Sent to Business Owner Date",
              "Select sent date",
              "date",
            )}
            {renderInput(
              "profileConnectWithClientDate",
              "Profile connect with client date",
              "Select connect date",
              "date",
            )}
            {renderSelect(
              "interviewedByClient",
              "Interviewed by Client (Yes / No / Not Applicable)",
              "Select client interview status",
              triOptions,
            )}
            {renderInput(
              "clientInterviewDate",
              "Client Interview date",
              "Select client interview date",
              "date",
            )}
            {renderInput(
              "feedbackDate",
              "Feedback date",
              "Select feedback date",
              "date",
            )}
            {renderSelect(
              "internalStatus",
              "Internal Status",
              "Select internal status",
              pipelineOptions,
            )}
            {renderSelect(
              "clientFinalStatus",
              "Client Final Status",
              "Select client final status",
              pipelineOptions,
            )}
            {renderInput(
              "updatedToCandidateDate",
              "Updated to candidate date",
              "Select update date",
              "date",
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-900">
              Offer and Joining
            </h3>
            <p className="text-sm text-slate-500">
              Offer conversion, joining commitment, and onboarding follow-through.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {renderInput("offeredDate", "Offered date", "Select offered date", "date")}
            {renderSelect(
              "offerAccepted",
              "Offer Accepted (Yes / No / Not Applicable)",
              "Select offer acceptance",
              triOptions,
            )}
            {renderInput(
              "agreedJoiningDate",
              "Agreed Joining date",
              "Select agreed joining date",
              "date",
            )}
            {renderSelect(
              "joined",
              "Joined (Yes / No / Not Applicable)",
              "Select joined status",
              triOptions,
            )}
            {renderInput(
              "actualJoiningDate",
              "Actual Joining Date",
              "Select actual joining date",
              "date",
            )}
            {renderSelect(
              "joiningDetailsShared",
              "Joining Details Shared for Joining Formalities (Yes / No / Not Applicable)",
              "Select joining details status",
              triOptions,
            )}
            {renderInput(
              "joiningDetailsSharedDate",
              "Date on which Joining Details Shared",
              "Select details shared date",
              "date",
            )}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Record Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as Status)}
                  >
                    <FormControl>
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                      <SelectItem value={Status.ACTIVE}>Active</SelectItem>
                      <SelectItem value={Status.INACTIVE}>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="reasonIfOfferNotAccepted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason if Not Accepted Offer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason if the candidate did not accept the offer"
                      className={textAreaClass}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reasonIfNotJoined"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason if Not Joined</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason if the candidate did not join"
                      className={textAreaClass}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any remarks, screening notes, or follow-up details"
                    className={textAreaClass}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
              "Update Applicant"
            ) : (
              "Create Applicant"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RecruitmentForm;
