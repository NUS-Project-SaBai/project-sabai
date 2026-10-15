// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mutable env so each test can switch between configured and not configured.
const env = vi.hoisted(() => ({
  S3_BUCKET_NAME: undefined as string | undefined,
}));
vi.mock("@/lib/envVariables", () => ({ default: env }));

const send = vi.hoisted(() => vi.fn());
vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@aws-sdk/client-s3")>()),
  S3Client: class {
    send = send;
  },
}));

const getSignedUrl = vi.hoisted(() => vi.fn());
vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl }));

const {
  createS3UploadUrl,
  getS3ObjectInfo,
  deleteFromS3,
  getS3ViewUrl,
  VIEW_URL_EXPIRY_SECONDS,
} = await import("@/server/utils/s3");

beforeEach(() => {
  vi.restoreAllMocks();
  send.mockReset();
  getSignedUrl.mockReset();
});

describe("when S3 is configured", () => {
  beforeEach(() => {
    env.S3_BUCKET_NAME = "patient-files";
  });

  it("presigns an upload under a random key in the patient's folder", async () => {
    getSignedUrl.mockResolvedValueOnce("https://signed.example/put");
    const { key, uploadUrl } = await createS3UploadUrl(42, "application/pdf");

    expect(key).toMatch(/^patients\/42\/[0-9a-f-]{36}$/);
    expect(uploadUrl).toBe("https://signed.example/put");
    const [, command] = getSignedUrl.mock.calls[0];
    expect(command.input).toEqual({
      Bucket: "patient-files",
      Key: key,
      ContentType: "application/pdf",
    });
  });

  it("reports a missing upload as null rather than an error", async () => {
    send.mockRejectedValueOnce(
      Object.assign(new Error("Not Found"), { name: "NotFound" }),
    );

    expect(await getS3ObjectInfo("patients/42/abc")).toBeNull();
  });

  it("deletes the object by key", async () => {
    send.mockResolvedValueOnce({});
    await deleteFromS3("patients/42/abc");

    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: "patient-files",
      Key: "patients/42/abc",
    });
  });

  it("presigns a view link that uses the current file name", async () => {
    getSignedUrl.mockResolvedValueOnce("https://signed.example/x");
    const url = await getS3ViewUrl(
      "patients/42/abc",
      "Referral letter.pdf",
      "application/pdf",
    );

    expect(url).toBe("https://signed.example/x");
    const [, command, options] = getSignedUrl.mock.calls[0];
    expect(command.input).toEqual({
      Bucket: "patient-files",
      Key: "patients/42/abc",
      ResponseContentType: "application/pdf",
      ResponseContentDisposition:
        "inline; filename*=UTF-8''Referral%20letter.pdf",
    });
    expect(options).toEqual({ expiresIn: VIEW_URL_EXPIRY_SECONDS });
  });
});

describe("when S3 is not configured", () => {
  beforeEach(() => {
    env.S3_BUCKET_NAME = undefined;
  });

  it("fails file operations with a clear message instead of crashing on import", async () => {
    await expect(createS3UploadUrl(1, "application/pdf")).rejects.toThrow(
      "S3 is not configured",
    );
    expect(getSignedUrl).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});

describe("when the S3 API fails", () => {
  beforeEach(() => {
    env.S3_BUCKET_NAME = "secret-bucket";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([
    [
      "createS3UploadUrl",
      () => createS3UploadUrl(1, "application/pdf"),
      getSignedUrl,
    ],
    ["getS3ObjectInfo", () => getS3ObjectInfo("key"), send],
    ["deleteFromS3", () => deleteFromS3("key"), send],
    [
      "getS3ViewUrl",
      () => getS3ViewUrl("key", "a.pdf", "application/pdf"),
      getSignedUrl,
    ],
  ])(
    "%s throws a generic error without AWS's details",
    async (_name, call, apiMethod) => {
      apiMethod.mockRejectedValueOnce(
        new Error("Access Denied for bucket secret-bucket"),
      );
      const error = await call().catch((e: Error) => e);
      expect(error).toMatchObject({ message: "Could not reach file storage" });
      expect(String((error as Error).message)).not.toContain("secret-bucket");
      expect(console.error).toHaveBeenCalledTimes(1);
    },
  );
});
