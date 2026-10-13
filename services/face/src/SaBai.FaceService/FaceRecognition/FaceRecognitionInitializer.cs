namespace SaBai.FaceService.FaceRecognition;

/// <summary>Loads the models and prepares the Qdrant collection in the background at startup.</summary>
public sealed class FaceRecognitionInitializer(
    FaceStore store,
    ILogger<FaceRecognitionInitializer> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            // Loads (and if needed downloads) the models, then prepares the collection.
            await store.InitializeAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            // Not fatal: requests retry initialisation and surface the error.
            logger.LogError(ex, "Face recognition initialisation failed");
        }
    }
}
