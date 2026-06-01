"use client";

import { ExperienceType, Status } from "@prisma/client";
import {
  createEmployeeDocument,
  updateEmployeeDocument,
} from "@/lib/actions/employee-documents";
import { employeeDocumentDefaultValues } from "@/lib/constants";
import { employeeDocumentSchema } from "@/lib/validators";
import { EmployeeDocument } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Loader2,
  Upload,
  Trash2,
  Plus,
  GraduationCap,
  Briefcase,
  User,
  IdCard,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import {
  FieldPath,
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

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
  data?: EmployeeDocument;
  update: boolean;
  redirectTo?: string;
  mode?: "applicant" | "applicant-self" | "employee";
  selectedCandidates?: SelectedInterviewCandidateOption[];
  initialSelectedInterviewApplicantId?: string;
  showApplicantSelection?: boolean;
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
  sourceInterviewApplicantId: string;
};

const fieldClass =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const textAreaClass =
  "min-h-28 w-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 outline-none";

const cardClass =
  "rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm space-y-5";

const experienceFileFields = [
  { name: "experienceLetterFileUrl", label: "Experience Letter" },
  { name: "salarySlip1FileUrl", label: "Salary Slip 1" },
  { name: "salarySlip2FileUrl", label: "Salary Slip 2" },
  { name: "salarySlip3FileUrl", label: "Salary Slip 3" },
] as const;

const createEducationEntry = () => ({
  degree: "",
  college: "",
  year: "",
  marks: undefined,
  marksheetFileUrl: "",
});

const createExperienceEntry = () => ({
  totalExperience: "",
  previousCompanyName: "",
  experienceLetterFileUrl: "",
  salarySlip1FileUrl: "",
  salarySlip2FileUrl: "",
  salarySlip3FileUrl: "",
});

const requiredLabel = (label: string): React.ReactNode => (
  <span>
    {label}
    <span className="ml-1 text-rose-500">*</span>
  </span>
);

type InputType = z.input<typeof employeeDocumentSchema>;
type OutputType = z.output<typeof employeeDocumentSchema>;

type ImageFieldPath = Extract<
  FieldPath<InputType>,
  | "aadhaarFileUrl"
  | "panFileUrl"
  | `educationEntries.${number}.marksheetFileUrl`
  | `experienceEntries.${number}.experienceLetterFileUrl`
  | `experienceEntries.${number}.salarySlip1FileUrl`
  | `experienceEntries.${number}.salarySlip2FileUrl`
  | `experienceEntries.${number}.salarySlip3FileUrl`
>;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject();
    reader.readAsDataURL(file);
  });

