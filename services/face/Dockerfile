# Bakes the face models into the image so it runs with no internet access.
# Building needs internet (NuGet, model pack); running does not.

FROM alpine:3.20 AS models
ARG MODEL_PACK_URL=https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
ADD ${MODEL_PACK_URL} /tmp/models.zip
RUN mkdir /models && unzip -j /tmp/models.zip '*det_10g.onnx' '*w600k_r50.onnx' -d /models

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY global.json SaBai.FaceService.slnx ./
COPY src/SaBai.FaceService/SaBai.FaceService.csproj src/SaBai.FaceService/
COPY tests/SaBai.FaceService.Tests/SaBai.FaceService.Tests.csproj tests/SaBai.FaceService.Tests/
RUN dotnet restore SaBai.FaceService.slnx
COPY . .
RUN dotnet build SaBai.FaceService.slnx -c Release --no-restore

# docker build --target test .
FROM build AS test
RUN dotnet test -c Release --no-build

FROM build AS publish
RUN dotnet publish src/SaBai.FaceService/SaBai.FaceService.csproj -c Release --no-build -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=models /models /app/models
COPY --from=publish /app/publish .
ENV FaceRecognition__ModelsDirectory=/app/models \
    FaceRecognition__AutoDownloadModels=false
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "SaBai.FaceService.dll"]
