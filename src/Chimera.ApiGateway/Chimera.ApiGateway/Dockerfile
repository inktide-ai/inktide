FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5000
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["Chimera.ApiGateway.csproj", "./"]
RUN dotnet restore "Chimera.ApiGateway.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "Chimera.ApiGateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Chimera.ApiGateway.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Chimera.ApiGateway.dll"]
