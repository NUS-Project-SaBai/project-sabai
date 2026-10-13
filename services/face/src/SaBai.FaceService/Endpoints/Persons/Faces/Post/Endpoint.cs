using FastEndpoints;
using SaBai.FaceService.Endpoints.Faces;
using SaBai.FaceService.FaceRecognition;

namespace SaBai.FaceService.Endpoints.Persons.Faces.Post;

public sealed class Request
{
    public string PersonId { get; set; } = null!;
    public IFormFile Image { get; set; } = null!;
}

public sealed record Response(Guid FaceId, string PersonId, FaceDto Face, int FacesDetected);

public class Endpoint(FaceAnalyzer analyzer, FaceStore store) : Endpoint<Request, Response>
{
    public override void Configure()
    {
        Post("/persons/{personId}/faces");
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Enroll a face for a person.";
            s.Description = "Uses the most prominent face in the image. Enroll several photos per person for better accuracy.";
        });
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        PersonId.Validate(this, req.PersonId);
        var image = await FaceImages.LoadAsync(this, req.Image, nameof(req.Image), ct);
        ThrowIfAnyErrors();

        var faces = await analyzer.AnalyzeAsync(image!, ct);
        var face = FaceImages.Largest(faces);
        if (face is null) ThrowError(r => r.Image, "No usable face detected. Use a closer, sharp, well-lit photo.", StatusCodes.Status422UnprocessableEntity);

        var stored = await store.AddAsync(req.PersonId, face.Embedding, ct);
        await Send.ResponseAsync(
            new Response(stored.FaceId, stored.PersonId, FaceDto.From(face.Detection), faces.Count),
            StatusCodes.Status201Created, ct);
    }
}
