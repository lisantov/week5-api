import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { basename, extname, join } from "path";

// Root directory for uploaded files. Docker (and tests) can point this at a
// writable location via UPLOADS_DIR, e.g. a mounted volume.
const UPLOADS_ROOT = process.env.UPLOADS_DIR ?? "./uploads";

@Injectable()
export class StorageService {
  private readonly TEMP_PATH = join(UPLOADS_ROOT, "temp");
  private readonly VIDEO_PATH = join(UPLOADS_ROOT, "videos");
  private readonly PREVIEW_PATH = join(UPLOADS_ROOT, "previews");
  private readonly ALLOWED_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".wav",
    ".mp4",
  ];

  async saveTempFile(
    file: Express.Multer.File,
    type: "video" | "preview",
  ): Promise<string> {
    if (!file) throw new BadRequestException("File is required");

    const extension = (
      extname(file.originalname) || `.${file.mimetype.split("/").pop() ?? ""}`
    ).toLowerCase();

    if (!this.ALLOWED_EXTENSIONS.includes(extension))
      throw new BadRequestException(
        `Allowed file extensions: ${this.ALLOWED_EXTENSIONS.join(", ")}`,
      );

    const filename = `${type}-${Date.now()}-${randomUUID()}${extension}`;

    try {
      await fs.mkdir(this.TEMP_PATH, { recursive: true });

      await fs.writeFile(join(this.TEMP_PATH, filename), file.buffer);
    } catch (e) {
      throw new BadRequestException(e);
    }

    return filename;
  }

  assertTempFileType(filename: string, type: "video" | "preview"): void {
    if (!filename.startsWith(`${type}-`))
      throw new BadRequestException(`Passed filepath is not a ${type}`);
  }

  async moveToVideo(filename: string): Promise<string> {
    this.assertTempFileType(filename, "video");
    const moved = await this.moveTo(filename, this.VIDEO_PATH);

    return `${basename(this.VIDEO_PATH)}/${moved}`;
  }

  async moveToPreview(filename: string): Promise<string> {
    this.assertTempFileType(filename, "preview");
    const moved = await this.moveTo(filename, this.PREVIEW_PATH);

    return `${basename(this.PREVIEW_PATH)}/${moved}`;
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
