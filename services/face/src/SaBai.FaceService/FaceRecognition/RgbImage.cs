using SkiaSharp;

namespace SaBai.FaceService.FaceRecognition;

/// <summary>Tightly packed 8-bit RGB image.</summary>
public sealed class RgbImage
{
    public RgbImage(int width, int height, byte[]? pixels = null)
    {
        Width = width;
        Height = height;
        Pixels = pixels ?? new byte[width * height * 3];
        if (Pixels.Length != width * height * 3)
            throw new ArgumentException("Pixel buffer does not match dimensions.", nameof(pixels));
    }

    public int Width { get; }
    public int Height { get; }
    public byte[] Pixels { get; }

    /// <summary>Decodes an encoded image (JPEG, PNG, WebP, ...) applying its EXIF orientation.</summary>
    public static RgbImage Decode(Stream stream)
    {
        using var data = SKData.Create(stream)
            ?? throw new InvalidImageException("Image could not be read.");
        using var codec = SKCodec.Create(data)
            ?? throw new InvalidImageException("Unsupported or corrupt image.");

        var info = new SKImageInfo(codec.Info.Width, codec.Info.Height, SKColorType.Rgba8888, SKAlphaType.Unpremul);
        using var decoded = new SKBitmap(info);
        var result = codec.GetPixels(info, decoded.GetPixels());
        if (result is not (SKCodecResult.Success or SKCodecResult.IncompleteInput))
            throw new InvalidImageException($"Image could not be decoded ({result}).");

        return Orient(FromRgba(decoded), codec.EncodedOrigin);
    }

    private static RgbImage FromRgba(SKBitmap bitmap)
    {
        var src = bitmap.GetPixelSpan();
        var image = new RgbImage(bitmap.Width, bitmap.Height);
        var dst = image.Pixels;
        var rowBytes = bitmap.RowBytes;
        for (var y = 0; y < bitmap.Height; y++)
        {
            var s = y * rowBytes;
            var d = y * bitmap.Width * 3;
            for (var x = 0; x < bitmap.Width; x++, s += 4, d += 3)
            {
                dst[d] = src[s];
                dst[d + 1] = src[s + 1];
                dst[d + 2] = src[s + 2];
            }
        }

        return image;
    }

    /// <summary>Remaps pixels so the image is upright according to its EXIF origin.</summary>
    public static RgbImage Orient(RgbImage image, SKEncodedOrigin origin)
    {
        int w = image.Width, h = image.Height;
        Func<int, int, (int X, int Y)>? map = origin switch
        {
            SKEncodedOrigin.TopRight => (x, y) => (w - 1 - x, y),
            SKEncodedOrigin.BottomRight => (x, y) => (w - 1 - x, h - 1 - y),
            SKEncodedOrigin.BottomLeft => (x, y) => (x, h - 1 - y),
            SKEncodedOrigin.LeftTop => (x, y) => (y, x),
            SKEncodedOrigin.RightTop => (x, y) => (y, h - 1 - x),
            SKEncodedOrigin.RightBottom => (x, y) => (w - 1 - y, h - 1 - x),
            SKEncodedOrigin.LeftBottom => (x, y) => (w - 1 - y, x),
            _ => null,
        };
        if (map is null) return image;

        var swap = origin >= SKEncodedOrigin.LeftTop;
        var result = new RgbImage(swap ? h : w, swap ? w : h);
        for (var y = 0; y < result.Height; y++)
            for (var x = 0; x < result.Width; x++)
            {
                var (sx, sy) = map(x, y);
                Buffer.BlockCopy(image.Pixels, (sy * w + sx) * 3, result.Pixels, (y * result.Width + x) * 3, 3);
            }

        return result;
    }
}

public sealed class InvalidImageException(string message) : Exception(message);
