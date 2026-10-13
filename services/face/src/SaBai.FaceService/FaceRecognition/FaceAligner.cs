namespace SaBai.FaceService.FaceRecognition;

/// <summary>
/// Aligns a face to the canonical 112x112 ArcFace crop using a least-squares similarity
/// transform (rotation, uniform scale and translation) of its five landmarks.
/// </summary>
public static class FaceAligner
{
    public const int Size = 112;

    /// <summary>Reference landmark positions used to train InsightFace ArcFace models.</summary>
    public static readonly PointF[] ArcFaceTemplate =
    [
        new(38.2946f, 51.6963f),
        new(73.5318f, 51.5014f),
        new(56.0252f, 71.7366f),
        new(41.5493f, 92.3655f),
        new(70.7299f, 92.2041f),
    ];

    public static RgbImage Align(RgbImage image, IReadOnlyList<PointF> landmarks)
    {
        var t = SimilarityTransform.Estimate(landmarks, ArcFaceTemplate);
        var inverse = t.Inverse();
        var output = new RgbImage(Size, Size);
        for (var y = 0; y < Size; y++)
            for (var x = 0; x < Size; x++)
            {
                var (sx, sy) = inverse.Apply(x, y);
                ImageOps.SampleBilinear(image, sx, sy, output.Pixels.AsSpan((y * Size + x) * 3, 3));
            }

        return output;
    }
}

/// <summary>2D similarity transform: [x', y'] = [[a, -b], [b, a]] * [x, y] + [tx, ty].</summary>
public readonly record struct SimilarityTransform(double A, double B, double Tx, double Ty)
{
    public double Scale => Math.Sqrt(A * A + B * B);
    public double RotationRadians => Math.Atan2(B, A);

    public (float X, float Y) Apply(double x, double y) =>
        ((float)(A * x - B * y + Tx), (float)(B * x + A * y + Ty));

    public SimilarityTransform Inverse()
    {
        var d = A * A + B * B;
        var ia = A / d;
        var ib = -B / d;
        return new SimilarityTransform(ia, ib, -(ia * Tx - ib * Ty), -(ib * Tx + ia * Ty));
    }

    /// <summary>Closed-form least-squares fit (Umeyama without reflection) mapping src onto dst.</summary>
    public static SimilarityTransform Estimate(IReadOnlyList<PointF> src, IReadOnlyList<PointF> dst)
    {
        if (src.Count != dst.Count || src.Count < 2)
            throw new ArgumentException("Need at least two matching point pairs.");

        double msx = 0, msy = 0, mdx = 0, mdy = 0;
        for (var i = 0; i < src.Count; i++)
        {
            msx += src[i].X; msy += src[i].Y;
            mdx += dst[i].X; mdy += dst[i].Y;
        }

        msx /= src.Count; msy /= src.Count; mdx /= src.Count; mdy /= src.Count;

        double norm = 0, dot = 0, cross = 0;
        for (var i = 0; i < src.Count; i++)
        {
            double ax = src[i].X - msx, ay = src[i].Y - msy;
            double bx = dst[i].X - mdx, by = dst[i].Y - mdy;
            norm += ax * ax + ay * ay;
            dot += ax * bx + ay * by;
            cross += ax * by - ay * bx;
        }

        if (norm < 1e-12) throw new ArgumentException("Source points are degenerate.");

        var a = dot / norm;
        var b = cross / norm;
        return new SimilarityTransform(a, b, mdx - (a * msx - b * msy), mdy - (b * msx + a * msy));
    }
}
