import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { open, rename, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { newId } from "../../common/ids";
import { clientQuery, DbService, SQL_NOW_UTC } from "../../db/db.service";
import { doubtsDir, UPLOADS_URL_PREFIX } from "../../common/uploads";
import type {
  AssignmentStatus,
  CreateAssignmentInput,
  CreateDoubtInput,
  DoubtStatus,
  RecordSessionInput,
} from "./learning.schemas";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type UploadFile = {
  mimetype: string;
  filename: string;
  file: Readable & { truncated?: boolean };
};

type BadgeRow = {
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earnedAt: Date | string | null;
};

type DoubtRow = {
  id: string;
  userId: string;
  classId: string | null;
  subjectId: string | null;
  chapterId: string | null;
  sectionId: string | null;
  question: string;
  details: string;
  photoUrl: string | null;
  status: DoubtStatus;
  teacherNote: string;
  escalatedAt: Date | string | null;
  answeredAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  studentName?: string;
  studentEmail?: string;
  subjectName?: string;
};

type AssignmentRow = {
  id: string;
  title: string;
  description: string;
  classId: string | null;
  subjectId: string | null;
  chapterId: string | null;
  dueAt: Date | string;
  status: AssignmentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  subjectName?: string | null;
  className?: string | null;
  submissionStatus?: string | null;
  submissionNote?: string | null;
  submittedAt?: Date | string | null;
};

type TaskRow = AssignmentRow & {
  submissionId: string | null;
  score: number | null;
  feedback: string | null;
};

const DOUBT_COLUMNS = `
  d."id", d."user_id" AS "userId", d."class_id" AS "classId",
  d."subject_id" AS "subjectId", d."chapter_id" AS "chapterId",
  d."section_id" AS "sectionId", d."question", d."details",
  d."photo_url" AS "photoUrl", d."status", d."teacher_note" AS "teacherNote",
  d."escalated_at" AS "escalatedAt", d."answered_at" AS "answeredAt",
  d."created_at" AS "createdAt", d."updated_at" AS "updatedAt"`;

/** `INSERT/UPDATE ... RETURNING` cannot use the `d` alias from a SELECT join. */
const DOUBT_RETURN_COLUMNS = `
  "id", "user_id" AS "userId", "class_id" AS "classId",
  "subject_id" AS "subjectId", "chapter_id" AS "chapterId",
  "section_id" AS "sectionId", "question", "details",
  "photo_url" AS "photoUrl", "status", "teacher_note" AS "teacherNote",
  "escalated_at" AS "escalatedAt", "answered_at" AS "answeredAt",
  "created_at" AS "createdAt", "updated_at" AS "updatedAt"`;

const ADMIN_DOUBT_SELECT = `
  SELECT ${DOUBT_COLUMNS}, u."name" AS "studentName", u."email" AS "studentEmail",
         s."name" AS "subjectName"
    FROM learning_doubts d
    JOIN "User" u ON u."id" = d."user_id"
    LEFT JOIN "Subject" s ON s."id" = d."subject_id"`;

const ASSIGNMENT_COLUMNS = `
  a."id", a."title", a."description", a."class_id" AS "classId",
  a."subject_id" AS "subjectId", a."chapter_id" AS "chapterId",
  a."due_at" AS "dueAt", a."status",
  a."created_at" AS "createdAt", a."updated_at" AS "updatedAt",
  s."name" AS "subjectName", sc."title" AS "className"`;

/** `INSERT/UPDATE ... RETURNING` has no `a` alias or joined subject/class rows. */
const ASSIGNMENT_RETURN_COLUMNS = `
  "id", "title", "description", "class_id" AS "classId",
  "subject_id" AS "subjectId", "chapter_id" AS "chapterId",
  "due_at" AS "dueAt", "status",
  "created_at" AS "createdAt", "updated_at" AS "updatedAt"`;

const toIso = (value: Date | string | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null;

const toDoubtDto = (row: DoubtRow) => ({
  id: row.id,
  question: row.question,
  details: row.details,
  status: row.status,
  photoUrl: row.photoUrl,
  classId: row.classId,
  subjectId: row.subjectId,
  chapterId: row.chapterId,
  sectionId: row.sectionId,
  teacherNote: row.teacherNote,
  escalatedAt: toIso(row.escalatedAt),
  answeredAt: toIso(row.answeredAt),
  createdAt: toIso(row.createdAt),
  updatedAt: toIso(row.updatedAt),
  studentName: row.studentName,
  studentEmail: row.studentEmail,
  subjectName: row.subjectName,
});

const toBadgeDto = (row: BadgeRow) => ({
  code: row.code,
  name: row.name,
  description: row.description,
  icon: row.icon,
  points: row.points,
  earnedAt: toIso(row.earnedAt),
});

const mondayOf = (date = new Date()): string => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const isoDay = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - isoDay + 1);
  return d.toISOString().slice(0, 10);
};

