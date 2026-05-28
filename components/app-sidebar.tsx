"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarPlus,
  ClipboardList,
  Search,
  FolderArchive,
  Gauge,
  IdCard,
  ListChecks,
  LayoutGrid,
  NotebookText,
  Settings,
  User2Icon,
  UserCog,
  Users2Icon,
} from "lucide-react";

import { NavUser } from "@/components/nav-user";
import { Switcher } from "@/components/switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type SidebarUser = {
  name?: string;
  email?: string;
  avatar?: string;
};

type SidebarRole = string | undefined;
type SidebarJobRole = string | undefined;

type AppConfig = {
  name?: string | null;
  logo?: string | null;
};

type MenuItem = {
  name: string;
  url: string;
  icon: React.ReactNode;
};

type MenuGroup = {
  name: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  url?: string;
};

const onboardingMenuGroup: MenuGroup = {
  name: "On-boarding",
  icon: <ClipboardList size={18} />,
  children: [
    {
      name: "Recruitment",
      url: "/recruitment-intake",
      icon: <Users2Icon size={18} />,
    },
    {
      name: "Pre-Onboarding",
      url: "/recruitment",
      icon: <ClipboardList size={18} />,
    },
    {
      name: "Employee Documents",
      url: "/employee-documents",
      icon: <IdCard size={18} />,
    },
  ],
};

function getRoleLabel(role?: SidebarRole, jobRole?: SidebarJobRole, isManager?: boolean) {
  if (role?.toLowerCase() === "employer") return "Employer Portal";
  if (role?.toLowerCase() === "employee") {
    if (isHrJobRole(jobRole)) return "HR Workspace";
    if (isManager || isManagerJobRole(jobRole)) return "Manager Workspace";
    return "Employee Workspace";
  }

  return "Operations Console";
}

const menu: MenuGroup[] = [
  {
    name: "Dashboard",
    icon: <Gauge size={18} />,
    children: [
      { name: "Overview", url: "/dashboard", icon: <Gauge size={18} /> },
      {
        name: "Employee Search",
        url: "/dashboard-design",
        icon: <Search size={18} />,
      },
      {
        name: "Employee Dashboard",
        url: "/employee-dashboard",
        icon: <Users2Icon size={18} />,
      },
    ],
  },
  onboardingMenuGroup,
  {
    name: "Employee Management",
    icon: <Users2Icon size={18} />,
    children: [
      {
        name: "Employee Profiles",
        url: "/employee-profiles",
        icon: <Users2Icon size={18} />,
      },
      {
        name: "Dept & Org Chart",
        url: "/department",
        icon: <Building2 size={18} />,
      },
      {
        name: "Job Roles",
        url: "/job-roles",
        icon: <BadgeCheck size={18} />,
      },
      {
        name: "Work Location",
        url: "/work-location",
        icon: <Briefcase size={18} />,
      },
      {
        name: "Transfer & Promotion",
        url: "/transfer-promotion",
        icon: <ArrowRightLeft size={18} />,
      },
      {
        name: "Attendance",
        url: "/attendance",
        icon: <CalendarCheck size={18} />,
      },
      {
        name: "Leave Requests",
        url: "/leave-requests",
        icon: <CalendarPlus size={18} />,
      },
      {
        name: "EOD Reporting",
        url: "/eod-reporting",
        icon: <NotebookText size={18} />,
      },
    ],
  },
  {
    name: "User Management",
    icon: <User2Icon size={18} />,
    children: [
      { name: "User", url: "/users", icon: <User2Icon size={18} /> },
      { name: "Role", url: "/roles", icon: <UserCog size={18} /> },
      { name: "Module", url: "/module", icon: <LayoutGrid size={18} /> },
    ],
  },
  {
    name: "Employer Management",
    icon: <Building2 size={18} />,
    children: [
      { name: "Company", url: "/companies", icon: <Building2 size={18} /> },
      { name: "Employer", url: "/employers", icon: <UserCog size={18} /> },
    ],
  },
  {
    name: "Project Management",
    icon: <FolderArchive size={18} />,
    children: [
      {
        name: "Project Creation",
        url: "/projects",
        icon: <Building2 size={18} />,
      },
      {
        name: "Project Members",
        url: "/project-members",
        icon: <UserCog size={18} />,
      },
      {
        name: "Project Tracking",
        url: "/project-tracking",
        icon: <FolderArchive size={18} />,
      },
      {
        name: "Task Creation",
        url: "/tasks",
        icon: <UserCog size={18} />,
      },
    ],
  },
  {
    name: "Configuration",
    icon: <Settings size={18} />,
    url: "/configuration",
  },
];

function isHrJobRole(jobRole?: SidebarJobRole) {
  return !!jobRole?.toLowerCase().includes("hr");
}

