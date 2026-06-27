# ADLFRONT Hostinger Deployment

Target domain: `adlfront.com`

Target VPS IP: `147.93.98.242`

The ADLFRONT stack must not bind public ports directly. The host Nginx on the VPS owns ports `80` and `443`, and ADLFRONT Docker Nginx is exposed only on loopback:

```text
127.0.0.1:8095 -> adlfront nginx container port 80
```

## Cloudflare and GoDaddy

1. Add `adlfront.com` to Cloudflare.
2. Copy the two Cloudflare nameservers.
3. In GoDaddy, replace the domain nameservers with Cloudflare's nameservers.
4. In Cloudflare DNS, create:

```text
Type: A
Name: @
Content: 147.93.98.242
Proxy status: DNS only

Type: CNAME
Name: www
Target: adlfront.com
Proxy status: DNS only
```

Keep Cloudflare records as `DNS only` until Certbot succeeds on the VPS.

## VPS Deploy

```bash
ssh root@147.93.98.242
mkdir -p /opt/adlfront
cd /opt/adlfront
```

Copy or clone `enterprise_project_structure` into `/opt/adlfront/enterprise_project_structure`.

Build the frontend:

```bash
cd /opt/adlfront/enterprise_project_structure/apps/web-portal
npm install
npm run build
```

Create the production env file:

```bash
cd /opt/adlfront/enterprise_project_structure
nano .env.production
```

Paste the production values provided separately, then lock the file:

```bash
chmod 600 .env.production
```

Validate and start the stack with a unique project name:

```bash
docker compose --env-file .env.production -p adlfront config --quiet
docker compose --env-file .env.production -p adlfront up -d --build
docker compose -p adlfront ps
```

Local canary checks:

```bash
curl -f http://127.0.0.1:8095/api/health
curl -I http://127.0.0.1:8095
```

## Host Nginx

Create the host Nginx site:

```bash
nano /etc/nginx/sites-available/adlfront.com
```

Use:

```nginx
server {
    listen 80;
    server_name adlfront.com www.adlfront.com;

    location / {
        proxy_pass http://127.0.0.1:8095;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/adlfront.com /etc/nginx/sites-enabled/adlfront.com
nginx -t
systemctl reload nginx
```

## TLS

```bash
certbot --nginx -d adlfront.com -d www.adlfront.com
```

After HTTPS works, switch Cloudflare DNS records to proxied and set:

```text
SSL/TLS mode: Full (strict)
```

## Final Checks

```bash
curl -I https://adlfront.com
curl -f https://adlfront.com/api/health
```

Admin URL:

```text
https://adlfront.com/admin/login
```

## Port Collision Rules

Do not use these already occupied ports from the VPS snapshot:

```text
80, 443, 3000, 3001, 8000, 8080, 8088, 8090, 8091, 8092, 9090, 1935, 5349, 7880, 7881, 7882
```

ADLFRONT uses only:

```text
127.0.0.1:8095
```
