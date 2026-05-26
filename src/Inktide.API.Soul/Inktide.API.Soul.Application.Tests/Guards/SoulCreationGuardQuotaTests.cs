using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Application.Exceptions;
using Inktide.API.Soul.Application.Guards;
using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Application.Queries;
using Inktide.API.Soul.Domain.Repositories;
using NSubstitute;
using Xunit;

namespace Inktide.API.Soul.Application.Tests.Guards;

public sealed class SoulCreationGuardQuotaTests
{
    private static readonly Guid UserId    = Guid.NewGuid();
    private static readonly Guid CatalogId = Guid.NewGuid();

    private static SoulCreationGuard BuildGuard(int currentCount, PlanLimits limits)
    {
        var cardRepo = Substitute.For<IAiCardRepository>();
        cardRepo.CountByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns(currentCount);

        var planResolver = Substitute.For<IUserPlanResolver>();
        planResolver.GetLimitsAsync(UserId.ToString(), Arg.Any<CancellationToken>()).Returns(limits);

        // SoulCreationValidationQueryService is concrete — build it with mocked deps.
        // For quota-exceeded tests it is never reached; for below-limit tests it will
        // throw SoulCreationException (catalog not found), which is intentional.
        var catalogRepo = Substitute.For<ICatalogRepository>();
        var credService = Substitute.For<IUserProviderCredentialService>();
        var credRepo    = Substitute.For<IUserProviderCredentialRepository>();
        var query       = new SoulCreationValidationQueryService(catalogRepo, credService, credRepo);

        return new SoulCreationGuard(query, planResolver, cardRepo);
    }

    [Fact]
    public async Task Throws_PlanLimitExceededException_when_count_equals_limit()
    {
        var guard = BuildGuard(currentCount: 1, limits: PlanLimits.Free);

        var ex = await Assert.ThrowsAsync<PlanLimitExceededException>(
            () => guard.EnsureCanCreateAsync(UserId, CatalogId, null, null));

        Assert.Equal("soul_cards", ex.LimitType);
        Assert.Equal(1, ex.Limit);
    }

    [Fact]
    public async Task Throws_PlanLimitExceededException_when_count_exceeds_limit()
    {
        var guard = BuildGuard(currentCount: 5, limits: PlanLimits.Starter);

        await Assert.ThrowsAsync<PlanLimitExceededException>(
            () => guard.EnsureCanCreateAsync(UserId, CatalogId, null, null));
    }

    [Fact]
    public async Task Does_not_throw_PlanLimitExceededException_when_count_below_limit()
    {
        // count = 0, limit = 1 → quota not exceeded.
        // Guard proceeds to catalog check (returns SoulCreationException, not PlanLimitExceededException).
        var guard = BuildGuard(currentCount: 0, limits: PlanLimits.Free);

        var ex = await Assert.ThrowsAsync<SoulCreationException>(
            () => guard.EnsureCanCreateAsync(UserId, CatalogId, null, null));

        Assert.NotEqual("PLAN_LIMIT_EXCEEDED", ex.ErrorCode);
    }
}
