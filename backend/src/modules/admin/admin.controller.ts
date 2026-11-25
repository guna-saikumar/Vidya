import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { AdminTokenGuard } from "../support/admin-token.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { ApiZodBody } from "../../common/zod-openapi";
import {
  adminLoginSchema,
  adminStudentListQuerySchema,
  broadcastNotificationSchema,
  updateStudentProfileAdminSchema,
  type AdminLoginInput,
  type AdminStudentListQuery,
  type BroadcastNotificationInput,
  type UpdateStudentProfileAdminInput,
} from "./admin.schemas";
import { AdminService } from "./admin.service";

@ApiTags("admin · auth")
@Controller(["api/admin/auth", "api/v1/admin/auth"])
export class AdminAuthController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Admin login (email/password)" })
  @ApiZodBody(adminLoginSchema)
  login(
    @Body(new ZodValidationPipe(adminLoginSchema)) body: AdminLoginInput
  ) {
    return this.admin.login(body);
  }

  @Get("me")
  @UseGuards(AdminTokenGuard)
  @ApiSecurity("x-admin-token")
  @ApiOperation({ summary: "Get current authenticated admin user profile" })
  getMe() {
    return this.admin.getMe();
  }
}

@ApiTags("admin · portal")
@ApiSecurity("x-admin-token")
@Controller(["api/admin", "api/v1/admin"])
@UseGuards(AdminTokenGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get("overview")
  @ApiOperation({ summary: "Get high-level admin dashboard statistics and analytics" })
  getOverview() {
    return this.admin.getOverviewStats();
  }

  // ---- Notifications / Alerts -------------------------------------------
  @Post(["notifications/broadcast", "notifications"])
  @ApiOperation({ summary: "Broadcast an alert or notification to students" })
  broadcastNotification(
    @Body(new ZodValidationPipe(broadcastNotificationSchema))
    body: BroadcastNotificationInput
  ) {
    return this.admin.broadcastNotification(body);
  }

  @Get(["notifications/broadcast", "notifications"])
  @ApiOperation({ summary: "List broadcast notifications sent to students" })
  listNotifications() {
    return this.admin.listBroadcastNotifications();
  }

  @Delete("notifications")
  @ApiOperation({ summary: "Delete or recall a notification by title" })
  deleteNotification(@Query("title") title: string) {
    return this.admin.deleteNotificationByTitle(title);
  }

  // ---- Students Management ---------------------------------------------
  @Get("students")
  @ApiOperation({ summary: "List and search all students with progress stats" })
  listStudents(
    @Query(new ZodValidationPipe(adminStudentListQuerySchema))
    query: AdminStudentListQuery
  ) {
    return this.admin.listStudents(query);
  }

  @Get("students/:id")
  @ApiOperation({ summary: "Get detailed student profile, progress and bookmarks" })
  getStudentDetails(@Param("id") id: string) {
    return this.admin.getStudentDetails(id);
  }

  @Patch("students/:id")
  @ApiOperation({ summary: "Update student details and profile from admin" })
  updateStudent(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStudentProfileAdminSchema))
    body: UpdateStudentProfileAdminInput
  ) {
    return this.admin.updateStudentProfile(id, body);
  }

  @Delete("students/:id")
  @ApiOperation({ summary: "Delete a student record and associated progress" })
  deleteStudent(@Param("id") id: string) {
    return this.admin.deleteStudent(id);
  }
}
