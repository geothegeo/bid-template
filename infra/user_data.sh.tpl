#!/bin/bash
set -euxo pipefail
exec > >(tee /var/log/bootstrap.log) 2>&1

# 2 GB swap so `next build` doesn't OOM on a small instance
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

dnf install -y docker git cronie
systemctl enable --now docker crond
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

mkdir -p /opt/app && cd /opt/app
git clone --branch ${repo_ref} ${repo_url} src

cat > Caddyfile <<CADDY
${domain} {
  reverse_proxy app:3000
}
CADDY

cat > docker-compose.yml <<'COMPOSE'
services:
  app:
    build: ./src
    env_file: .env
    restart: unless-stopped
    depends_on: [db]
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bid
      POSTGRES_DB: bid
    env_file: .env
    volumes: [pgdata:/var/lib/postgresql/data]
    restart: unless-stopped
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes: ["./Caddyfile:/etc/caddy/Caddyfile", "caddy:/data"]
    restart: unless-stopped
volumes:
  pgdata:
  caddy:
COMPOSE

# Re-run after changing the SSM parameter or pushing code: sudo /opt/app/deploy.sh
cat > deploy.sh <<'DEPLOY'
#!/bin/bash
set -euo pipefail
cd /opt/app
aws ssm get-parameter --region ${region} --name ${param} --with-decryption \
  --query Parameter.Value --output text > .env
chmod 600 .env
git -C src pull --ff-only
docker compose up -d --build
DEPLOY
chmod +x deploy.sh && ./deploy.sh

# Daily notices at 09:00 UTC (replaces EventBridge Scheduler)
cat > /etc/cron.d/bid-notices <<'CRON'
0 9 * * * root curl -fsS -H "Authorization: Bearer $(grep ^CRON_SECRET= /opt/app/.env | cut -d= -f2)" https://${domain}/api/cron/notices >> /var/log/notices.log 2>&1
CRON
