using FastEndpoints;
using Microsoft.Extensions.Options;
using SaBai.FaceService.FaceRecognition;

namespace SaBai.FaceService.Endpoints.Faces.Verify.Post;

public sealed class Request
{
    public IFormFile First { get; set; } = null!;
    public IFormFile Second { get; set; } = null!;
}

public sealed record Response(float Similarity, bool IsMatch, float Threshold, FaceDto First, FaceDto Second);

public class Endpoint(FaceAnalyzer analyzer, IOptions<FaceRecognitionOptions> options) : Endpoint<Request, Response>
{
    public override void Configure()
    {
        Post("/faces/verify");
        AllowFileUploads();
        Summary(s => s.Summary = "Compare the most prominent face in two images (1:1 verification).");
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var first = await FaceImages.LoadAsync(this, req.First, nameof(req.First), ct);
        var second = await FaceImages.LoadAsync(this, req.Second, nameof(req.Second), ct);
        ThrowIfAnyErrors();

        var a = FaceImages.Largest(await analyzer.AnalyzeAsync(first!, ct));
        var b = FaceImages.Largest(await analyzer.AnalyzeAsync(second!, ct));
        if (a is null) AddError(r => r.First, "No usable face detected. Use a closer, sharp, well-lit photo.");
        if (b is null) AddError(r => r.Second, "No usable face detected. Use a closer, sharp, well-lit photo.");
        ThrowIfAnyErrors(StatusCodes.Status422UnprocessableEntity);

        var similarity = ArcFaceEmbedder.Similarity(a!.Embedding, b!.Embedding);
        var threshold = options.Value.MatchThreshold;
        await Send.OkAsync(new Response(similarity, similarity >= threshold, threshold,
            FaceDto.From(a.Detection), FaceDto.From(b.Detection)), ct);
    }
}
