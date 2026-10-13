import { Readable } from "stream";
import { pipeline } from "stream/promises";
import type { NextApiRequest, NextApiResponse } from "next";
import { getRequestUser } from "@/server/auth";
import { getOfflinePatientImage } from "@/server/utils/imageStorage";

// Images are streamed, so Next's 4MB response warning doesn't apply.
export const config = { api: { responseLimit: false } };

/**
 * Serves patient images from local storage (RustFS) when APP_MODE is OFFLINE.
 * Online, images are served by Cloudinary and this route returns 404.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  if (!(await getRequestUser(req, res))) {
    return res.status(401).end();
  }

  const segments = req.query.key;
  const id = Array.isArray(segments) ? segments.join("/") : (segments ?? "");
  const image = await getOfflinePatientImage(id);
  if (!image) {
    return res.status(404).end();
  }

  res.setHeader("Content-Type", image.contentType);
  if (image.contentLength !== undefined) {
    res.setHeader("Content-Length", image.contentLength);
  }
  // Each upload gets a new id, so an id's content never changes.
  res.setHeader("Cache-Control", "private, max-age=31536000, immutable");

  // In Node the SDK returns the object body as a Readable stream.
  const body = image.body as Readable;
  if (req.method === "HEAD") {
    body.destroy();
    return res.status(200).end();
  }
  await pipeline(body, res);
}
