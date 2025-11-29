# Deployment Guide for Linode

This guide will help you deploy the Excel to GSTR-1 Converter application to a Linode instance.

## Prerequisites

- A Linode account with a running Linux instance (Ubuntu 22.04 LTS recommended)
- SSH access to your Linode instance
- Docker and Docker Compose installed on your Linode instance
- Domain name (optional, for production use)

## Step 1: Set Up Your Linode Instance

### 1.1 Create a Linode Instance

1. Log in to your [Linode Cloud Manager](https://cloud.linode.com)
2. Click "Create" → "Linode"
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Region**: Choose closest to your users
   - **Plan**: Shared CPU, Nanode 1GB (minimum) or higher
   - **Root Password**: Set a strong password
4. Click "Create Linode"

### 1.2 Configure Firewall (Optional but Recommended)

1. Go to "Firewalls" in the Linode dashboard
2. Create a new firewall with these rules:
   - **Inbound**: Allow TCP port 22 (SSH)
   - **Inbound**: Allow TCP port 80 (HTTP)
   - **Inbound**: Allow TCP port 443 (HTTPS)
   - **Inbound**: Allow TCP port 3000 (if not using reverse proxy)
   - **Outbound**: Allow all

### 1.3 Connect to Your Instance

```bash
ssh root@your-linode-ip-address
```

## Step 2: Install Docker and Docker Compose

### 2.1 Update System Packages

```bash
apt update && apt upgrade -y
```

### 2.2 Install Docker

```bash
# Install prerequisites
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2.3 (Optional) Add Non-Root User for Docker

```bash
# Create a new user
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Switch to the new user
su - deploy
```

## Step 3: Deploy the Application

### 3.1 Clone or Upload Your Application

**Option A: Using Git (Recommended)**

```bash
# Install Git if not already installed
apt install -y git

# Clone your repository
git clone https://github.com/yourusername/excel-to-gstr1.git
cd excel-to-gstr1
```

**Option B: Using SCP (from your local machine)**

```bash
# From your local machine
scp -r /path/to/excel-to-gstr1 root@your-linode-ip:/opt/
ssh root@your-linode-ip
cd /opt/excel-to-gstr1
```

### 3.2 Build and Run with Docker Compose

```bash
# Build and start the container
docker compose up -d --build

# Check if the container is running
docker compose ps

# View logs
docker compose logs -f app
```

The application should now be accessible at `http://your-linode-ip:3000`

## Step 4: Set Up Reverse Proxy with Nginx (Recommended for Production)

### 4.1 Install Nginx

```bash
apt install -y nginx
```

### 4.2 Configure Nginx

Create a new configuration file:

```bash
nano /etc/nginx/sites-available/excel-to-gstr1
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Enable the Site

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/excel-to-gstr1 /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

### 4.4 Set Up SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically configure Nginx and set up auto-renewal
```

## Step 5: Set Up Automatic Updates and Monitoring

### 5.1 Create a Systemd Service (Optional)

Create a service file for better process management:

```bash
nano /etc/systemd/system/excel-to-gstr1.service
```

Add:

```ini
[Unit]
Description=Excel to GSTR-1 Converter
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/excel-to-gstr1
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable excel-to-gstr1.service
systemctl start excel-to-gstr1.service
```

### 5.2 Set Up Log Rotation

```bash
nano /etc/logrotate.d/excel-to-gstr1
```

Add:

```
/opt/excel-to-gstr1/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
}
```

## Step 6: Update and Maintain

### 6.1 Update the Application

```bash
cd /opt/excel-to-gstr1

# Pull latest changes (if using Git)
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### 6.2 View Logs

```bash
# Application logs
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app
```

### 6.3 Monitor Resources

```bash
# Check container status
docker compose ps

# Check resource usage
docker stats

# Check disk space
df -h
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Check if port 3000 is already in use
netstat -tulpn | grep 3000

# Rebuild from scratch
docker compose down
docker system prune -a
docker compose up -d --build
```

### Application Not Accessible

1. Check firewall rules in Linode dashboard
2. Verify Nginx is running: `systemctl status nginx`
3. Check Nginx error logs: `tail -f /var/log/nginx/error.log`
4. Verify Docker container is running: `docker compose ps`

### Out of Memory Issues

If you experience memory issues, consider:
- Upgrading your Linode plan
- Adding swap space
- Optimizing Docker images

## Security Best Practices

1. **Keep system updated**: `apt update && apt upgrade -y`
2. **Use SSH keys** instead of passwords
3. **Configure firewall** to only allow necessary ports
4. **Use SSL/HTTPS** for production
5. **Regular backups** of your application data
6. **Monitor logs** for suspicious activity
7. **Use non-root user** for running applications

## Backup Strategy

### Backup Application Code

```bash
# Create backup directory
mkdir -p /opt/backups

# Backup application
tar -czf /opt/backups/excel-to-gstr1-$(date +%Y%m%d).tar.gz /opt/excel-to-gstr1
```

### Automated Backups (Cron)

```bash
crontab -e
```

Add:

```
0 2 * * * tar -czf /opt/backups/excel-to-gstr1-$(date +\%Y\%m\%d).tar.gz /opt/excel-to-gstr1 && find /opt/backups -name "*.tar.gz" -mtime +7 -delete
```

## Additional Resources

- [Linode Documentation](https://www.linode.com/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Nginx Documentation](https://nginx.org/en/docs/)

## Support

For issues specific to this application, please check the main README.md file or open an issue in the repository.

