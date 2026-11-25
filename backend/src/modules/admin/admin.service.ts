import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { DbService, SQL_NOW_UTC } from "../../db/db.service";
import { newId } from "../../common/ids";
import type {
  AdminLoginInput,
  AdminStudentListQuery,
  BroadcastNotificationInput,
  UpdateStudentProfileAdminInput,
} from "./admin.schemas";

@Injectable()
export class AdminService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  async login(body: AdminLoginInput) {
    const cleanEmail = body.email.trim().toLowerCase();
    const cleanPassword = body.password;

    let user: any = null;
    try {
      const res = await this.db.queryOne<{ id: string; email: string; name: string; role: string; passwordHash: string }>(
        `SELECT "id", "email", "name", "role", "passwordHash"
         FROM "User"
         WHERE LOWER("email") = $1 AND "role" IN ('ADMIN', 'SUPER_ADMIN')
         LIMIT 1`,
        [cleanEmail]
      );
      if (res) {
        user = res;
      }
    } catch {
      // Proceed to fallback if table not queried
    }

    let isValid = false;
    if (user && user.passwordHash) {
      isValid = await bcrypt.compare(cleanPassword, user.passwordHash);
    }

    const envAdminEmail = (process.env.ADMIN_EMAIL || "admin@vidya.test").toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD || "AdminDemo1!";

    if (!isValid && cleanEmail === envAdminEmail && cleanPassword === envAdminPassword) {
      isValid = true;
      user = {
        id: "admin-root",
        email: envAdminEmail,
        name: "Academic Administrator",
        role: "ADMIN",
      };
    }

    if (!isValid) {
      throw new UnauthorizedException("Incorrect email or password. Please try again.");
    }

    const token = (process.env.ADMIN_TOKEN || "vidya-admin-secret").trim();

