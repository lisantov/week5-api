import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma.service";

import { VideosModule } from "./videos/videos.module.js";
import { StorageModule } from './storage/storage.module.js';

@Module({
  imports: [VideosModule, StorageModule],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
