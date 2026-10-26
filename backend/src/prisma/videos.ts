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
    "views",
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
      views: v.views,
      createdAt: v.createdAt,
    }));
}

export async function createVideo(
  body: Omit<Video, "id" | "createdAt" | "isArchived" | "views">,
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
    views: video.views,
    createdAt: video.createdAt,
  };
}

/**
 * Atomically increments the view counter and returns the new value.
 * Returns `null` when no video with the given id exists.
 */
export async function registerVideoView(id: string): Promise<number | null> {
  const plan = db.sql.public.Video
    .update((fields, fns) => ({
      views: fns.raw`${fields.views} + 1`.returns("pg/int4@1"),
    }))
    .where((fields, fns) => fns.eq(fields.id, id))
    .returning("views")
    .build();

  const rows = await db.runtime().query(plan);
  const row = rows[0];

  return row ? Number(row.views) : null;
}

export type Video = Awaited<ReturnType<typeof listVideos>>[number];