    return {
      token,
      user: {
        id: user.id || "admin-root",
        email: user.email,
        name: user.name || "Academic Administrator",
        role: user.role || "ADMIN",
      },
    };
  }

  async getMe() {
    const envAdminEmail = (process.env.ADMIN_EMAIL || "admin@vidya.test").toLowerCase();
    return {
      user: {
        id: "admin-root",
        email: envAdminEmail,
        name: "Academic Administrator",
        role: "ADMIN",
      },
    };
  }

  async getOverviewStats() {
    const [
      studentsCountRes,
      onboardedCountRes,
      materialsCountRes,
      complaintsCountRes,
      gradeDistributionRes,
      recentStudentsRes,
      recentMaterialsRes,
    ] = await Promise.all([
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM "User" WHERE "role" = 'STUDENT'`
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM "StudentProfile" WHERE "isOnboarded" = true`
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM study_materials`
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM contact_tickets WHERE "status" = 'open'`
      ),
      this.db.query<{ grade: number; count: string }>(
        `SELECT COALESCE("grade", 0) as grade, COUNT(*)::text as count
         FROM "StudentProfile"
         GROUP BY "grade"
         ORDER BY grade ASC`
      ),
      this.db.query<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        grade: number | null;
        section: string | null;
        schoolName: string | null;
        createdAt: Date;
      }>(
        `SELECT u."id", u."email", p."firstName", p."lastName", p."grade", p."section", p."schoolName", u."createdAt"
         FROM "User" u
         LEFT JOIN "StudentProfile" p ON p."userId" = u."id"
         WHERE u."role" = 'student'
         ORDER BY u."createdAt" DESC
         LIMIT 6`
      ),
      this.db.query<{
        id: string;
        title: string;
        classId: string;
        subjectId: string;
        byteSize: number;
        createdAt: Date;
      }>(
        `SELECT "id", "title", "class_id" as "classId", "subject_id" as "subjectId", "byte_size" as "byteSize", "created_at" as "createdAt"
         FROM study_materials
         ORDER BY "created_at" DESC
         LIMIT 6`
      ),
    ]);

    return {
      totalStudents: parseInt(studentsCountRes?.count || "0", 10),
      onboardedStudents: parseInt(onboardedCountRes?.count || "0", 10),
      totalStudyMaterials: parseInt(materialsCountRes?.count || "0", 10),
      openComplaints: parseInt(complaintsCountRes?.count || "0", 10),
      gradeDistribution: gradeDistributionRes.rows.map((r) => ({
        grade: r.grade,
        count: parseInt(r.count, 10),
      })),
      recentStudents: recentStudentsRes.rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: [r.firstName, r.lastName].filter(Boolean).join(" ") || "Student",
        grade: r.grade,
        section: r.section,
        schoolName: r.schoolName,
        createdAt: r.createdAt.toISOString(),
      })),
      recentMaterials: recentMaterialsRes.rows.map((r) => ({
        id: r.id,
        title: r.title,
        classId: r.classId,
        subjectId: r.subjectId,
        byteSize: r.byteSize,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async broadcastNotification(input: BroadcastNotificationInput) {
    let targetUserIds: string[] = [];

    if (input.target === "student" && input.targetValue) {
      targetUserIds = [input.targetValue];
    } else if (input.target === "grade" && input.targetValue) {
      const gradeNum = parseInt(input.targetValue, 10);
      const { rows } = await this.db.query<{ userId: string }>(
        `SELECT "userId" FROM "StudentProfile" WHERE "grade" = $1`,
        [gradeNum]
      );
      targetUserIds = rows.map((r) => r.userId);
    } else {
      // All students
      const { rows } = await this.db.query<{ id: string }>(
        `SELECT "id" FROM "User" WHERE "role" = 'student'`
      );
      targetUserIds = rows.map((r) => r.id);
    }

    if (targetUserIds.length === 0) {
      return {
        success: true,
        deliveredCount: 0,
        message: "No matching students found for the target selection.",
      };
    }

    const batchId = newId();
    for (const userId of targetUserIds) {
      const notifId = `notif-${batchId}-${userId.slice(0, 8)}`;
      await this.db.query(
        `INSERT INTO "Notification"
           ("id", "userId", "title", "message", "detailedBody", "type", "icon",
            "actionRoute", "actionLabel", "readAt")
         VALUES ($1, $2, $3, $4, $5, $6::"NotificationType", $7, $8, $9, NULL)
         ON CONFLICT ("id") DO NOTHING`,
        [
          notifId,
          userId,
          input.title,
          input.message,
          input.detailedBody || input.message,
          input.type,
          input.icon || "campaign",
          input.actionRoute || null,
          input.actionLabel || null,
        ]
      );
    }

    return {
      success: true,
      batchId,
      deliveredCount: targetUserIds.length,
      target: input.target,
      title: input.title,
    };
  }

  async listBroadcastNotifications() {
    const { rows } = await this.db.query<{
      title: string;
      message: string;
      type: string;
      icon: string;
      actionRoute: string | null;
      actionLabel: string | null;
      recipientCount: string;
      readCount: string;
      latestSentAt: Date;
    }>(
      `SELECT "title", "message", "type", "icon", "actionRoute", "actionLabel",
              COUNT(*)::text as "recipientCount",
              COUNT("readAt")::text as "readCount",
              MAX("createdAt") as "latestSentAt"
       FROM "Notification"
       GROUP BY "title", "message", "type", "icon", "actionRoute", "actionLabel"
       ORDER BY "latestSentAt" DESC
       LIMIT 50`
    );

    return rows.map((r) => ({
      title: r.title,
      message: r.message,
      type: r.type,
      icon: r.icon,
      actionRoute: r.actionRoute,
      actionLabel: r.actionLabel,
      recipientCount: parseInt(r.recipientCount, 10),
      readCount: parseInt(r.readCount, 10),
      sentAt: r.latestSentAt.toISOString(),
    }));
  }

  async deleteNotificationByTitle(title: string) {
    const { rowCount } = await this.db.query(
      `DELETE FROM "Notification" WHERE "title" = $1`,
      [title]
    );
    return { success: true, deletedCount: rowCount };
  }

  async listStudents(query: AdminStudentListQuery) {
    const offset = (query.page - 1) * query.limit;
    const params: unknown[] = [];
    const conditions: string[] = [`u."role" = 'student'`];

    if (query.search) {
      params.push(`%${query.search.toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(LOWER(u."email") LIKE $${idx} OR LOWER(COALESCE(p."firstName", '')) LIKE $${idx} OR LOWER(COALESCE(p."lastName", '')) LIKE $${idx} OR LOWER(COALESCE(p."rollNumber", '')) LIKE $${idx} OR LOWER(COALESCE(p."schoolName", '')) LIKE $${idx})`
      );
    }

    if (query.grade !== undefined) {
      params.push(query.grade);
      conditions.push(`p."grade" = $${params.length}`);
    }

    if (query.section) {
      params.push(query.section.toUpperCase());
      conditions.push(`p."section" = $${params.length}`);
    }

    if (query.isOnboarded !== undefined) {
      params.push(query.isOnboarded);
      conditions.push(`p."isOnboarded" = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countRes = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count
       FROM "User" u
       LEFT JOIN "StudentProfile" p ON p."userId" = u."id"
       ${whereClause}`,
      params
    );

    const total = parseInt(countRes?.count || "0", 10);

    const listParams = [...params, query.limit, offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const { rows } = await this.db.query<{
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      gender: string | null;
      dob: string | null;
      grade: number | null;
      section: string | null;
      schoolName: string | null;
      rollNumber: string | null;
      medium: string | null;
      district: string | null;
      villageCity: string | null;
      isOnboarded: boolean | null;
      createdAt: Date;
      completedChaptersCount: string | null;
      bookmarksCount: string | null;
    }>(
      `SELECT u."id", u."email", u."createdAt",
              p."firstName", p."lastName", p."gender", p."dob",
              p."grade", p."section", p."schoolName", p."rollNumber",
              p."medium", p."district", p."villageCity", p."isOnboarded",
              (SELECT COUNT(*)::text FROM "ChapterProgress" cp WHERE cp."userId" = u."id" AND cp."completed" = true) as "completedChaptersCount",
              (SELECT COUNT(*)::text FROM "Bookmark" b WHERE b."userId" = u."id") as "bookmarksCount"
       FROM "User" u
       LEFT JOIN "StudentProfile" p ON p."userId" = u."id"
       ${whereClause}
       ORDER BY u."createdAt" DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );

    return {
      items: rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: [r.firstName, r.lastName].filter(Boolean).join(" ") || "Student",
        firstName: r.firstName,
        lastName: r.lastName,
        gender: r.gender,
        dob: r.dob,
        grade: r.grade,
        section: r.section,
        schoolName: r.schoolName,
        rollNumber: r.rollNumber,
        medium: r.medium,
        district: r.district,
        villageCity: r.villageCity,
        isOnboarded: Boolean(r.isOnboarded),
        createdAt: r.createdAt.toISOString(),
        completedChaptersCount: parseInt(r.completedChaptersCount || "0", 10),
        bookmarksCount: parseInt(r.bookmarksCount || "0", 10),
      })),
      total,
      page: query.page,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async getStudentDetails(userId: string) {
    const user = await this.db.queryOne<{
      id: string;
      email: string;
      role: string;
      createdAt: Date;
    }>(`SELECT "id", "email", "role", "createdAt" FROM "User" WHERE "id" = $1`, [
      userId,
    ]);

    if (!user) throw new NotFoundException({ error: "Student not found" });

    const profile = await this.db.queryOne<any>(
      `SELECT * FROM "StudentProfile" WHERE "userId" = $1`,
      [userId]
    );

    const progressRows = await this.db.query<{
      chapterId: string;
      subjectId: string | null;
      classId: string | null;
      progressPercent: number;
      completed: boolean;
      updatedAt: Date;
    }>(
      `SELECT "chapterId", "subjectId", "classId", "progressPercent", "completed", "updatedAt"
       FROM "ChapterProgress"
       WHERE "userId" = $1
       ORDER BY "updatedAt" DESC`,
      [userId]
    );

    const bookmarksRows = await this.db.query<{
      id: string;
      title: string;
      subtitle: string | null;
      type: string;
      createdAt: Date;
    }>(
      `SELECT "id", "title", "subtitle", "type", "createdAt"
       FROM "Bookmark"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      [userId]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
      profile: profile
        ? {
            ...profile,
            name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
          }
        : null,
      progress: progressRows.rows.map((p) => ({
        chapterId: p.chapterId,
        subjectId: p.subjectId,
        classId: p.classId,
        progressPercent: p.progressPercent,
        completed: p.completed,
        updatedAt: p.updatedAt.toISOString(),
      })),
      bookmarks: bookmarksRows.rows.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        type: b.type,
        createdAt: b.createdAt.toISOString(),
      })),
    };
  }

  async updateStudentProfile(userId: string, input: UpdateStudentProfileAdminInput) {
    const existing = await this.db.queryOne(
      `SELECT "id" FROM "User" WHERE "id" = $1`,
      [userId]
    );
    if (!existing) throw new NotFoundException({ error: "Student not found" });

    const fields: string[] = [];
    const values: unknown[] = [];

    const allowed: Array<keyof UpdateStudentProfileAdminInput> = [
      "firstName",
      "lastName",
      "grade",
      "section",
      "schoolName",
      "rollNumber",
      "medium",
      "district",
      "villageCity",
      "fatherName",
      "isOnboarded",
    ];

    for (const key of allowed) {
      if (input[key] !== undefined) {
        values.push(input[key]);
        fields.push(`"${key}" = $${values.length}`);
      }
    }

    if (fields.length > 0) {
      values.push(userId);
      await this.db.query(
        `UPDATE "StudentProfile"
         SET ${fields.join(", ")}, "updatedAt" = ${SQL_NOW_UTC}
         WHERE "userId" = $${values.length}`,
        values
      );
    }

    return this.getStudentDetails(userId);
  }

  async deleteStudent(userId: string) {
    const { rowCount } = await this.db.query(
      `DELETE FROM "User" WHERE "id" = $1 AND "role" = 'student'`,
      [userId]
    );
    if (rowCount === 0) throw new NotFoundException({ error: "Student not found" });
    return { success: true };
  }
}
