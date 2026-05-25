const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

const ADMIN_ID = "admin@formbuilder.dev";
const ADMIN_PASSWORD = "Admin@2026!";
const ADMIN_NAME = "FormBuilder Admin";
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || "7d";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

const sanitizeAdmin = () => ({
  id: 0,
  name: ADMIN_NAME,
  email: ADMIN_ID,
  role: "admin",
});

const signToken = () => {
  return jwt.sign(
    {
      sub: "admin",
      email: ADMIN_ID,
      name: ADMIN_NAME,
      role: "admin",
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
};

const mapSubmissionRow = (row, userMap) => ({
  id: Number(row.id),
  formId: Number(row.formId),
  formName: row.formName || `Form #${row.formId}`,
  submittedAt: row.submittedAt,
  versionNo: row.versionNo == null ? null : Number(row.versionNo),
  versionStatus: row.versionStatus || null,
  user: row.userId == null
    ? null
    : {
        id: Number(row.userId),
        name: row.userName || userMap.get(Number(row.userId))?.name || `User #${row.userId}`,
        email: row.userEmail || userMap.get(Number(row.userId))?.email || "",
      },
  valueCount: Number(row.valueCount || 0),
});

const login = async ({ adminId, password }) => {
  const safeAdminId = String(adminId || "").trim();
  const safePassword = String(password || "");

  if (safeAdminId !== ADMIN_ID || safePassword !== ADMIN_PASSWORD) {
    throw new Error("Invalid admin credentials");
  }

  return {
    token: signToken(),
    user: sanitizeAdmin(),
  };
};

const getOverview = async () => {
  const [forms, users, totalSubmissions, submissionRows] = await Promise.all([
    prisma.form.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            versions: true,
            submissions: true,
            fields: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    prisma.submission.count(),
    prisma.$queryRaw`
      SELECT
        s.id,
        s."formId",
        s."versionId",
        s."userId",
        s."submittedAt",
        f.name AS "formName",
        v."versionNo",
        v.status AS "versionStatus",
        u.name AS "userName",
        u.email AS "userEmail",
        COALESCE(COUNT(sv.id), 0) AS "valueCount"
      FROM "Submission" s
      LEFT JOIN "Form" f ON f.id = s."formId"
      LEFT JOIN "FormVersion" v ON v.id = s."versionId"
      LEFT JOIN "User" u ON u.id = s."userId"
      LEFT JOIN "SubmissionValue" sv ON sv."submissionId" = s.id
      GROUP BY
        s.id,
        s."formId",
        s."versionId",
        s."userId",
        s."submittedAt",
        f.name,
        v."versionNo",
        v.status,
        u.name,
        u.email
      ORDER BY s."submittedAt" DESC
    `,
  ]);

  const submissions = submissionRows.map((row) => ({
    id: Number(row.id),
    formId: Number(row.formId),
    submittedAt: new Date(row.submittedAt),
    userId: row.userId == null ? null : Number(row.userId),
  }));

  const recentSubmissions = submissionRows.slice(0, 12).map((row) => mapSubmissionRow(row, new Map(users.map((user) => [user.id, user]))));

  const formMap = new Map(forms.map((form) => [form.id, form]));
  const userMap = new Map(users.map((user) => [user.id, user]));
  const userCounts = new Map();

  for (const submission of submissions) {
    const key = submission.userId || 0;
    userCounts.set(key, (userCounts.get(key) || 0) + 1);
  }

  const byForm = submissions.reduce((acc, submission) => {
    const key = submission.formId;
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());

  const today = new Date();
  const submissionsByDay = [];

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const label = date.toISOString().slice(5, 10);

    const dayKey = date.toISOString().slice(0, 10);
    const count = submissions.filter(
      (item) => item.submittedAt.toISOString().slice(0, 10) === dayKey
    ).length;
    submissionsByDay.push({ label, count });
  }

  const topForms = Array.from(byForm.entries())
    .map(([formId, count]) => {
      const form = formMap.get(formId);
      return {
        id: formId,
        name: form?.name || `Form #${formId}`,
        submissions: count,
        fields: form?._count?.fields || 0,
        versions: form?._count?.versions || 0,
      };
    })
    .sort((a, b) => b.submissions - a.submissions)
    .slice(0, 8);

  const topUsers = Array.from(userCounts.entries())
    .map(([userId, count]) => ({
      id: userId === 0 ? null : userId,
      label:
        userId === 0
          ? "Anonymous"
          : userMap.get(userId)
            ? `${userMap.get(userId).name} (${userMap.get(userId).email})`
            : `User #${userId}`,
      submissions: count,
    }))
    .sort((a, b) => b.submissions - a.submissions)
    .slice(0, 8);

  const recent = recentSubmissions.map((submission) => ({
    id: submission.id,
    formId: submission.formId,
    formName: submission.formName,
    submittedAt: submission.submittedAt,
    versionNo: submission.versionNo,
    versionStatus: submission.versionStatus,
    user: submission.user,
    valueCount: submission.valueCount,
  }));

  return {
    totals: {
      forms: forms.length,
      submissions: totalSubmissions,
      users: users.length,
      linkedSubmissions: submissions.filter((item) => item.userId != null).length,
    },
    chart: {
      submissionsByDay,
      topForms,
      topUsers,
    },
    forms: forms.slice(0, 12).map((form) => ({
      id: form.id,
      name: form.name,
      createdAt: form.createdAt,
      submissions: form._count?.submissions || 0,
      versions: form._count?.versions || 0,
      fields: form._count?.fields || 0,
    })),
    recentSubmissions: recent,
  };
};

module.exports = {
  login,
  getOverview,
  ADMIN_ID,
  ADMIN_PASSWORD,
};