import "dotenv/config"; // Cloudinary SDK automatically loads CLOUDINARY_URL environment variable from .env file
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  secure: true,
});

export async function uploadToCloudinary(image: File) {
  // Cloudinary's Node.js SDK doesn't support direct file uploads from the browser,
  // so we convert the File to a Buffer and use upload_stream.
  const buffer = Buffer.from(await image.arrayBuffer());
  const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: "image" }, (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      })
      .end(buffer);
  });

  return `image/upload/v${uploaded.version}/${uploaded.public_id}`;
}

/**
 * Recovers the bare public id (what the destroy API expects) from the stored
 * `image/upload/v{version}/{public_id}` path produced by {@link uploadToCloudinary}.
 * Any folder segments in the public id are preserved; only the
 * `image/upload/v{version}/` prefix is stripped. If the prefix isn't present
 * (unexpected format), the input is returned unchanged.
 */
export function extractCloudinaryPublicId(publicIdPath: string): string {
  return publicIdPath.replace(/^image\/upload\/v\d+\//, "");
}

/**
 * Deletes an image from Cloudinary given the stored public id path
 * (the `image/upload/v{version}/{public_id}` value produced by
 * {@link uploadToCloudinary}).
 */
export async function deleteFromCloudinary(publicIdPath: string) {
  const publicId = extractCloudinaryPublicId(publicIdPath);
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
