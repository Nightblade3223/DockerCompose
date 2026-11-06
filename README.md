# Media Automation Docker Compose Stack

A production-oriented `docker-compose` stack for self-hosted media automation, streaming, request handling, and reverse proxying, plus anti-bot cookie solving via Byparr.

## Summary

This project brings together the *arr ecosystem, media streaming, request workflows, and ingress tooling in a single compose file. It is designed for:

- Automated media discovery and import (`Prowlarr`, `Sonarr`, `Radarr`).
- Media playback (`Jellyfin`).
- User requests (`Seerr`).
- Download pipeline (`qBittorrent`).
- Secure/public access (`NPMPlus`) and anti-bot proxy support (`Flaresolverr`) and Cloudflare/anti-bot bypass cookie solving (`Byparr`).

## Services Included

| Service | Image | Purpose | Default Port(s) |
|---|---|---|---|
| LANCommander | `lancommander/lancommander:latest` | Personal game library and launcher backend | `1337/tcp`, `35891/udp`, `213/udp` |
| Prowlarr | `linuxserver/prowlarr:latest` | Indexer manager for *arr apps | `9696` |
| Sonarr | `linuxserver/sonarr:latest` | TV show automation | `8989` |
| Radarr | `linuxserver/radarr:latest` | Movie automation | `7878` |
| Jellyfin | `linuxserver/jellyfin:latest` | Media server | `8096`, `7359/udp`, `1900/udp` |
| Seerr | `ghcr.io/seerr-team/seerr:latest` | Media request management | `5055` |
| qBittorrent | `linuxserver/qbittorrent:latest` | Torrent client | `8080`, `6881/tcp`, `6881/udp` |
| NPMPlus | `docker.io/zoeyvid/npmplus:latest` | Reverse proxy + cert management | `80`, `81`, `443/tcp`, `443/udp` |
| Flaresolverr | `ghcr.io/flaresolverr/flaresolverr:latest` | Cloudflare challenge proxy helper | `8191` |
| Byparr | `ghcr.io/thephaseless/byparr:latest` | Anti-bot cookie solving API | `8192` (container `8191`) |

## Key Features

- **Full media automation pipeline** from indexers to downloads to organized libraries.
- **Media streaming** through Jellyfin.
- **Hardware acceleration ready** (`/dev/dri`) for Jellyfin transcoding workloads.
- **Remote-friendly ingress** with NPMPlus for TLS termination and host-based routing.
- **User self-service experience** via Seerr for requests.
- **Consistent runtime controls** with shared `PUID`, `PGID`, `TZ`, and `UMASK_SET` usage.

## Setup (Best Practice)

### 1) Prerequisites

- Docker Engine + Docker Compose plugin installed.
- A Linux host with media storage mounted and accessible.
- Optional GPU/iGPU drivers configured if you plan to use hardware transcoding.

### 2) Clone and prepare environment

```bash
git clone <your-repo-url>
cd DockerCompose
cp .env.example .env  # or create .env manually if no template exists
```

### 3) Configure `.env`

At minimum, define:

- `PUID` / `PGID` for file ownership consistency.
- `TZ` for correct schedules/log timestamps.
- Base paths used in compose such as:
  - `ARRPATH`
  - `CACHE`
  - `NASDRIVE_1`
  - `NASDRIVE_2=/nas_share/Other/` for non-ARR applications.

> Tip: ensure all host paths end with a trailing slash when required by your path convention in `docker-compose.yml`.

### 4) Create required host directories

Create every mapped host path before first boot to avoid root-owned auto-created directories.

### 5) Validate and start

```bash
docker compose config

docker compose pull

docker compose up -d
```

### 6) Initial access

After startup, access each service from your host/LAN using the ports listed above.

## Recommended Post-Install Configuration

1. Configure `qBittorrent` download categories/paths.
2. In Sonarr/Radarr, add:
   - Download client: `qBittorrent`
   - Indexer source: `Prowlarr`
   - Root folders that match the mounted `/data/...` paths.
3. Connect Seerr to Jellyfin.
4. Configure NPMPlus proxy hosts and TLS certificates.

## LANCommander game library

LANCommander supports user accounts, registration approval, and role-based access.
Administrators can add games and upload versioned game ZIP archives through the web
dashboard. Friends use the LANCommander desktop launcher to connect to your server,
sign in, browse the library, download/install games, and launch them. Each game may
need install and launch scripts; copying loose files into the NAS folder does not
automatically publish a playable game.

The `.env` setting `NASDRIVE_2=/nas_share/Other/` gives LANCommander a dedicated
`/nas_share/Other/Games/LANCommander/` directory, mounted at `/app/Data`. This stores
its configuration, database, and uploaded archives together. Back up the entire
directory. Create it on your mounted NAS before starting, and make it writable by
the configured `PUID` and `PGID`:

```bash
mkdir -p /nas_share/Other/Games/LANCommander
docker compose up -d lancommander
```

Open port `1337` on your server to complete LANCommander's initial setup and create
the administrator account. Review registration and approval settings before adding
friends; give player accounts the roles you want them to have. Keep archive, media,
save, and backup storage paths inside `/app/Data` during setup so they persist on
the NAS.
Port `35891/udp` is for LAN discovery and `213/udp` is for the optional IPX relay.
Docker bridge networking may not forward discovery broadcasts, so entering the
server address manually in the launcher is the reliable fallback.

For friends outside your LAN, provide a reachable HTTPS hostname through NPMPlus
(upstream `lancommander:1337`) or private VPN access. Configure reverse-proxy upload
size limits and timeouts for large game archives. This Compose entry does not itself
configure remote access. Games must support the players' systems and any required
licenses/DRM; LANCommander does not supply games or bypass DRM.

Official references: [LANCommander setup and features](https://github.com/LANCommander/LANCommander#readme)
and [game archive uploads](https://github.com/LANCommander/LANCommander/blob/master/LANCommander.Documentation/Server/Games.md#archives).

## Operational Best Practices

- **Pin image tags** to stable versions in production instead of `latest`.
- **Back up config volumes** (especially `/config`, `/data`, and app databases).
- **Restrict exposed ports** to trusted networks; prefer reverse proxy entrypoints.
- **Use strong credentials** and enable MFA where supported.
- **Keep least privilege**: only map devices and paths each service truly needs.
- **Update deliberately**: `docker compose pull` + controlled restart window.

## Maintenance

```bash
# Show status
docker compose ps

# View logs for a service
docker compose logs -f sonarr

# Restart a single service
docker compose restart jellyfin

# Stop all services
docker compose down
```

## Notes

- `Flaresolverr` exposes configurable defaults via environment variables (`PORT`, `LOG_LEVEL`, etc.).
- `Byparr` is exposed on host port `8192` and maps to container port `8191` to avoid conflict with `Flaresolverr`.
- `NPMPlus` upstream features are documented at:
  - https://github.com/ZoeyVid/NPMplus?tab=readme-ov-file#list-of-new-features
