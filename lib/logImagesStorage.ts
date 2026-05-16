import { supabase } from "./supabase";
import type { LogPhoto } from "./types";

export const LOG_IMAGES_BUCKET = "shade-log-images";

export type ImageUploadResult = {
  status: "success" | "error" | "skipped";
  message: string;
  photo?: LogPhoto;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

export function buildLogImagePath({
  userId,
  date,
  fileName,
}: {
  userId?: string;
  date: string;
  fileName: string;
}) {
  const owner = userId || "temporary";
  return `${owner}/${date}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export async function createSignedImageUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(LOG_IMAGES_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (error || !data) return undefined;
  return data.signedUrl;
}

export async function uploadLogImage({
  file,
  userId,
  date,
}: {
  file: File;
  userId?: string;
  date: string;
}): Promise<ImageUploadResult> {
  const path = buildLogImagePath({ userId, date, fileName: file.name });
  const { error } = await supabase.storage
    .from(LOG_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) return { status: "error", message: error.message };

  const signedUrl = await createSignedImageUrl(path);
  const { data: publicData } = supabase.storage
    .from(LOG_IMAGES_BUCKET)
    .getPublicUrl(path);

  return {
    status: "success",
    message: "画像をSupabase Storageへ保存しました。",
    photo: {
      storagePath: path,
      publicUrl: publicData.publicUrl,
      signedUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    },
  };
}
