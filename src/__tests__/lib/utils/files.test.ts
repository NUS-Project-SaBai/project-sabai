import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants/files";
import { getFileError } from "@/lib/utils/files";

const TYPE_ERROR = "Only PDF, JPEG, PNG and DOCX files are allowed";

describe("getFileError", () => {
  it.each(ALLOWED_FILE_TYPES)("allows %s", (type) => {
    expect(getFileError(1, type)).toBeNull();
  });

  it.each([
    [0, "application/pdf", "File is empty"],
    [MAX_FILE_SIZE_BYTES, "application/pdf", null],
    [MAX_FILE_SIZE_BYTES + 1, "application/pdf", "File is too large!"],
    [1, "text/plain", TYPE_ERROR],
    [1, "", TYPE_ERROR],
    [1, undefined, TYPE_ERROR],
  ])("size %s, type %s -> %s", (size, type, expected) => {
    expect(getFileError(size, type)).toBe(expected);
  });
});
