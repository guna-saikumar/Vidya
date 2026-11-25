import { z } from "zod";

export const broadcastNotificationSchema = z.object({
  title: z.string().trim().min(3, "Title must have at least 3 characters").max(100),
  message: z.string().trim().min(3, "Message must have at least 3 characters").max(500),
  detailedBody: z.string().trim().max(2000).optional(),
  type: z.enum(["announcement", "alert", "system", "event", "achievement"]).default("announcement"),
  target: z.enum(["all", "grade", "student"]).default("all"),
  targetValue: z.string().trim().optional(),
  icon: z.string().trim().default("campaign"),
  actionRoute: z.string().trim().max(100).optional(),
  actionLabel: z.string().trim().max(50).optional(),
});

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;

export const adminStudentListQuerySchema = z.object({
  search: z.string().trim().optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  section: z.string().trim().optional(),
  isOnboarded: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminStudentListQuery = z.infer<typeof adminStudentListQuerySchema>;

export const updateStudentProfileAdminSchema = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  section: z.string().trim().max(10).optional(),
  schoolName: z.string().trim().max(120).optional(),
  rollNumber: z.string().trim().max(30).optional(),
  medium: z.string().trim().max(30).optional(),
  district: z.string().trim().max(60).optional(),
  villageCity: z.string().trim().max(60).optional(),
  fatherName: z.string().trim().max(60).optional(),
  isOnboarded: z.boolean().optional(),
});

export type UpdateStudentProfileAdminInput = z.infer<typeof updateStudentProfileAdminSchema>;
