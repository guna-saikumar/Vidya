import "@fastify/multipart";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard, type AuthedRequest } from "../../auth/jwt.guard";
import { StudentRoleGuard } from "../../auth/student-role.guard";
import { ApiPathParam, ApiZodBody } from "../../common/zod-openapi";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import {
  createDoubtSchema,
  recordSessionSchema,
  submitAssignmentSchema,
  type RecordSessionInput,
  type SubmitAssignmentInput,
} from "./learning.schemas";
import { LearningService } from "./learning.service";

const truthy = (value: unknown): boolean =>
  value === true ||
  (typeof value === "string" && ["true", "1", "yes", "on"].includes(value.toLowerCase()));

const multipartValue = (
  fields: Record<string, unknown>,
  name: string
): string | undefined => {
  const part = fields[name];
  const first = Array.isArray(part) ? part[0] : part;
  if (!first || (first as { type?: string }).type !== "field") return undefined;
  const value = (first as { value?: unknown }).value;
  return value === undefined ? undefined : String(value);
};

@ApiTags("learning · student")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StudentRoleGuard)
@Controller("api/v1/learning")
export class StudentLearningController {
  constructor(@Inject(LearningService) private readonly learning: LearningService) {}

  @Get("overview")
  @ApiOperation({
    summary: "Streak, XP, badges, weekly goal, task inbox, doubts and glossary",
  })
  overview(@Req() req: AuthedRequest) {
    return this.learning.getOverview(req.user!.sub);
  }

  @Get("gamification")
  @ApiOperation({ summary: "Streak, XP, level, badges and weekly study goal" })
  gamification(@Req() req: AuthedRequest) {
    return this.learning.getGamification(req.user!.sub);
  }

  @Post("sessions")
  @ApiOperation({
    summary: "Record study minutes; updates streak, XP and weekly goal",
  })
  @ApiZodBody(recordSessionSchema)
  recordSession(
    @Req() req: AuthedRequest,
    @Body(new ZodValidationPipe(recordSessionSchema)) body: RecordSessionInput
  ) {
    return this.learning.recordSession(req.user!.sub, body);
  }

  // --------------------------------------------------------------- doubts --

  @Get("doubts")
  @ApiOperation({ summary: "List the signed-in student's doubts" })
  listDoubts(@Req() req: AuthedRequest) {
    return this.learning.listDoubts(req.user!.sub);
  }

  @Post("doubts")
  @ApiOperation({
    summary: "Ask a doubt with an optional photo and teacher escalation",
    description:
      "multipart/form-data. Send text fields BEFORE `photo`: question, details, " +
      "classId, subjectId, chapterId, sectionId, escalate. JPEG/PNG/WebP up to 5 MB.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", example: "Why is the denominator never zero?" },
        details: { type: "string", example: "I did not follow step 3 in the example." },
        classId: { type: "string", example: "class-10" },
        subjectId: { type: "string", example: "c10-maths" },
        chapterId: { type: "string", example: "c10-maths-ch1" },
        sectionId: { type: "string", example: "c10-maths-ch1-s2" },
        escalate: { type: "string", enum: ["true", "false"], example: "true" },
        photo: { type: "string", format: "binary" },
      },
    },
  })
  async createDoubt(@Req() req: AuthedRequest) {
    if (!req.isMultipart?.()) {
      throw new BadRequestException({
        error: "Expected multipart/form-data with a `question` field",
      });
    }
    const file = await req.file({ limits: { files: 1, parts: 10, fields: 8, fieldSize: 8192 } });
    if (!file || file.fieldname !== "photo") {
      file?.file.resume();
      throw new BadRequestException({ error: "Attach the image in the `photo` field" });
    }

    const fields = file.fields as Record<string, unknown>;
    const input = new ZodValidationPipe(createDoubtSchema).transform({
      question: multipartValue(fields, "question"),
      details: multipartValue(fields, "details"),
      classId: multipartValue(fields, "classId") ?? multipartValue(fields, "class_id"),
      subjectId: multipartValue(fields, "subjectId") ?? multipartValue(fields, "subject_id"),
      chapterId: multipartValue(fields, "chapterId") ?? multipartValue(fields, "chapter_id"),
      sectionId: multipartValue(fields, "sectionId") ?? multipartValue(fields, "section_id"),
      escalate: truthy(multipartValue(fields, "escalate")),
    });

    return this.learning.createDoubt(req.user!.sub, input, {
      mimetype: file.mimetype,
      filename: file.filename,
      file: file.file,
    });
  }

  @Post("doubts/:id/escalate")
  @ApiOperation({ summary: "Escalate an open doubt to a teacher" })
  @ApiPathParam("id", { description: "Doubt id" })
  escalateDoubt(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.learning.escalateDoubt(req.user!.sub, id);
  }

  // ---------------------------------------------------------- task inbox --

  @Get("tasks")
  @ApiOperation({ summary: "Student task inbox with due dates and submission status" })
  tasks(@Req() req: AuthedRequest) {
    return this.learning.listTasks(req.user!.sub);
  }

  @Post("tasks/:id/submit")
  @ApiOperation({ summary: "Submit a teacher assignment (marks late after the due date)" })
  @ApiPathParam("id", { description: "Assignment id" })
  @ApiZodBody(submitAssignmentSchema)
  submitTask(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(submitAssignmentSchema)) body: SubmitAssignmentInput
  ) {
    return this.learning.submitTask(req.user!.sub, id, body.note);
  }

  // ------------------------------------------------------------- glossary --

  @Get("glossary")
  @ApiOperation({ summary: "Bilingual English/Hindi glossary for reader tooltips" })
  @ApiQuery({ name: "search", required: false, description: "Term or definition search" })
  glossary(@Query("search") search?: string) {
    return this.learning.listGlossary(search);
  }
}
