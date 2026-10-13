using FastEndpoints;
using SaBai.FaceService.FaceRecognition;

namespace SaBai.FaceService.Endpoints.Persons.Faces.Get;

public sealed class Request
{
    public string PersonId { get; set; } = null!;
}

public sealed record Response(string PersonId, StoredFace[] Faces);

public class Endpoint(FaceStore store) : Endpoint<Request, Response>
{
    public override void Configure()
    {
        Get("/persons/{personId}/faces");
        Summary(s => s.Summary = "List the faces enrolled for a person.");
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        PersonId.Validate(this, req.PersonId);
        ThrowIfAnyErrors();

        var faces = await store.ListAsync(req.PersonId, ct);
        await Send.OkAsync(new Response(req.PersonId, faces.ToArray()), ct);
    }
}
