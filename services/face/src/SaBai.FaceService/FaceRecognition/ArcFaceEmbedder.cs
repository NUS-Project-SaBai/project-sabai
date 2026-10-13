using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace SaBai.FaceService.FaceRecognition;

/// <summary>
/// ArcFace face recognition model (InsightFace). Maps an aligned 112x112 face crop to an
/// L2-normalised identity embedding whose dot product is the cosine similarity.
/// </summary>
public sealed class ArcFaceEmbedder : IDisposable
{
    private const float Mean = 127.5f;
    private const float Std = 127.5f;

    private readonly InferenceSession _session;
    private readonly string _inputName;
    private readonly bool _supportsBatching;

    public ArcFaceEmbedder(InferenceSession session)
    {
        _session = session;
        var input = session.InputMetadata.Single();
        _inputName = input.Key;
        var output = session.OutputMetadata.Values.First();
        // Some exports declare a dynamic input batch but a fixed output batch of 1.
        _supportsBatching = input.Value.Dimensions[0] < 0 && output.Dimensions[0] < 0;
        Dimensions = output.Dimensions[^1];
        if (Dimensions <= 0) throw new NotSupportedException("Recognition model has a dynamic embedding size.");
    }

    public int Dimensions { get; }

    public IReadOnlyList<float[]> Embed(IReadOnlyList<RgbImage> alignedFaces)
    {
        if (alignedFaces.Count == 0) return [];
        if (_supportsBatching) return Run(alignedFaces);
        return alignedFaces.SelectMany(face => Run([face])).ToList();
    }

    private List<float[]> Run(IReadOnlyList<RgbImage> faces)
    {
        const int size = FaceAligner.Size;
        const int plane = size * size;
        var tensor = new DenseTensor<float>([faces.Count, 3, size, size]);
        var data = tensor.Buffer.Span;
        for (var n = 0; n < faces.Count; n++)
        {
            var pixels = faces[n].Pixels;
            var offset = n * 3 * plane;
            for (var p = 0; p < plane; p++)
            {
                data[offset + p] = (pixels[p * 3] - Mean) / Std;
                data[offset + plane + p] = (pixels[p * 3 + 1] - Mean) / Std;
                data[offset + 2 * plane + p] = (pixels[p * 3 + 2] - Mean) / Std;
            }
        }

        using var results = _session.Run([NamedOnnxValue.CreateFromTensor(_inputName, tensor)]);
        var output = results[0].AsTensor<float>();
        var embeddings = new List<float[]>(faces.Count);
        for (var n = 0; n < faces.Count; n++)
        {
            var embedding = new float[Dimensions];
            for (var i = 0; i < Dimensions; i++) embedding[i] = output.GetValue(n * Dimensions + i);
            embeddings.Add(Normalize(embedding));
        }

        return embeddings;
    }

    public static float[] Normalize(float[] vector)
    {
        var norm = MathF.Sqrt(vector.Sum(v => v * v));
        if (norm > 0)
            for (var i = 0; i < vector.Length; i++) vector[i] /= norm;
        return vector;
    }

    /// <summary>Cosine similarity of two L2-normalised embeddings.</summary>
    public static float Similarity(ReadOnlySpan<float> a, ReadOnlySpan<float> b)
    {
        var dot = 0f;
        for (var i = 0; i < a.Length; i++) dot += a[i] * b[i];
        return dot;
    }

    public void Dispose() => _session.Dispose();
}
