import { Injectable } from "@nestjs/common";
import {
  db,
  listVideos,
  createVideo as createVideoRecord,
  type Video,
} from "./prisma/videos";

@Injectable()
export class PrismaService {
  readonly db = db;

  listVideos(limit = 20): Promise<Video[]> {
    return listVideos(limit);
  }

  createVideo(
    body: Omit<Video, "id" | "createdAt" | "isArchived">,
  ): Promise<Video> {
    return createVideoRecord(body);
  }
}
