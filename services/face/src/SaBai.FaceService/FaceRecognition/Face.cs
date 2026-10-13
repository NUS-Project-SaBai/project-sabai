namespace SaBai.FaceService.FaceRecognition;

public readonly record struct PointF(float X, float Y);

public readonly record struct BoundingBox(float X1, float Y1, float X2, float Y2)
{
    public float Width => MathF.Max(0, X2 - X1);
    public float Height => MathF.Max(0, Y2 - Y1);
    public float Area => Width * Height;

    public float IoU(BoundingBox other)
    {
        var w = MathF.Min(X2, other.X2) - MathF.Max(X1, other.X1);
        var h = MathF.Min(Y2, other.Y2) - MathF.Max(Y1, other.Y1);
        if (w <= 0 || h <= 0) return 0;
        var inter = w * h;
        return inter / (Area + other.Area - inter);
    }
}

/// <summary>A detected face: bounding box, detector confidence and the five facial landmarks
/// (left eye, right eye, nose tip, left mouth corner, right mouth corner).</summary>
public sealed record DetectedFace(BoundingBox Box, float Score, PointF[] Landmarks);

/// <summary>A detected face together with its L2-normalised identity embedding.</summary>
public sealed record AnalyzedFace(DetectedFace Detection, float[] Embedding);
