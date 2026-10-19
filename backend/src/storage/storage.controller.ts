import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { promises as fs } from "fs";
import { basename, resolve } from "path";
import { StorageService } from "./storage.service.js";

// Same root as StorageService, keeps `GET /uploads/...` in sync with writes.
const UPLOADS_ROOT = process.env.UPLOADS_DIR ?? "./uploads";

@Controller("uploads")
export class StorageController {
  private readonly ROOT_PATH = UPLOADS_ROOT;

  constructor(
    @Inject(StorageService) private readonly storageService: StorageService,
  ) {}

  @Get(":folder/:filename")
  async serveFile(
    @Param("folder") folder: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ) {
    if (folder !== "videos" && folder !== "previews") {
      throw new NotFoundException();
    }

    const safeFilename = basename(filename);
    if (safeFilename !== filename) {
      throw new BadRequestException();
    }

    const filePath = resolve(this.ROOT_PATH, folder, safeFilename);

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException();
    }

    res.sendFile(filePath);
  }
}
