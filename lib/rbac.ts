import { auth } from "@/auth";
import { prisma } from "./prisma";
import { isCurrentEmployeeHr, isCurrentEmployeeManager } from "./employee-job-role";

export type PermissionAction = "view" | "create" | "edit" | "delete";

type RoleModulePermission = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  module: {
    route: string;
  };
};

type UserWithPermissions = {
  role?: {
    name?: string | null;
    roleModules: RoleModulePermission[];
  } | null;
};

export async function getUserPermissions() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      role: {
        include: {
          roleModules: {
            include: {
              module: true,
            },
          },
        },
      },
    },
  });

  if (user) {
    return user;
  }

  if (isEmployeeRole(session.user.role)) {
    return {
      id: session.user.id,
      email: session.user.email,
      role: {
        name: "employee",
        roleModules: [],
      },
    };
  }

  return null;
}

export function isAdminRole(roleName?: string | null) {
  return !!roleName?.toLowerCase().includes("admin");
}

export function isHrRole(roleName?: string | null) {
  return !!roleName?.toLowerCase().includes("hr");
}

export function isEmployeeRole(roleName?: string | null) {
  return roleName?.toLowerCase() === "employee";
}

export function isEmployerRole(roleName?: string | null) {
  return roleName?.toLowerCase() === "employer";
}

export function canManageAllAttendance(roleName?: string | null) {
  return isAdminRole(roleName) || isHrRole(roleName);
}

function isLeaveRequestRoute(route: string) {
  return route === "/leave-requests" || route === "/leave-requests/my";
}

function isEodReportingRoute(route: string) {
  return route === "/eod-reporting";
}

function isProjectManagementRoute(route: string) {
  return (
    route === "/projects" ||
    route === "/project-members" ||
    route === "/project-tracking" ||
    route === "/employee-task-tracking"
  );
}

function isRecruitmentRoute(route: string) {
  return route === "/recruitment";
}

function isEmployeeDocumentsRoute(route: string) {
  return route === "/employee-documents";
}

function isAdminUser(user: UserWithPermissions | null) {
  return !!user?.role?.name?.toLowerCase().includes("admin");
}

function isEmployeeUser(user: UserWithPermissions | null) {
  return isEmployeeRole(user?.role?.name);
}

function getModulePermission(
  user: UserWithPermissions | null,
  route: string
) {
  return user?.role?.roleModules.find((roleModule) => {
    return roleModule.module.route === route;
  });
}

function readPermission(
  permission: RoleModulePermission | undefined,
  action: PermissionAction
) {
  if (!permission) {
    return false;
  }

  if (action === "view") return !!permission.canView;
  if (action === "create") return !!permission.canCreate;
  if (action === "edit") return !!permission.canEdit;
  if (action === "delete") return !!permission.canDelete;

  return false;
}

export async function canAccess(route: string, action: PermissionAction) {
  const user = await getUserPermissions();

  if (!user) {
    return false;
  }

  if (isAdminUser(user)) {
    return true;
  }

  if (canManageAllAttendance(user.role?.name) && route === "/leave-requests") {
    return action === "view" || action === "edit";
  }

  if (canManageAllAttendance(user.role?.name) && isEodReportingRoute(route)) {
    return action !== "delete";
  }

  if (
    isEmployeeUser(user) &&
    isRecruitmentRoute(route) &&
    (await isCurrentEmployeeHr())
  ) {
    return action !== "delete";
  }

  if (isEmployeeUser(user) && isEmployeeDocumentsRoute(route)) {
    return action !== "delete";
  }

  if (
    isEmployeeUser(user) &&
    (route === "/employee-task-tracking" ||
      isEodReportingRoute(route) ||
      route === "/attendance" ||
      route === "/attendance/my" ||
      isLeaveRequestRoute(route))
  ) {
    return action !== "delete";
  }

  if (
    isEmployeeUser(user) &&
    isProjectManagementRoute(route) &&
    (await isCurrentEmployeeManager())
  ) {
    return action !== "delete";
  }

  const permission = getModulePermission(user, route);
  return readPermission(permission, action);
}

