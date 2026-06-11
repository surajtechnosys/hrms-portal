"use client";

import { getEmployeeProfileOptions } from "@/lib/actions/employee-profiles";
import {
  createTraineeProfile,
  getNextTraineeCodePreview,
} from "@/lib/actions/trainees";
import { traineeDefaultValues } from "@/lib/constants";
import { isImagePreviewUrl } from "@/lib/document-uploads";
import {
  buildTraineeDocumentSummary,
  buildTraineeDocumentUrls,
} from "@/lib/trainee-documents";
import { traineeSchema } from "@/lib/validators";
import type { EmployeeDocument, Trainee } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Download, Eye, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { type Resolver, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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

type TraineeFormValues = z.infer<typeof traineeSchema>;

type Option = {
  id: string;
  name: string;
};

type EmployeeOption = {
  id: string;
  employeeName: string;
  employeeCode: string;
};

type ApplicantDocumentPrefill = Pick<
  EmployeeDocument,
  | "id"
  | "applicantId"
  | "candidateName"
  | "email"
  | "mobileNumber"
  | "gender"
  | "dateOfBirth"
  | "currentAddress"
  | "permanentAddress"
  | "city"
  | "state"
  | "postalCode"
  | "emergencyContactName"
  | "emergencyContactNumber"
  | "educationEntries"
  | "experienceEntries"
  | "passportPhotoFileUrl"
  | "passportFileUrl"
  | "drivingLicenseFileUrl"
  | "voterIdFileUrl"
  | "addressProofFileUrl"
  | "class10MarksheetFileUrl"
  | "class12MarksheetFileUrl"
  | "highestQualificationFileUrl"
  | "additionalDegreesFileUrl"
  | "professionalCertificationsFileUrl"
  | "experienceLetterFileUrl"
  | "relievingLetterFileUrl"
  | "salarySlip1FileUrl"
  | "salarySlip2FileUrl"
  | "salarySlip3FileUrl"
  | "previousOfferLetterFileUrl"
  | "promotionAppraisalLettersFileUrl"
  | "bankProofFileUrl"
  | "pfPassbookFileUrl"
  | "pfTransferDocumentsFileUrl"
  | "aadhaarFileUrl"
  | "panFileUrl"
> & {
  traineeId?: string;
  linkedEmployeeId?: string;
};

type Props = {
  data?: Trainee;
  initialApplicantDocument?: ApplicantDocumentPrefill | null;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const textAreaClass =
  "min-h-28 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const NONE_VALUE = "none";

function buildAddress(document: ApplicantDocumentPrefill) {
  return (
    document.currentAddress ||
    document.permanentAddress ||
    [document.city, document.state, document.postalCode]
      .filter(Boolean)
      .join(", ")
  );
}

function buildPrefill(document: ApplicantDocumentPrefill) {
  return {
    sourceApplicantDocumentId: document.id,
    applicantDocumentId: document.id,
    applicantId: document.applicantId ?? "",
    fullName: document.candidateName || "",
    email: document.email || "",
    mobileNumber: document.mobileNumber || "",
    gender: document.gender || "",
    dateOfBirth: document.dateOfBirth || "",
    address: buildAddress(document),
    currentAddress: document.currentAddress || "",
    permanentAddress: document.permanentAddress || "",
    city: document.city || "",
    state: document.state || "",
    postalCode: document.postalCode || "",
    emergencyContactName: document.emergencyContactName || "",
    emergencyContactPhone: document.emergencyContactNumber || "",
    educationEntries: document.educationEntries ?? [],
    experienceEntries: document.experienceEntries ?? [],
    uploadedDocumentUrls: buildTraineeDocumentUrls(document),
  };
}

const TraineeForm = ({ data, initialApplicantDocument }: Props) => {
  const router = useRouter();
  const id = data?.id;

  const [departments, setDepartments] = React.useState<Option[]>([]);
  const [managers, setManagers] = React.useState<EmployeeOption[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const documentSummary = React.useMemo(
    () =>
      initialApplicantDocument
        ? buildTraineeDocumentSummary(initialApplicantDocument)
        : [],
    [initialApplicantDocument],
  );

  const form = useForm<TraineeFormValues>({
    resolver: zodResolver(traineeSchema) as Resolver<TraineeFormValues>,
    defaultValues: (data ?? traineeDefaultValues) as TraineeFormValues,
  });

  React.useEffect(() => {
    getEmployeeProfileOptions().then((options) => {
      setDepartments(options.departments);
      setManagers(options.managers);
    });
  }, []);

  React.useEffect(() => {
    if (data) {
      form.reset(data as TraineeFormValues);
    }
  }, [data, form]);

  React.useEffect(() => {
    if (!initialApplicantDocument) {
      return;
    }

    const prefill = buildPrefill(initialApplicantDocument);
    form.setValue(
      "sourceApplicantDocumentId",
      prefill.sourceApplicantDocumentId,
    );
    form.setValue("applicantDocumentId", prefill.applicantDocumentId);
    form.setValue("applicantId", prefill.applicantId);
    form.setValue("fullName", prefill.fullName);
    form.setValue("email", prefill.email);
    form.setValue("mobileNumber", prefill.mobileNumber);
    form.setValue("gender", prefill.gender);
    form.setValue("dateOfBirth", prefill.dateOfBirth);
    form.setValue("address", prefill.address);
    form.setValue("currentAddress", prefill.currentAddress);
    form.setValue("permanentAddress", prefill.permanentAddress);
    form.setValue("city", prefill.city);
    form.setValue("state", prefill.state);
    form.setValue("postalCode", prefill.postalCode);
    form.setValue("emergencyContactName", prefill.emergencyContactName);
    form.setValue("emergencyContactPhone", prefill.emergencyContactPhone);
    form.setValue("educationEntries", prefill.educationEntries);
    form.setValue("experienceEntries", prefill.experienceEntries);
    form.setValue("uploadedDocumentUrls", prefill.uploadedDocumentUrls);
  }, [form, initialApplicantDocument]);

  React.useEffect(() => {
    if (!data) {
      getNextTraineeCodePreview().then((code) => {
        form.setValue("traineeCode", code);
      });
    }
  }, [data, form]);

  const onSubmit: SubmitHandler<TraineeFormValues> = async (values) => {
    startTransition(async () => {
      const result = await createTraineeProfile(values);

      if (!result.success) {
        toast.error("Error", { description: result.message });
        return;
      }

      toast.success("Success", { description: result.message });
      router.push("/trainee-dashboard");
      router.refresh();
    });
  };

  function openDocument(url: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function downloadDocument(url: string) {
    if (typeof window === "undefined") {
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "document";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Trainee Onboarding
              </h3>
              <p className="text-sm text-slate-500">
                Applicant details are prefilled. HR completes the training
                setup.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="traineeCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainee ID</FormLabel>
                  <FormControl>
                    <Input className={fieldClass} readOnly {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      className={fieldClass}
                      placeholder="Full name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      className={fieldClass}
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input
                      className={fieldClass}
                      placeholder="Mobile number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className={fieldClass}
                      placeholder="Set trainee login password"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainingBatch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Batch</FormLabel>
                  <FormControl>
                    <Input
                      className={fieldClass}
                      placeholder="Batch name"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainer</FormLabel>
                  <FormControl>
                    <Input
                      className={fieldClass}
                      placeholder="Trainer name"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? "" : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>None</SelectItem>
                      {departments.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reportingManagerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reporting Manager</FormLabel>
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? "" : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>None</SelectItem>
                      {managers.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.employeeName} ({item.employeeCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainingStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" className={fieldClass} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainingEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training End Date</FormLabel>
                  <FormControl>
                    <Input type="date" className={fieldClass} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input
                      className={fieldClass}
                      placeholder="Contact name"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input
                      className={fieldClass}
                      placeholder="Contact phone"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      className={textAreaClass}
                      placeholder="Address information"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-slate-900">
                  Documents Available
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  HR reviews uploaded applicant documents here without exposing
                  raw URLs or Base64 data.
                </p>
              </div>
              <Badge variant="outline" className="border-cyan-200 text-cyan-700">
                {documentSummary.filter((item) => item.urls.length > 0).length} of{" "}
                {documentSummary.length} available
              </Badge>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {documentSummary.map((item) => {
                const hasFiles = item.urls.length > 0;

                return (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {hasFiles
                            ? `${item.urls.length} file${item.urls.length > 1 ? "s" : ""} available`
                            : "Not uploaded"}
                        </p>
                      </div>
                      <Badge variant={hasFiles ? "default" : "outline"}>
                        {hasFiles ? "Available" : "Missing"}
                      </Badge>
                    </div>

                    {hasFiles ? (
                      <div className="mt-3 space-y-2">
                        {item.urls.map((url, index) => (
                          <div
                            key={`${item.key}-${index}`}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <span className="text-xs font-medium text-slate-500">
                              File {index + 1}
                            </span>
                            {isImagePreviewUrl(url) || url.toLowerCase().includes(".pdf") ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openDocument(url)}
                              >
                                <Eye className="size-4" />
                                Preview
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(url)}
                            >
                              <Download className="size-4" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="evaluationRecommendation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recommendation</FormLabel>
                <Select
                  value={field.value || NONE_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NONE_VALUE ? "" : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Not evaluated</SelectItem>
                    <SelectItem value="RECOMMENDED">Recommended</SelectItem>
                    <SelectItem value="NOT_RECOMMENDED">
                      Not Recommended
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="evaluationRemarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evaluation Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    className={textAreaClass}
                    placeholder="Remarks"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-8 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-xl"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          {id ? "Update Trainee" : "Create Trainee"}
        </Button>
      </form>
    </Form>
  );
};

export default TraineeForm;
