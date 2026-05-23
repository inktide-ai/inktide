using System.Text.Json;
using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Graph.Infrastructure.Configurations;

public sealed class GraphDefinitionConfiguration : IEntityTypeConfiguration<GraphDefinition>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public void Configure(EntityTypeBuilder<GraphDefinition> b)
    {
        b.ToTable("graph_definitions", "graph");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.ProjectId)
            .HasColumnName("project_id")
            .IsRequired();

        b.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        b.Property(e => e.Nodes)
            .HasColumnName("nodes")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOptions),
                v => JsonSerializer.Deserialize<List<GraphNodeRecord>>(v, JsonOptions)!)
            .IsRequired();

        b.Property(e => e.Edges)
            .HasColumnName("edges")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOptions),
                v => JsonSerializer.Deserialize<List<GraphEdgeRecord>>(v, JsonOptions)!)
            .IsRequired();

        b.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at");

        b.HasIndex(e => e.ProjectId)
            .IsUnique()
            .HasDatabaseName("idx_graph_definitions_project_id");
    }
}
