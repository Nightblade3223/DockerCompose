# Media Automation Docker Compose Stack

A production-oriented `docker-compose` stack for self-hosted media automation, streaming, request handling, and reverse proxying.

## Summary

This project brings together the *arr ecosystem, media servers, request workflows, transcoding, and ingress tooling in a single compose file. It is designed for:

- Automated media discovery and import (`Prowlarr`, `Sonarr`, `Radarr`, `Lidarr`).
- Media playback (`Jellyfin`, `Plex`).
- User requests and onboarding (`Seerr`, `Wizarr`).
- Download and post-processing pipeline (`qBittorrent`, `Tdarr`).
- Secure/public access (`NPMPlus`) and anti-bot proxy support (`Flaresolverr`).
- Unified landing/dashboard (`Homarr`).

## Services Included

| Service | Image | Purpose | Default Port(s) |
|---|---|---|---|
| Prowlarr | `linuxserver/prowlarr:latest` | Indexer manager for *arr apps | `9696` |
| Sonarr | `linuxserver/sonarr:latest` | TV show automation | `8989` |
| Radarr | `linuxserver/radarr:latest` | Movie automation | `7878` |
| Lidarr | `linuxserver/lidarr:latest` | Music automation | `8686` |
| Homarr | `ghcr.io/ajnart/homarr:latest` | Dashboard/homepage | `7575` |
| Jellyfin | `linuxserver/jellyfin:latest` | Media server | `8096`, `7359/udp`, `1900/udp` |
| Plex | `linuxserver/plex:latest` | Media server (alternative/additional) | `32400` |
| Seerr | `ghcr.io/seerr-team/seerr:latest` | Media request management | `5055` |
| qBittorrent | `linuxserver/qbittorrent:latest` | Torrent client | `8080`, `6881/tcp`, `6881/udp` |
| Tdarr | `ghcr.io/haveagitgat/tdarr:latest` | Transcode server | `8265`, `8266` |
| Tdarr Node | `ghcr.io/haveagitgat/tdarr_node:latest` | Transcode worker | `8267` |
| NPMPlus | `docker.io/zoeyvid/npmplus:latest` | Reverse proxy + cert management | `80`, `81`, `443/tcp`, `443/udp` |
| Flaresolverr | `ghcr.io/flaresolverr/flaresolverr:latest` | Cloudflare challenge proxy helper | `8191` |
| Wizarr | `ghcr.io/wizarrrr/wizarr` | Invite/onboarding system | `5690` |

## Key Features

- **Full media automation pipeline** from indexers to downloads to organized libraries.
- **Dual media server support** using shared content mounts for Jellyfin and Plex.
- **Hardware acceleration ready** (`/dev/dri`) for media and transcoding workloads.
- **Remote-friendly ingress** with NPMPlus for TLS termination and host-based routing.
- **User self-service experience** via Seerr (requests), Wizarr (invites), and Homarr (dashboard).
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
2. In Sonarr/Radarr/Lidarr, add:
   - Download client: `qBittorrent`
   - Indexer source: `Prowlarr`
   - Root folders that match the mounted `/data/...` paths.
3. Connect Seerr to Jellyfin or Plex.
4. Configure NPMPlus proxy hosts and TLS certificates.
5. Add service links/widgets in Homarr.
6. Set Tdarr libraries and worker/node options.

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

- `Tdarr Node` depends on `Tdarr` and expects internal service DNS (`serverIP=tdarr`).
- `Flaresolverr` exposes configurable defaults via environment variables (`PORT`, `LOG_LEVEL`, etc.).
- `NPMPlus` upstream features are documented at:
  - https://github.com/ZoeyVid/NPMplus?tab=readme-ov-file#list-of-new-features
