using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Models;
using Inktide.API.Soul.Application.Services;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace Inktide.API.Soul.Application.Tests.Services;

public sealed class ChannelLinkQuotaTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Guid CardId = Guid.NewGuid();

    private static AiCardChannelLinkService Build(
        IAiCardRepository cardRepo,
        IAiCardChannelRepository channelRepo,
        IUserPlanResolver planResolver)
    {
        return new AiCardChannelLinkService(
            cardRepo,
            channelRepo,
            planResolver,
            TimeProvider.System,
            NullLogger<AiCardChannelLinkService>.Instance);
    }

    private static IAiCardRepository CardRepoWith(Guid cardId, Guid userId)
    {
        var repo = Substitute.For<IAiCardRepository>();
        repo.GetByIdAsync(cardId, Arg.Any<CancellationToken>())
            .Returns(new AiCard { Id = cardId, UserId = userId });
        return repo;
    }

    private static IReadOnlyList<AiCardChannel> MakeChannels(int count) =>
        Enumerable.Range(0, count)
            .Select(_ => new AiCardChannel
            {
                Id       = Guid.NewGuid(),
                AiCardId = CardId,
                Platform = "discord",
                ChannelId = Guid.NewGuid().ToString(),
            })
            .ToList();

    // ── CreateAsync quota tests ──────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_throws_when_channel_count_equals_limit()
    {
        var channelRepo  = Substitute.For<IAiCardChannelRepository>();
        channelRepo.GetByCardIdAsync(CardId, Arg.Any<CancellationToken>())
                   .Returns(MakeChannels(1));   // already at Free limit of 1

        var planResolver = Substitute.For<IUserPlanResolver>();
        planResolver.GetLimitsAsync(UserId.ToString(), Arg.Any<CancellationToken>())
                    .Returns(PlanLimits.Free);

        var svc = Build(CardRepoWith(CardId, UserId), channelRepo, planResolver);
        var cmd = new CreateChannelLinkCommand("twitch", "my-channel", null, "bot");

        var ex = await Assert.ThrowsAsync<PlanLimitExceededException>(
            () => svc.CreateAsync(UserId, CardId, cmd));

        Assert.Equal("channels_per_card", ex.LimitType);
        Assert.Equal(1, ex.Limit);
    }

    [Fact]
    public async Task CreateAsync_succeeds_when_count_below_limit()
    {
        var channelRepo  = Substitute.For<IAiCardChannelRepository>();
        channelRepo.GetByCardIdAsync(CardId, Arg.Any<CancellationToken>())
                   .Returns(MakeChannels(0));   // 0 channels, Free limit is 1

        channelRepo.CreateAsync(Arg.Any<AiCardChannel>(), Arg.Any<CancellationToken>())
                   .Returns(x => x.Arg<AiCardChannel>());

        var planResolver = Substitute.For<IUserPlanResolver>();
        planResolver.GetLimitsAsync(UserId.ToString(), Arg.Any<CancellationToken>())
                    .Returns(PlanLimits.Free);

        var svc = Build(CardRepoWith(CardId, UserId), channelRepo, planResolver);
        var cmd = new CreateChannelLinkCommand("discord", "my-guild", "guild-id", "bot");

        var result = await svc.CreateAsync(UserId, CardId, cmd);
        Assert.Equal("discord", result.Platform);
    }

    // ── UpsertAsync quota tests ──────────────────────────────────────────────

    [Fact]
    public async Task UpsertAsync_throws_when_new_channel_exceeds_limit()
    {
        var channelRepo  = Substitute.For<IAiCardChannelRepository>();
        // 1 existing channel for this card; limit is 1
        var existing = MakeChannels(1);
        channelRepo.GetByCardIdAsync(CardId, Arg.Any<CancellationToken>()).Returns(existing);

        var planResolver = Substitute.For<IUserPlanResolver>();
        planResolver.GetLimitsAsync(UserId.ToString(), Arg.Any<CancellationToken>())
                    .Returns(PlanLimits.Free);

        var svc = Build(CardRepoWith(CardId, UserId), channelRepo, planResolver);
        var cmd = new OAuthChannelUpsertCommand(
            UserId, CardId, "twitch", "channel-id", "my-channel", "bot",
            "enc-access", "enc-refresh", DateTime.UtcNow.AddHours(1));

        await Assert.ThrowsAsync<PlanLimitExceededException>(
            () => svc.UpsertAsync(cmd));
    }

    [Fact]
    public async Task UpsertAsync_does_not_throw_when_updating_existing_channel()
    {
        // The channel already exists for this platform + channelId → update path
        var existingChannel = new AiCardChannel
        {
            Id        = Guid.NewGuid(),
            AiCardId  = CardId,
            Platform  = "twitch",
            ChannelId = "channel-id",
        };

        var channelRepo = Substitute.For<IAiCardChannelRepository>();
        channelRepo.GetByCardIdAsync(CardId, Arg.Any<CancellationToken>())
                   .Returns(new List<AiCardChannel> { existingChannel });

        var planResolver = Substitute.For<IUserPlanResolver>();
        planResolver.GetLimitsAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
                    .Returns(PlanLimits.Free);   // limit = 1, existing = 1 but it's an UPDATE

        var svc = Build(CardRepoWith(CardId, UserId), channelRepo, planResolver);
        var cmd = new OAuthChannelUpsertCommand(
            UserId, CardId, "twitch", "channel-id", "my-channel", "bot",
            "enc-access", "enc-refresh", DateTime.UtcNow.AddHours(1));

        // Should NOT throw — this is a token refresh of an existing channel
        var id = await svc.UpsertAsync(cmd);
        Assert.Equal(existingChannel.Id, id);
    }
}
