import {
  IndexFacesCommand,
  SearchFacesByImageCommand,
  RekognitionClient,
  SearchFacesByImageCommandInput,
  SearchFacesByImageCommandOutput,
  Image,
  IndexFacesCommandInput,
  IndexFacesCommandOutput,
} from "@aws-sdk/client-rekognition";
import env from "@/lib/envVariables";

export async function generateFaceprint(str: string) {
  const image: Image = toImage(str);
  const input: IndexFacesCommandInput = {
    CollectionId: env.COLLECTION_ID,
    Image: image,
  };

  const client: RekognitionClient = new RekognitionClient();
  const command = new IndexFacesCommand(input);

  try {
    const results: IndexFacesCommandOutput = await client.send(command);

    return results.$metadata.httpStatusCode; // Hopefully this is only 200 for true successes lol to check
  } catch (err) {
    console.error(err);
  }
}

export async function searchFaceprint(str: string) {
  const image: Image = toImage(str);
  const input: SearchFacesByImageCommandInput = {
    CollectionId: env.COLLECTION_ID,
    Image: image,
    // Keep the other attributes as default
  };
  const client: RekognitionClient = new RekognitionClient();
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
 * Returns the byte representation of a base64 encoded string.
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
 *
 * @param str Base64 representation
 * @returns the AWS Rekognition Image of a base64 encoded string.
 */
function toImage(str: string): Image {
  const bytes = toBytes(str);
  return { Bytes: bytes };
}
