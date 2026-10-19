import { useEffect, useState } from "react";
import type { Video } from "./types";

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);

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
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div className="page">
      <header className="header">
        <h1>Видео</h1>
        {status === "ready" && (
          <span className="count">{videos.length} видео</span>
        )}
      </header>

      {status === "loading" && <p className="message">Загрузка…</p>}
      {status === "error" && <p className="message error">{error}</p>}
      {status === "ready" && videos.length === 0 && (
        <p className="message">Пока нет видео</p>
      )}

      <div className="grid">
        {videos.map((video) => (
          <button
            key={video.id}
            className="card"
            onClick={() => setSelected(video)}
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
    </div>
  );
}
