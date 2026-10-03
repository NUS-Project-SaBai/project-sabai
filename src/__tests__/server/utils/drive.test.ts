// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mutable env so each test can switch between configured and not configured.
const env = vi.hoisted(() => ({
  GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY: undefined as string | undefined,
  GOOGLE_DRIVE_FOLDER_ID: undefined as string | undefined,
}));
vi.mock("@/lib/envVariables", () => ({ default: env }));

const filesApi = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@googleapis/drive", () => ({
  auth: { GoogleAuth: vi.fn() },
  drive: () => ({ files: filesApi }),
}));

const { getDriveViewUrl, uploadToDrive, renameDriveFile, deleteDriveFile } =
  await import("@/server/utils/drive");

const pdf = () => new File(["%PDF"], "a.pdf", { type: "application/pdf" });

describe("getDriveViewUrl", () => {
  it("builds the Google Drive viewer link for a file ID", () => {
    expect(getDriveViewUrl("1AbC-xyz_123")).toBe(
      "https://drive.google.com/file/d/1AbC-xyz_123/view?usp=sharing",
    );
  });
});

describe("when Google Drive is not configured", () => {
  beforeEach(() => {
    env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY = undefined;
    env.GOOGLE_DRIVE_FOLDER_ID = undefined;
  });

  it("fails file operations with a clear message instead of crashing on import", async () => {
    await expect(uploadToDrive(pdf(), "a.pdf")).rejects.toThrow(
      "Google Drive is not configured",
    );
    expect(filesApi.create).not.toHaveBeenCalled();
  });
});

describe("when the Drive API fails", () => {
  beforeEach(() => {
    env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY = "{}";
    env.GOOGLE_DRIVE_FOLDER_ID = "secret-folder-id";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it.each([
    ["uploadToDrive", () => uploadToDrive(pdf(), "a.pdf"), filesApi.create],
    [
      "renameDriveFile",
      () => renameDriveFile("file-id", "b.pdf"),
      filesApi.update,
    ],
    ["deleteDriveFile", () => deleteDriveFile("file-id"), filesApi.delete],
  ])(
    "%s throws a generic error without Google's details",
    async (_name, call, apiMethod) => {
      apiMethod.mockRejectedValueOnce(
        new Error("File not found: secret-folder-id."),
      );
      const error = await call().catch((e: Error) => e);
      expect(error).toMatchObject({ message: "Could not reach Google Drive" });
      expect(String((error as Error).message)).not.toContain(
        "secret-folder-id",
      );
      expect(console.error).toHaveBeenCalled();
    },
  );
});
