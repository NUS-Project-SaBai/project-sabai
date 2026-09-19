import { extractCloudinaryPublicId } from "@/server/utils/cloudinary";

describe("extractCloudinaryPublicId", () => {
  it("strips the image/upload/v{version}/ prefix", () => {
    expect(
      extractCloudinaryPublicId("image/upload/v1723200000/abc123xyz"),
    ).toBe("abc123xyz");
  });

  it("handles any version number length", () => {
    expect(extractCloudinaryPublicId("image/upload/v42/xyz")).toBe("xyz");
  });

  it("preserves folder segments within the public id", () => {
    expect(
      extractCloudinaryPublicId("image/upload/v1723200000/patients/photo123"),
    ).toBe("patients/photo123");
  });

  it("preserves a file extension in the public id", () => {
    expect(
      extractCloudinaryPublicId("image/upload/v1723200000/abc123.jpg"),
    ).toBe("abc123.jpg");
  });

  it("returns the input unchanged when the prefix is absent", () => {
    expect(extractCloudinaryPublicId("abc123xyz")).toBe("abc123xyz");
  });

  it("returns an empty string when given an empty string", () => {
    expect(extractCloudinaryPublicId("")).toBe("");
  });
});
