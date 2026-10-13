namespace SaBai.FaceService.FaceRecognition;

/// <summary>Resolution and geometry guards applied before generating identity embeddings.</summary>
public static class FaceQuality
{
    public static bool IsSuitable(DetectedFace face, FaceRecognitionOptions options)
    {
        var box = face.Box;
        if (!float.IsFinite(face.Score) ||
            !float.IsFinite(box.X1) || !float.IsFinite(box.Y1) ||
            !float.IsFinite(box.X2) || !float.IsFinite(box.Y2) ||
            box.Width <= 0 || box.Height <= 0 ||
            box.Width < options.MinimumFaceSize || box.Height < options.MinimumFaceSize)
            return false;

        if (face.Landmarks.Length != 5 ||
            face.Landmarks.Any(p => !float.IsFinite(p.X) || !float.IsFinite(p.Y)))
            return false;

        var dx = (double)face.Landmarks[1].X - face.Landmarks[0].X;
        var dy = (double)face.Landmarks[1].Y - face.Landmarks[0].Y;
        var eyeDistance = Math.Sqrt(dx * dx + dy * dy);
        if (eyeDistance <= 1e-5 || eyeDistance < options.MinimumEyeDistance)
            return false;

        // Distinct eyes alone do not guarantee an invertible alignment transform.
        var transform = SimilarityTransform.Estimate(face.Landmarks, FaceAligner.ArcFaceTemplate);
        return double.IsFinite(transform.Scale) && transform.Scale > 1e-6;
    }
}
