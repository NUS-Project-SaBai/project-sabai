import {
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  RekognitionClient,
  SearchFacesByImageCommandInput,
  SearchFacesByImageCommandOutput,
  Image,
  IndexFacesCommandInput,
  IndexFacesCommandOutput,
  DeleteFacesCommandInput,
} from "@aws-sdk/client-rekognition";
import env from "@/lib/envVariables";

const client: RekognitionClient = new RekognitionClient();

/**
 * Indexes faces in the AWS Collection.
 * @param str Base64 encoded string of an image
 * @returns The FaceId of the faceprint.
 */
export async function generateFaceprint(str: string) {
  const image: Image = toImage(str);
  const input: IndexFacesCommandInput = {
    CollectionId: env.COLLECTION_ID,
    Image: image,
  };

  const command = new IndexFacesCommand(input);

  try {
    const results: IndexFacesCommandOutput = await client.send(command);
    return results.FaceRecords?.[0]?.Face?.FaceId;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Removes a faceprint from the AWS Collection.
 * @param faceId The FaceId of the faceprint to delete.
 */
export async function deleteFaceprint(faceId: string) {
  const input: DeleteFacesCommandInput = {
    CollectionId: env.COLLECTION_ID,
    FaceIds: [faceId],
  };

  const command = new DeleteFacesCommand(input);

  try {
    await client.send(command);
  } catch (err) {
    console.error(err);
  }
}

/**
 * Searches existing faceprints for possible matches.
 * @param str Base64 encoded representation of an image.
 * @returns An array of FaceMatches.
 */
export async function searchFaceprint(str: string) {
  const image: Image = toImage(str);
  const input: SearchFacesByImageCommandInput = {
    CollectionId: env.COLLECTION_ID,
    Image: image,
    // Keep the other attributes as default
  };
  const command = new SearchFacesByImageCommand(input);
  try {
    const results: SearchFacesByImageCommandOutput = await client.send(command);

    return results.FaceMatches;
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Converts a base64 encoded string to bytes.
 */
export function toBytes(str: string): Uint8Array<ArrayBuffer> {
  const base64data = str.includes(",") ? str.split(",")[1] : str;
  const binary = atob(base64data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper function to convert a Base64 encoded string to an AWS Rekognition Image.
 * @param str Base64 representation
 * @returns the AWS Rekognition Image of a base64 encoded string.
 */
function toImage(str: string): Image {
  const bytes = toBytes(str);
  return { Bytes: bytes };
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = toBytes(base64);
  return new File([bytes], filename, { type: mimeType });
}
