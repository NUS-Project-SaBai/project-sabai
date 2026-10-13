using FastEndpoints;
using SaBai.FaceService.FaceRecognition;

namespace SaBai.FaceService.Endpoints.Faces.Detect.Post;

public sealed class Request
{
    public IFormFile Image { get; set; } = null!;
}

public sealed record Response(int Width, int Height, FaceDto[] Faces);

public class Endpoint(FaceAnalyzer analyzer) : Endpoint<Request, Response>
{
    public override void Configure()
    {
        Post("/faces/detect");
        AllowFileUploads();
        Summary(s => s.Summary = "Detect faces and their five-point landmarks in an image.");
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var image = await FaceImages.LoadAsync(this, req.Image, nameof(req.Image), ct);
        ThrowIfAnyErrors();

        var faces = await analyzer.DetectAsync(image!, ct);
        await Send.OkAsync(new Response(image!.Width, image.Height, faces.Select(FaceDto.From).ToArray()), ct);
    }
}
