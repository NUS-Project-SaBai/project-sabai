// @vitest-environment node
import type { ServerEnv } from "@/lib/envVariables";
import {
  generateFaceprint,
  searchFaceprint,
  deleteFaceprint,
} from "@/lib/utils/facialRecognition";

const { mockEnv, rekognitionSend } = vi.hoisted(() => ({
  mockEnv: {} as Record<string, string>,
  rekognitionSend: vi.fn(),
}));

vi.mock("@/lib/envVariables", () => ({ default: mockEnv }));

vi.mock("@aws-sdk/client-rekognition", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  RekognitionClient: class {
    send = rekognitionSend;
  },
}));

const API_KEY = "k".repeat(32);
// "abc" as a data URL, like the webcam capture the router receives
const IMAGE = "data:image/jpeg;base64,YWJj";

function setMode(mode: ServerEnv["APP_MODE"]) {
  for (const key of Object.keys(mockEnv)) delete mockEnv[key];
  Object.assign(
    mockEnv,
    mode === "OFFLINE"
      ? {
          APP_MODE: "OFFLINE",
          FACE_SERVICE_URL: "http://face.test:5080",
          FACE_SERVICE_API_KEY: API_KEY,
        }
      : { APP_MODE: "ONLINE", COLLECTION_ID: "collection" },
  );
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  rekognitionSend.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("OFFLINE mode (face service)", () => {
  beforeEach(() => setMode("OFFLINE"));

  it("enrolls the image under a new person and returns the face id", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ faceId: "face-1" }, 201));

    await expect(generateFaceprint(IMAGE)).resolves.toBe("face-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(
      /^http:\/\/face\.test:5080\/persons\/[0-9a-f-]{36}\/faces$/,
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "X-Api-Key": API_KEY });
    const image = (init.body as FormData).get("image") as Blob;
    expect(await image.text()).toBe("abc");
    expect(rekognitionSend).not.toHaveBeenCalled();
  });

  it("returns undefined when no usable face is found", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ title: "No face" }, 422));

    await expect(generateFaceprint(IMAGE)).resolves.toBeUndefined();
  });

  it("returns the unique face ids matched across every detected face", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        faces: [
          { matches: [{ faceId: "a" }, { faceId: "b" }] },
          { matches: [{ faceId: "b" }] },
          { matches: [] },
        ],
      }),
    );

    await expect(searchFaceprint(IMAGE)).resolves.toEqual(["a", "b"]);

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "http://face.test:5080/faces/identify?maxMatches=20",
    );
  });

  it("deletes the face by id", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await deleteFaceprint("face-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://face.test:5080/faces/face-1");
    expect(init.method).toBe("DELETE");
  });

  it("degrades gracefully when the service is unreachable", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(generateFaceprint(IMAGE)).resolves.toBeUndefined();
    await expect(searchFaceprint(IMAGE)).resolves.toEqual([]);
    await expect(deleteFaceprint("face-1")).resolves.toBeUndefined();
  });
});

describe("ONLINE mode (AWS Rekognition)", () => {
  beforeEach(() => setMode("ONLINE"));

  it("indexes with Rekognition and never calls the face service", async () => {
    rekognitionSend.mockResolvedValue({
      FaceRecords: [{ Face: { FaceId: "aws-face" } }],
    });

    await expect(generateFaceprint(IMAGE)).resolves.toBe("aws-face");
    expect(rekognitionSend.mock.calls[0][0].input.CollectionId).toBe(
      "collection",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the matched face ids", async () => {
    rekognitionSend.mockResolvedValue({
      FaceMatches: [
        { Face: { FaceId: "x" } },
        { Face: {} },
        { Face: { FaceId: "y" } },
      ],
    });

    await expect(searchFaceprint(IMAGE)).resolves.toEqual(["x", "y"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
