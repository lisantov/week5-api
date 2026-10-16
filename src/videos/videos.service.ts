import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { StorageService } from "../storage/storage.service.js";
import type { CreateVideoDto } from "./dto/create-video.dto.js";

@Injectable()
export class VideosService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(StorageService) private readonly storageService: StorageService,
  ) {}

  findAll() {
    return this.prismaService.listVideos();
  }

  async loadPreview(file: Express.Multer.File) {
    const preview = await this.storageService.saveTempFile(file, "preview");

    return { preview };
  }

  async loadVideo(file: Express.Multer.File) {
    const video = await this.storageService.saveTempFile(file, "video");

    return { video };
  }

  async createVideo(dto: CreateVideoDto) {
    const [preview, video] = await Promise.all([
      this.storageService.moveToPreview(dto.preview),
      this.storageService.moveToVideo(dto.video),
    ]);

    return this.prismaService.createVideo({
      title: dto.title,
      author: dto.author,
      description: dto.description ?? null,
      preview,
      video,
    });
  }
}
