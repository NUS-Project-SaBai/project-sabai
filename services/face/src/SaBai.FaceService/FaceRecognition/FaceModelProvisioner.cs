using System.IO.Compression;
using Microsoft.Extensions.Options;

namespace SaBai.FaceService.FaceRecognition;

/// <summary>Makes sure the ONNX model files exist locally, downloading the model pack if allowed.</summary>
public sealed class FaceModelProvisioner(IOptions<FaceRecognitionOptions> options, ILogger<FaceModelProvisioner> logger)
{
    private readonly FaceRecognitionOptions _options = options.Value;

    public string DetectorPath => Path.Combine(_options.ModelsDirectory, _options.DetectorModel);
    public string RecognizerPath => Path.Combine(_options.ModelsDirectory, _options.RecognizerModel);

    public async Task EnsureModelsAsync(CancellationToken ct)
    {
        string[] required = [DetectorPath, RecognizerPath];
        var missing = required.Where(p => !File.Exists(p)).ToList();
        if (missing.Count == 0) return;

        if (!_options.AutoDownloadModels)
            throw new FileNotFoundException(
                $"Face recognition model(s) not found: {string.Join(", ", missing)}. " +
                $"Place them in '{_options.ModelsDirectory}' or enable {FaceRecognitionOptions.SectionName}:AutoDownloadModels.");

        Directory.CreateDirectory(_options.ModelsDirectory);
        var archive = Path.Combine(_options.ModelsDirectory, $"download-{Guid.NewGuid():N}.zip");
        try
        {
            logger.LogInformation("Downloading face recognition models from {Url}", _options.ModelPackUrl);
            // Not using IHttpClientFactory: the default resilience pipeline times out long downloads.
            using (var http = new HttpClient { Timeout = Timeout.InfiniteTimeSpan })
            using (var response = await http.GetAsync(_options.ModelPackUrl, HttpCompletionOption.ResponseHeadersRead, ct))
            {
                response.EnsureSuccessStatusCode();
                await using var file = File.Create(archive);
                await response.Content.CopyToAsync(file, ct);
            }

            using var zip = ZipFile.OpenRead(archive);
            foreach (var path in missing)
            {
                var name = Path.GetFileName(path);
                var entry = zip.Entries.FirstOrDefault(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                    ?? throw new FileNotFoundException($"Model '{name}' not found in {_options.ModelPackUrl}.");

                var temp = path + ".tmp";
                entry.ExtractToFile(temp, overwrite: true);
                File.Move(temp, path, overwrite: true);
                logger.LogInformation("Extracted face model {Model}", path);
            }
        }
        finally
        {
            File.Delete(archive);
        }
    }
}
