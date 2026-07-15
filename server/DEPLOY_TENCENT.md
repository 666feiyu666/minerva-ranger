# Tencent Cloud Deployment Notes

This project now uses the self-hosted sync API as the only cloud sync backend.
Supabase is no longer part of the runtime path.

## Target Machine

The current target is the Tencent Cloud CVM shown in the console:

- Region: Guangzhou
- OS: Ubuntu
- Public IP: `119.91.111.102`
- Suggested open ports: `22`, `80`, `443`

Keep the API behind HTTPS before using real passwords.

## Current MVP Architecture

```text
Vue/Electron client
  -> HTTPS /api
    -> Nginx
      -> Node sync server on 127.0.0.1:4174
        -> server/data/sync-db.json
```

The JSON file is deliberately temporary. The API shape is designed so the
storage layer can later move to PostgreSQL without changing the frontend.

## Server Environment

Required production variables:

```bash
NODE_ENV=production
SYNC_HOST=127.0.0.1
SYNC_PORT=4174
SYNC_JWT_SECRET=<generate-a-long-random-secret>
SYNC_CORS_ORIGIN=https://your-domain.example
SYNC_DB_FILE=/var/lib/minerva-ranger/sync-db.json
```

Generate a JWT secret on the server:

```bash
openssl rand -base64 48
```

## Frontend Environment

For local development:

```bash
VITE_SYNC_API_URL=http://localhost:4174
```

For production builds:

```bash
VITE_SYNC_API_URL=https://your-domain.example/api
```

## Basic Deployment Steps

Install runtime packages. The app requires Node.js 20.19+ or 22.12+; use
NodeSource or nvm instead of Ubuntu's older default Node package when needed.

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Create the app directory and data directory:

```bash
sudo mkdir -p /opt/minerva-ranger /var/lib/minerva-ranger
sudo chown -R "$USER":"$USER" /opt/minerva-ranger /var/lib/minerva-ranger
```

Copy or clone the project into `/opt/minerva-ranger`, then install dependencies:

```bash
cd /opt/minerva-ranger
npm ci --omit=dev
```

Use systemd to keep the sync server running:

```ini
[Unit]
Description=Minerva Ranger Sync API
After=network.target

[Service]
WorkingDirectory=/opt/minerva-ranger
ExecStart=/usr/bin/node server/index.js
Restart=always
Environment=NODE_ENV=production
Environment=SYNC_HOST=127.0.0.1
Environment=SYNC_PORT=4174
Environment=SYNC_JWT_SECRET=replace-with-a-long-random-secret
Environment=SYNC_CORS_ORIGIN=https://your-domain.example
Environment=SYNC_DB_FILE=/var/lib/minerva-ranger/sync-db.json

[Install]
WantedBy=multi-user.target
```

Save that as `/etc/systemd/system/minerva-sync.service`, then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minerva-sync
sudo systemctl status minerva-sync
```

Nginx reverse proxy example:

```nginx
server {
  listen 80;
  server_name your-domain.example;

  location /api/ {
    proxy_pass http://127.0.0.1:4174/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

After DNS is pointed at the CVM, add HTTPS with Certbot or Tencent Cloud's
certificate tooling.

## Smoke Test

From your local machine:

```bash
curl https://your-domain.example/api/health
```

Expected:

```json
{"ok":true}
```

## Next Hardening Steps

- Move `server/data/sync-db.json` to PostgreSQL.
- Add password reset emails.
- Add request rate limiting for `/auth/login` and `/auth/register`.
- Restrict `SYNC_CORS_ORIGIN` to the production app origin.
- Back up `/var/lib/minerva-ranger` until PostgreSQL is in place.
