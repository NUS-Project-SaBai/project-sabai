# Storage

[RustFS](https://github.com/rustfs/rustfs) is S3-compatible object storage that runs fully offline. When
`APP_MODE=OFFLINE`, the app stores patient photos here instead of Cloudinary. It's started by the root
`compose.yaml` together with the other offline services:

```sh
docker compose up -d   # from the repo root
```

It uses these settings from the root `.env`. The app and the container both read them:

| Variable | |
| --- | --- |
| `STORAGE_ENDPOINT` | `http://127.0.0.1:9000` |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | Credentials the container is created with (secret key: at least 8 characters) |
| `STORAGE_BUCKET` | Created automatically on the first upload (default `sabai`) |

Photos are stored as `patients/<uuid>`, and the app saves that key in `patients.patient_image_public_id`.
Browsers never talk to RustFS directly. They load photos through `/api/images/patients/<uuid>`, which
requires a signed-in user and streams the photo from RustFS.

Ports are bound to `127.0.0.1`. The web console is at http://127.0.0.1:9001 (sign in with the access and
secret keys). Data is persisted in the `storage-data` volume.
