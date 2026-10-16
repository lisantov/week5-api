import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { basename, extname, join } from "path";

@Injectable()
export class StorageService {
  private readonly TEMP_PATH = "./uploads/temp";
  private readonly VIDEO_PATH = "./uploads/videos";
  private readonly PREVIEW_PATH = "./uploads/previews";
  private readonly ALLOWED_EXTENSIONS = [
    ".png, .jpg, .jpeg, .webp, .wav, .mp4",
  ];

  async saveTempFile(
    file: Express.Multer.File,
    type: "video" | "preview",
  ): Promise<string> {
    if (!file) throw new BadRequestException("File is required");

    try {
      await fs.mkdir(this.TEMP_PATH, { recursive: true });

      const extension =
        extname(file.originalname) || `.${file.mimetype.split("/").pop()}`;

      if (!extension || !this.ALLOWED_EXTENSIONS.includes(extension))
        throw new BadRequestException(
          `Allowed file extenstions: ${this.ALLOWED_EXTENSIONS.join(", ")}`,
        );

      const filename = `${type}-${Date.now()}-${randomUUID()}${extension}`;

      await fs.writeFile(join(this.TEMP_PATH, filename), file.buffer);

      return filename;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async moveToVideo(filename: string): Promise<string> {
    if (filename.startsWith("video"))
      throw new BadRequestException("Passed filepath is not a video");
    return this.moveTo(filename, this.VIDEO_PATH);
  }

  async moveToPreview(filename: string): Promise<string> {
    if (filename.startsWith("preview"))
      throw new BadRequestException("Passed filepath is not a video");
    return this.moveTo(filename, this.PREVIEW_PATH);
  }

  private async moveTo(filename: string, targetPath: string): Promise<string> {
    const safeFilename = basename(filename);
    const source = join(this.TEMP_PATH, safeFilename);
    const destination = join(targetPath, safeFilename);

    try {
      await fs.mkdir(targetPath, { recursive: true });
      await fs.rename(source, destination);

      return safeFilename;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
}