function isManagerJobRole(jobRole?: SidebarJobRole) {
  return !!jobRole?.toLowerCase().includes("manager");
}

function getMenuByRole(
  role?: SidebarRole,
  jobRole?: SidebarJobRole,
  isManager?: boolean,
): MenuGroup[] {
  if (role?.toLowerCase() === "employee") {
    if (isHrJobRole(jobRole)) {
      return [
        {
          name: "HR Dashboard",
          url: "/employee-dashboard",
          icon: <Gauge size={18} />,
        },
        onboardingMenuGroup,
        {
          name: "Employee Profiles",
          url: "/employee-profiles",
          icon: <Users2Icon size={18} />,
        },
        {
          name: "Dept & Org Chart",
          url: "/department",
          icon: <Building2 size={18} />,
        },
        {
          name: "Job Roles",
          url: "/job-roles",
          icon: <BadgeCheck size={18} />,
        },
        {
          name: "Work Location",
          url: "/work-location",
          icon: <Briefcase size={18} />,
        },
        {
          name: "Attendance",
          url: "/attendance",
          icon: <CalendarCheck size={18} />,
        },
        {
          name: "Employee Documents",
          url: "/employee-documents",
          icon: <IdCard size={18} />,
        },
        {
          name: "Leave Requests",
          url: "/leave-requests",
          icon: <CalendarPlus size={18} />,
        },
        {
          name: "Task Tracking",
          url: "/employee-task-tracking",
          icon: <ListChecks size={18} />,
        },
        {
          name: "EOD Reporting",
          url: "/eod-reporting",
          icon: <NotebookText size={18} />,
        },
        {
          name: "Transfer & Promotion",
          url: "/transfer-promotion",
          icon: <ArrowRightLeft size={18} />,
        },
      ];
    }

    if (isManager || isManagerJobRole(jobRole)) {
      return [
        {
          name: "Manager Dashboard",
          url: "/employee-dashboard",
          icon: <Gauge size={18} />,
        },
        onboardingMenuGroup,
        {
          name: "My Attendance",
          url: "/attendance/my",
          icon: <CalendarCheck size={18} />,
        },
        {
          name: "My Leave Requests",
          url: "/leave-requests/my",
          icon: <CalendarPlus size={18} />,
        },
        {
          name: "My Task Tracking",
          url: "/employee-task-tracking",
          icon: <ListChecks size={18} />,
        },
        {
          name: "EOD Reporting",
          url: "/eod-reporting",
          icon: <NotebookText size={18} />,
        },
        {
          name: "Project Management",
          icon: <FolderArchive size={18} />,
          children: [
            {
              name: "Project Creation",
              url: "/projects",
              icon: <Building2 size={18} />,
            },
            {
              name: "Project Members",
              url: "/project-members",
              icon: <UserCog size={18} />,
            },
            {
              name: "Project Tracking",
              url: "/project-tracking",
              icon: <FolderArchive size={18} />,
            },
          ],
        },
      ];
    }

    return [
      {
        name: "Employee Dashboard",
        url: "/employee-dashboard",
        icon: <Gauge size={18} />,
      },
      onboardingMenuGroup,
      {
        name: "My Attendance",
        url: "/attendance/my",
        icon: <CalendarCheck size={18} />,
      },
      {
        name: "My Leave Requests",
        url: "/leave-requests/my",
        icon: <CalendarPlus size={18} />,
      },
      {
        name: "My Documents",
        url: "/employee-documents",
        icon: <IdCard size={18} />,
      },
      {
        name: "My Task Tracking",
        url: "/employee-task-tracking",
        icon: <ListChecks size={18} />,
      },
      {
        name: "EOD Reporting",
        url: "/eod-reporting",
        icon: <NotebookText size={18} />,
      },
    ];
  }

  if (role?.toLowerCase() === "employer") {
    return [
      {
        name: "Dashboard",
        icon: <Gauge size={18} />,
        children: [
          {
            name: "Employer Dashboard",
            url: "/dashboard",
            icon: <Gauge size={18} />,
          },
          {
            name: "Employee Search",
            url: "/dashboard-design",
            icon: <Search size={18} />,
          },
        ],
      },
    ];
  }

  return menu;
}

function filterMenuByAccess(
  menuGroups: MenuGroup[],
  role: SidebarRole,
  accessibleRoutes: string[]
) {
  if (role?.toLowerCase() === "employee" || role?.toLowerCase() === "employer") {
    return menuGroups;
  }

  const routeSet = new Set(accessibleRoutes);

  return menuGroups
    .map((group) => {
      if (group.children?.length) {
        const children = group.children.filter((item) =>
          routeSet.has(item.url)
        );

        if (!children.length) return null;

        return { ...group, children };
      }

      if (group.url && routeSet.has(group.url)) {
        return group;
      }

      return null;
    })
    .filter((group): group is MenuGroup => !!group);
}