export async function getRoutePermissions(route: string) {
  const user = await getUserPermissions();

  if (!user) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };
  }

  if (isAdminUser(user)) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    };
  }

  if (canManageAllAttendance(user.role?.name) && route === "/leave-requests") {
    return {
      canView: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
    };
  }

  if (canManageAllAttendance(user.role?.name) && isEodReportingRoute(route)) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    };
  }

  if (
    isEmployeeUser(user) &&
    isRecruitmentRoute(route) &&
    (await isCurrentEmployeeHr())
  ) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    };
  }

  if (isEmployeeUser(user) && isEmployeeDocumentsRoute(route)) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    };
  }

  if (
    isEmployeeUser(user) &&
    (route === "/employee-task-tracking" ||
      isEodReportingRoute(route) ||
      route === "/attendance" ||
      route === "/attendance/my" ||
      isLeaveRequestRoute(route))
  ) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    };
  }

  if (
    isEmployeeUser(user) &&
    isProjectManagementRoute(route) &&
    (await isCurrentEmployeeManager())
  ) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    };
  }

  const permission = getModulePermission(user, route);

  return {
    canView: readPermission(permission, "view"),
    canCreate: readPermission(permission, "create"),
    canEdit: readPermission(permission, "edit"),
    canDelete: readPermission(permission, "delete"),
  };
}

export async function getAllowedRoute(route: string) {
  const permissions = await getRoutePermissions(route);

  if (
    permissions.canView ||
    permissions.canCreate ||
    permissions.canEdit ||
    permissions.canDelete
  ) {
    return route;
  }

  return "";
}

export async function getAccessibleRoutes() {
  const user = await getUserPermissions();
  const session = await auth();

  if (isEmployerRole(session?.user?.role)) {
    return ["/dashboard", "/dashboard-design"];
  }

  if (!user) {
    return [];
  }

  if (isAdminUser(user)) {
    const routes = new Set(
      user.role?.roleModules.map((roleModule) => roleModule.module.route) || []
    );
    routes.add("/leave-requests");
    routes.add("/eod-reporting");
    routes.add("/dashboard-design");
    routes.add("/project-tracking");
    routes.add("/recruitment");
    return Array.from(routes);
  }

  if (isEmployeeUser(user)) {
    const routes = new Set(
      user.role?.roleModules
        .filter((roleModule) => {
          return (
            roleModule.canView ||
            roleModule.canCreate ||
            roleModule.canEdit ||
            roleModule.canDelete
          );
        })
        .map((roleModule) => roleModule.module.route) || []
    );

    routes.add("/employee-task-tracking");
    routes.add("/eod-reporting");
    routes.add("/attendance/my");
    routes.add("/leave-requests/my");
    routes.add("/employee-documents");

    if (await isCurrentEmployeeHr()) {
      routes.add("/recruitment");
    }

    if (await isCurrentEmployeeManager()) {
      routes.add("/projects");
      routes.add("/project-members");
      routes.add("/project-tracking");
    }

    return Array.from(routes);
  }

  if (canManageAllAttendance(user.role?.name)) {
    const routes = new Set(
      user.role?.roleModules
        .filter((roleModule) => {
          return (
            roleModule.canView ||
            roleModule.canCreate ||
            roleModule.canEdit ||
            roleModule.canDelete
          );
        })
        .map((roleModule) => roleModule.module.route) || []
    );

    routes.add("/leave-requests");
    routes.add("/dashboard-design");
    routes.add("/project-tracking");

    return Array.from(routes);
  }

  const routes = new Set(
    user.role?.roleModules
      .filter((roleModule) => {
        return (
          roleModule.canView ||
          roleModule.canCreate ||
          roleModule.canEdit ||
          roleModule.canDelete
        );
      })
      .map((roleModule) => roleModule.module.route) || []
  );

  routes.add("/dashboard-design");
  routes.add("/project-tracking");
  if (canManageAllAttendance(user.role?.name)) {
    routes.add("/eod-reporting");
  }

  return Array.from(routes);
}
