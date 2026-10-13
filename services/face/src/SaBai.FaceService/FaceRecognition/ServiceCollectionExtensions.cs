namespace SaBai.FaceService.FaceRecognition;

public static class ServiceCollectionExtensions
{
    /// <summary>Registers the ONNX face recognition pipeline and the Qdrant-backed face store.
    /// Requires a <see cref="Qdrant.Client.QdrantClient"/> to be registered.</summary>
    public static IHostApplicationBuilder AddFaceRecognition(this IHostApplicationBuilder builder)
    {
        builder.Services.AddOptions<FaceRecognitionOptions>()
            .Bind(builder.Configuration.GetSection(FaceRecognitionOptions.SectionName))
            .Validate(o => o.DetectionSize > 0 && o.DetectionSize % 32 == 0, "DetectionSize must be a positive multiple of 32.")
            .Validate(o => o.DetectionThreshold is >= 0 and <= 1, "DetectionThreshold must be between 0 and 1.")
            .Validate(o => o.NmsThreshold is >= 0 and <= 1, "NmsThreshold must be between 0 and 1.")
            .Validate(o => o.MinimumFaceSize >= 0, "MinimumFaceSize must be non-negative.")
            .Validate(o => float.IsFinite(o.MinimumEyeDistance) && o.MinimumEyeDistance >= 0,
                "MinimumEyeDistance must be finite and non-negative.")
            .Validate(o => o.MatchThreshold is >= -1 and <= 1, "MatchThreshold must be between -1 and 1.")
            .ValidateOnStart();

        builder.Services.AddSingleton<FaceModelProvisioner>();
        builder.Services.AddSingleton<FaceAnalyzer>();
        builder.Services.AddSingleton<FaceStore>();
        builder.Services.AddHostedService<FaceRecognitionInitializer>();
        return builder;
    }
}
