import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { ApiPathParam, ApiZodBody, ApiZodQueries } from "../../common/zod-openapi";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AdminTokenGuard } from "../support/admin-token.guard";
import {
  adminDoubtListQuerySchema,
  createAssignmentSchema,
  updateDoubtSchema,
  type AdminDoubtListQuery,
  type CreateAssignmentInput,
  type UpdateDoubtInput,
} from "./learning.schemas";
import { LearningService } from "./learning.service";

const teacherIdFrom = (req: FastifyRequest): string => {
  const raw = req.headers["x-teacher-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || "admin-root";
};

@ApiTags("admin · learning desk")
@ApiSecurity("x-admin-token")
@UseGuards(AdminTokenGuard)
@Controller()
export class AdminLearningController {
  constructor(@Inject(LearningService) private readonly learning: LearningService) {}

  @Get(["api/admin/learning/overview", "api/v1/admin/learning/overview"])
  @ApiOperation({ summary: "Teacher desk counters for doubts and assignments" })
  overview() {
    return this.learning.adminOverview();
  }

  // --------------------------------------------------------------- doubts --

  @Get(["api/admin/learning/doubts", "api/v1/admin/learning/doubts"])
  @ApiOperation({ summary: "List student doubts; escalated ones first" })
  @ApiZodQueries(adminDoubtListQuerySchema)
  listDoubts(
    @Query(new ZodValidationPipe(adminDoubtListQuerySchema)) query: AdminDoubtListQuery
  ) {
    return this.learning.adminListDoubts(query.status);
  }

  @Patch(["api/admin/learning/doubts/:id", "api/v1/admin/learning/doubts/:id"])
  @ApiOperation({ summary: "Answer, resolve or reopen a student doubt" })
  @ApiPathParam("id", { description: "Doubt id" })
  @ApiZodBody(updateDoubtSchema)
  updateDoubt(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateDoubtSchema)) body: UpdateDoubtInput
  ) {
    return this.learning.adminUpdateDoubt(id, body.status, body.teacherNote);
  }

  // ---------------------------------------------------------- assignments --

  @Get(["api/admin/learning/assignments", "api/v1/admin/learning/assignments"])
  @ApiOperation({ summary: "List teacher assignments with submission counts" })
  listAssignments() {
    return this.learning.adminListAssignments();
  }

  @Post(["api/admin/learning/assignments", "api/v1/admin/learning/assignments"])
  @ApiOperation({ summary: "Create an assignment with a due date for a class" })
  @ApiZodBody(createAssignmentSchema)
  createAssignment(
    @Req() req: FastifyRequest,
    @Body(new ZodValidationPipe(createAssignmentSchema)) body: CreateAssignmentInput
  ) {
    return this.learning.adminCreateAssignment(teacherIdFrom(req), body);
  }
}
