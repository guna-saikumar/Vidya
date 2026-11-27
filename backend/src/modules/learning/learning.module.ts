import { Module } from "@nestjs/common";
import { AdminTokenGuard } from "../support/admin-token.guard";
import { AdminLearningController } from "./admin-learning.controller";
import { LearningService } from "./learning.service";
import { StudentLearningController } from "./student-learning.controller";

@Module({
  controllers: [StudentLearningController, AdminLearningController],
  providers: [LearningService, AdminTokenGuard],
  exports: [LearningService],
})
export class LearningModule {}
