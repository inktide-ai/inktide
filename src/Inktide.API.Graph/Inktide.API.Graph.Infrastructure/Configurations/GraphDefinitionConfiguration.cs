using System.Text.Json;
using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Graph.Infrastructure.Configurations;

public sealed class GraphDefinitionConfiguration : IEntityTypeConfiguration<GraphDefinition>
{
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
                v => JsonSerializer.Serialize(v, GraphJsonSerializerOptions.CamelCase),
                v => JsonSerializer.Deserialize<List<GraphNodeRecord>>(v, GraphJsonSerializerOptions.CamelCase)!)
            .IsRequired();

        b.Property(e => e.Edges)
            .HasColumnName("edges")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, GraphJsonSerializerOptions.CamelCase),
                v => JsonSerializer.Deserialize<List<GraphEdgeRecord>>(v, GraphJsonSerializerOptions.CamelCase)!)
            .IsRequired();

        b.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at");

        b.HasIndex(e => e.ProjectId)
            .IsUnique()
            .HasDatabaseName("idx_graph_definitions_project_id");
    }
}
