using FastEndpoints;

namespace SaBai.FaceService.Endpoints.Persons;

public static class PersonId
{
    public const int MaxLength = 128;

    public static void Validate(IEndpoint endpoint, string? personId)
    {
        if (string.IsNullOrWhiteSpace(personId) || personId.Length > MaxLength)
            endpoint.ValidationFailures.Add(new("personId", $"PersonId must be 1-{MaxLength} characters."));
    }
}
