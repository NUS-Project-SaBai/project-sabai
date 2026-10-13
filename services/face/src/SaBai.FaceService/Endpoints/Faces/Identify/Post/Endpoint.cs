using FastEndpoints;
using Microsoft.Extensions.Options;
using SaBai.FaceService.FaceRecognition;

namespace SaBai.FaceService.Endpoints.Faces.Identify.Post;

public sealed class Request
{
    public IFormFile Image { get; set; } = null!;

    /// <summary>Minimum cosine similarity for a match. Defaults to the configured match threshold.</summary>
    [QueryParam]
    public float? Threshold { get; set; }

    /// <summary>Maximum number of candidate people returned per face.</summary>
    [QueryParam]
    public int MaxMatches { get; set; } = 1;
}

public sealed record IdentifiedFace(FaceDto Face, MatchDto[] Matches);

public sealed record Response(IdentifiedFace[] Faces);

public class Endpoint(FaceAnalyzer analyzer, FaceStore store, IOptions<FaceRecognitionOptions> options)
    : Endpoint<Request, Response>
{
    public override void Configure()
    {
        Post("/faces/identify");
        AllowFileUploads();
        Summary(s => s.Summary = "Identify every face in an image against the enrolled people.");
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if (req.Threshold is < -1 or > 1) AddError(r => r.Threshold!, "Threshold must be between -1 and 1.");
        if (req.MaxMatches is < 1 or > 20) AddError(r => r.MaxMatches, "MaxMatches must be between 1 and 20.");
        var image = await FaceImages.LoadAsync(this, req.Image, nameof(req.Image), ct);
        ThrowIfAnyErrors();

        var threshold = req.Threshold ?? options.Value.MatchThreshold;
        var faces = await analyzer.AnalyzeAsync(image!, ct);
        var results = new IdentifiedFace[faces.Count];
        for (var i = 0; i < faces.Count; i++)
        {
            var matches = await store.SearchAsync(faces[i].Embedding, threshold, req.MaxMatches, ct);
            results[i] = new IdentifiedFace(
                FaceDto.From(faces[i].Detection),
                matches.Select(m => new MatchDto(m.PersonId, m.FaceId, m.Similarity)).ToArray());
        }

        await Send.OkAsync(new Response(results), ct);
    }
}
