using FastEndpoints;
using SaBai.FaceService.FaceRecognition;

namespace SaBai.FaceService.Endpoints.Faces;

public sealed record BoxDto(float X, float Y, float Width, float Height);

public sealed record PointDto(float X, float Y);

public sealed record FaceDto(BoxDto Box, float Score, PointDto[] Landmarks)
{
    public static FaceDto From(DetectedFace face) => new(
        new BoxDto(face.Box.X1, face.Box.Y1, face.Box.Width, face.Box.Height),
        face.Score,
        face.Landmarks.Select(p => new PointDto(p.X, p.Y)).ToArray());
}

public sealed record MatchDto(string PersonId, Guid FaceId, float Similarity);

public static class FaceImages
{
    private const long MaxPixels = 50_000_000;

    /// <summary>Decodes an uploaded image, recording a validation error on failure.</summary>
    public static async Task<RgbImage?> LoadAsync(IEndpoint endpoint, IFormFile? file, string property, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            endpoint.ValidationFailures.Add(new(property, "An image file is required."));
            return null;
        }

        try
        {
            await using var stream = file.OpenReadStream();
            using var buffer = new MemoryStream((int)file.Length);
            await stream.CopyToAsync(buffer, ct);
            buffer.Position = 0;
            var image = RgbImage.Decode(buffer);
            if ((long)image.Width * image.Height > MaxPixels)
            {
                endpoint.ValidationFailures.Add(new(property, "Image resolution is too large."));
                return null;
            }

            return image;
        }
        catch (InvalidImageException ex)
        {
            endpoint.ValidationFailures.Add(new(property, ex.Message));
            return null;
        }
    }

    public static AnalyzedFace? Largest(IEnumerable<AnalyzedFace> faces) => faces.MaxBy(f => f.Detection.Box.Area);
}
