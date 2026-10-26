import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Video } from "./types";

type Props = {
  onCreated: (video: Video) => void;
  onCancel: () => void;
};

// Keep in sync with `StorageService.ALLOWED_EXTENSIONS` on the backend.
const PREVIEW_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".wav"];

function hasAllowedExtension(file: File, allowed: string[]): boolean {
  const name = file.name.toLowerCase();
  return allowed.some((extension) => name.endsWith(extension));
}

async function readMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message: unknown }).message;
      if (Array.isArray(message)) return message.join("; ");
      if (typeof message === "string") return message;
    }
  } catch {
    // Body is not JSON.
  }
  return `${fallback} (HTTP ${response.status})`;
}

async function uploadFile(
  field: "preview" | "video",
  file: File,
): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`/videos/${field}`, { method: "POST", body });
  if (!response.ok) {
    throw new Error(
      await readMessage(response, `Не удалось загрузить «${file.name}»`),
    );
  }

  const data = (await response.json()) as { preview?: string; video?: string };
  const filename = data[field];
  if (!filename) throw new Error("Сервер не вернул имя загруженного файла");
  return filename;
}

export default function CreateVideoForm({ onCreated, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function pickFile(
    event: ChangeEvent<HTMLInputElement>,
    allowed: string[],
    setFile: (file: File | null) => void,
  ) {
    const file = event.target.files?.[0] ?? null;
    setError("");

    if (file && !hasAllowedExtension(file, allowed)) {
      setFile(null);
      event.target.value = "";
      setError(`Недопустимый формат. Разрешены: ${allowed.join(", ")}`);
      return;
    }

    setFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !author.trim()) {
      setError("Заполните название и автора");
      return;
    }
    if (!previewFile || !videoFile) {
      setError("Выберите обложку и видеофайл");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const [preview, video] = await Promise.all([
        uploadFile("preview", previewFile),
        uploadFile("video", videoFile),
      ]);

      const response = await fetch("/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          description: description.trim() || undefined,
          preview,
          video,
        }),
      });

      if (!response.ok) {
        throw new Error(await readMessage(response, "Не удалось создать видео"));
      }

      onCreated((await response.json()) as Video);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="video-form" onSubmit={handleSubmit}>
      <h2>Новое видео</h2>

      <label className="field">
        <span>Название</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например, «Первый запуск»"
          disabled={busy}
          required
        />
      </label>

      <label className="field">
        <span>Автор</span>
        <input
          type="text"
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="Имя автора"
          disabled={busy}
          required
        />
      </label>

      <label className="field">
        <span>Описание</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Необязательно"
          rows={3}
          disabled={busy}
        />
      </label>

      <div className="file-fields">
        <label className="field">
          <span>Обложка (изображение)</span>
          <input
            type="file"
            accept={PREVIEW_EXTENSIONS.join(",")}
            onChange={(event) =>
              pickFile(event, PREVIEW_EXTENSIONS, setPreviewFile)
            }
            disabled={busy}
            required
          />
          <small className="file-name">
            {previewFile ? previewFile.name : "не выбрано"}
          </small>
        </label>

        <label className="field">
          <span>Видеофайл</span>
          <input
            type="file"
            accept={VIDEO_EXTENSIONS.join(",")}
            onChange={(event) => pickFile(event, VIDEO_EXTENSIONS, setVideoFile)}
            disabled={busy}
            required
          />
          <small className="file-name">
            {videoFile ? videoFile.name : "не выбрано"}
          </small>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button
          type="button"
          className="ghost"
          onClick={onCancel}
          disabled={busy}
        >
          Отмена
        </button>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Загрузка…" : "Добавить"}
        </button>
      </div>
    </form>
  );
}
