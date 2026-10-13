using Google.Protobuf.Collections;
using Microsoft.Extensions.Options;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

namespace SaBai.FaceService.FaceRecognition;

public sealed record StoredFace(Guid FaceId, string PersonId, DateTimeOffset CreatedAt);

public sealed record FaceMatch(Guid FaceId, string PersonId, float Similarity);

/// <summary>Persists face embeddings in Qdrant and performs nearest-neighbour identity search.</summary>
public sealed class FaceStore(
    QdrantClient qdrant,
    FaceAnalyzer analyzer,
    IOptions<FaceRecognitionOptions> options,
    ILogger<FaceStore> logger) : IDisposable
{
    private const string PersonIdField = "person_id";
    private const string CreatedAtField = "created_at";

    private readonly string _collection = options.Value.CollectionName;
    private readonly SemaphoreSlim _initLock = new(1, 1);
    private volatile bool _initialized;

    /// <summary>Creates the collection (sized to the recognition model) if it does not exist yet.</summary>
    public async Task InitializeAsync(CancellationToken ct)
    {
        if (_initialized) return;

        await _initLock.WaitAsync(ct);
        try
        {
            if (_initialized) return;
            await EnsureCollectionAsync(await analyzer.GetEmbeddingSizeAsync(ct), ct);
            _initialized = true;
        }
        finally
        {
            _initLock.Release();
        }
    }

    private async Task EnsureCollectionAsync(int dimensions, CancellationToken ct)
    {
        if (await qdrant.CollectionExistsAsync(_collection, ct))
        {
            var info = await qdrant.GetCollectionInfoAsync(_collection, ct);
            var size = info.Config.Params.VectorsConfig.Params?.Size;
            if (size != (ulong)dimensions)
                throw new InvalidOperationException(
                    $"Qdrant collection '{_collection}' has vector size {size}, but the recognition model produces {dimensions}.");
            return;
        }

        logger.LogInformation("Creating Qdrant collection {Collection} ({Dimensions}-d, cosine)", _collection, dimensions);
        await qdrant.CreateCollectionAsync(
            _collection,
            new VectorParams { Size = (ulong)dimensions, Distance = Distance.Cosine },
            cancellationToken: ct);
        await qdrant.CreatePayloadIndexAsync(_collection, PersonIdField, PayloadSchemaType.Keyword, cancellationToken: ct);
    }

    public async Task<StoredFace> AddAsync(string personId, float[] embedding, CancellationToken ct)
    {
        await InitializeAsync(ct);
        var face = new StoredFace(Guid.NewGuid(), personId, DateTimeOffset.UtcNow);
        await qdrant.UpsertAsync(_collection,
        [
            new PointStruct
            {
                Id = face.FaceId,
                Vectors = embedding,
                Payload =
                {
                    [PersonIdField] = personId,
                    [CreatedAtField] = face.CreatedAt.ToString("O"),
                },
            },
        ], cancellationToken: ct);
        return face;
    }

    /// <summary>Returns the best match per person, most similar first.</summary>
    public async Task<IReadOnlyList<FaceMatch>> SearchAsync(float[] embedding, float minSimilarity, int limit, CancellationToken ct)
    {
        await InitializeAsync(ct);
        // Over-fetch so several enrolled faces of the same person don't crowd out other people.
        var points = await qdrant.QueryAsync(
            _collection,
            query: embedding,
            limit: (ulong)(limit * 5),
            scoreThreshold: minSimilarity,
            payloadSelector: new WithPayloadSelector { Include = new PayloadIncludeSelector { Fields = { PersonIdField } } },
            cancellationToken: ct);

        return points
            .Select(p => new FaceMatch(Guid.Parse(p.Id.Uuid), p.Payload[PersonIdField].StringValue, p.Score))
            .GroupBy(m => m.PersonId)
            .Select(g => g.MaxBy(m => m.Similarity)!)
            .OrderByDescending(m => m.Similarity)
            .Take(limit)
            .ToList();
    }

    public async Task<IReadOnlyList<StoredFace>> ListAsync(string personId, CancellationToken ct)
    {
        await InitializeAsync(ct);
        var faces = new List<StoredFace>();
        PointId? offset = null;
        do
        {
            var page = await qdrant.ScrollAsync(_collection, MatchKeyword(PersonIdField, personId),
                limit: 256, offset: offset, payloadSelector: true, cancellationToken: ct);
            faces.AddRange(page.Result.Select(p => ToStoredFace(p.Id, p.Payload)));
            offset = page.NextPageOffset;
        } while (offset is not null);

        return faces.OrderBy(f => f.CreatedAt).ToList();
    }

    public async Task<bool> DeleteFaceAsync(Guid faceId, CancellationToken ct)
    {
        await InitializeAsync(ct);
        var existing = await qdrant.RetrieveAsync(_collection, faceId, withPayload: false, cancellationToken: ct);
        if (existing.Count == 0) return false;
        await qdrant.DeleteAsync(_collection, faceId, cancellationToken: ct);
        return true;
    }

    public async Task<ulong> DeletePersonAsync(string personId, CancellationToken ct)
    {
        await InitializeAsync(ct);
        var filter = MatchKeyword(PersonIdField, personId);
        var count = await qdrant.CountAsync(_collection, filter, exact: true, cancellationToken: ct);
        if (count > 0) await qdrant.DeleteAsync(_collection, filter, cancellationToken: ct);
        return count;
    }

    private static StoredFace ToStoredFace(PointId id, MapField<string, Value> payload) => new(
        Guid.Parse(id.Uuid),
        payload[PersonIdField].StringValue,
        DateTimeOffset.Parse(payload[CreatedAtField].StringValue));

    public void Dispose() => _initLock.Dispose();
}
