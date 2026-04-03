# VPS Setup — News Digest Pipeline

## Server Info
- **IP:** 148.230.84.56
- **IPv6:** 2a02:4780:2d:db43::1
- **OS:** Ubuntu 24.04 (template: Ubuntu 24.04 with n8n)
- **Docker:** installed (Docker Manager for Docker Compose)
- **Existing services:** n8n

## Access Model

### Deploy user (for CI/CD agent)
- **Username:** agent
- **Auth:** SSH key (no password)
- **Home:** `/home/<deploy-user>/`
- **Project path:** `/srv/news_agent_001/`
- **Permissions:**
  - Read/write to `/srv/news_agent_001/` (code, .env, data/)
  - Limited sudo for Docker Compose only:
    ```
    <user> ALL=(ALL) NOPASSWD: /usr/bin/docker compose -f /srv/news_agent_001/docker-compose.yml *
    ```
  - NO access to apt, systemctl, other directories
  - NO root/full sudo

### What the agent needs access to
| Path/Command | Access | Purpose |
|-------------|--------|---------|
| `/srv/news_agent_001/` | read/write | Project files, code |
| `/srv/news_agent_001/.env` | read/write | Secrets (API keys, tokens) |
| `/srv/news_agent_001/data/` | read/write | SQLite database |
| `docker compose build` | execute | Build container |
| `docker compose up -d` | execute | Start/restart service |
| `docker compose down` | execute | Stop service |
| `docker compose logs` | execute | View logs |
| `docker compose ps` | execute | Check status |

### What the agent does NOT need
- apt/dpkg (OS packages)
- systemctl (system services)
- Access to other directories (/home, /etc, other /opt projects)
- Root/full sudo
- Firewall management (ufw)
- SSL certificate management (handled by nginx/certbot separately)

## Deployment Flow

```
Developer pushes to GitHub (main branch)
    ↓
GitHub Actions triggered (paths: news-digest-pipeline/**)
    ↓
SSH into VPS as deploy user
    ↓
cd /opt/news-digest-pipeline
git pull origin main
cd news-digest-pipeline
docker compose build
docker compose up -d
docker compose ps
```

## Docker Architecture

```
Host (Ubuntu 24.04)
├── n8n (existing Docker container)
├── news-digest-pipeline (new Docker container)
│   ├── Node.js 20 Alpine
│   ├── Express API on port 3000
│   ├── SQLite at /app/data/news-digest.db
│   └── Prompt files mounted from host (read-only)
└── nginx (reverse proxy, TBD)
    ├── n8n.domain.com → n8n container
    └── news.domain.com → news-digest container
```

## Network / Domain
- **Domain:** news.questtales.com
- **DNS:** Cloudflare (A-record → 148.230.84.56, DNS only / grey cloud)
- **HTTPS:** Let's Encrypt via certbot
- **Reverse proxy:** nginx on host
- **Port mapping:** host:3000 → container:3000 (internal, nginx forwards)

## Monitoring

Script: `scripts/monitor.sh` (runs as cron every 5 min)
- Checks: container running, /health responds, disk <90%, memory <90%
- Alerts: via ntfy.sh push notification

Cron setup (on VPS):
```
*/5 * * * * /srv/news_agent_001/news-digest-pipeline/scripts/monitor.sh
```

## OS Updates
- Handled by system (unattended-upgrades), NOT by deploy agent
- Agent has no access to apt/system packages

## Setup Checklist
- [ ] Create deploy user on VPS
- [ ] Generate SSH key pair
- [ ] Add public key to VPS deploy user
- [ ] Add private key to GitHub Secrets (VPS_SSH_KEY)
- [ ] Add VPS_HOST and VPS_USER to GitHub Secrets
- [ ] Create /srv/news_agent_001/ directory
- [ ] Set ownership to deploy user
- [ ] Clone repo to /srv/news_agent_001/
- [ ] Create .env with production secrets
- [ ] Configure sudo for docker compose (sudoers.d)
- [ ] Setup nginx reverse proxy
- [ ] Setup SSL with certbot
- [ ] Setup monitoring cron
- [ ] Choose and configure domain/subdomain
- [ ] Test full deploy cycle

## Decisions Log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-02 | Docker Compose deploy | VPS has Docker, project needs persistent SQLite |
| 2026-04-02 | Dedicated deploy user (not root) | Security: agent should not have server-wide access |
| 2026-04-02 | sudo only for docker compose | Minimal privilege: agent manages only its container |
| 2026-04-02 | OS updates by system, not agent | Prevent accidental server breakage |
| 2026-04-02 | SQLite (not PostgreSQL) | Small project, single-user, no need for separate DB |
| 2026-04-02 | Ntfy.sh for notifications | Zero infrastructure, free, native iOS appearance |
