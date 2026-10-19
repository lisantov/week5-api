import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { VideosModule } from "./videos/videos.module.js";

@Module({
  imports: [PrismaModule, StorageModule, VideosModule],
  controllers: [AppController],
})
export class AppModule {}
