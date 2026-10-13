using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace SaBai.FaceService.FaceRecognition;

/// <summary>
/// SCRFD face detector (InsightFace). Produces boxes and five-point landmarks from the
/// stride 8/16/32 heads of the model.
/// </summary>
public sealed class ScrfdFaceDetector : IDisposable
{
    private static readonly int[] Strides = [8, 16, 32];

    private readonly InferenceSession _session;
    private readonly string _inputName;
    private readonly string[] _outputNames;
    private const int AnchorsPerLocation = 2;

    public ScrfdFaceDetector(InferenceSession session)
    {
        _session = session;
        _inputName = session.InputMetadata.Keys.Single();
        _outputNames = session.OutputMetadata.Keys.ToArray();

        // Landmark-capable SCRFD models (det_*g, *_kps) with 3 strides expose 9 outputs:
        // scores, box distances and landmark offsets for each stride, with 2 anchors per cell.
        if (_outputNames.Length != 9)
            throw new NotSupportedException(
                $"Unsupported SCRFD model with {_outputNames.Length} outputs; a 3-stride model with landmarks is required.");
    }

    public IReadOnlyList<DetectedFace> Detect(RgbImage image, int inputSize, float scoreThreshold, float nmsThreshold)
    {
        // Letterbox: keep the aspect ratio and pad the bottom/right edge.
        var ratio = (float)image.Height / image.Width;
        int newWidth, newHeight;
        if (ratio > 1)
        {
            newHeight = inputSize;
            newWidth = Math.Max(1, (int)(newHeight / ratio));
        }
        else
        {
            newWidth = inputSize;
            newHeight = Math.Max(1, (int)(newWidth * ratio));
        }

        // Integer resize dimensions can produce slightly different scales per axis.
        var scaleX = (float)newWidth / image.Width;
        var scaleY = (float)newHeight / image.Height;
        var resized = ImageOps.Resize(image, newWidth, newHeight);
        var input = ToTensor(resized, inputSize);

        using var results = _session.Run([NamedOnnxValue.CreateFromTensor(_inputName, input)], _outputNames);
        var outputs = results.Select(r => r.AsTensor<float>()).ToArray();

        var candidates = new List<DetectedFace>();
        for (var level = 0; level < Strides.Length; level++)
        {
            var stride = Strides[level];
            var scores = outputs[level];
            var boxes = outputs[level + Strides.Length];
            var kps = outputs[level + Strides.Length * 2];
            var gridW = inputSize / stride;
            var gridH = inputSize / stride;
            var count = gridW * gridH * AnchorsPerLocation;

            for (var i = 0; i < count; i++)
            {
                var score = scores.GetValue(i);
                if (!float.IsFinite(score) || score < scoreThreshold) continue;

                var cell = i / AnchorsPerLocation;
                var cx = (float)(cell % gridW * stride);
                var cy = (float)(cell / gridW * stride);

                var box = new BoundingBox(
                    (cx - boxes.GetValue(i * 4) * stride) / scaleX,
                    (cy - boxes.GetValue(i * 4 + 1) * stride) / scaleY,
                    (cx + boxes.GetValue(i * 4 + 2) * stride) / scaleX,
                    (cy + boxes.GetValue(i * 4 + 3) * stride) / scaleY);

                var landmarks = new PointF[5];
                for (var k = 0; k < 5; k++)
                {
                    landmarks[k] = new PointF(
                        (cx + kps.GetValue(i * 10 + k * 2) * stride) / scaleX,
                        (cy + kps.GetValue(i * 10 + k * 2 + 1) * stride) / scaleY);
                }

                candidates.Add(new DetectedFace(box, score, landmarks));
            }
        }

        return NonMaxSuppression(candidates, nmsThreshold)
            .Select(f => f with { Box = Clamp(f.Box, image.Width, image.Height) })
            .ToList();
    }

    public static List<DetectedFace> NonMaxSuppression(IEnumerable<DetectedFace> faces, float iouThreshold)
    {
        var kept = new List<DetectedFace>();
        foreach (var face in faces.OrderByDescending(f => f.Score))
        {
            if (kept.All(k => k.Box.IoU(face.Box) <= iouThreshold))
                kept.Add(face);
        }

        return kept;
    }

    private static BoundingBox Clamp(BoundingBox b, int width, int height) => new(
        Math.Clamp(b.X1, 0, width), Math.Clamp(b.Y1, 0, height),
        Math.Clamp(b.X2, 0, width), Math.Clamp(b.Y2, 0, height));

    private static DenseTensor<float> ToTensor(RgbImage image, int size)
    {
        const float mean = 127.5f, std = 128f;
        var tensor = new DenseTensor<float>([1, 3, size, size]);
        var data = tensor.Buffer.Span;
        data.Fill(-mean / std);

        var plane = size * size;
        for (var y = 0; y < image.Height; y++)
            for (var x = 0; x < image.Width; x++)
            {
                var s = (y * image.Width + x) * 3;
                var d = y * size + x;
                data[d] = (image.Pixels[s] - mean) / std;
                data[plane + d] = (image.Pixels[s + 1] - mean) / std;
                data[2 * plane + d] = (image.Pixels[s + 2] - mean) / std;
            }

        return tensor;
    }

    public void Dispose() => _session.Dispose();
}
