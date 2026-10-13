// @vitest-environment node
import type { ServerEnv } from "@/lib/envVariables";
import {
  uploadPatientImage,
  deletePatientImage,
  getPatientImageUrl,
  getOfflinePatientImage,
} from "@/server/utils/imageStorage";

const { mockEnv, s3Send, uploadToCloudinary, deleteFromCloudinary } =
  vi.hoisted(() => ({
    mockEnv: {} as Record<string, string>,
    s3Send: vi.fn(),
    uploadToCloudinary: vi.fn(),
    deleteFromCloudinary: vi.fn(),
  }));

vi.mock("@/lib/envVariables", () => ({ default: mockEnv }));

vi.mock("@/server/utils/cloudinary", () => ({
  uploadToCloudinary,
  deleteFromCloudinary,
}));

vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  S3Client: class {
    send = s3Send;
  },
}));

function setMode(mode: ServerEnv["APP_MODE"]) {
  for (const key of Object.keys(mockEnv)) delete mockEnv[key];
  Object.assign(
    mockEnv,
    mode === "OFFLINE"
      ? {
          APP_MODE: "OFFLINE",
          STORAGE_ENDPOINT: "http://storage.test:9000",
          STORAGE_ACCESS_KEY: "access",
          STORAGE_SECRET_KEY: "secret-key",
          STORAGE_BUCKET: "bucket",
        }
      : {
          APP_MODE: "ONLINE",
          CLOUDINARY_URL_PREFIX: "https://res.cloudinary.com/demo",
        },
  );
}

const image = () => new File(["abc"], "photo.jpg", { type: "image/png" });

beforeEach(() => {
  s3Send.mockReset();
  uploadToCloudinary.mockReset();
  deleteFromCloudinary.mockReset();
});

describe("ONLINE mode (Cloudinary)", () => {
  beforeEach(() => setMode("ONLINE"));

  it("uploads to Cloudinary and never touches S3", async () => {
    uploadToCloudinary.mockResolvedValue("image/upload/v1/abc");

    await expect(uploadPatientImage(image())).resolves.toBe(
      "image/upload/v1/abc",
    );
    expect(s3Send).not.toHaveBeenCalled();
  });

  it("deletes from Cloudinary", async () => {
    await deletePatientImage("image/upload/v1/abc");

    expect(deleteFromCloudinary).toHaveBeenCalledWith("image/upload/v1/abc");
    expect(s3Send).not.toHaveBeenCalled();
  });

  it("builds Cloudinary URLs", () => {
    expect(getPatientImageUrl("image/upload/v1/abc")).toBe(
      "https://res.cloudinary.com/demo/image/upload/v1/abc",
    );
  });

  it("never serves images through the offline route", async () => {
    await expect(getOfflinePatientImage("patients/abc")).resolves.toBeNull();
    expect(s3Send).not.toHaveBeenCalled();
  });
});

describe("OFFLINE mode (RustFS)", () => {
  beforeEach(() => setMode("OFFLINE"));

  it("uploads under a new extensionless key and never touches Cloudinary", async () => {
    s3Send.mockResolvedValue({});

    const id = await uploadPatientImage(image());

    expect(id).toMatch(/^patients\/[0-9a-f-]{36}$/);
    const put = s3Send.mock.calls.at(-1)![0];
    expect(put.constructor.name).toBe("PutObjectCommand");
    expect(put.input).toMatchObject({
      Bucket: "bucket",
      Key: id,
      ContentType: "image/png",
    });
    expect(Buffer.from(put.input.Body).toString()).toBe("abc");
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });

  it("deletes the object", async () => {
    s3Send.mockResolvedValue({});

    await deletePatientImage("patients/abc");

    const del = s3Send.mock.calls[0][0];
    expect(del.constructor.name).toBe("DeleteObjectCommand");
    expect(del.input).toEqual({ Bucket: "bucket", Key: "patients/abc" });
    expect(deleteFromCloudinary).not.toHaveBeenCalled();
  });

  it("builds URLs to the authenticated image route", () => {
    expect(getPatientImageUrl("patients/abc")).toBe("/api/images/patients/abc");
  });

  it("reads patient images", async () => {
    s3Send.mockResolvedValue({
      Body: "stream",
      ContentType: "image/jpeg",
      ContentLength: 3,
    });

    await expect(getOfflinePatientImage("patients/abc")).resolves.toEqual({
      body: "stream",
      contentType: "image/jpeg",
      contentLength: 3,
    });
  });

  it.each(["other/abc", "patients/", "patients/../secret", "patients//abc"])(
    "refuses to read %s",
    async (id) => {
      await expect(getOfflinePatientImage(id)).resolves.toBeNull();
      expect(s3Send).not.toHaveBeenCalled();
    },
  );
});
