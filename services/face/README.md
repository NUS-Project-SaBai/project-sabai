# Face service

Offline face recognition for SaBai: SCRFD face detection and ArcFace embeddings (ONNX Runtime), with the
embeddings stored in Qdrant. It runs as its own container. The Next.js server calls it over HTTP; browsers never do.

The face models are baked into the image at build time. Building needs internet access, but running does not.

## Run

The app only calls this service when `APP_MODE=OFFLINE` in the root `.env`. Set `FACE_SERVICE_API_KEY` there too
(at least 32 characters, e.g. from `openssl rand -hex 32`). Both the app and this container read it from that file.

Start it from the repo root, which also starts the [observability dashboard](../../infra/observability/README.md)
on the same network:

```sh
docker compose up -d --build
curl http://127.0.0.1:5080/health   # "Healthy" once the models are loaded
```

Running `docker compose up` inside `services/face` also works, but then the key has to be in your shell
environment, and telemetry is dropped.

| Service | Address (loopback only) | Purpose |
| --- | --- | --- |
| `face` | `http://127.0.0.1:5080` | Face API |
| `qdrant` | not published | Embedding store, persisted in the `qdrant-data` volume |

## API

All endpoints except `/health` and `/alive` require the `X-Api-Key` header. Images are sent as
`multipart/form-data`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/persons/{personId}/faces` | Enroll the most prominent face (`image`) for a person |
| `GET` | `/persons/{personId}/faces` | List a person's enrolled faces |
| `DELETE` | `/persons/{personId}` | Remove all of a person's faces |
| `DELETE` | `/faces/{faceId}` | Remove one enrolled face |
| `POST` | `/faces/identify` | Match every face in `image` against enrolled people (`threshold`, `maxMatches` query) |
| `POST` | `/faces/verify` | Similarity between the main faces in `first` and `second` |
| `POST` | `/faces/detect` | Boxes, scores and landmarks for every face in `image` |

`personId` is any string up to 128 characters. Use the patient's UUID so that `identify` results map
straight back to `patients` rows. Enroll several photos per patient for better recall. See
[FaceRecognition/README.md](src/SaBai.FaceService/FaceRecognition/README.md) for the pipeline, the
accuracy settings and how to tune `MatchThreshold` (default `0.4`).

## Configuration

Set these as environment variables, using `__` for nesting:

| Variable | Default | |
| --- | --- | --- |
| `FaceService__ApiKey` | `FACE_SERVICE_API_KEY` from the root `.env` | Required, at least 32 characters |
| `ConnectionStrings__qdrant` | none | e.g. `Endpoint=http://qdrant:6334` (gRPC port) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://dashboard:18889` in `compose.yaml` | Telemetry is exported only when this is set |
| `FaceRecognition__MatchThreshold` | `0.4` | Cosine similarity needed for a match |
| `FaceRecognition__UseCuda` | `false` | Requires the GPU ONNX Runtime package |

## Deploying to an offline machine

From the repo root:

```sh
# On a machine with internet access
docker compose build
docker save sabai-face:latest qdrant/qdrant:v1.18.0 rustfs/rustfs:1.0.1 mcr.microsoft.com/dotnet/aspire-dashboard:13.6 -o sabai-offline.tar

# On the clinic machine (repo checked out, plus the root .env and sabai-offline.tar)
docker load -i sabai-offline.tar
docker compose up -d --no-build
```

## Tests

```sh
docker build --target test .
```

The local SDK doesn't need to be .NET 10, because tests run inside the SDK image.

## Provenance

This code was extracted from Qin Guan's SaBai .NET backend (`SaBai.API`, commit `d6d166b`). These parts
are unchanged apart from the namespace, so upstream fixes can be diffed and applied directly:

- `src/SaBai.FaceService/FaceRecognition/`
- `src/SaBai.FaceService/Endpoints/` (staff-role checks removed)
- `tests/SaBai.FaceService.Tests/FaceRecognitionTests.cs`

These parts are new or changed:

- `Program.cs`
- `ApiKeyAuthentication.cs`
- `FaceModelsHealthCheck.cs`
- `ServiceDefaults.cs`: health endpoints are mapped in production and the WorkOS trace source is gone
- `Dockerfile` and `compose.yaml`

## License

InsightFace's pretrained `buffalo_l` models are licensed for **non-commercial research use only**.
Confirm that SaBai's use is covered, or swap in a different SCRFD/ArcFace ONNX model with the
`MODEL_PACK_URL` build argument plus the `FaceRecognition__DetectorModel` and
`FaceRecognition__RecognizerModel` settings.
