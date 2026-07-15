# Minerva Ranger Server Record

## Current Goal

Use the Tencent Cloud CVM as the only account and save-sync backend.
Supabase has been removed from the runtime path.

## Server

- Provider: Tencent Cloud CVM
- Region: Guangzhou
- OS: Ubuntu 22.04 LTS
- Public IP: `119.91.111.102`
- Internal IP: `172.16.0.6`
- App directory: `/opt/minerva-ranger`
- Runtime data: `/var/lib/minerva-ranger/sync-db.json`

## Architecture

```text
Client app
  -> http://119.91.111.102/api
    -> Nginx
      -> http://127.0.0.1:4174
        -> Node sync server
          -> JSON data file
```

The JSON data file is temporary MVP storage. The API is shaped so the storage
layer can later move to PostgreSQL without changing the frontend contract.

## Public API Base

```text
http://119.91.111.102/api
```

Health check:

```text
http://119.91.111.102/api/health
```

Expected response:

```json
{"ok":true}
```

## Frontend Config

Local `.env.local` should point to the Tencent Cloud backend:

```env
VITE_SYNC_API_URL=http://119.91.111.102/api
```

For future production use, replace this with an HTTPS domain.

## Systemd Service

Service name:

```bash
minerva-sync
```

Common commands:

```bash
sudo systemctl status minerva-sync
sudo systemctl restart minerva-sync
sudo journalctl -u minerva-sync -f
```

The service runs:

```bash
/usr/bin/node server/index.js
```

Important environment variables are set in:

```text
/etc/systemd/system/minerva-sync.service
```

Do not commit the real `SYNC_JWT_SECRET`.

## Nginx

Nginx proxies `/api/` to the local Node service:

```text
/etc/nginx/sites-available/minerva-ranger
/etc/nginx/sites-enabled/minerva-ranger
```

Common commands:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Implemented MVP Features

- Email/password registration
- Email/password login
- JWT-authenticated sync API
- Upload all local save slots
- Pull all cloud save slots after login
- Soft-delete cloud save slots
- Systemd process persistence
- Nginx public reverse proxy

## Current Limitations

- Public access is currently HTTP, not HTTPS.
- Data storage is a JSON file, not PostgreSQL.
- No password reset email flow yet.
- No request rate limiting yet.
- No conflict-copy UI yet; current merge is timestamp based.

## Next Steps

1. Bind a domain to `119.91.111.102`.
2. Enable HTTPS with Nginx and Certbot.
3. Change `VITE_SYNC_API_URL` to the HTTPS API URL.
4. Move storage from JSON file to PostgreSQL.
5. Add password reset and login rate limiting.
