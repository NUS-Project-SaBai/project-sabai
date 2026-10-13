using FastEndpoints;
using SaBai.FaceService.FaceRecognition;

namespace SaBai.FaceService.Endpoints.Faces.Delete;

public sealed class Request
{
    public Guid FaceId { get; set; }
}

public class Endpoint(FaceStore store) : Endpoint<Request>
{
    public override void Configure()
    {
        Delete("/faces/{faceId}");
        Summary(s => s.Summary = "Delete a single enrolled face.");
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if (await store.DeleteFaceAsync(req.FaceId, ct))
            await Send.NoContentAsync(ct);
        else
            await Send.NotFoundAsync(ct);
    }
}
