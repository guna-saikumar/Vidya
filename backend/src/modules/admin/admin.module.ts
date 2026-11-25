import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AdminAuthController, AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [DbModule],
  controllers: [AdminAuthController, AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