export function AppSidebar({
  user,
  role,
  jobRole,
  isManager,
  config,
  accessibleRoutes = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: SidebarUser;
  role?: SidebarRole;
  jobRole?: SidebarJobRole;
  isManager?: boolean;
  config?: AppConfig;
  accessibleRoutes?: string[];
}) {
  const navUser = {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.avatar || "",
  };

  const filteredMenu = filterMenuByAccess(
    getMenuByRole(role, jobRole, isManager),
    role,
    accessibleRoutes
  );

  const homeHref =
    role?.toLowerCase() === "employee"
      ? "/employee-dashboard"
      : "/dashboard";

  const companyName = config?.name?.trim() || "SY ASSOCIATES";
  const logoSrc = config?.logo?.trim() || "";
  const [failedLogoSrc, setFailedLogoSrc] = React.useState<string | null>(null);
  const showLogo = Boolean(logoSrc) && failedLogoSrc !== logoSrc;

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const pathname = usePathname();
  const roleLabel = getRoleLabel(role, jobRole, isManager);

  return (
    <Sidebar
      collapsible="icon"
      className="z-100 border-r border-slate-200/60 bg-transparent shadow-none"
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-3 top-3 h-36 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_52%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_45%)] blur-2xl" />

      <SidebarHeader className="relative z-10 border-b border-slate-200/75 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={cn(
                "h-auto rounded-[1.5rem] p-2.5 transition-all duration-200 hover:bg-slate-50/95",
                isCollapsed && "justify-center p-2"
              )}
            >
              <Link href={homeHref}>
                <div
                  className={cn(
                    "flex min-w-0 items-center gap-3",
                    isCollapsed && "w-full justify-center gap-0"
                  )}
                >
                  {showLogo && logoSrc ? (
                    <Image
                      src={logoSrc}
                      alt={companyName}
                      width={44}
                      height={44}
                      className="shrink-0 rounded-2xl border border-slate-200/80 object-cover shadow-sm"
                      onError={() => setFailedLogoSrc(logoSrc)}
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-700 to-sky-600 text-sm font-semibold text-white shadow-[0_16px_28px_-18px_rgba(8,145,178,0.65)]">
                      {companyName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div
                    className={cn(
                      "min-w-0 group-data-[collapsible=icon]:hidden",
                      isCollapsed && "hidden"
                    )}
                  >
                    <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700/90">
                      {roleLabel}
                    </span>
                    <span className="block truncate text-sm font-semibold text-slate-950">
                      {companyName}
                    </span>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

       
      </SidebarHeader>

      <SidebarContent className="relative z-10 space-y-3 p-2">
        <div className="px-2 pt-1 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500/90">
            Navigation
          </p>
        </div>

        {filteredMenu.map((group) =>
          group.children ? (
            <Switcher key={group.name} menu={group} />
          ) : (
            <SidebarMenu key={group.name}>
              <SidebarMenuItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        size="lg"
                        className={cn(
                          `
                        rounded-[1.35rem] cursor-pointer transition-all duration-200
                        ${pathname === group.url
                            ? "bg-gradient-to-r from-slate-900 via-cyan-700 to-sky-600 text-white shadow-[0_18px_34px_-20px_rgba(8,145,178,0.6)]"
                            : "text-slate-700 hover:bg-slate-50/95 hover:text-slate-950"
                          }
                      `,
                          isCollapsed && "justify-center px-0"
                        )}
                      >
                        <Link
                          href={group.url!}
                          className={cn(
                            "flex w-full items-center gap-3",
                            isCollapsed && "justify-center gap-0"
                          )}
                        >
                          <div
                            className={cn(
                              `
                              flex aspect-square size-9 items-center justify-center rounded-2xl
                              ${pathname === group.url
                                ? "bg-white/14 text-white ring-1 ring-white/18"
                                : "border border-slate-200/80 bg-white text-cyan-700 shadow-sm"
                              }
                            `,
                              isCollapsed && "size-10"
                            )}
                          >
                            {group.icon}
                          </div>
                          <div
                            className={cn(
                              "flex min-w-0 flex-1 items-center justify-between gap-2",
                              isCollapsed && "hidden"
                            )}
                          >
                            <span className="truncate">{group.name}</span>
                            {pathname === group.url ? <span className="h-2 w-2 rounded-full bg-white/85" /> : null}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="border-0 bg-slate-900 text-white shadow-xl">
                        {group.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            </SidebarMenu>
          )
        )}
      </SidebarContent>

      <SidebarFooter className="relative z-10 border-t border-slate-200/75 p-2">
        <div className="glass-panel rounded-2xl">
          <NavUser user={navUser} />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
