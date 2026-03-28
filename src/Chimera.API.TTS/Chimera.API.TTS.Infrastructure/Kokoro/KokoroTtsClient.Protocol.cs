using System.Text.Json;
using Chimera.API.TTS.Domain.Models;

namespace Chimera.API.TTS.Infrastructure.Kokoro;

public sealed partial class KokoroTtsClient
{
   
    public async Task<Stream> GenerateSpeechAsync(
        KokoroSpeechOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options.Input);
        
        using var httpRequest = CreateGenerateSpeechRequest(options);

        return await SendAndReadContentStreamAsync(httpRequest, cancellationToken)
            .ConfigureAwait(false);
    }
    
    public async Task<SpeechModelCollection> GetModelsAsync(
        CancellationToken cancellationToken = default)
    {
 
        using var httpRequest = CreateGetModelsRequest();

        await using var stream = await SendAndReadContentStreamAsync(
            httpRequest, 
            cancellationToken: cancellationToken);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
   
        return SpeechModelCollection.FromResponse(doc.RootElement);
    }
    
    public async Task<SpeechModel> GetModelAsync(
        string modelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(modelId);
        
        using var httpRequest = CreateGetModelRequest(modelId);

        await using var stream = await SendAndReadContentStreamAsync(
            httpRequest, 
            cancellationToken: cancellationToken);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);
   
        return SpeechModel.FromResponse(doc.RootElement);
    }
    
    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        CancellationToken cancellationToken = default)
    {
        using var httpRequest = CreateGetVoicesRequest();

        await using var stream = await SendAndReadContentStreamAsync(
            httpRequest,
            cancellationToken: cancellationToken);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return SpeechVoiceCollection.FromResponse(doc.RootElement);
    }
    
    #region Private Methods
    
    private async Task<Stream> SendAndReadContentStreamAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
            .ConfigureAwait(false);

        await ThrowIfKokoroRequestFailedAsync(response, cancellationToken).ConfigureAwait(false);

        return await response.Content
            .ReadAsStreamAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    #endregion
    
}