// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants/files";

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

const createPresignedPost = vi.hoisted(() => vi.fn());
vi.mock("@aws-sdk/s3-presigned-post", () => ({ createPresignedPost }));

const { fileStorage, VIEW_URL_EXPIRY_SECONDS } =
  await import("@/server/utils/s3");

beforeEach(() => {
  vi.restoreAllMocks();
  send.mockReset();
  getSignedUrl.mockReset();
  createPresignedPost.mockReset();
});

describe("when S3 is configured", () => {
  beforeEach(() => {
    env.S3_BUCKET_NAME = "patient-files";
  });

  it("presigns an upload under a random key in the patient's folder", async () => {
    createPresignedPost.mockResolvedValueOnce({
      url: "https://signed.example",
      fields: { key: "k" },
    });
    const { key, url, fields } = await fileStorage.createUploadPost(
      42,
      "application/pdf",
    );

    expect(key).toMatch(/^patients\/42\/[0-9a-f-]{36}$/);
    expect(url).toBe("https://signed.example");
    expect(fields).toEqual({ key: "k" });
    expect(createPresignedPost.mock.calls[0][1]).toMatchObject({
      Bucket: "patient-files",
      Key: key,
      Fields: { "Content-Type": "application/pdf" },
    });
  });

  it("makes S3 itself refuse empty, oversized or differently typed uploads", async () => {
    createPresignedPost.mockResolvedValueOnce({ url: "u", fields: {} });
    await fileStorage.createUploadPost(42, "application/pdf");

    expect(createPresignedPost.mock.calls[0][1].Conditions).toEqual([
      ["content-length-range", 1, MAX_FILE_SIZE_BYTES],
      ["eq", "$Content-Type", "application/pdf"],
    ]);
  });

  it("reports a missing upload as null rather than an error", async () => {
    send.mockRejectedValueOnce(
      Object.assign(new Error("Not Found"), { name: "NotFound" }),
    );

    expect(await fileStorage.getObjectInfo("patients/42/abc")).toBeNull();
  });

  it("deletes the object by key", async () => {
    send.mockResolvedValueOnce({});
    await fileStorage.delete("patients/42/abc");

    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: "patient-files",
      Key: "patients/42/abc",
    });
  });

  it("presigns a view link that uses the current file name", async () => {
    getSignedUrl.mockResolvedValueOnce("https://signed.example/x");
    const url = await fileStorage.getViewUrl(
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
    await expect(
      fileStorage.createUploadPost(1, "application/pdf"),
    ).rejects.toThrow("S3 is not configured");
    expect(createPresignedPost).not.toHaveBeenCalled();
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
      "createUploadPost",
      () => fileStorage.createUploadPost(1, "application/pdf"),
      createPresignedPost,
    ],
    ["getObjectInfo", () => fileStorage.getObjectInfo("key"), send],
    ["delete", () => fileStorage.delete("key"), send],
    [
      "getViewUrl",
      () => fileStorage.getViewUrl("key", "a.pdf", "application/pdf"),
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
