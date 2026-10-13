using Microsoft.Extensions.Diagnostics.HealthChecks;
using SaBai.FaceService.FaceRecognition;

namespace SaBai.FaceService;

/// <summary>Reports unhealthy until the ONNX models have loaded, so callers can wait for readiness.</summary>
public sealed class FaceModelsHealthCheck(FaceAnalyzer analyzer) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default) =>
        Task.FromResult(analyzer.IsReady
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("Face models are loading or failed to load; check the logs."));
}
