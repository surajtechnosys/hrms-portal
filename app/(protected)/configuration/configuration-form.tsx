"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  Globe2,
  ImagePlus,
  Loader2,
  Lock,
  Mail,
  Save,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Configuration } from "@/types";
import { configurationSchema } from "@/lib/validators";
import { createOrUpdateConfiguration } from "@/lib/actions/configuration";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const inputStyle =
  "h-12 rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-cyan-300 focus-visible:border-cyan-400 focus-visible:ring-4 focus-visible:ring-cyan-100";

const fileStyle =
  "h-12 cursor-pointer rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-cyan-700 hover:border-cyan-300 focus-visible:border-cyan-400 focus-visible:ring-4 focus-visible:ring-cyan-100";

const sectionCardClass =
  "rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_55px_-45px_rgba(15,23,42,0.45)]";

function getFilePreview(value: unknown) {
  if (typeof window === "undefined") {
    return "";
  }

  if (value instanceof File) {
    return URL.createObjectURL(value);
  }

  return typeof value === "string" ? value : "";
}

const ConfigurationForm = ({
  data,
  canEdit = true,
}: {
  data?: Configuration;
  canEdit?: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<Configuration>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      name: data?.name || "",
      logo: data?.logo || "",
      favicon: data?.favicon || "",
      email: data?.email || "",
      password: data?.password || "",
      smtpHost: data?.smtpHost || "",
      smtpPort: data?.smtpPort || 465,
      smtpSecure: data?.smtpSecure ?? true,
      smtpFromName: data?.smtpFromName || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      name: data?.name || "",
      logo: data?.logo || "",
      favicon: data?.favicon || "",
      email: data?.email || "",
      password: data?.password || "",
      smtpHost: data?.smtpHost || "",
      smtpPort: data?.smtpPort || 465,
      smtpSecure: data?.smtpSecure ?? true,
      smtpFromName: data?.smtpFromName || "",
    });
  }, [data, form]);

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedEmail = useWatch({ control: form.control, name: "email" });
  const watchedPassword = useWatch({ control: form.control, name: "password" });
  const watchedSmtpHost = useWatch({ control: form.control, name: "smtpHost" });
  const watchedSmtpPort = useWatch({ control: form.control, name: "smtpPort" });
  const watchedSmtpSecure = useWatch({
    control: form.control,
    name: "smtpSecure",
  });
  const watchedSmtpFromName = useWatch({
    control: form.control,
    name: "smtpFromName",
  });
  const watchedLogo = useWatch({ control: form.control, name: "logo" });
  const watchedFavicon = useWatch({ control: form.control, name: "favicon" });

  const logoPreview = React.useMemo(() => getFilePreview(watchedLogo), [watchedLogo]);
  const faviconPreview = React.useMemo(
    () => getFilePreview(watchedFavicon),
    [watchedFavicon],
  );

  React.useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (faviconPreview.startsWith("blob:")) {
        URL.revokeObjectURL(faviconPreview);
      }
    };
  }, [faviconPreview, logoPreview]);

  function onSubmit(values: Configuration) {
    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.set("id", data?.id || "");
        formData.set("currentLogo", typeof data?.logo === "string" ? data.logo : "");
        formData.set(
          "currentFavicon",
          typeof data?.favicon === "string" ? data.favicon : "",
        );
        formData.set("name", values.name || "");
        formData.set("email", values.email || "");
        formData.set("password", values.password || "");
        formData.set("smtpHost", values.smtpHost || "");
        formData.set("smtpPort", values.smtpPort ? String(values.smtpPort) : "");
        formData.set("smtpSecure", String(values.smtpSecure ?? true));
        formData.set("smtpFromName", values.smtpFromName || "");

        if (values.logo instanceof File) {
          formData.set("logo", values.logo);
        }

        if (values.favicon instanceof File) {
          formData.set("favicon", values.favicon);
        }

        const res = await createOrUpdateConfiguration(formData);

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        toast.success(res.message);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
      }
    });
  }

  const companyName = watchedName?.trim() || "Your Company";
  const senderName = watchedSmtpFromName?.trim() || companyName || "HRMS Portal";
  const smtpState = watchedSmtpHost?.trim()
    ? `${watchedSmtpHost}${watchedSmtpPort ? `:${watchedSmtpPort}` : ""}`
    : "SMTP server not configured";
  const mailState = watchedEmail?.trim() || "Email account not configured";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_-48px_rgba(15,23,42,0.35)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_50%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_42%),linear-gradient(180deg,rgba(240,249,255,0.95),rgba(255,255,255,0))]" />
        <div className="relative grid gap-6 p-5 md:p-7 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                <Sparkles className="size-3.5" />
                Configuration Studio
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Portal Configuration
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">
                Manage brand identity, sender details, and SMTP delivery settings
                from one polished workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
                Branding and email in one place
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                {canEdit ? "Editable configuration" : "Read-only access"}
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                Save updates without leaving this page
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.45)] backdrop-blur sm:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Company
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{companyName}</p>
              <p className="mt-1 text-xs text-slate-500">Brand name shown across the portal</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Delivery
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {watchedSmtpSecure ? "Secure SMTP" : "Standard SMTP"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Protocol mode for outgoing email</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Sender Name
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{senderName}</p>
              <p className="mt-1 text-xs text-slate-500">Used in email headers</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                SMTP Endpoint
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900 break-all">{smtpState}</p>
              <p className="mt-1 text-xs text-slate-500">Host and port currently prepared</p>
            </div>
          </div>
        </div>
      </section>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]"
          encType="multipart/form-data"
        >
          <div className="space-y-6">
            <Card className={sectionCardClass}>
              <CardHeader className="border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                    <Building2 className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="text-xl text-slate-950">Brand Identity</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Define how the portal should look and feel to users.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute top-4 left-4 h-4 w-4 text-cyan-500" />
                          <Input
                            placeholder="Enter company name"
                            disabled={!canEdit}
                            className={`${inputStyle} pl-11`}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            disabled={!canEdit}
                            className={fileStyle}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              field.onChange(file || "");
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-slate-500">
                          Recommended for sidebar branding and header presence.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="favicon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            disabled={!canEdit}
                            className={fileStyle}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              field.onChange(file || "");
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-slate-500">
                          Best used for browser tabs and quick brand recognition.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <ImagePlus className="size-4 text-cyan-700" />
                      Logo Preview
                    </div>
                    <div className="mt-4 flex min-h-28 items-center gap-4 rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-4">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-2xl border object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                          <Building2 className="size-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800">{companyName}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          This preview reflects the current or newly selected logo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Globe2 className="size-4 text-cyan-700" />
                      Favicon Preview
                    </div>
                    <div className="mt-4 flex min-h-28 items-center gap-4 rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-4">
                      {faviconPreview ? (
                        <Image
                          src={faviconPreview}
                          alt="Favicon preview"
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg border object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                          <Globe2 className="size-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800">Browser tab icon</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Smaller square mark used beside the portal title.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={sectionCardClass}>
              <CardHeader className="border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="text-xl text-slate-950">Mail Delivery</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Configure the account and server details used for outbound email.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute top-4 left-4 h-4 w-4 text-cyan-500" />
                            <Input
                              type="email"
                              placeholder="Enter email"
                              disabled={!canEdit}
                              className={`${inputStyle} pl-11`}
                              {...field}
                            />
                          </div>
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
                          <div className="relative">
                            <Lock className="absolute top-4 left-4 h-4 w-4 text-cyan-500" />
                            <Input
                              type="password"
                              placeholder="Enter password"
                              disabled={!canEdit}
                              className={`${inputStyle} pl-11`}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-[1fr_160px]">
                  <FormField
                    control={form.control}
                    name="smtpHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Server className="absolute top-4 left-4 h-4 w-4 text-cyan-500" />
                            <Input
                              placeholder="smtp.example.com"
                              disabled={!canEdit}
                              className={`${inputStyle} pl-11`}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtpPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <ShieldCheck className="absolute top-4 left-4 h-4 w-4 text-cyan-500" />
                            <Input
                              type="number"
                              min={1}
                              placeholder="465"
                              disabled={!canEdit}
                              className={`${inputStyle} pl-11`}
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? Number(e.target.value) : undefined,
                                )
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-[1fr_260px]">
                  <FormField
                    control={form.control}
                    name="smtpFromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserRound className="absolute top-4 left-4 h-4 w-4 text-cyan-500" />
                            <Input
                              placeholder="HRMS Portal"
                              disabled={!canEdit}
                              className={`${inputStyle} pl-11`}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtpSecure"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                            <Checkbox
                              checked={field.value ?? true}
                              disabled={!canEdit}
                              onCheckedChange={field.onChange}
                            />
                            <FormLabel className="m-0 text-sm font-medium text-slate-700">
                              Use SSL/TLS
                            </FormLabel>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className={sectionCardClass}>
              <CardHeader className="border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                    <BadgeCheck className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="text-xl text-slate-950">Live Preview</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Review how the configuration feels before saving it.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] p-5">
                  <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Brand logo"
                          width={52}
                          height={52}
                          className="h-14 w-14 rounded-2xl border object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                          <Building2 className="size-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-base font-semibold text-slate-950">{companyName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Portal identity preview
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Send className="size-4 text-cyan-700" />
                        Example email header
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>
                          <span className="font-medium text-slate-900">From:</span>{" "}
                          {senderName} &lt;{mailState}&gt;
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Server:</span>{" "}
                          {smtpState}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Security:</span>{" "}
                          {watchedSmtpSecure ? "SSL/TLS enabled" : "Standard transport"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Configuration Status
                    </p>
                    <div className="mt-4 grid gap-3">
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                        <span className="text-sm text-slate-600">Brand name</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {watchedName?.trim() ? "Ready" : "Missing"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                        <span className="text-sm text-slate-600">Email account</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {watchedEmail?.trim() ? "Ready" : "Missing"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                        <span className="text-sm text-slate-600">SMTP host</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {watchedSmtpHost?.trim() ? "Ready" : "Missing"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                        <span className="text-sm text-slate-600">Password</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {watchedPassword?.trim() ? "Added" : "Missing"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Quick Notes
                    </p>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                      <p>Use a clean square favicon for the sharpest browser-tab display.</p>
                      <p>Match the sender name to your brand so password resets feel trustworthy.</p>
                      <p>Keep SSL/TLS enabled when your SMTP provider supports secure delivery.</p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending || !canEdit}
                  className="h-12 w-full rounded-2xl bg-cyan-700 text-sm font-semibold text-white shadow-[0_18px_32px_-20px_rgba(8,145,178,0.85)] transition-all hover:bg-cyan-800"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {!canEdit
                    ? "Read Only"
                    : isPending
                      ? "Saving..."
                      : "Save Configuration"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ConfigurationForm;
