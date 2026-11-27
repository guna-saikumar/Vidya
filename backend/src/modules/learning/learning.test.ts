import { describe, expect, it } from "vitest";
import {
  adminDoubtListQuerySchema,
  createAssignmentSchema,
  createDoubtSchema,
  recordSessionSchema,
  submitAssignmentSchema,
} from "./learning.schemas";
import { assertDoubtPhotoMime } from "./learning.service";

describe("Learning schemas", () => {
  it("accepts and coerces a study session", () => {
    const result = recordSessionSchema.safeParse({ minutes: "15", chapterId: "c10-maths-ch1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.minutes).toBe(15);
  });

  it("rejects zero-minute study sessions", () => {
    expect(recordSessionSchema.safeParse({ minutes: 0 }).success).toBe(false);
  });

  it("validates a doubt with escalation", () => {
    const result = createDoubtSchema.safeParse({
      question: "Why can't the denominator be zero?",
      details: "I am stuck on step 3.",
      classId: "class-10",
      escalate: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.escalate).toBe(true);
  });

  it("requires a real question", () => {
    expect(createDoubtSchema.safeParse({ question: "help" }).success).toBe(false);
  });

  it("validates teacher assignments and task submissions", () => {
    const assignment = createAssignmentSchema.safeParse({
      title: "Chapter 1 practice",
      classId: "class-10",
      dueAt: "2026-12-01T18:00:00.000Z",
    });
    expect(assignment.success).toBe(true);
    expect(submitAssignmentSchema.safeParse({ note: "Completed all questions" }).success).toBe(true);
    expect(submitAssignmentSchema.safeParse({ note: "" }).success).toBe(false);
  });

  it("only allows known doubt statuses in the admin filter", () => {
    expect(adminDoubtListQuerySchema.safeParse({ status: "escalated" }).success).toBe(true);
    expect(adminDoubtListQuerySchema.safeParse({ status: "unknown" }).success).toBe(false);
  });
});

describe("Doubt photo validation", () => {
  it("accepts JPEG, PNG and WebP", () => {
    expect(assertDoubtPhotoMime("image/jpeg")).toBe("jpg");
    expect(assertDoubtPhotoMime("image/png")).toBe("png");
    expect(assertDoubtPhotoMime("image/webp")).toBe("webp");
  });

  it("rejects other file types", () => {
    expect(() => assertDoubtPhotoMime("image/gif")).toThrow();
    expect(() => assertDoubtPhotoMime("application/pdf")).toThrow();
  });
});
