import { Toaster, toast } from "react-hot-toast";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import UploadDocumentsModal from "@/components/patient-documents/UploadDocumentsModal";

const { mockTrpc, listInvalidate, createUploadUrl, confirmUpload } = vi.hoisted(
  () => {
    const listInvalidate = vi.fn();
    const createUploadUrl = vi.fn();
    const confirmUpload = vi.fn();
    return {
      listInvalidate,
      createUploadUrl,
      confirmUpload,
      mockTrpc: {
        useUtils: vi.fn(() => ({
          filesRouter: { listByPatientId: { invalidate: listInvalidate } },
        })),
        filesRouter: {
          createUploadUrl: {
            useMutation: vi.fn(() => ({ mutateAsync: createUploadUrl })),
          },
          confirmUpload: {
            useMutation: vi.fn(() => ({ mutateAsync: confirmUpload })),
          },
        },
      },
    };
  },
);

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

const PATIENT_ID = 3;
const fetchMock = vi.fn();

function pdf(name: string, contents = "%PDF") {
  return new File([contents], name, { type: "application/pdf" });
}

// Modal opens the <dialog> inside a requestAnimationFrame; until then its contents are hidden
// from role queries.
async function renderModal() {
  const onClose = vi.fn();
  const view = render(
    <>
      <UploadDocumentsModal patientId={PATIENT_ID} onClose={onClose} />
      <Toaster />
    </>,
  );
  const input =
    view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  // applyAccept: false so invalid types reach the component's own check.
  const user = userEvent.setup({ applyAccept: false });
  await screen.findByRole("button", { name: "Upload" });
  return { onClose, input, user };
}

describe("UploadDocumentsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.remove();
    vi.stubGlobal("fetch", fetchMock);
    createUploadUrl.mockImplementation(async ({ fileName }) => ({
      key: `patients/${PATIENT_ID}/${fileName}`,
      url: "https://bucket.s3.example.com",
      fields: { "Content-Type": "application/pdf", Policy: "p" },
    }));
    fetchMock.mockResolvedValue({ ok: true, status: 204 });
    confirmUpload.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("rejects an oversized file before upload", async () => {
    const { input, user } = await renderModal();
    const big = pdf("big.pdf");
    Object.defineProperty(big, "size", { value: 26 * 1024 * 1024 });
    await user.upload(input, big);

    expect(
      await screen.findByText("big.pdf - File is too large!"),
    ).toBeInTheDocument();
    expect(createUploadUrl).not.toHaveBeenCalled();
  });

  it("uploads the other files when one fails, and names the failed file", async () => {
    fetchMock.mockImplementation(async (_url, { body }: { body: FormData }) =>
      (body.get("file") as File).name === "bad.pdf"
        ? { ok: false, status: 403 }
        : { ok: true, status: 204 },
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { input, user, onClose } = await renderModal();
    await user.upload(input, [pdf("good.pdf"), pdf("bad.pdf")]);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      await screen.findByText(/Failed to upload:\s*bad\.pdf/),
    ).toBeInTheDocument();
    expect(confirmUpload).toHaveBeenCalledTimes(1);
    expect(confirmUpload).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "good.pdf" }),
    );
    expect(listInvalidate).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // Only the failed file stays selected, ready to retry.
    expect(screen.queryByText("good.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("bad.pdf")).toBeInTheDocument();
  });

  it("shows the server's reason for a failed file", async () => {
    createUploadUrl.mockRejectedValue(new Error("Invalid patient 3"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { input, user } = await renderModal();
    await user.upload(input, pdf("a.pdf"));
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      await screen.findByText(/a\.pdf - Invalid patient 3/),
    ).toBeInTheDocument();
  });

  it("keeps a file whose confirm fails, and doesn't refresh when nothing uploaded", async () => {
    confirmUpload.mockRejectedValue(new Error("a.pdf - File was not uploaded"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { input, user, onClose } = await renderModal();
    await user.upload(input, pdf("a.pdf"));
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      await screen.findByText(/a\.pdf - File was not uploaded/),
    ).toBeInTheDocument();
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
    expect(listInvalidate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("can't be closed while an upload is running", async () => {
    let finishUpload!: (value: { ok: boolean; status: number }) => void;
    fetchMock.mockImplementation(
      () => new Promise((resolve) => (finishUpload = resolve)),
    );
    const { input, user, onClose } = await renderModal();
    await user.upload(input, pdf("a.pdf"));
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).not.toHaveBeenCalled();

    finishUpload({ ok: true, status: 204 });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("ignores a file that is already selected", async () => {
    const { input, user } = await renderModal();
    const file = pdf("a.pdf");
    await user.upload(input, file);
    await user.upload(input, file);

    expect(screen.getAllByText("a.pdf")).toHaveLength(1);
  });

  it("stops a file dropped outside the drop zone from opening in the tab", async () => {
    await renderModal();
    const drop = (target: EventTarget) => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const dragOver = (target: EventTarget) => {
      const event = new Event("dragover", { bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };

    const title = screen.getByRole("heading", { name: "Upload Document" });
    expect(dragOver(title)).toBe(true);
    expect(drop(title)).toBe(true);
    expect(drop(document.body)).toBe(true);
  });
});
