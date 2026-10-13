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
import env, { type ServerEnv } from "@/lib/envVariables";

/*
 * Faceprints are stored by AWS Rekognition when APP_MODE is ONLINE, and by the
 * local face service container (services/face) when APP_MODE is OFFLINE.
 * Either way a faceprint is identified by an opaque face ID, which is what
 * patients.rekognitionFaceId holds.
 */

type OnlineEnv = Extract<ServerEnv, { APP_MODE: "ONLINE" }>;
type OfflineEnv = Extract<ServerEnv, { APP_MODE: "OFFLINE" }>;

/**
 * Indexes the face in an image.
 * @param str Base64 encoded string of an image
 * @returns The FaceId of the faceprint, or undefined if none was created.
 */
export async function generateFaceprint(str: string) {
  return env.APP_MODE === "OFFLINE"
    ? enrollWithFaceService(env, str)
    : indexWithRekognition(env, str);
}

/**
 * Removes a faceprint.
 * @param faceId The FaceId of the faceprint to delete.
 */
export async function deleteFaceprint(faceId: string) {
  return env.APP_MODE === "OFFLINE"
    ? deleteWithFaceService(env, faceId)
    : deleteWithRekognition(env, faceId);
}

/**
 * Searches existing faceprints for possible matches.
 * @param str Base64 encoded representation of an image.
 * @returns The FaceIds of the matching faceprints.
 */
export async function searchFaceprint(str: string): Promise<string[]> {
  return env.APP_MODE === "OFFLINE"
    ? searchWithFaceService(env, str)
    : searchWithRekognition(env, str);
}

// ONLINE: AWS Rekognition

let rekognitionClient: RekognitionClient | undefined;

function getRekognitionClient() {
  rekognitionClient ??= new RekognitionClient();
  return rekognitionClient;
}

async function indexWithRekognition(env: OnlineEnv, str: string) {
  const image: Image = toImage(str);
  const input: IndexFacesCommandInput = {
    CollectionId: env.COLLECTION_ID,
    Image: image,
  };

  const command = new IndexFacesCommand(input);

  try {
    const results: IndexFacesCommandOutput =
      await getRekognitionClient().send(command);
    return results.FaceRecords?.[0]?.Face?.FaceId;
  } catch (err) {
    console.error(err);
  }
}

async function deleteWithRekognition(env: OnlineEnv, faceId: string) {
  const input: DeleteFacesCommandInput = {
    CollectionId: env.COLLECTION_ID,
    FaceIds: [faceId],
  };

  const command = new DeleteFacesCommand(input);

  try {
    await getRekognitionClient().send(command);
  } catch (err) {
    console.error(err);
  }
}

async function searchWithRekognition(env: OnlineEnv, str: string) {
  const image: Image = toImage(str);
  const input: SearchFacesByImageCommandInput = {
    CollectionId: env.COLLECTION_ID,
    Image: image,
    // Keep the other attributes as default
  };
  const command = new SearchFacesByImageCommand(input);
  try {
    const results: SearchFacesByImageCommandOutput =
      await getRekognitionClient().send(command);

    return (results.FaceMatches ?? [])
      .map((match) => match.Face?.FaceId)
      .filter((id): id is string => typeof id === "string");
  } catch (err) {
    console.error(err);
    return [];
  }
}

// OFFLINE: local face service (services/face)

// The face service caps matches per face at 20.
const FACE_SERVICE_MAX_MATCHES = 20;

function callFaceService(env: OfflineEnv, path: string, init: RequestInit) {
  return fetch(new URL(path, env.FACE_SERVICE_URL), {
    ...init,
    headers: { "X-Api-Key": env.FACE_SERVICE_API_KEY },
  });
}

function toImageForm(str: string) {
  const form = new FormData();
  // The service detects the actual format from the bytes.
  form.append("image", new Blob([toBytes(str)]), "face.jpg");
  return form;
}

async function enrollWithFaceService(env: OfflineEnv, str: string) {
  try {
    // Each faceprint gets its own person: patients link to faceprints by face ID,
    // and the patient may not exist yet when the faceprint is created.
    const res = await callFaceService(
      env,
      `/persons/${crypto.randomUUID()}/faces`,
      { method: "POST", body: toImageForm(str) },
    );
    if (!res.ok) {
      console.error(
        `Face service enroll failed (${res.status}):`,
        await res.text(),
      );
      return undefined;
    }
    const body = (await res.json()) as { faceId: string };
    return body.faceId;
  } catch (err) {
    console.error(err);
  }
}

async function deleteWithFaceService(env: OfflineEnv, faceId: string) {
  try {
    const res = await callFaceService(
      env,
      `/faces/${encodeURIComponent(faceId)}`,
      { method: "DELETE" },
    );
    if (!res.ok && res.status !== 404) {
      console.error(
        `Face service delete failed (${res.status}):`,
        await res.text(),
      );
    }
  } catch (err) {
    console.error(err);
  }
}

async function searchWithFaceService(env: OfflineEnv, str: string) {
  try {
    const res = await callFaceService(
      env,
      `/faces/identify?maxMatches=${FACE_SERVICE_MAX_MATCHES}`,
      { method: "POST", body: toImageForm(str) },
    );
    if (!res.ok) {
      console.error(
        `Face service identify failed (${res.status}):`,
        await res.text(),
      );
      return [];
    }
    const body = (await res.json()) as {
      faces: { matches: { faceId: string }[] }[];
    };
    const faceIds = body.faces.flatMap((face) =>
      face.matches.map((match) => match.faceId),
    );
    return [...new Set(faceIds)];
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
