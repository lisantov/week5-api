import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { VideosService } from "./videos.service.js";
import type { CreateVideoDto } from "./dto/create-video.dto.js";

@Controller("videos")
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  findAll() {
    return this.videosService.findAll();
  }

  @Post("preview")
  @UseInterceptors(FileInterceptor("file"))
  uploadPreview(@UploadedFile() file: Express.Multer.File) {
    return this.videosService.loadPreview(file);
  }

  @Post("video")
  @UseInterceptors(FileInterceptor("file"))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.videosService.loadVideo(file);
  }

  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.videosService.createVideo(dto);
  }
}
