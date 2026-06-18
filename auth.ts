/* eslint-disable @typescript-eslint/no-explicit-any */
import * as NextAuthModule from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

const NextAuth = (NextAuthModule as any).default ?? NextAuthModule;

type RecruitmentApplicantAuthRecord = {
  id?: string;
  candidateName?: string;
  email?: string;
  applicantPortalId?: string;
  applicantUsername?: string;
  applicantPasswordHash?: string;
  applicantPortalEnabled?: boolean;
  status?: string;
};

async function readRecruitmentApplicantsForAuth(): Promise<
  RecruitmentApplicantAuthRecord[]
> {
  try {
    const recruitmentClient = prisma as any;
    const records = (await recruitmentClient.recruitmentApplication.findMany({
      select: {
        id: true,
        candidateName: true,
        email: true,
        applicantPortalId: true,
        applicantUsername: true,
        applicantPasswordHash: true,
        applicantPortalEnabled: true,
        status: true,
      },
    })) as RecruitmentApplicantAuthRecord[];

    return records.map((record: RecruitmentApplicantAuthRecord) => ({
      ...record,
      email: record.email ?? undefined,
      applicantPortalId: record.applicantPortalId ?? undefined,
      applicantUsername: record.applicantUsername ?? undefined,
      applicantPasswordHash: record.applicantPasswordHash ?? undefined,
      status: record.status ?? undefined,
    }));
  } catch {
    return [];
  }
}

async function authorizeCredentials(username: string, password: string) {
  const identifier = username.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
      status: "ACTIVE",
    },
    include: {
      role: true,
    },
  });

  if (user?.password) {
    const isMatched = await bcrypt.compare(password, user.password);

    if (isMatched) {
      return {
        id: user.id,
        username: user.username ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        role: user.role?.name ?? "USER",
        accountType: "user",
      };
    }
  }

  const employee = await prisma.employeeProfile.findFirst({
    where: {
      email: identifier,
      status: "ACTIVE",
    },
    include: {
      jobRole: {
        select: {
          name: true,
        },
      },
    },
  });

  if (employee?.password) {
    const isMatched = await bcrypt.compare(password, employee.password);

    if (isMatched) {
      const [firstName = "", ...rest] = employee.employeeName
        .trim()
        .split(/\s+/);

      return {
        id: employee.id,
        username: employee.employeeCode ?? employee.email ?? "",
        firstName,
        lastName: rest.join(" "),
        email: employee.email ?? "",
        role: "employee",
        accountType: "employee",
        jobRole: employee.jobRole?.name ?? "",
      };
    }
  }

  const employer = await prisma.employer.findFirst({
    where: {
      email: identifier,
      status: "ACTIVE",
    },
  });

  if (employer?.password) {
    const isMatched = await bcrypt.compare(password, employer.password);

    if (isMatched) {
      const [firstName = "", ...rest] = employer.employerName
        .trim()
        .split(/\s+/);

      return {
        id: employer.id,
        username: employer.employerCode ?? employer.email ?? "",
        firstName,
        lastName: rest.join(" "),
        email: employer.email ?? "",
        role: "employer",
        accountType: "employer",
      };
    }
  }

  const applicants = await readRecruitmentApplicantsForAuth();
  const applicant = applicants.find((record) => {
    const normalizedIdentifier = identifier.toLowerCase();

    return (
      record.status === "ACTIVE" &&
      record.applicantPortalEnabled &&
      !!record.applicantPasswordHash &&
      [
        record.applicantUsername,
        record.applicantPortalId,
        record.email,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase() === normalizedIdentifier)
    );
  });

  if (applicant?.applicantPasswordHash) {
    const isMatched = await bcrypt.compare(
      password,
      applicant.applicantPasswordHash,
    );

    if (isMatched) {
      const [firstName = "", ...rest] = (applicant.candidateName || "Applicant")
        .trim()
        .split(/\s+/);

      return {
        id: applicant.id ?? "",
        username: applicant.applicantUsername ?? applicant.applicantPortalId ?? "",
        firstName,
        lastName: rest.join(" "),
        email: applicant.email ?? "",
        role: "applicant",
        accountType: "applicant",
      };
    }
  }

  return null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  pages: {
    signIn: "/",
    error: "/",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  adapter: PrismaAdapter(prisma) as any,

  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials) return null;
        return authorizeCredentials(
          credentials.username as string,
          credentials.password as string
        );
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
        token.role = user.role;
        token.accountType = user.accountType;
        token.jobRole = user.jobRole;
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.name =
          `${token.firstName ?? ""} ${token.lastName ?? ""}`.trim();
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.accountType = token.accountType;
        session.user.jobRole = token.jobRole;
      }

      return session;
    },
  },
});
