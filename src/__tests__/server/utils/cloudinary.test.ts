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

  it("returns the input unchanged when the prefix is absent", () => {
    expect(extractCloudinaryPublicId("abc123xyz")).toBe("abc123xyz");
  });
});