const EmployeeDocumentForm = ({
  data,
  update,
  redirectTo = "/employee-documents",
  mode = "applicant",
  selectedCandidates = [],
  initialSelectedInterviewApplicantId,
  showApplicantSelection = true,
}: Props) => {
  const router = useRouter();
  const id = data?.id;

  const [isPending, startTransition] = React.useTransition();

  const form = useForm<InputType, unknown, OutputType>({
    resolver: zodResolver(employeeDocumentSchema),
    defaultValues: (data ?? {
      ...employeeDocumentDefaultValues,
    }) as InputType,
  });

  const experienceType = useWatch({
    control: form.control,
    name: "experienceType",
  });
  const isApplicantDocumentMode =
    mode === "applicant" || mode === "applicant-self";

  console.log(isApplicantDocumentMode)
  const selectedInterviewApplicantId = useWatch({
    control: form.control,
    name: "sourceInterviewApplicantId",
  });
  const selectedInterviewCandidate = selectedCandidates.find(
    (item) => item.sourceInterviewApplicantId === selectedInterviewApplicantId,
  );

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: "educationEntries",
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
    replace: replaceExperience,
  } = useFieldArray({
    control: form.control,
    name: "experienceEntries",
  });

  useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  useEffect(() => {
    if (mode !== "applicant" || update || !selectedCandidates.length) {
      return;
    }

    form.setValue("documentContext", "ONBOARDING");

    const applicantId =
      initialSelectedInterviewApplicantId ||
      selectedCandidates[0]?.sourceInterviewApplicantId ||
      "";
    if (!applicantId) {
      return;
    }

    form.setValue("sourceInterviewApplicantId", applicantId);
  }, [
    form,
    initialSelectedInterviewApplicantId,
    mode,
    selectedCandidates,
    update,
  ]);

  useEffect(() => {
    if (mode !== "applicant" || !selectedInterviewCandidate) {
      return;
    }

    form.setValue("applicantId", selectedInterviewCandidate.applicantId);
    form.setValue("applicantCode", selectedInterviewCandidate.requestId);
    form.setValue("candidateName", selectedInterviewCandidate.candidateName);
    form.setValue("appliedPosition", selectedInterviewCandidate.profilePost);
    form.setValue("email", selectedInterviewCandidate.email);
    form.setValue("mobileNumber", selectedInterviewCandidate.mobileNumber);
    form.setValue("skillsLevel", selectedInterviewCandidate.skillsLevel);
    form.setValue(
      "totalExperience",
      selectedInterviewCandidate.totalExperience,
    );
    form.setValue(
      "relevantExperience",
      selectedInterviewCandidate.relevantExperience,
    );
    form.setValue("qualification", selectedInterviewCandidate.qualification);
  }, [form, mode, selectedInterviewCandidate]);

  useEffect(() => {
    if (mode === "employee") {
      return;
    }

    form.setValue("documentContext", "ONBOARDING");
  }, [form, mode]);

  useEffect(() => {
    if (!educationFields.length) {
      appendEducation(createEducationEntry());
    }
  }, [educationFields.length, appendEducation]);

  useEffect(() => {
    if (experienceType === ExperienceType.EXPERIENCED) {
      if (!experienceFields.length) {
        appendExperience(createExperienceEntry());
      }
    } else {
      replaceExperience([]);
    }
  }, [
    experienceType,
    experienceFields.length,
    appendExperience,
    replaceExperience,
  ]);

  const onSubmit: SubmitHandler<OutputType> = async (values) => {
    startTransition(async () => {
      const res =
        update && id
          ? await updateEmployeeDocument(values, id)
          : await createEmployeeDocument(values);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.push(redirectTo);
      router.refresh();
    });
  };

  const renderUpload = (name: ImageFieldPath, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>

          <FormControl>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 px-4 py-4 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100">
                <Upload className="h-4 w-4" />
                Upload File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      const base64 = await readFileAsDataUrl(file);
                      field.onChange(base64);
                    } catch {
                      toast.error("Unable to read file");
                    }
                  }}
                />
              </label>

              {field.value && (
                <div className="space-y-2">
                  <Image
                    src={field.value}
                    alt={label}
                    width={220}
                    height={140}
                    unoptimized
                    className="h-36 w-full rounded-2xl border object-cover md:w-56"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => field.onChange("")}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderDocumentUpload = (
    name: FieldPath<InputType>,
    statusName: FieldPath<InputType>,
    label: React.ReactNode,
    accept = "image/*,application/pdf",
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 px-4 py-4 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100">
                <Upload className="h-4 w-4" />
                Upload File
                <input
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      const base64 = await readFileAsDataUrl(file);
                      field.onChange(base64);
                      form.setValue(statusName, "PENDING_REVIEW" as never, {
                        shouldDirty: true,
                      });
                    } catch {
                      toast.error("Unable to read file");
                    }
                  }}
                />
              </label>

              {field.value ? (
                <div className="space-y-2">
                  {String(field.value).startsWith("data:image/") ? (
                    <Image
                      src={String(field.value)}
                      alt={
                        typeof label === "string" ? label : "Uploaded document"
                      }
                      width={220}
                      height={140}
                      unoptimized
                      className="h-36 w-full rounded-2xl border object-cover md:w-56"
                    />
                  ) : (
                    <a
                      href={String(field.value)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-700"
                    >
                      <FileText className="h-4 w-4" />
                      Open uploaded file
                    </a>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => field.onChange("")}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {mode === "applicant" && showApplicantSelection ? (
          <div className={cardClass}>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                Applicant Details
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sourceInterviewApplicantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selected Interview Candidate</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      disabled={!selectedCandidates.length}
                    >
                      <FormControl>
                        <SelectTrigger className={fieldClass}>
                          <SelectValue placeholder="Select selected candidate" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                        {selectedCandidates.map((candidate) => (
                          <SelectItem
                            key={candidate.sourceInterviewApplicantId}
                            value={candidate.sourceInterviewApplicantId}
                          >
                            {candidate.candidateName} - {candidate.profilePost}
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
                name="applicantCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request ID</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        className={fieldClass}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="candidateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        className={fieldClass}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedInterviewCandidate ? (
                <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Selected from interview:{" "}
                  {selectedInterviewCandidate.candidateName} (
                  {selectedInterviewCandidate.requestId})
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Personal Information
                  </h3>
                </div>
                <p className="mb-4 text-sm text-slate-500">
                  Fields marked with <span className="text-rose-500">*</span>{" "}
                  are required.
                </p>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="candidateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Full Name")}</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Date of Birth")}</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className={fieldClass}
                            {...field}
                            value={(field.value as string | undefined) ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Gender")}</FormLabel>
                        <Select
                          value={(field.value as string | undefined) ?? ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              "Male",
                              "Female",
                              "Other",
                              "Prefer not to say",
                            ].map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("Personal Email Address")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            className={fieldClass}
                            placeholder="Enter personal email"
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
                        <FormLabel>{requiredLabel("Mobile Number")}</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter mobile number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Marital Status")}</FormLabel>
                        <Select
                          value={(field.value as string | undefined) ?? ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              "Single",
                              "Married",
                              "Divorced",
                              "Widowed",
                              "Separated",
                              "Other",
                            ].map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
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
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Nationality")}</FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter nationality"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2 xl:col-span-3">
                    {renderDocumentUpload(
                      "passportPhotoFileUrl",
                      "passportPhotoStatus",
                      requiredLabel("Passport Size Photograph"),
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Identity Verification
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="aadhaarNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("Aadhaar Card Number")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter Aadhaar number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {renderDocumentUpload(
                    "aadhaarFileUrl",
                    "aadhaarStatus",
                    requiredLabel("Aadhaar Card"),
                  )}
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("PAN Card Number")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClass}
                            placeholder="Enter PAN number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {renderDocumentUpload(
                    "panFileUrl",
                    "panStatus",
                    requiredLabel("PAN Card"),
                  )}
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "passportFileUrl",
                      "passportStatus",
                      "Passport",
                    )}
                  </div>
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "drivingLicenseFileUrl",
                      "drivingLicenseStatus",
                      "Driving License",
                    )}
                  </div>
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "voterIdFileUrl",
                      "voterIdStatus",
                      "Voter ID",
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Address Information
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="currentAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("Current Address")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className={textAreaClass}
                            {...field}
                            value={(field.value as string | undefined) ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permanentAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("Permanent Address")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className={textAreaClass}
                            {...field}
                            value={(field.value as string | undefined) ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("City")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("State")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Postal Code")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "addressProofFileUrl",
                      "addressProofStatus",
                      requiredLabel("Address Proof"),
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Educational Details
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="highestQualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("Highest Qualification")}
                        </FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="institutionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("Institution Name")}
                        </FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passingYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Passing Year")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "class10MarksheetFileUrl",
                      "class10MarksheetStatus",
                      requiredLabel("Class 10 Certificate / Marksheet"),
                    )}
                  </div>
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "class12MarksheetFileUrl",
                      "class12MarksheetStatus",
                      requiredLabel("Class 12 Certificate / Marksheet"),
                    )}
                  </div>
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "highestQualificationFileUrl",
                      "highestQualificationStatus",
                      requiredLabel(
                        "Highest Qualification Degree / Certificate",
                      ),
                    )}
                  </div>
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "additionalDegreesFileUrl",
                      "additionalDegreesStatus",
                      "Additional Degrees",
                    )}
                  </div>
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "professionalCertificationsFileUrl",
                      "professionalCertificationsStatus",
                      "Professional Certifications",
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Employment Details
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="experienceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Candidate Type")}</FormLabel>
                        <Select
                          value={(field.value as string | undefined) ?? ""}
                          onValueChange={(value) =>
                            field.onChange(value as ExperienceType)
                          }
                        >
                          <FormControl>
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ExperienceType.FRESHER}>
                              Fresher
                            </SelectItem>
                            <SelectItem value={ExperienceType.EXPERIENCED}>
                              Experienced
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {experienceType === ExperienceType.EXPERIENCED ? (
                    <FormField
                      control={form.control}
                      name="uanNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{requiredLabel("UAN Number")}</FormLabel>
                          <FormControl>
                            <Input className={fieldClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                  {experienceType === ExperienceType.EXPERIENCED ? (
                    <div className="md:col-span-2">
                      {renderDocumentUpload(
                        "experienceLetterFileUrl",
                        "experienceLetterStatus",
                        requiredLabel("Experience Letter"),
                      )}
                    </div>
                  ) : null}
                  {experienceType === ExperienceType.EXPERIENCED ? (
                    <div className="md:col-span-2">
                      {renderDocumentUpload(
                        "relievingLetterFileUrl",
                        "relievingLetterStatus",
                        requiredLabel("Relieving Letter"),
                      )}
                    </div>
                  ) : null}
                  {experienceType === ExperienceType.EXPERIENCED ? (
                    <>
                      <div className="md:col-span-2">
                        {renderDocumentUpload(
                          "salarySlip1FileUrl",
                          "salarySlipsStatus",
                          requiredLabel("Salary Slip 1"),
                        )}
                      </div>
                      <div className="md:col-span-2">
                        {renderDocumentUpload(
                          "salarySlip2FileUrl",
                          "salarySlipsStatus",
                          requiredLabel("Salary Slip 2"),
                        )}
                      </div>
                      <div className="md:col-span-2">
                        {renderDocumentUpload(
                          "salarySlip3FileUrl",
                          "salarySlipsStatus",
                          requiredLabel("Salary Slip 3"),
                        )}
                      </div>
                      <div className="md:col-span-2">
                        {renderDocumentUpload(
                          "previousOfferLetterFileUrl",
                          "previousOfferLetterStatus",
                          "Previous Offer Letter",
                        )}
                      </div>
                      <div className="md:col-span-2">
                        {renderDocumentUpload(
                          "promotionAppraisalLettersFileUrl",
                          "promotionAppraisalLettersStatus",
                          "Promotion / Appraisal Letters",
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Banking Information
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Bank Name")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("Account Holder Name")}
                        </FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Account Number")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("IFSC Code")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="branchName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Branch Name")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "bankProofFileUrl",
                      "bankProofStatus",
                      requiredLabel(
                        "Cancelled Cheque / Passbook Front Page / Bank Statement",
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    PF / UAN Information
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "pfPassbookFileUrl",
                      "pfPassbookStatus",
                      "PF Passbook",
                    )}
                  </div>
                  <div className="md:col-span-2">
                    {renderDocumentUpload(
                      "pfTransferDocumentsFileUrl",
                      "pfTransferDocumentsStatus",
                      "PF Transfer Documents",
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Emergency Contact
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {requiredLabel("Emergency Contact Name")}
                        </FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Relationship")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{requiredLabel("Contact Number")}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Declaration & Consent
                  </h3>
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  {[
                    [
                      "declarationInfoAccurate",
                      "I confirm that all information provided is accurate.",
                    ],
                    [
                      "declarationAuthorizeVerification",
                      "I authorize the company to verify my documents and employment history.",
                    ],
                    [
                      "declarationAgreePolicies",
                      "I agree to company onboarding policies and terms.",
                    ],
                  ].map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as FieldPath<InputType>}
                      render={({ field }) => (
                        <FormItem className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                          <input
                            type="checkbox"
                            checked={Boolean(field.value)}
                            onChange={(event) =>
                              field.onChange(event.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600"
                          />
                          <FormLabel className="m-0 font-normal text-slate-700">
                            {label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={cardClass}>
            <div className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-semibold text-slate-800">
                {mode === "employee"
                  ? "Employee Document Upload"
                  : "Applicant Document Upload"}
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              {mode === "employee"
                ? "Upload your identity, education, and experience records here. HR can review them later from the employee profile."
                : "Upload your identity, education, and experience records here so HR can complete your joining documentation."}
            </p>
          </div>
        )}

        {isApplicantDocumentMode ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-500" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Personal Information
                </h3>
              </div>
              <p className="mb-4 text-sm text-slate-500">
                Fields marked with <span className="text-rose-500">*</span> are
                required.
              </p>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <FormField
                  control={form.control}
                  name="candidateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{requiredLabel("Full Name")}</FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClass}
                          placeholder="Enter full name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{requiredLabel("Date of Birth")}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className={fieldClass}
                          {...field}
                          value={(field.value as string | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{requiredLabel("Gender")}</FormLabel>
                      <Select
                        value={(field.value as string | undefined) ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className={fieldClass}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["Male", "Female", "Other", "Prefer not to say"].map(
                            (option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {requiredLabel("Personal Email Address")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          className={fieldClass}
                          placeholder="Enter personal email"
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
                      <FormLabel>{requiredLabel("Mobile Number")}</FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClass}
                          placeholder="Enter mobile number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{requiredLabel("Marital Status")}</FormLabel>
                      <Select
                        value={(field.value as string | undefined) ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className={fieldClass}>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "Single",
                            "Married",
                            "Divorced",
                            "Widowed",
                            "Separated",
                            "Other",
                          ].map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
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
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{requiredLabel("Nationality")}</FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClass}
                          placeholder="Enter nationality"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 xl:col-span-3">
                  {renderDocumentUpload(
                    "passportPhotoFileUrl",
                    "passportPhotoStatus",
                    requiredLabel("Passport Size Photograph"),
                  )}
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-2">
                <IdCard className="h-5 w-5 text-cyan-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Identity Documents
                </h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="aadhaarNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClass}
                          placeholder="Enter Aadhaar Number"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {renderUpload("aadhaarFileUrl", "Aadhaar Upload")}

                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClass}
                          placeholder="Enter PAN Number"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {renderUpload("panFileUrl", "PAN Upload")}
              </div>
            </div>

            {/* Education */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Education Details
                  </h3>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => appendEducation(createEducationEntry())}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              {educationFields.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        Education {index + 1}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Keep qualification details and marksheet in one place.
                      </p>
                    </div>

                    {educationFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => removeEducation(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`educationEntries.${index}.degree`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Degree</FormLabel>
                          <FormControl>
                            <Input
                              className={fieldClass}
                              placeholder="Enter degree"
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
                      name={`educationEntries.${index}.college`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College / University</FormLabel>
                          <FormControl>
                            <Input
                              className={fieldClass}
                              placeholder="Enter college or university"
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
                      name={`educationEntries.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passing Year</FormLabel>
                          <FormControl>
                            <Input
                              className={fieldClass}
                              placeholder="Enter passing year"
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
                      name={`educationEntries.${index}.marks`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marks / Percentage</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className={fieldClass}
                              placeholder="Enter marks"
                              {...field}
                              value={
                                typeof field.value === "number" ||
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {renderUpload(
                      `educationEntries.${index}.marksheetFileUrl`,
                      "Marksheet Upload",
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Experience */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Experience Details
                  </h3>
                </div>

                {experienceType === ExperienceType.EXPERIENCED && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => appendExperience(createExperienceEntry())}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="experienceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Type</FormLabel>

                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) =>
                          field.onChange(v as ExperienceType)
                        }
                      >
                        <FormControl>
                          <SelectTrigger className={fieldClass}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                          <SelectItem value={ExperienceType.FRESHER}>
                            Fresher
                          </SelectItem>
                          <SelectItem value={ExperienceType.EXPERIENCED}>
                            Experienced
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>

                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v as Status)}
                      >
                        <FormControl>
                          <SelectTrigger className={fieldClass}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                          <SelectItem value={Status.ACTIVE}>Active</SelectItem>
                          <SelectItem value={Status.INACTIVE}>
                            Inactive
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {experienceType === ExperienceType.EXPERIENCED &&
                experienceFields.map((item, index) => (
                  <div
                    key={item.id}
                    className="space-y-4 rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Experience {index + 1}</h4>

                      {experienceFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => removeExperience(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`experienceEntries.${index}.totalExperience`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Experience</FormLabel>
                            <FormControl>
                              <Input
                                className={fieldClass}
                                placeholder="Example: 2 years"
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
                        name={`experienceEntries.${index}.previousCompanyName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Company</FormLabel>
                            <FormControl>
                              <Input
                                className={fieldClass}
                                placeholder="Enter previous company"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {experienceFileFields.map((fileField) =>
                        renderUpload(
                          `experienceEntries.${index}.${fileField.name}`,
                          fileField.label,
                        ),
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : mode === "employee" ? (
          <>
            {/* Documents */}
            <div className={cardClass}>
              <div className="flex items-center gap-2">
                <IdCard className="h-5 w-5 text-cyan-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Identity Documents
                </h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="aadhaarNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClass}
                          placeholder="Enter Aadhaar Number"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {renderUpload("aadhaarFileUrl", "Aadhaar Upload")}

                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClass}
                          placeholder="Enter PAN Number"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {renderUpload("panFileUrl", "PAN Upload")}
              </div>
            </div>

            {/* Education */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Education Details
                  </h3>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => appendEducation(createEducationEntry())}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              {educationFields.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        Education {index + 1}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Keep qualification details and marksheet in one place.
                      </p>
                    </div>

                    {educationFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => removeEducation(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`educationEntries.${index}.degree`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Degree</FormLabel>
                          <FormControl>
                            <Input
                              className={fieldClass}
                              placeholder="Enter degree"
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
                      name={`educationEntries.${index}.college`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College / University</FormLabel>
                          <FormControl>
                            <Input
                              className={fieldClass}
                              placeholder="Enter college or university"
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
                      name={`educationEntries.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passing Year</FormLabel>
                          <FormControl>
                            <Input
                              className={fieldClass}
                              placeholder="Enter passing year"
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
                      name={`educationEntries.${index}.marks`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marks / Percentage</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className={fieldClass}
                              placeholder="Enter marks"
                              {...field}
                              value={
                                typeof field.value === "number" ||
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {renderUpload(
                      `educationEntries.${index}.marksheetFileUrl`,
                      "Marksheet Upload",
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Experience */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Experience Details
                  </h3>
                </div>

                {experienceType === ExperienceType.EXPERIENCED && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => appendExperience(createExperienceEntry())}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="experienceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Type</FormLabel>

                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) =>
                          field.onChange(v as ExperienceType)
                        }
                      >
                        <FormControl>
                          <SelectTrigger className={fieldClass}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                          <SelectItem value={ExperienceType.FRESHER}>
                            Fresher
                          </SelectItem>
                          <SelectItem value={ExperienceType.EXPERIENCED}>
                            Experienced
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>

                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v as Status)}
                      >
                        <FormControl>
                          <SelectTrigger className={fieldClass}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent className="rounded-2xl border border-slate-200 shadow-xl">
                          <SelectItem value={Status.ACTIVE}>Active</SelectItem>
                          <SelectItem value={Status.INACTIVE}>
                            Inactive
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {experienceType === ExperienceType.EXPERIENCED &&
                experienceFields.map((item, index) => (
                  <div
                    key={item.id}
                    className="space-y-4 rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Experience {index + 1}</h4>

                      {experienceFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => removeExperience(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`experienceEntries.${index}.totalExperience`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Experience</FormLabel>
                            <FormControl>
                              <Input
                                className={fieldClass}
                                placeholder="Example: 2 years"
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
                        name={`experienceEntries.${index}.previousCompanyName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Company</FormLabel>
                            <FormControl>
                              <Input
                                className={fieldClass}
                                placeholder="Enter previous company"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {experienceFileFields.map((fileField) =>
                        renderUpload(
                          `experienceEntries.${index}.${fileField.name}`,
                          fileField.label,
                        ),
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : null}

        {/* Remark */}
        <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remark</FormLabel>
              <FormControl>
                <Textarea
                  className={textAreaClass}
                  placeholder="Additional notes"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit */}
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

          {update
            ? mode === "employee"
              ? "Update My Document"
              : "Update Applicant Document"
            : mode === "employee"
              ? "Save My Document"
              : "Save Applicant Document"}
        </Button>
      </form>
    </Form>
  );
};
export default EmployeeDocumentForm;
