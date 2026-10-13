// @vitest-environment node
import { Readable, Writable } from "stream";
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/images/[...key]";

const { getRequestUser, getOfflinePatientImage } = vi.hoisted(() => ({
  getRequestUser: vi.fn(),
  getOfflinePatientImage: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ getRequestUser }));
vi.mock("@/server/utils/imageStorage", () => ({ getOfflinePatientImage }));

/** Minimal NextApiResponse that collects what the handler writes. */
function createResponse() {
  const chunks: Buffer[] = [];
  const res = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  }) as Writable & Record<string, unknown>;
  const headers: Record<string, unknown> = {};
  res.statusCode = 200;
  res.setHeader = (name: string, value: unknown) => {
    headers[name.toLowerCase()] = value;
    return res;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  return {
    res: res as unknown as NextApiResponse,
    headers,
    body: () => Buffer.concat(chunks).toString(),
  };
}

function request(method: string, key: string[]) {
  return { method, query: { key }, headers: {} } as unknown as NextApiRequest;
}

beforeEach(() => {
  getRequestUser.mockReset().mockResolvedValue({ id: "user-1" });
  getOfflinePatientImage.mockReset();
});

it("rejects requests without a session", async () => {
  getRequestUser.mockResolvedValue(null);
  const { res } = createResponse();

  await handler(request("GET", ["patients", "abc"]), res);

  expect(res.statusCode).toBe(401);
  expect(getOfflinePatientImage).not.toHaveBeenCalled();
});

it("only allows GET and HEAD", async () => {
  const { res, headers } = createResponse();

  await handler(request("POST", ["patients", "abc"]), res);

  expect(res.statusCode).toBe(405);
  expect(headers.allow).toBe("GET, HEAD");
});

it("returns 404 when there's no such image", async () => {
  getOfflinePatientImage.mockResolvedValue(null);
  const { res } = createResponse();

  await handler(request("GET", ["patients", "abc"]), res);

  expect(getOfflinePatientImage).toHaveBeenCalledWith("patients/abc");
  expect(res.statusCode).toBe(404);
});

it("streams the image with caching headers", async () => {
  getOfflinePatientImage.mockResolvedValue({
    body: Readable.from([Buffer.from("jpeg-bytes")]),
    contentType: "image/jpeg",
    contentLength: 10,
  });
  const { res, headers, body } = createResponse();

  await handler(request("GET", ["patients", "abc"]), res);

  expect(res.statusCode).toBe(200);
  expect(body()).toBe("jpeg-bytes");
  expect(headers).toMatchObject({
    "content-type": "image/jpeg",
    "content-length": 10,
    "cache-control": "private, max-age=31536000, immutable",
  });
});
