# Face recognition

ONNX Runtime pipeline with embeddings stored in Qdrant.

1. **Detection**: [SCRFD](https://arxiv.org/abs/2105.04714) (`det_10g.onnx`) finds face boxes and five landmarks.
2. **Alignment**: the landmarks are mapped onto the standard ArcFace 112×112 template with a least-squares similarity transform.
3. **Recognition**: [ArcFace](https://arxiv.org/abs/1801.07698) ResNet-50 trained on WebFace600K (`w600k_r50.onnx`) produces a 512-d, L2-normalised embedding.
4. **Search**: embeddings live in the Qdrant collection `faces` (cosine distance), with a `person_id` payload index.

Both models come from InsightFace's `buffalo_l` pack. The first time they're needed, they're downloaded (~280 MB) to
`FaceRecognition:ModelsDirectory`, which defaults to `~/.local/share/sabai/models`. In containers, mount a volume
there or pre-provision the files and set `FaceRecognition:AutoDownloadModels` to `false`. Any SCRFD (3 strides, with
landmarks) or ArcFace ONNX export works, for example `antelopev2`'s `glintr100.onnx`; the Qdrant collection is sized
from the model's output.

The pipeline uses InsightFace's RGB normalization and ArcFace alignment template. Resizing uses
fractionally weighted area averaging when shrinking and bilinear interpolation when enlarging;
pixel-identical parity with the reference Python/OpenCV implementation is not guaranteed.

Endpoints require the shared API key in the `X-Api-Key` header (see `services/face/README.md`).

> **License:** InsightFace's pretrained models are for **non-commercial research use only**. Commercial use requires a
> license from InsightFace or a different model.

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/faces/detect` | Boxes, scores and landmarks for every face |
| `POST` | `/persons/{personId}/faces` | Enroll the most prominent face for a person |
| `GET` | `/persons/{personId}/faces` | List a person's enrolled faces |
| `DELETE` | `/persons/{personId}` | Remove all of a person's faces |
| `DELETE` | `/faces/{faceId}` | Remove one enrolled face |
| `POST` | `/faces/identify` | Match every face in an image against enrolled people (`threshold`, `maxMatches` query) |
| `POST` | `/faces/verify` | 1:1 similarity between the main faces in two images |

Images are sent as `multipart/form-data` (`image`, or `first`/`second` for verify). Similarity is cosine in
`[-1, 1]`; the default `MatchThreshold` is `0.4`. It is a starting point, not a calibrated probability
or a guarantee of identity. Enrolling several sharp, well-lit photos per person improves recall.

## Accuracy settings

Recognition (enrollment, identification and verification) excludes faces smaller than
`MinimumFaceSize` (default 40 source pixels in either dimension), or with eyes less than
`MinimumEyeDistance` (default 12 source pixels) apart. Non-finite landmarks and degenerate alignment
are also rejected. Detection still returns small faces. Set either size setting to zero to disable
that guard. These defaults are conservative starting points, not dataset-calibrated values;
they can reduce recall for distant faces. Use a closer, sharper photo when no usable face remains.

Preprocessing fixes change generated embeddings slightly. Existing vectors are not rewritten;
re-enroll from original photos for consistent enrollment/query preprocessing.

Before production tuning, evaluate labeled same-person and different-person pairs from the actual
camera workflow, keeping identities separate between calibration and evaluation sets. Choose
`MatchThreshold` using measured false-match and false-non-match rates, and check lighting, pose and
demographic slices. Do not lower the threshold just to force a match. Model weights and the default
match threshold have not been changed, and accuracy gains require validation on those images.
