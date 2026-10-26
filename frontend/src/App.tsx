import { useEffect, useState } from "react";
import CreateVideoForm from "./CreateVideoForm";
import type { Video } from "./types";

function viewsLabel(views: number): string {
  const mod10 = views % 10;
  const mod100 = views % 100;

  if (mod10 === 1 && mod100 !== 11) return "просмотр";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "просмотра";
  }
  return "просмотров";
}

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetch("/videos")
      .then((res) => {
        if (!res.ok) throw new Error(`Ошибка API: HTTP ${res.status}`);
        return res.json() as Promise<Video[]>;
      })
      .then((data) => {
        setVideos(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (!selected && !createOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setCreateOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, createOpen]);

  function handleCreated(video: Video) {
    setVideos((current) => [video, ...current]);
    setStatus("ready");
    setCreateOpen(false);
  }

  async function openVideo(video: Video) {
    setSelected(video);

    try {
      const response = await fetch(`/videos/${video.id}/views`, {
        method: "POST",
      });
      if (!response.ok) return;

      const data = (await response.json()) as { id: string; views: number };
      setVideos((current) =>
        current.map((item) =>
          item.id === data.id ? { ...item, views: data.views } : item,
        ),
      );
      setSelected((current) =>
        current && current.id === data.id
          ? { ...current, views: data.views }
          : current,
      );
    } catch {
      // Counting a view must never prevent playback.
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="header-title">
          <h1>Видео</h1>
          {status === "ready" && (
            <span className="count">{videos.length} видео</span>
          )}
        </div>
        <button className="primary" onClick={() => setCreateOpen(true)}>
          + Добавить видео
        </button>
      </header>

      {status === "loading" && <p className="message">Загрузка…</p>}
      {status === "error" && <p className="message error">{error}</p>}
      {status === "ready" && videos.length === 0 && (
        <p className="message">
          Пока нет видео — нажмите «Добавить видео», чтобы загрузить первое.
        </p>
      )}

      <div className="grid">
        {videos.map((video) => (
          <button
            key={video.id}
            className="card"
            onClick={() => void openVideo(video)}
          >
            <div className="card-preview">
              {video.preview ? (
                <img
                  src={`/uploads/${video.preview}`}
                  alt={video.title}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="placeholder">нет обложки</span>
              )}
            </div>
            <div className="card-body">
              <h2>{video.title}</h2>
              <p className="author">{video.author}</p>
              <p className="views">
                {video.views} {viewsLabel(video.views)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <video
              src={`/uploads/${selected.video}`}
              poster={
                selected.preview ? `/uploads/${selected.preview}` : undefined
              }
              controls
              autoPlay
            />
            <div className="modal-body">
              <h2>{selected.title}</h2>
              <p className="author">{selected.author}</p>
              <p className="views">
                {selected.views} {viewsLabel(selected.views)}
              </p>
              {selected.description && (
                <p className="description">{selected.description}</p>
              )}
            </div>
            <button
              className="close"
              aria-label="Закрыть"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="overlay" onClick={() => setCreateOpen(false)}>
          <div
            className="modal form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <CreateVideoForm
              onCreated={handleCreated}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
