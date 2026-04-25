using System.Diagnostics.Metrics;
using Inktide.API.Domain.Enums;
using Inktide.API.Domain.Models;
using FluentValidation.Results;

namespace Inktide.API.Core.Decorators;

public sealed class MetricsChatProviderDecorator : IChatProvider
{

    private readonly IChatProvider _inner;
    private readonly Counter<long> _requests;
    private readonly Counter<long> _failures;


    public MetricsChatProviderDecorator(IChatProvider inner)
        : this(inner, new Meter("Inktide.API.Chat", "1.0.0"))
    {
    }

    public MetricsChatProviderDecorator(IChatProvider inner, Meter meter)
    {
        _inner = inner ?? throw new ArgumentNullException(nameof(inner));
        ArgumentNullException.ThrowIfNull(meter);

        _requests = meter.CreateCounter<long>("inktide.chat.requests");
        _failures = meter.CreateCounter<long>("inktide.chat.failures");
    }


    public string Id => _inner.Id;

    public string Name => _inner.Name;

    public ProviderCategory Category => _inner.Category;

    public ChatProviderCapabilities Capabilities => _inner.Capabilities;


    public ValidationResult Validate(ProviderOptions options)
    {
        _requests.Add(1, new KeyValuePair<string, object?>("provider", Id), new KeyValuePair<string, object?>("operation", "validate"));
        return _inner.Validate(options);
    }

    public async Task<IReadOnlyList<ModelInfo>> ListModelsAsync(
        ProviderOptions options,
        CancellationToken cancellationToken = default)
    {
        _requests.Add(1, new KeyValuePair<string, object?>("provider", Id), new KeyValuePair<string, object?>("operation", "list_models"));
        try
        {
            return await _inner.ListModelsAsync(options, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception)
        {
            _failures.Add(1, new KeyValuePair<string, object?>("provider", Id), new KeyValuePair<string, object?>("operation", "list_models"));
            throw;
        }
    }

    public async Task<ChatResponse> GenerateAsync(
        ProviderOptions options,
        ChatRequest request,
        CancellationToken cancellationToken = default)
    {
        _requests.Add(1, new KeyValuePair<string, object?>("provider", Id), new KeyValuePair<string, object?>("operation", "generate"));
        try
        {
            return await _inner.GenerateAsync(options, request, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception)
        {
            _failures.Add(1, new KeyValuePair<string, object?>("provider", Id), new KeyValuePair<string, object?>("operation", "generate"));
            throw;
        }
    }

    public async IAsyncEnumerable<ChatChunk> StreamAsync(
        ProviderOptions options,
        ChatRequest request,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        _requests.Add(1, new KeyValuePair<string, object?>("provider", Id), new KeyValuePair<string, object?>("operation", "stream"));
        await foreach (var chunk in _inner.StreamAsync(options, request, cancellationToken).ConfigureAwait(false))
        {
            yield return chunk;
        }
    }

}
