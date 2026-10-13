using FastEndpoints;
using SaBai.FaceService;
using SaBai.FaceService.FaceRecognition;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddQdrantClient("qdrant");
builder.AddFaceRecognition();
builder.Services.AddHealthChecks().AddCheck<FaceModelsHealthCheck>("face-models");

var apiKey = builder.Configuration["FaceService:ApiKey"] ?? "";
if (apiKey.Length < 32)
{
    throw new InvalidOperationException("FaceService:ApiKey must be at least 32 characters.");
}

// FastEndpoints requires an authenticated caller on every endpoint by default; the only
// caller is the web app's server, which sends the shared key.
builder.Services
    .AddAuthentication(ApiKeyAuthentication.SchemeName)
    .AddScheme<ApiKeyAuthenticationOptions, ApiKeyAuthentication>(ApiKeyAuthentication.SchemeName, o => o.ApiKey = apiKey);
builder.Services.AddAuthorization();
builder.Services.AddFastEndpoints();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.MapDefaultEndpoints();
app.UseAuthentication();
app.UseAuthorization();
app.UseFastEndpoints(config => config.Errors.UseProblemDetails());

app.Run();
