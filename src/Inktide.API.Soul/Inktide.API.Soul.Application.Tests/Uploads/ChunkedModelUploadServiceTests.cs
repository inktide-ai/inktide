using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Services;
using Inktide.API.Soul.Application.Storage;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;
using AiCardEntity = Inktide.API.Soul.Domain.Entities.AiCard;

namespace Inktide.API.Soul.Application.Tests.Uploads;

public sealed class ChunkedModelUploadServiceTests : IDisposable
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Guid CardId = Guid.NewGuid();

    private readonly string _root = Path.Combine(Path.GetTempPath(), "chunked-upload-tests-" + Guid.NewGuid().ToString("N"));
    private readonly IAiCardModelRepository _models = Substitute.For<IAiCardModelRepository>();
    private readonly IObjectStorageService _storage = Substitute.For<IObjectStorageService>();
    private readonly IAiCardModelUploadService _uploads = Substitute.For<IAiCardModelUploadService>();
    private readonly List<(string Key, byte[] Bytes)> _stored = [];
    private readonly ChunkedModelUploadService _service;

    public ChunkedModelUploadServiceTests()
    {
        var cards = Substitute.For<IAiCardService>();
        cards.GetByIdAsync(UserId, CardId, Arg.Any<CancellationToken>()).Returns(new AiCardEntity());

        _models.CountByCardAsync(UserId, CardId, Arg.Any<CancellationToken>()).Returns(0);

        _storage.IsEnabled.Returns(true);
        _storage
            .PutObjectAsync(Arg.Any<string>(), Arg.Any<Stream>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                using var copy = new MemoryStream();
                call.ArgAt<Stream>(1).CopyTo(copy);
                _stored.Add((call.ArgAt<string>(0), copy.ToArray()));
                return Task.CompletedTask;
            });

        _uploads
            .CompleteUploadAsync(UserId, CardId, Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<long>(), Arg.Any<CancellationToken>())
            .Returns(call => CompleteModelUploadResult.Ok(new AiCardModel(
                Guid.NewGuid(), CardId, call.ArgAt<string>(2), "https://s3.example/" + call.ArgAt<string>(2),
                call.ArgAt<string>(3), call.ArgAt<string>(4), call.ArgAt<long>(5), DateTime.UtcNow, IsActive: true)));

        _service = new ChunkedModelUploadService(
            cards, _models, _storage, _uploads, new ChunkedUploadStore(_root),
            TimeProvider.System, NullLogger<ChunkedModelUploadService>.Instance);
    }

    public void Dispose() => Directory.Delete(_root, recursive: true);

    [Fact]
    public async Task Stores_the_whole_file_once_every_chunk_has_arrived()
    {
        var file = GltfBytes(2_500_000);
        var upload = await StartAsync("Sandrone.vrm", file.Length);

        var offset = 0L;
        while (offset < file.Length)
        {
            var length = (int)Math.Min(upload.ChunkBytes, file.Length - offset);
            var chunk = await _service.AppendAsync(UserId, CardId, upload.UploadId, offset, new MemoryStream(file, (int)offset, length));
            Assert.True(chunk.Success, chunk.Error);
            offset = chunk.ReceivedBytes;
        }

        var done = await _service.CompleteAsync(UserId, CardId, upload.UploadId);

        Assert.True(done.Success, done.Error);
        var (key, bytes) = Assert.Single(_stored);
        Assert.Equal(file, bytes);
        Assert.StartsWith($"users/{UserId:N}/cards/{CardId:N}/models/", key);
        Assert.EndsWith("_Sandrone.vrm", key);
        await _uploads.Received(1).CompleteUploadAsync(
            UserId, CardId, key, "Sandrone.vrm", "application/octet-stream", file.Length, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Keeps_the_bytes_of_a_dropped_chunk_and_continues_after_them()
    {
        var file = GltfBytes(1_500_000);
        var upload = await StartAsync("model.glb", file.Length);

        // The connection dies 300 KB into the first chunk.
        await Assert.ThrowsAsync<IOException>(() =>
            _service.AppendAsync(UserId, CardId, upload.UploadId, 0, new DroppingStream(file, dropAfter: 300_000)));

        var status = await _service.GetStatusAsync(UserId, CardId, upload.UploadId);
        Assert.Equal(300_000, status.Upload!.ReceivedBytes);

        // The client retries from 0, learns the real offset, and sends the rest from there.
        var retry = await _service.AppendAsync(UserId, CardId, upload.UploadId, 0, new MemoryStream(file, 0, 1_000_000));
        Assert.Equal(ChunkedUploadError.OffsetMismatch, retry.ErrorKind);
        Assert.Equal(300_000, retry.ReceivedBytes);

        var offset = retry.ReceivedBytes;
        while (offset < file.Length)
        {
            var length = (int)Math.Min(ChunkedUploadLimits.ChunkBytes, file.Length - offset);
            offset = (await _service.AppendAsync(UserId, CardId, upload.UploadId, offset, new MemoryStream(file, (int)offset, length))).ReceivedBytes;
        }
        var done = await _service.CompleteAsync(UserId, CardId, upload.UploadId);

        Assert.True(done.Success, done.Error);
        Assert.Equal(file, Assert.Single(_stored).Bytes);
    }

    [Fact]
    public async Task Refuses_a_chunk_that_runs_past_the_declared_size_and_keeps_nothing_of_it()
    {
        var upload = await StartAsync("model.vrm", 100);

        var result = await _service.AppendAsync(UserId, CardId, upload.UploadId, 0, new MemoryStream(GltfBytes(150)));

        Assert.Equal(ChunkedUploadError.Validation, result.ErrorKind);
        Assert.Equal(0, (await _service.GetStatusAsync(UserId, CardId, upload.UploadId)).Upload!.ReceivedBytes);
    }

    [Fact]
    public async Task Refuses_a_chunk_bigger_than_the_per_request_limit()
    {
        var upload = await StartAsync("model.vrm", 3 * ChunkedUploadLimits.MaxChunkBytes);

        var result = await _service.AppendAsync(UserId, CardId, upload.UploadId, 0,
            new MemoryStream(GltfBytes((int)ChunkedUploadLimits.MaxChunkBytes + 1)));

        Assert.Equal(ChunkedUploadError.Validation, result.ErrorKind);
    }

    [Fact]
    public async Task Complete_before_all_bytes_arrived_says_how_many_are_there()
    {
        var file = GltfBytes(1_000);
        var upload = await StartAsync("model.vrm", file.Length);
        await _service.AppendAsync(UserId, CardId, upload.UploadId, 0, new MemoryStream(file, 0, 400));

        var done = await _service.CompleteAsync(UserId, CardId, upload.UploadId);

        Assert.Equal(ChunkedUploadError.Incomplete, done.ErrorKind);
        Assert.Equal(400, done.ReceivedBytes);
        Assert.Empty(_stored);
    }

    [Fact]
    public async Task Refuses_a_file_whose_bytes_are_not_what_the_extension_claims()
    {
        var html = "<html><script>alert(1)</script></html>"u8.ToArray();
        var upload = await StartAsync("avatar.vrm", html.Length);
        await _service.AppendAsync(UserId, CardId, upload.UploadId, 0, new MemoryStream(html));

        var done = await _service.CompleteAsync(UserId, CardId, upload.UploadId);

        Assert.Equal(ChunkedUploadError.InvalidFile, done.ErrorKind);
        Assert.Empty(_stored);
    }

    [Fact]
    public async Task A_repeated_complete_returns_the_same_model_without_storing_twice()
    {
        var file = GltfBytes(2_000);
        var upload = await StartAsync("model.vrm", file.Length);
        await _service.AppendAsync(UserId, CardId, upload.UploadId, 0, new MemoryStream(file));

        var first = await _service.CompleteAsync(UserId, CardId, upload.UploadId);
        var second = await _service.CompleteAsync(UserId, CardId, upload.UploadId);

        Assert.True(second.Success, second.Error);
        Assert.Equal(first.Model!.Id, second.Model!.Id);
        Assert.Single(_stored);
    }

    [Fact]
    public async Task Another_users_upload_does_not_exist_for_them()
    {
        var upload = await StartAsync("model.vrm", 1_000);
        var stranger = Guid.NewGuid();

        var status = await _service.GetStatusAsync(stranger, CardId, upload.UploadId);
        var chunk = await _service.AppendAsync(stranger, CardId, upload.UploadId, 0, new MemoryStream(GltfBytes(10)));

        Assert.Equal(ChunkedUploadError.UploadNotFound, status.ErrorKind);
        Assert.Equal(ChunkedUploadError.UploadNotFound, chunk.ErrorKind);
    }

    [Fact]
    public async Task Start_refuses_once_the_card_is_at_its_model_limit()
    {
        _models.CountByCardAsync(UserId, CardId, Arg.Any<CancellationToken>()).Returns(int.MaxValue);

        var result = await _service.StartAsync(UserId, CardId, "model.vrm", 1_000);

        Assert.Equal(ChunkedUploadError.Validation, result.ErrorKind);
    }

    [Fact]
    public async Task Start_refuses_an_extension_that_is_not_a_model()
    {
        var result = await _service.StartAsync(UserId, CardId, "setup.exe", 1_000);

        Assert.Equal(ChunkedUploadError.Validation, result.ErrorKind);
    }

    [Theory]
    [InlineData("a.vrm", "glTF\u0002\0\0\0", true)]
    [InlineData("a.glb", "glTF", true)]
    [InlineData("a.zip", "PK\u0003\u0004rest", true)]
    [InlineData("a.gltf", "﻿  \n{\"asset\":{}}", true)]
    [InlineData("a.json", "{\"Version\":3}", true)]
    [InlineData("a.vrm", "<html>", false)]
    [InlineData("a.json", "<html>", false)]
    [InlineData("a.zip", "glTF", false)]
    public void Signature_check_matches_extension_and_content(string name, string head, bool expected)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(head);
        Assert.Equal(expected, ModelFileSignature.Matches(name, bytes.AsSpan(0, Math.Min(bytes.Length, ModelFileSignature.HeadBytes))));
    }

    private async Task<ChunkedUploadInfo> StartAsync(string fileName, long size)
    {
        var started = await _service.StartAsync(UserId, CardId, fileName, size);
        Assert.True(started.Success, started.Error);
        return started.Upload!;
    }

    private static byte[] GltfBytes(int size)
    {
        var bytes = new byte[size];
        for (var i = 0; i < size; i++)
            bytes[i] = (byte)(i * 31 + 7);
        "glTF"u8.CopyTo(bytes);
        return bytes;
    }

    /// <summary>Serves the first <c>dropAfter</c> bytes, then fails like a reset connection.</summary>
    private sealed class DroppingStream(byte[] data, int dropAfter) : Stream
    {
        private int _position;

        public override int Read(byte[] buffer, int offset, int count)
        {
            if (_position >= dropAfter)
                throw new IOException("Connection reset by peer.");
            var n = Math.Min(count, dropAfter - _position);
            Array.Copy(data, _position, buffer, offset, n);
            _position += n;
            return n;
        }

        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => _position; set => throw new NotSupportedException(); }
        public override void Flush() { }
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    }
}
