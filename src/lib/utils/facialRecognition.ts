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
 * Returns an AWS Rekognition Image form of a base64 encoded string.
 */
function toImage(str: string) {
  return { Bytes: Uint8Array.fromBase64(str) };
}
