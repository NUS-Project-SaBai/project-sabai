# Observability

A standalone [Aspire dashboard](https://learn.microsoft.com/dotnet/aspire/fundamentals/dashboard/standalone) that shows logs, traces and
metrics from any service that exports OpenTelemetry (OTLP). It works fully offline. It's started by the
root `compose.yaml` together with the other offline services:

```sh
docker compose up -d   # from the repo root
```

Open http://127.0.0.1:18888. Telemetry is kept in memory, so it's cleared when the container restarts.

## Sending telemetry

| Sender | Endpoint |
| --- | --- |
| Containers in the root compose project | `http://dashboard:18889` (gRPC) or `http://dashboard:18890` (HTTP) |
| Processes on the host, e.g. the Next.js server | `http://127.0.0.1:4317` (gRPC) or `http://127.0.0.1:4318` (HTTP) |

Set `OTEL_EXPORTER_OTLP_ENDPOINT` to one of these, and `OTEL_SERVICE_NAME` to name the service in the dashboard.

What sends telemetry today:

- **Face service:** yes, configured in `services/face/compose.yaml`
- **Next.js server:** not yet
- **Qdrant and Supabase:** no. They don't push OTLP, so they need an OpenTelemetry Collector that scrapes
  them and forwards to the dashboard. Add that here if it's needed.

All ports are bound to `127.0.0.1` and the dashboard runs without login, so it's only reachable from
this machine.
