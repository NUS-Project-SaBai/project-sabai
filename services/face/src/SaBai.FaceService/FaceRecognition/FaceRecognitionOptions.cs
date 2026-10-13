namespace SaBai.FaceService.FaceRecognition;

public sealed class FaceRecognitionOptions
{
    public const string SectionName = "FaceRecognition";

    /// <summary>Directory holding the ONNX models. Defaults to a per-user data directory.</summary>
    public string ModelsDirectory { get; set; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData, Environment.SpecialFolderOption.Create),
        "sabai", "models");

    /// <summary>File name of the SCRFD face detection model inside <see cref="ModelsDirectory"/>.</summary>
    public string DetectorModel { get; set; } = "det_10g.onnx";

    /// <summary>File name of the ArcFace recognition model inside <see cref="ModelsDirectory"/>.</summary>
    public string RecognizerModel { get; set; } = "w600k_r50.onnx";

    /// <summary>Download missing models from <see cref="ModelPackUrl"/> on first use.</summary>
    public bool AutoDownloadModels { get; set; } = true;

    /// <summary>Zip archive containing both models (InsightFace buffalo_l pack by default).</summary>
    public string ModelPackUrl { get; set; } =
        "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip";

    /// <summary>Square input size the detector runs at.</summary>
    public int DetectionSize { get; set; } = 640;

    /// <summary>Minimum detector confidence for a face to be kept.</summary>
    public float DetectionThreshold { get; set; } = 0.5f;

    /// <summary>IoU threshold for non-maximum suppression.</summary>
    public float NmsThreshold { get; set; } = 0.4f;

    /// <summary>Minimum face width and height in source pixels for recognition; zero disables the size guard.</summary>
    public int MinimumFaceSize { get; set; } = 40;

    /// <summary>Minimum distance between the eyes in source pixels; zero disables the resolution guard.</summary>
    public float MinimumEyeDistance { get; set; } = 12f;

    /// <summary>Cosine similarity at or above which two faces are considered the same person.</summary>
    public float MatchThreshold { get; set; } = 0.4f;

    /// <summary>Qdrant collection storing face embeddings.</summary>
    public string CollectionName { get; set; } = "faces";

    /// <summary>Use the CUDA execution provider when available (requires the GPU ONNX Runtime package).</summary>
    public bool UseCuda { get; set; }
}
