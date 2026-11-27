import { z } from "zod";

export const DOUBT_STATUSES = ["open", "escalated", "answered", "resolved"] as const;
export const TASK_SUBMISSION_STATUSES = ["pending", "submitted", "late", "graded"] as const;
export const ASSIGNMENT_STATUSES = ["draft", "published", "archived"] as const;

export type DoubtStatus = (typeof DOUBT_STATUSES)[number];
export type TaskSubmissionStatus = (typeof TASK_SUBMISSION_STATUSES)[number];
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const recordSessionSchema = z.object({
  minutes: z.coerce.number().int().min(1, "At least one minute is required").max(480),
  chapterId: z.string().trim().min(1).optional(),
});
export type RecordSessionInput = z.infer<typeof recordSessionSchema>;

export const submitAssignmentSchema = z.object({
  note: z.string().trim().min(1, "Add a short note about your submission").max(2000),
});
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(4, "Title must have at least 4 characters").max(180),
  description: z.string().trim().max(5000).optional().default(""),
  classId: z.string().trim().min(1, "Choose a class"),
  subjectId: z.string().trim().min(1).optional().or(z.literal("")),
  chapterId: z.string().trim().min(1).optional().or(z.literal("")),
  dueAt: z.string().trim().min(1, "Choose a due date"),
  status: z.enum(ASSIGNMENT_STATUSES).optional().default("published"),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateDoubtSchema = z.object({
  status: z.enum(DOUBT_STATUSES),
  teacherNote: z.string().trim().max(5000).optional().default(""),
});
export type UpdateDoubtInput = z.infer<typeof updateDoubtSchema>;

export const adminDoubtListQuerySchema = z.object({
  status: z.enum(DOUBT_STATUSES).optional(),
});
export type AdminDoubtListQuery = z.infer<typeof adminDoubtListQuerySchema>;

/** Multipart fields arrive as strings; the controller normalises them before this parse. */
export const createDoubtSchema = z.object({
  question: z.string().trim().min(8, "Describe your doubt in at least 8 characters").max(500),
  details: z.string().trim().max(5000).optional().default(""),
  classId: z.string().trim().min(1).optional().or(z.literal("")),
  subjectId: z.string().trim().min(1).optional().or(z.literal("")),
  chapterId: z.string().trim().min(1).optional().or(z.literal("")),
  sectionId: z.string().trim().min(1).optional().or(z.literal("")),
  escalate: z.boolean().optional().default(false),
});
export type CreateDoubtInput = z.infer<typeof createDoubtSchema>;
