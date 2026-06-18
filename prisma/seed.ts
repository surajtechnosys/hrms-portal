import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { Status, ExperienceType, MovementType } from "@prisma/client";

async function main() {
  console.log("🌱 Seeding started...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const employeePassword = await bcrypt.hash("employee123", 10);
  const employerPassword = await bcrypt.hash("employer123", 10);

  /* ---------------- ROLES ---------------- */
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      remark: "System Administrator",
      status: Status.ACTIVE,
    },
  });

  const hrRole = await prisma.role.upsert({
    where: { name: "HR" },
    update: {},
    create: {
      name: "HR",
      remark: "Human Resource Manager",
      status: Status.ACTIVE,
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: "Employee" },
    update: {},
    create: {
      name: "Employee",
      remark: "Normal Employee",
      status: Status.ACTIVE,
    },
  });

  /* ---------------- MODULES ---------------- */
  const modules = [
    { name: "Dashboard", description: "Dashboard Module", route: "/dashboard" },
    { name: "User", description: "Users Module", route: "/users" },
    { name: "Role", description: "Roles Module", route: "/roles" },
    { name: "Module", description: "Module Setup", route: "/module" },
    {
      name: "Employee Profiles",
      description: "Employee Profiles Module",
      route: "/employee-profiles",
    },
    {
      name: "Department",
      description: "Department Module",
      route: "/department",
    },
    {
      name: "Job Roles",
      description: "Job Role Module",
      route: "/job-roles",
    },
    {
      name: "Work Location",
      description: "Work Location Module",
      route: "/work-location",
    },
    {
      name: "Applicant Documents",
      description: "Applicant Documents Module",
      route: "/employee-documents",
    },
    {
      name: "Transfer Promotion",
      description: "Transfer Promotion Module",
      route: "/transfer-promotion",
    },
    {
      name: "Attendance",
      description: "Attendance Management Module",
      route: "/attendance",
    },
    {
      name: "Leave Requests",
      description: "Leave Request Management Module",
      route: "/leave-requests",
    },
    {
      name: "EOD Reporting",
      description: "End of Day Reporting and Payroll Review Module",
      route: "/eod-reporting",
    },
    {
      name: "Project Creation",
      description: "Project Creation Module",
      route: "/projects",
    },
    {
      name: "Project Members",
      description: "Project Members Module",
      route: "/project-members",
    },

    { name: "Employer", description: "Employer Module", route: "/employers" },
    { name: "Company", description: "Company Module", route: "/companies" },

    {
      name: "Configuration",
      description: "Configuration Module",
      route: "/configuration",
    },
  ];

  const createdModules = [];

  for (const item of modules) {
    const existing = await prisma.module.findFirst({
      where: {
        OR: [{ name: item.name }, { route: item.route }],
      },
    });

    let mod;

    if (existing) {
      mod = await prisma.module.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.description,
          route: item.route,
          status: Status.ACTIVE,
        },
      });
    } else {
      mod = await prisma.module.create({
        data: {
          ...item,
          status: Status.ACTIVE,
        },
      });
    }

    createdModules.push(mod);
  }

  /* ---------------- ROLE MODULE ---------------- */
  for (const mod of createdModules) {
    await prisma.roleModule.upsert({
      where: {
        roleId_moduleId: {
          roleId: adminRole.id,
          moduleId: mod.id,
        },
      },
      update: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
      create: {
        roleId: adminRole.id,
        moduleId: mod.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    });

    await prisma.roleModule.upsert({
      where: {
        roleId_moduleId: {
          roleId: hrRole.id,
          moduleId: mod.id,
        },
      },
      update: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
      },
      create: {
        roleId: hrRole.id,
        moduleId: mod.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
      },
    });

    await prisma.roleModule.upsert({
      where: {
        roleId_moduleId: {
          roleId: employeeRole.id,
          moduleId: mod.id,
        },
      },
      update: {
        canView:
          mod.route === "/attendance" ||
          mod.route === "/leave-requests" ||
          mod.route === "/eod-reporting",
        canCreate:
          mod.route === "/attendance" ||
          mod.route === "/leave-requests" ||
          mod.route === "/eod-reporting",
        canEdit: mod.route === "/attendance" || mod.route === "/eod-reporting",
        canDelete: false,
      },
      create: {
        roleId: employeeRole.id,
        moduleId: mod.id,
        canView:
          mod.route === "/attendance" ||
          mod.route === "/leave-requests" ||
          mod.route === "/eod-reporting",
        canCreate:
          mod.route === "/attendance" ||
          mod.route === "/leave-requests" ||
          mod.route === "/eod-reporting",
        canEdit: mod.route === "/attendance" || mod.route === "/eod-reporting",
        canDelete: false,
      },
    });
  }

  /* ---------------- USERS ---------------- */
  await prisma.user.upsert({
    where: { email: "admin@hrms.com" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      firstName: "Super",
      lastName: "Admin",
      email: "admin@hrms.com",
      roleId: adminRole.id,
      status: Status.ACTIVE,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "employee@hrms.com" },
    update: {},
    create: {
      username: "employee1",
      password: employeePassword,
      firstName: "Rahul",
      lastName: "Sharma",
      email: "employee@hrms.com",
      roleId: employeeRole.id,
      status: Status.ACTIVE,
    },
  });

  /* ---------------- COMPANY ---------------- */
  const company = await prisma.company.upsert({
    where: { companyCode: "CMP001" },
    update: {},
    create: {
      companyName: "SY Associates",
      companyCode: "CMP001",
      email: "contact@syassociates.com",
      phone: "9810012345",
      website: "https://syassociates.com",
      address: "Noida, India",
      status: Status.ACTIVE,
    },
  });

  /* ---------------- EMPLOYER ---------------- */
  await prisma.employer.upsert({
    where: { email: "employer@hrms.com" },
    update: {},
    create: {
      companyId: company.id,
      employerName: "Amit Verma",
      employerCode: "EMPR001",
      email: "employer@hrms.com",
      phone: "9898989898",
      password: employerPassword,
      designation: "Hiring Manager",
      address: "Noida, India",
      status: Status.ACTIVE,
    },
  });

  /* ---------------- DEPARTMENT ---------------- */
  const itDept = await prisma.department.upsert({
    where: { code: "IT001" },
    update: {},
    create: {
      name: "IT",
      code: "IT001",
      description: "Information Technology",
      status: Status.ACTIVE,
    },
  });

  await prisma.department.upsert({
    where: { code: "HR001" },
    update: {},
    create: {
      name: "HR",
      code: "HR001",
      description: "Human Resources",
      status: Status.ACTIVE,
    },
  });

  /* ---------------- JOB ROLE ---------------- */
  const developer = await prisma.jobRole.upsert({
    where: { code: "DEV001" },
    update: {},
    create: {
      name: "Software Developer",
      code: "DEV001",
      description: "Develops software systems",
      status: Status.ACTIVE,
    },
  });

  await prisma.jobRole.upsert({
    where: { code: "MGR001" },
    update: {},
    create: {
      name: "HR Manager",
      code: "MGR001",
      description: "Handles HR operations",
      status: Status.ACTIVE,
    },
  });

  /* ---------------- WORK LOCATION ---------------- */
  const delhiOffice = await prisma.workLocation.upsert({
    where: { code: "DEL001" },
    update: {},
    create: {
      name: "Delhi Office",
      code: "DEL001",
      address: "Connaught Place",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      postalCode: "110001",
      status: Status.ACTIVE,
    },
  });

  const noidaOffice = await prisma.workLocation.upsert({
    where: { code: "NOI001" },
    update: {},
    create: {
      name: "Noida Office",
      code: "NOI001",
      address: "Sector 62",
      city: "Noida",
      state: "Uttar Pradesh",
      country: "India",
      postalCode: "201309",
      status: Status.ACTIVE,
    },
  });

  /* ---------------- EMPLOYEE PROFILE ---------------- */
  const employeeProfile = await prisma.employeeProfile.upsert({
    where: { employeeCode: "EMP001" },
    update: {},
    create: {
      employeeName: "Rahul Sharma",
      employeeCode: "EMP001",
      email: employeeUser.email,
      companyId: company.id,
      phone: "9876543210",
      alternatePhone: "9876500000",
      gender: "Male",
      dateOfBirth: new Date("2000-01-01"),
      joiningDate: new Date(),
      departmentId: itDept.id,
      jobRoleId: developer.id,
      workLocationId: delhiOffice.id,
      address: "Delhi, India",
      emergencyContactName: "Ramesh Sharma",
      emergencyContactPhone: "9999999999",
      status: Status.ACTIVE,
    },
  });

  /* ---------------- EMPLOYEE DOCUMENT ---------------- */
  const existingDoc = await prisma.applicantDocument.findFirst({
    where: { employeeId: employeeProfile.id },
  });

  if (!existingDoc) {
    await prisma.applicantDocument.create({
      data: {
        employeeId: employeeProfile.id,
        employeeCode: employeeProfile.employeeCode,
        aadhaarNumber: "123412341234",
        aadhaarFileUrl: "/uploads/aadhaar.pdf",
        panNumber: "ABCDE1234F",
        panFileUrl: "/uploads/pan.pdf",
        educationEntries: [
          {
            degree: "B.Tech",
            college: "Delhi University",
            year: "2022",
            marks: 78,
            marksheetFileUrl: "/uploads/marksheet.pdf",
          },
        ],
        experienceType: ExperienceType.FRESHER,
        experienceEntries: [],
        status: Status.ACTIVE,
      },
    });
  }

  /* ---------------- TRANSFER PROMOTION ---------------- */
  const existingTransfer = await prisma.transferPromotion.findFirst({
    where: {
      employeeId: employeeProfile.id,
      movementType: MovementType.TRANSFER,
    },
  });

  if (!existingTransfer) {
    await prisma.transferPromotion.create({
      data: {
        employeeId: employeeProfile.id,
        movementType: MovementType.TRANSFER,
        fromLocationId: delhiOffice.id,
        toLocationId: noidaOffice.id,
        currentDesignation: "Software Developer",
        newDesignation: "Senior Software Developer",
        effectiveDate: new Date(),
        reason: "Project Requirement",
        status: Status.ACTIVE,
      },
    });
  }

  /* ---------------- CONFIGURATION ---------------- */
  const config = await prisma.configuration.findFirst();

  if (!config) {
    await prisma.configuration.create({
      data: {
        name: "SY Associates",
        email: "admin@syassociates.com",
        password: "test123",
        logo: "/uploads/default-logo.png",
        favicon: "/uploads/default-favicon.png",
      },
    });
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
