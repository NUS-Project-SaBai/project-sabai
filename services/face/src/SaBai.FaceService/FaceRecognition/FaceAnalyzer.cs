using Microsoft.Extensions.Options;
using Microsoft.ML.OnnxRuntime;
using SessionOptions = Microsoft.ML.OnnxRuntime.SessionOptions;

namespace SaBai.FaceService.FaceRecognition;

/// <summary>
/// Face detection + recognition pipeline: SCRFD detection, five-point alignment and ArcFace
/// embedding. Models are loaded lazily (and downloaded if needed) on first use.
/// </summary>
public sealed class FaceAnalyzer(
    FaceModelProvisioner provisioner,
    IOptions<FaceRecognitionOptions> options,
    ILogger<FaceAnalyzer> logger) : IDisposable
{
    private readonly FaceRecognitionOptions _options = options.Value;
    private readonly SemaphoreSlim _initLock = new(1, 1);
    private volatile Models? _models;

    private sealed record Models(ScrfdFaceDetector Detector, ArcFaceEmbedder Embedder);

    public bool IsReady => _models is not null;

    /// <summary>Embedding dimensionality of the loaded recognition model.</summary>
    public async Task<int> GetEmbeddingSizeAsync(CancellationToken ct) => (await GetModelsAsync(ct)).Embedder.Dimensions;

    public async Task<IReadOnlyList<DetectedFace>> DetectAsync(RgbImage image, CancellationToken ct)
    {
        var models = await GetModelsAsync(ct);
        return models.Detector.Detect(image, _options.DetectionSize, _options.DetectionThreshold, _options.NmsThreshold);
    }

    public async Task<IReadOnlyList<AnalyzedFace>> AnalyzeAsync(RgbImage image, CancellationToken ct)
    {
        var models = await GetModelsAsync(ct);
        var faces = models.Detector.Detect(image, _options.DetectionSize, _options.DetectionThreshold, _options.NmsThreshold);
        faces = faces.Where(f => FaceQuality.IsSuitable(f, _options)).ToList();
        var aligned = faces.Select(f => FaceAligner.Align(image, f.Landmarks)).ToList();
        var embeddings = models.Embedder.Embed(aligned);
        return faces.Zip(embeddings, (face, embedding) => new AnalyzedFace(face, embedding)).ToList();
    }

    public Task WarmUpAsync(CancellationToken ct) => GetModelsAsync(ct);

    private async Task<Models> GetModelsAsync(CancellationToken ct)
    {
        if (_models is { } loaded) return loaded;

        await _initLock.WaitAsync(ct);
        try
        {
            if (_models is not null) return _models;

            await provisioner.EnsureModelsAsync(ct);
            var detector = new ScrfdFaceDetector(CreateSession(provisioner.DetectorPath));
            var embedder = new ArcFaceEmbedder(CreateSession(provisioner.RecognizerPath));
            logger.LogInformation("Face models loaded ({Dimensions}-d embeddings)", embedder.Dimensions);
            return _models = new Models(detector, embedder);
        }
        finally
        {
            _initLock.Release();
        }
    }

    private InferenceSession CreateSession(string path)
    {
        var sessionOptions = new SessionOptions { GraphOptimizationLevel = GraphOptimizationLevel.ORT_ENABLE_ALL };
        if (_options.UseCuda)
        {
            try
            {
                sessionOptions.AppendExecutionProvider_CUDA();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "CUDA execution provider unavailable, falling back to CPU");
            }
        }

        return new InferenceSession(path, sessionOptions);
    }

    public void Dispose()
    {
        _models?.Detector.Dispose();
        _models?.Embedder.Dispose();
        _initLock.Dispose();
    }
}
