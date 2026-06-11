using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Connector.InktideChat;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace Inktide.API.Connector.Application.Tests;

public sealed class InktideChatConnectorTests : IDisposable
{
    private readonly IStreamMessageHandler _handler = Substitute.For<IStreamMessageHandler>();
    private readonly IInktideChatMessageMapper _mapper = Substitute.For<IInktideChatMessageMapper>();
    private readonly IHostApplicationLifetime _lifetime = Substitute.For<IHostApplicationLifetime>();
    private readonly InktideChatConnector _connector;

    public InktideChatConnectorTests()
    {
        _lifetime.ApplicationStopping.Returns(CancellationToken.None);
        _connector = new InktideChatConnector(
            _handler,
            _mapper,
            NullLogger<InktideChatConnector>.Instance,
            _lifetime);
    }

    [Fact]
    public void TryEnqueue_WhenQueueNotFull_ReturnsTrue()
    {
        var result = _connector.TryEnqueue("ch1", "u1", "user", "hello");
        Assert.True(result);
    }

    [Fact]
    public void TryEnqueue_WhenNotConnected_StillAcceptsMessages()
    {
        // Channel is always open for writes even before ConnectAsync
        var result = _connector.TryEnqueue("ch1", "u1", "user", "hello");
        Assert.True(result);
    }

    [Fact]
    public async Task ConnectAsync_WhenCalledTwice_SecondCallIsNoOp()
    {
        await _connector.ConnectAsync();
        Assert.True(_connector.IsConnected);

        // Second call should be ignored (no exception, no double-start)
        await _connector.ConnectAsync();
        Assert.True(_connector.IsConnected);

        // Disconnect handled by Dispose
    }

    [Fact]
    public async Task DisconnectAsync_AfterConnect_WorkerCompletes()
    {
        await _connector.ConnectAsync();
        Assert.True(_connector.IsConnected);

        await _connector.DisconnectAsync();

        // Allow brief moment for worker task to fully complete
        await Task.Delay(10);
        Assert.False(_connector.IsConnected);
    }

    [Fact]
    public async Task ConnectAsync_WhenNotConnected_IsConnectedIsFalse()
    {
        Assert.False(_connector.IsConnected);
        await Task.CompletedTask;
    }

    public void Dispose() => _connector.DisposeAsync().AsTask().GetAwaiter().GetResult();
}