const imageSignatureMatches = (head: Buffer, ext: string): boolean => {
  if (ext === "jpg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (ext === "png") return head[0] === 0x89 && head.subarray(1, 4).toString("ascii") === "PNG";
  if (ext === "webp") {
    return (
      head.subarray(0, 4).toString("ascii") === "RIFF" &&
      head.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
};

/** Exported for unit tests: validates the declared MIME type of a doubt photo. */
export const assertDoubtPhotoMime = (mimetype: string): string => {
  const ext = PHOTO_EXT[mimetype.toLowerCase().split(";")[0]!.trim()];
  if (!ext) {
    throw new UnsupportedMediaTypeException({
      error: "Photo must be a JPEG, PNG or WebP image",
    });
  }
  return ext;
};

@Injectable()
export class LearningService {
  constructor(@Inject(DbService) private readonly db: DbService) {}

  private async activeClassId(userId: string): Promise<string | null> {
    const row = await this.db.queryOne<{ activeClassId: string | null }>(
      `SELECT "activeClassId" FROM "StudentProfile" WHERE "userId" = $1`,
      [userId]
    );
    return row?.activeClassId ?? null;
  }

  private async awardBadge(userId: string, code: string): Promise<boolean> {
    const row = await this.db.queryOne<{ code: string }>(
      `INSERT INTO learning_student_badges ("user_id", "badge_code")
       VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING "badge_code" AS "code"`,
      [userId, code]
    );
    if (!row) return false;

    const badge = await this.db.queryOne<{ points: number }>(
      `SELECT "points" FROM learning_badges WHERE "code" = $1`,
      [code]
    );
    if (badge?.points) {
      await this.db.query(
        `INSERT INTO learning_xp_events ("id", "user_id", "points", "reason")
         VALUES ($1, $2, $3, $4)`,
        [newId(), userId, badge.points, `Badge: ${code}`]
      );
    }
    return true;
  }

  async getGamification(userId: string) {
    const [{ rows: xpRows }, { rows: badgeRows }, goal, profile] = await Promise.all([
      this.db.query<{ points: number }>(
        `SELECT COALESCE(SUM("points"), 0)::int AS "points" FROM learning_xp_events WHERE "user_id" = $1`,
        [userId]
      ),
      this.db.query<BadgeRow>(
        `SELECT b."code", b."name", b."description", b."icon", b."points", sb."earned_at" AS "earnedAt"
           FROM learning_student_badges sb
           JOIN learning_badges b ON b."code" = sb."badge_code"
          WHERE sb."user_id" = $1
          ORDER BY sb."earned_at" DESC`,
        [userId]
      ),
      this.db.queryOne<{
        weekStart: string;
        targetMinutes: number;
        progressMinutes: number;
      }>(
        `SELECT "week_start" AS "weekStart", "target_minutes" AS "targetMinutes",
                "progress_minutes" AS "progressMinutes"
           FROM learning_weekly_goals WHERE "user_id" = $1`,
        [userId]
      ),
      this.db.queryOne<{ streakDays: number; studyGoalMinutes: number | null }>(
        `SELECT "streakDays", "studyGoalMinutes" FROM "StudentProfile" WHERE "userId" = $1`,
        [userId]
      ),
    ]);

    const xp = xpRows[0]?.points ?? 0;
    const level = Math.floor(xp / 100) + 1;
    const target = goal?.targetMinutes ?? Math.max(60, (profile?.studyGoalMinutes ?? 30) * 5);
    const progress = goal?.progressMinutes ?? 0;

    return {
      streakDays: profile?.streakDays ?? 0,
      xp,
      level,
      xpToNextLevel: level * 100 - xp,
      badges: badgeRows.map(toBadgeDto),
      weeklyGoal: {
        weekStart: goal?.weekStart ?? mondayOf(),
        targetMinutes: target,
        progressMinutes: progress,
        percent: Math.min(100, Math.round((progress / Math.max(1, target)) * 100)),
        completed: progress >= target,
      },
    };
  }

  async getOverview(userId: string) {
    const [gamification, tasks, doubts, glossary] = await Promise.all([
      this.getGamification(userId),
      this.listTasks(userId),
      this.listDoubts(userId),
      this.listGlossary(),
    ]);
    return { gamification, tasks, doubts, glossary };
  }

  async listGlossary(search?: string) {
    const term = search?.trim();
    const { rows } = await this.db.query<{
      term: string;
      english: string;
      hindi: string;
      pronunciation: string;
      category: string;
    }>(
      `SELECT "term", "english", "hindi", "pronunciation", "category"
         FROM learning_glossary
        WHERE $1::text IS NULL OR "term" ILIKE $2 OR "english" ILIKE $2 OR "hindi" ILIKE $2
        ORDER BY "category", "term"`,
      [term || null, `%${term?.replace(/[\\%_]/g, "") ?? ""}%`]
    );
    return rows;
  }

  private async savePhoto(upload: UploadFile | undefined): Promise<string | null> {
    if (!upload) return null;
    const ext = assertDoubtPhotoMime(upload.mimetype);
    const filename = `${randomUUID()}.${ext}`;
    const finalPath = join(doubtsDir(), filename);
    const tempPath = `${finalPath}.tmp`;

    try {
      await pipeline(upload.file, createWriteStream(tempPath, { flags: "wx" }));
      if (upload.file.truncated || (await stat(tempPath)).size > MAX_PHOTO_BYTES) {
        throw new PayloadTooLargeException({ error: "Photo is too large (max 5 MB)" });
      }
      const handle = await open(tempPath, "r");
      const head = Buffer.alloc(12);
      try {
        const { bytesRead } = await handle.read(head, 0, 12, 0);
        if (bytesRead < 4 || !imageSignatureMatches(head, ext)) {
          throw new UnsupportedMediaTypeException({
            error: "Photo content does not match the declared image type",
          });
        }
      } finally {
        await handle.close();
      }
      await rename(tempPath, finalPath);
      return `${UPLOADS_URL_PREFIX}/doubts/${filename}`;
    } catch (error) {
      await unlink(tempPath).catch(() => undefined);
      throw error;
    }
  }

  async createDoubt(userId: string, input: CreateDoubtInput, upload?: UploadFile) {
    const photoUrl = await this.savePhoto(upload);
    try {
      const row = await this.db.queryOne<DoubtRow>(
        `INSERT INTO learning_doubts
           ("id", "user_id", "class_id", "subject_id", "chapter_id", "section_id",
            "question", "details", "photo_url", "status", "escalated_at")
         VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''),
                 $7, $8, $9, $10, CASE WHEN $10 = 'escalated' THEN ${SQL_NOW_UTC} ELSE NULL END)
         RETURNING ${DOUBT_RETURN_COLUMNS}`,
        [
          newId(),
          userId,
          input.classId || null,
          input.subjectId || null,
          input.chapterId || null,
          input.sectionId || null,
          input.question,
          input.details || "",
          photoUrl,
          input.escalate ? "escalated" : "open",
        ]
      );
      await this.awardBadge(userId, "curious-mind");
      return { doubt: toDoubtDto(row!) };
    } catch (error) {
      if (photoUrl) {
        const name = photoUrl.split("/").pop()!;
        await unlink(join(doubtsDir(), name)).catch(() => undefined);
      }
      throw error;
    }
  }

  async listDoubts(userId: string) {
    const { rows } = await this.db.query<DoubtRow>(
      `SELECT ${DOUBT_COLUMNS} FROM learning_doubts d
        WHERE d."user_id" = $1 ORDER BY d."created_at" DESC`,
      [userId]
    );
    return rows.map(toDoubtDto);
  }

  async escalateDoubt(userId: string, id: string) {
    const row = await this.db.queryOne<DoubtRow>(
      `UPDATE learning_doubts
          SET "status" = 'escalated', "escalated_at" = ${SQL_NOW_UTC}, "updated_at" = ${SQL_NOW_UTC}
        WHERE "id" = $1 AND "user_id" = $2 AND "status" NOT IN ('escalated', 'resolved')
        RETURNING ${DOUBT_RETURN_COLUMNS}`,
      [id, userId]
    );
    if (!row) throw new NotFoundException({ error: "Doubt not found or already resolved" });
    return { doubt: toDoubtDto(row) };
  }

  async listTasks(userId: string) {
    const classId = await this.activeClassId(userId);
    const { rows } = await this.db.query<TaskRow>(
      `SELECT ${ASSIGNMENT_COLUMNS},
              sub."id" AS "submissionId", sub."status" AS "submissionStatus",
              sub."note" AS "submissionNote", sub."submitted_at" AS "submittedAt",
              sub."score", sub."feedback"
         FROM learning_assignments a
         LEFT JOIN "Subject" s ON s."id" = a."subject_id"
         LEFT JOIN "SchoolClass" sc ON sc."id" = a."class_id"
         LEFT JOIN learning_assignment_submissions sub
           ON sub."assignment_id" = a."id" AND sub."user_id" = $2
        WHERE a."status" = 'published' AND a."class_id" = $1
        ORDER BY a."due_at" ASC`,
      [classId, userId]
    );

    const now = Date.now();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      subjectName: row.subjectName ?? "General",
      className: row.className,
      dueAt: toIso(row.dueAt),
      status: row.submissionStatus ?? (new Date(row.dueAt).getTime() < now ? "late" : "pending"),
      note: row.submissionNote ?? "",
      submittedAt: toIso(row.submittedAt),
      score: row.score,
      feedback: row.feedback,
      isOverdue: new Date(row.dueAt).getTime() < now && !row.submissionStatus,
    }));
  }

  async submitTask(userId: string, id: string, note: string) {
    const result = await this.db.tx(async (client) => {
      const assignment = await clientQuery<{ id: string; due_at: Date }>(
        client,
        `SELECT "id", "due_at" FROM learning_assignments WHERE "id" = $1 AND "status" = 'published'`,
        [id]
      );
      const found = assignment.rows[0];
      if (!found) throw new NotFoundException({ error: "Assignment not found" });

      const status = new Date(found.due_at).getTime() < Date.now() ? "late" : "submitted";
      const submission = await clientQuery<{ id: string; status: string; note: string }>(
        client,
        `INSERT INTO learning_assignment_submissions
           ("id", "assignment_id", "user_id", "status", "note", "submitted_at")
         VALUES ($1, $2, $3, $4, $5, ${SQL_NOW_UTC})
         ON CONFLICT ("assignment_id", "user_id") DO UPDATE SET
           "status" = EXCLUDED."status", "note" = EXCLUDED."note",
           "submitted_at" = EXCLUDED."submitted_at", "updated_at" = ${SQL_NOW_UTC}
         RETURNING "id", "status", "note"`,
        [newId(), id, userId, status, note]
      );
      return submission.rows[0]!;
    });

    await this.awardBadge(userId, "assignment-star");
    return {
      task: {
        id,
        submissionId: result.id,
        status: result.status,
        note: result.note,
      },
    };
  }

  /** Records a study session, recalculates streaks, XP, badges and the weekly goal. */
  async recordSession(userId: string, input: RecordSessionInput) {
    const today = new Date().toISOString().slice(0, 10);
    const newBadges: string[] = [];

    const gamification = await this.db.tx(async (client) => {
      // A provisioned student may not have opened their profile yet.
      await clientQuery(
        client,
        `INSERT INTO "StudentProfile" ("id", "userId", "updatedAt")
         VALUES ($1, $2, ${SQL_NOW_UTC})
         ON CONFLICT ("userId") DO NOTHING`,
        [newId(), userId]
      );

      await clientQuery(
        client,
        `INSERT INTO learning_study_sessions ("user_id", "day", "minutes")
         VALUES ($1, $2::date, $3)
         ON CONFLICT ("user_id", "day") DO UPDATE
           SET "minutes" = learning_study_sessions."minutes" + EXCLUDED."minutes"`,
        [userId, today, input.minutes]
      );

      const profile = await clientQuery<{ studyGoalMinutes: number | null }>(
        client,
        `SELECT "studyGoalMinutes" FROM "StudentProfile" WHERE "userId" = $1`,
        [userId]
      );
      const target = Math.max(60, (profile.rows[0]?.studyGoalMinutes ?? 30) * 5);
      await clientQuery(
        client,
        `INSERT INTO learning_weekly_goals
           ("user_id", "week_start", "target_minutes", "progress_minutes")
         VALUES ($1, $2::date, $3, $4)
         ON CONFLICT ("user_id") DO UPDATE SET
           "week_start" = EXCLUDED."week_start",
           "target_minutes" = EXCLUDED."target_minutes",
           "progress_minutes" = CASE
             WHEN EXCLUDED."week_start" = learning_weekly_goals."week_start"
               THEN learning_weekly_goals."progress_minutes" + EXCLUDED."progress_minutes"
             ELSE EXCLUDED."progress_minutes" END,
           "updated_at" = ${SQL_NOW_UTC}`,
        [userId, mondayOf(), target, input.minutes]
      );

      await clientQuery(
        client,
        `INSERT INTO learning_xp_events ("id", "user_id", "points", "reason")
         VALUES ($1, $2, $3, $4)`,
        [newId(), userId, input.minutes, "Study session"]
      );

      const sessions = await clientQuery<{ day: string }>(
        client,
        `SELECT "day"::text AS "day" FROM learning_study_sessions
          WHERE "user_id" = $1 AND "day" <= $2::date
          ORDER BY "day" DESC LIMIT 370`,
        [userId, today]
      );
      const days = new Set(sessions.rows.map((r) => String(r.day).slice(0, 10)));
      let cursor = new Date(`${today}T00:00:00Z`);
      if (!days.has(today)) {
        cursor = new Date(cursor.getTime() - 86_400_000);
      }
      let streak = 0;
      while (days.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor = new Date(cursor.getTime() - 86_400_000);
      }
      await clientQuery(
        client,
        `UPDATE "StudentProfile" SET "streakDays" = $2, "updatedAt" = ${SQL_NOW_UTC}
          WHERE "userId" = $1`,
        [userId, streak]
      );

      if (streak >= 7) {
        const awarded = await clientQuery<{ code: string }>(
          client,
          `INSERT INTO learning_student_badges ("user_id", "badge_code")
           VALUES ($1, 'streak-7') ON CONFLICT DO NOTHING RETURNING "badge_code" AS "code"`,
          [userId]
        );
        if (awarded.rows[0]) newBadges.push("streak-7");
      }
      const firstStep = await clientQuery<{ code: string }>(
        client,
        `INSERT INTO learning_student_badges ("user_id", "badge_code")
         VALUES ($1, 'first-step') ON CONFLICT DO NOTHING RETURNING "badge_code" AS "code"`,
        [userId]
      );
      if (firstStep.rows[0]) newBadges.push("first-step");
      return true;
    });

    if (!gamification) throw new BadRequestException({ error: "Could not record session" });
    return { success: true, newBadges, gamification: await this.getGamification(userId) };
  }

  // --------------------------------------------------------- teacher desk --

  async adminOverview() {
    const [doubts, assignments, submissions] = await Promise.all([
      this.db.queryOne<{
        total: number;
        open: number;
        escalated: number;
        answered: number;
      }>(
        `SELECT COUNT(*)::int AS "total",
                COUNT(*) FILTER (WHERE "status" = 'open')::int AS "open",
                COUNT(*) FILTER (WHERE "status" = 'escalated')::int AS "escalated",
                COUNT(*) FILTER (WHERE "status" IN ('answered', 'resolved'))::int AS "answered"
           FROM learning_doubts`
      ),
      this.db.queryOne<{ total: number; published: number }>(
        `SELECT COUNT(*)::int AS "total",
                COUNT(*) FILTER (WHERE "status" = 'published')::int AS "published"
           FROM learning_assignments`
      ),
      this.db.queryOne<{ total: number; submitted: number; late: number }>(
        `SELECT COUNT(*)::int AS "total",
                COUNT(*) FILTER (WHERE "status" IN ('submitted', 'graded'))::int AS "submitted",
                COUNT(*) FILTER (WHERE "status" = 'late')::int AS "late"
           FROM learning_assignment_submissions`
      ),
    ]);
    return {
      doubts: doubts ?? { total: 0, open: 0, escalated: 0, answered: 0 },
      assignments: assignments ?? { total: 0, published: 0 },
      submissions: submissions ?? { total: 0, submitted: 0, late: 0 },
    };
  }

  async adminListDoubts(status?: DoubtStatus) {
    const { rows } = await this.db.query<DoubtRow>(
      `${ADMIN_DOUBT_SELECT}
        WHERE $1::text IS NULL OR d."status" = $1
        ORDER BY
          CASE d."status" WHEN 'escalated' THEN 0 ELSE 1 END,
          d."created_at" DESC`,
      [status ?? null]
    );
    return rows.map(toDoubtDto);
  }

  async adminUpdateDoubt(id: string, status: DoubtStatus, teacherNote: string) {
    const row = await this.db.queryOne<DoubtRow>(
      `UPDATE learning_doubts
          SET "status" = $2,
              "teacher_note" = CASE WHEN $3 = '' THEN "teacher_note" ELSE $3 END,
              "answered_at" = CASE WHEN $2 IN ('answered', 'resolved') THEN ${SQL_NOW_UTC} ELSE "answered_at" END,
              "updated_at" = ${SQL_NOW_UTC}
        WHERE "id" = $1
        RETURNING ${DOUBT_RETURN_COLUMNS}`,
      [id, status, teacherNote]
    );
    if (!row) throw new NotFoundException({ error: "Doubt not found" });
    return { doubt: toDoubtDto(row) };
  }

  async adminCreateAssignment(teacherId: string, input: CreateAssignmentInput) {
    const dueAt = new Date(input.dueAt);
    if (Number.isNaN(dueAt.getTime())) {
      throw new BadRequestException({ error: "Enter a valid due date" });
    }
    const row = await this.db.queryOne<AssignmentRow>(
      `INSERT INTO learning_assignments
         ("id", "teacher_id", "class_id", "subject_id", "chapter_id", "title",
          "description", "due_at", "status")
       VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), $6, $7, $8::timestamp, $9)
       RETURNING ${ASSIGNMENT_RETURN_COLUMNS}`,
      [
        newId(),
        teacherId,
        input.classId,
        input.subjectId || null,
        input.chapterId || null,
        input.title,
        input.description || "",
        dueAt.toISOString(),
        input.status,
      ]
    );
    return { assignment: row };
  }

  async adminListAssignments() {
    const { rows } = await this.db.query<AssignmentRow>(
      `SELECT ${ASSIGNMENT_COLUMNS},
              COUNT(sub."id")::int AS "submissionCount"
         FROM learning_assignments a
         LEFT JOIN "Subject" s ON s."id" = a."subject_id"
         LEFT JOIN "SchoolClass" sc ON sc."id" = a."class_id"
         LEFT JOIN learning_assignment_submissions sub ON sub."assignment_id" = a."id"
        GROUP BY a."id", s."name", sc."title"
        ORDER BY a."due_at" ASC`
    );
    return rows;
  }
}
