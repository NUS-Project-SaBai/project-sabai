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
