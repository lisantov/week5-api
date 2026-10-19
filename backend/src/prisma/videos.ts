import { db } from "./db.ts";
import { seed } from "./seed.ts";

export { db };

export async function listVideos(limit = 20) {
  await seed();
  const videos = await db.orm.public.Video.select(
    "id",
    "title",
    "author",
    "description",
    "preview",
    "video",
    "isArchived",
    "createdAt",
  )
    .limit(limit)
    .all();

  return videos
    .filter((v) => !v.isArchived)
    .map((v) => ({
      id: v.id,
      title: v.title,
      author: v.author,
      description: v.description ?? null,
      preview: v.preview,
      video: v.video,
      createdAt: v.createdAt,
    }));
}

export async function createVideo(
  body: Omit<Video, "id" | "createdAt" | "isArchived">,
) {
  const video = await db.orm.public.Video.create({
    title: body.title,
    author: body.author,
    description: body.description,
    preview: body.preview,
    video: body.video,
  });

  return {
    id: video.id,
    title: video.title,
    author: video.author,
    description: video.description,
    preview: video.preview,
    video: video.video,
    createdAt: video.createdAt,
  };
}

export type Video = Awaited<ReturnType<typeof listVideos>>[number];
