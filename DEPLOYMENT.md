# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Glow by Hanka website to a production environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Server Requirements](#server-requirements)
- [Production Environment Setup](#production-environment-setup)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [File Upload Directory Setup](#file-upload-directory-setup)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Security Checklist](#security-checklist)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup Strategy](#backup-strategy)
- [Deployment Checklist](#deployment-checklist)

## Prerequisites

Before deploying to production, ensure you have:

- A production server (VPS, dedicated server, or cloud instance)
- Domain name configured and pointing to your server
- SSH access to the server
- Root or sudo privileges
- SSL certificate (Let's Encrypt recommended)

## Server Requirements

### Minimum Specifications

- **OS:** Ubuntu 20.04 LTS or higher (or similar Linux distribution)
- **CPU:** 2 cores
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 20GB minimum (more depending on image storage needs)
- **Network:** Static IP address

### Required Software

- Node.js v18 or higher
- PostgreSQL v14 or higher
- Nginx (for reverse proxy and static file serving)
- PM2 (for Node.js process management)
- Certbot (for SSL certificates)

## Production Environment Setup

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### 4. Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
```

### 5. Install PM2

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 6. Install Certbot for SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## Database Setup

### 1. Create Production Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database
CREATE DATABASE glowbyhanka_prod;

# Create dedicated database user
CREATE USER glowbyhanka_prod WITH PASSWORD 'your_strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE glowbyhanka_prod TO glowbyhanka_prod;

# Exit psql
\q
```

### 2. Configure PostgreSQL for Production

Edit PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Recommended settings:

```conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 3. Secure PostgreSQL

```bash
# Edit pg_hba.conf to restrict access
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Ensure local connections use password authentication:

```conf
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## Backend Deployment

### 1. Create Application Directory

```bash
sudo mkdir -p /var/www/glowbyhanka
sudo chown -R $USER:$USER /var/www/glowbyhanka
cd /var/www/glowbyhanka
```

### 2. Clone Repository

```bash
git clone <your-repository-url> .
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install --production
```

### 4. Configure Production Environment

Create production `.env` file:

```bash
nano .env
```

Production environment variables:

```env
# Database Configuration
DATABASE_URL=postgresql://glowbyhanka_prod:your_strong_password_here@localhost:5432/glowbyhanka_prod

# JWT Configuration
JWT_SECRET=generate-a-very-strong-random-secret-at-least-64-characters-long
JWT_EXPIRATION=24h

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@glowbyhanka.cz
SMTP_PASSWORD=your-production-email-app-password
SMTP_FROM=info@glowbyhanka.cz

# File Upload Configuration
UPLOAD_DIR=/var/www/glowbyhanka/uploads
MAX_FILE_SIZE=5242880

# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://glowbyhanka.cz
```

**Important:** Generate a strong JWT secret:

```bash
openssl rand -base64 64
```

### 5. Run Database Migrations

```bash
cd /var/www/glowbyhanka/backend
npm run migrate
```

### 6. Seed Initial Data

```bash
npm run seed
```

**⚠️ Important:** After seeding, immediately change the default admin password!

### 7. Change Default Admin Password

Connect to the database and update the admin password:

```bash
# Generate a new password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_new_secure_password', 10).then(hash => console.log(hash));"

# Connect to database
psql -U glowbyhanka_prod -d glowbyhanka_prod

# Update admin password with the generated hash
UPDATE users SET password_hash = 'paste_generated_hash_here' WHERE username = 'admin';

# Exit
\q
```

### 8. Start Backend with PM2

```bash
cd /var/www/glowbyhanka/backend

# Start the application
pm2 start src/server.js --name glowbyhanka-backend

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup systemd
# Follow the instructions provided by the command above
```

### 9. Verify Backend is Running

```bash
pm2 status
pm2 logs glowbyhanka-backend

# Test the API
curl http://localhost:3000/api/portfolio/categories
```

## Frontend Deployment

### 1. Install Frontend Dependencies

```bash
cd /var/www/glowbyhanka/frontend
npm install
```

### 2. Configure Production Environment

Create production `.env` file:

```bash
nano .env
```

```env
# API Configuration
VITE_API_URL=https://glowbyhanka.cz/api
```

### 3. Build Frontend for Production

```bash
cd /var/www/glowbyhanka/frontend
npm run build
```

This creates an optimized production build in the `dist` directory.

### 4. Configure Nginx

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/glowbyhanka
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name glowbyhanka.cz www.glowbyhanka.cz;

    # Redirect HTTP to HTTPS (will be configured after SSL setup)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name glowbyhanka.cz www.glowbyhanka.cz;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/glowbyhanka.cz/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/glowbyhanka.cz/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend static files
    root /var/www/glowbyhanka/frontend/dist;
    index index.html;

    # Serve uploaded images
    location /uploads/ {
        alias /var/www/glowbyhanka/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 5. Enable Nginx Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/glowbyhanka /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## File Upload Directory Setup

### 1. Create Upload Directory

```bash
sudo mkdir -p /var/www/glowbyhanka/uploads
```

### 2. Set Proper Permissions

```bash
# Set ownership to the user running the Node.js process
sudo chown -R $USER:$USER /var/www/glowbyhanka/uploads

# Set appropriate permissions
sudo chmod 755 /var/www/glowbyhanka/uploads

# Create category subdirectories (optional, will be created automatically)
mkdir -p /var/www/glowbyhanka/uploads/svatebni-liceni
mkdir -p /var/www/glowbyhanka/uploads/liceni-na-plesy-a-vecirky
mkdir -p /var/www/glowbyhanka/uploads/slavnostni-liceni
mkdir -p /var/www/glowbyhanka/uploads/liceni-pro-foceni
```

### 3. Configure Nginx to Serve Uploads

The Nginx configuration above already includes the `/uploads/` location block to serve uploaded images with proper caching headers.

## SSL/HTTPS Configuration

### 1. Obtain SSL Certificate with Let's Encrypt

```bash
# Obtain certificate for your domain
sudo certbot --nginx -d glowbyhanka.cz -d www.glowbyhanka.cz

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

### 2. Verify SSL Configuration

```bash
# Test SSL configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Set Up Auto-Renewal

Certbot automatically sets up a cron job for certificate renewal. Verify it:

```bash
# Test renewal process
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### 4. Verify HTTPS is Working

Visit your website:

- https://glowbyhanka.cz
- Verify the padlock icon in the browser
- Check that HTTP redirects to HTTPS

## Security Checklist

### Application Security

- [ ] **Change default admin password** immediately after deployment
- [ ] **Use strong JWT secret** (minimum 64 characters, randomly generated)
- [ ] **Enable HTTPS** for all traffic
- [ ] **Configure CORS** to allow only your domain
- [ ] **Set secure environment variables** (never commit `.env` files)
- [ ] **Disable directory listing** in Nginx
- [ ] **Implement rate limiting** on login endpoint (already configured in backend)
- [ ] **Validate all user inputs** (already implemented)
- [ ] **Sanitize file uploads** (already implemented)
- [ ] **Use parameterized queries** (already implemented with pg)

### Server Security

- [ ] **Configure firewall** (UFW):

  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw enable
  ```

- [ ] **Disable root SSH login**:

  ```bash
  sudo nano /etc/ssh/sshd_config
  # Set: PermitRootLogin no
  sudo systemctl restart sshd
  ```

- [ ] **Set up SSH key authentication** (disable password authentication)

- [ ] **Keep system updated**:

  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] **Configure fail2ban** to prevent brute force attacks:
  ```bash
  sudo apt install fail2ban
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```

### Database Security

- [ ] **Use strong database password**
- [ ] **Restrict database access** to localhost only
- [ ] **Regular database backups** (see Backup Strategy section)
- [ ] **Keep PostgreSQL updated**
- [ ] **Use dedicated database user** with minimal privileges

### File Security

- [ ] **Set proper file permissions** (755 for directories, 644 for files)
- [ ] **Restrict upload directory** access
- [ ] **Validate uploaded file types** (already implemented)
- [ ] **Limit file upload size** (already configured to 5MB)

### Monitoring

- [ ] **Set up error logging**
- [ ] **Monitor disk space** (especially uploads directory)
- [ ] **Monitor application logs** with PM2
- [ ] **Set up uptime monitoring** (e.g., UptimeRobot, Pingdom)
- [ ] **Configure email alerts** for critical errors

## Monitoring and Logging

### PM2 Monitoring

```bash
# View application status
pm2 status

# View logs
pm2 logs glowbyhanka-backend

# View specific log file
pm2 logs glowbyhanka-backend --lines 100

# Monitor CPU and memory usage
pm2 monit

# View detailed information
pm2 show glowbyhanka-backend
```

### Application Logs

Backend logs are managed by PM2:

```bash
# Log files location
~/.pm2/logs/

# View error logs
pm2 logs glowbyhanka-backend --err

# View output logs
pm2 logs glowbyhanka-backend --out
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Logs

```bash
# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Set Up Log Rotation

PM2 handles log rotation automatically. For Nginx:

```bash
# Nginx log rotation is configured by default in:
/etc/logrotate.d/nginx
```

### Monitoring Tools (Optional)

Consider setting up:

- **PM2 Plus** - Advanced PM2 monitoring (https://pm2.io/)
- **New Relic** - Application performance monitoring
- **Datadog** - Infrastructure and application monitoring
- **Sentry** - Error tracking and monitoring
- **UptimeRobot** - Website uptime monitoring (free tier available)

## Backup Strategy

### Database Backups

#### 1. Manual Database Backup

```bash
# Create backup directory
sudo mkdir -p /var/backups/glowbyhanka

# Create database backup
sudo -u postgres pg_dump glowbyhanka_prod > /var/backups/glowbyhanka/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip /var/backups/glowbyhanka/db_backup_*.sql
```

#### 2. Automated Daily Backups

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-glowbyhanka.sh
```

Add the following content:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/glowbyhanka"
DB_NAME="glowbyhanka_prod"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"

# Perform backup
sudo -u postgres pg_dump $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than retention period
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Make the script executable:

```bash
sudo chmod +x /usr/local/bin/backup-glowbyhanka.sh
```

Set up daily cron job:

```bash
sudo crontab -e
```

Add the following line (runs daily at 2 AM):

```cron
0 2 * * * /usr/local/bin/backup-glowbyhanka.sh >> /var/log/glowbyhanka-backup.log 2>&1
```

#### 3. Database Restore

To restore from a backup:

```bash
# Decompress backup
gunzip /var/backups/glowbyhanka/db_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore database
sudo -u postgres psql glowbyhanka_prod < /var/backups/glowbyhanka/db_backup_YYYYMMDD_HHMMSS.sql
```

### File Backups (Uploaded Images)

#### 1. Manual Backup

```bash
# Create backup of uploads directory
sudo tar -czf /var/backups/glowbyhanka/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/glowbyhanka/uploads
```

#### 2. Automated Backup Script

Add to the backup script above:

```bash
# Backup uploads directory
UPLOADS_BACKUP="$BACKUP_DIR/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $UPLOADS_BACKUP /var/www/glowbyhanka/uploads

# Remove old upload backups
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Uploads backup completed: $UPLOADS_BACKUP"
```

### Off-Site Backups

For production, consider storing backups off-site:

**Option 1: AWS S3**

```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS credentials
aws configure

# Sync backups to S3
aws s3 sync /var/backups/glowbyhanka s3://your-bucket-name/glowbyhanka-backups/
```

**Option 2: Rsync to Remote Server**

```bash
# Sync to remote server
rsync -avz /var/backups/glowbyhanka/ user@backup-server:/backups/glowbyhanka/
```

## Deployment Checklist

Use this checklist to ensure all deployment steps are completed:

### Pre-Deployment

- [ ] Code is tested and ready for production
- [ ] All tests pass (backend and frontend)
- [ ] Environment variables are documented
- [ ] Database migrations are tested
- [ ] SSL certificate is ready or can be obtained
- [ ] Domain DNS is configured correctly

### Server Setup

- [ ] Server is provisioned and accessible via SSH
- [ ] System packages are updated
- [ ] Node.js v18+ is installed
- [ ] PostgreSQL v14+ is installed
- [ ] Nginx is installed and configured
- [ ] PM2 is installed globally
- [ ] Firewall (UFW) is configured

### Database

- [ ] Production database is created
- [ ] Database user is created with strong password
- [ ] Database migrations are run successfully
- [ ] Initial data is seeded (categories, admin user)
- [ ] Default admin password is changed
- [ ] Database backups are configured

### Backend

- [ ] Application code is deployed to `/var/www/glowbyhanka`
- [ ] Backend dependencies are installed (`npm install --production`)
- [ ] Production `.env` file is configured with all required variables
- [ ] JWT secret is strong and randomly generated
- [ ] Backend is started with PM2
- [ ] PM2 is configured to start on system boot
- [ ] Backend API endpoints are accessible

### Frontend

- [ ] Frontend dependencies are installed
- [ ] Production `.env` file is configured
- [ ] Frontend is built for production (`npm run build`)
- [ ] Build artifacts are in `dist` directory

### Nginx

- [ ] Nginx configuration file is created
- [ ] Configuration includes SSL settings
- [ ] Configuration includes API proxy
- [ ] Configuration includes static file serving
- [ ] Configuration includes security headers
- [ ] Site is enabled in Nginx
- [ ] Nginx configuration is tested (`nginx -t`)
- [ ] Nginx is reloaded

### SSL/HTTPS

- [ ] SSL certificate is obtained with Certbot
- [ ] HTTPS is working correctly
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal is configured
- [ ] SSL configuration is tested

### File Uploads

- [ ] Upload directory is created (`/var/www/glowbyhanka/uploads`)
- [ ] Proper permissions are set (755)
- [ ] Nginx is configured to serve uploaded files
- [ ] File upload functionality is tested

### Security

- [ ] Default admin password is changed
- [ ] Strong JWT secret is set
- [ ] Firewall is enabled and configured
- [ ] SSH is secured (key-based auth, no root login)
- [ ] Database access is restricted to localhost
- [ ] CORS is configured for production domain
- [ ] Security headers are enabled
- [ ] Rate limiting is configured
- [ ] fail2ban is installed and configured

### Monitoring & Backups

- [ ] PM2 monitoring is set up
- [ ] Log rotation is configured
- [ ] Database backup script is created
- [ ] Automated daily backups are scheduled
- [ ] Backup restoration is tested
- [ ] Uptime monitoring is configured (optional)
- [ ] Error tracking is set up (optional)

### Testing

- [ ] Website is accessible via domain
- [ ] All public pages load correctly
- [ ] Portfolio images display correctly
- [ ] Contact form sends emails
- [ ] Admin login works
- [ ] Image upload works in admin panel
- [ ] Image deletion works in admin panel
- [ ] Responsive design works on mobile devices
- [ ] SSL certificate is valid

### Post-Deployment

- [ ] Monitor application logs for errors
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Test all critical functionality
- [ ] Document any production-specific configurations
- [ ] Set up alerts for critical issues
- [ ] Create runbook for common issues

## Updating the Application

### Deploying Updates

When you need to deploy code updates:

#### 1. Backend Updates

```bash
# Navigate to application directory
cd /var/www/glowbyhanka

# Pull latest changes
git pull origin main

# Install any new dependencies
cd backend
npm install --production

# Run any new migrations
npm run migrate

# Restart the application
pm2 restart glowbyhanka-backend

# Check logs for errors
pm2 logs glowbyhanka-backend --lines 50
```

#### 2. Frontend Updates

```bash
# Navigate to frontend directory
cd /var/www/glowbyhanka/frontend

# Pull latest changes (if not already done)
git pull origin main

# Install any new dependencies
npm install

# Rebuild for production
npm run build

# Reload Nginx to serve new files
sudo systemctl reload nginx
```

#### 3. Zero-Downtime Deployment (Advanced)

For zero-downtime deployments, consider using PM2's reload feature:

```bash
# Reload application with zero downtime
pm2 reload glowbyhanka-backend
```

This gracefully restarts the application without dropping connections.

## Troubleshooting

### Application Won't Start

1. Check PM2 logs:

   ```bash
   pm2 logs glowbyhanka-backend --err
   ```

2. Verify environment variables:

   ```bash
   cat /var/www/glowbyhanka/backend/.env
   ```

3. Check database connection:
   ```bash
   psql -U glowbyhanka_prod -d glowbyhanka_prod -c "SELECT 1;"
   ```

### Database Connection Errors

1. Verify PostgreSQL is running:

   ```bash
   sudo systemctl status postgresql
   ```

2. Check database credentials in `.env`

3. Verify database exists:
   ```bash
   sudo -u postgres psql -l | grep glowbyhanka
   ```

### Nginx Errors

1. Check Nginx error logs:

   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Test Nginx configuration:

   ```bash
   sudo nginx -t
   ```

3. Verify backend is running:
   ```bash
   curl http://localhost:3000/api/portfolio/categories
   ```

### SSL Certificate Issues

1. Check certificate status:

   ```bash
   sudo certbot certificates
   ```

2. Renew certificate manually:

   ```bash
   sudo certbot renew
   ```

3. Check Nginx SSL configuration:
   ```bash
   sudo nginx -t
   ```

### File Upload Issues

1. Check upload directory permissions:

   ```bash
   ls -la /var/www/glowbyhanka/uploads
   ```

2. Verify disk space:

   ```bash
   df -h
   ```

3. Check backend logs for upload errors:
   ```bash
   pm2 logs glowbyhanka-backend | grep -i upload
   ```

### High Memory Usage

1. Check PM2 memory usage:

   ```bash
   pm2 monit
   ```

2. Restart application if needed:

   ```bash
   pm2 restart glowbyhanka-backend
   ```

3. Consider increasing server resources if consistently high

## Performance Optimization

### Enable Nginx Caching

Add to Nginx configuration:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/portfolio/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    # ... rest of proxy configuration
}
```

### Database Optimization

1. Create indexes for frequently queried columns (already done in migrations)

2. Analyze query performance:

   ```sql
   EXPLAIN ANALYZE SELECT * FROM images WHERE category_id = 1;
   ```

3. Regular database maintenance:
   ```bash
   sudo -u postgres psql glowbyhanka_prod -c "VACUUM ANALYZE;"
   ```

### Image Optimization

Consider implementing:

- Image compression before upload
- Thumbnail generation for gallery views
- CDN for image delivery (e.g., Cloudflare, AWS CloudFront)

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**

- Review application logs for errors
- Check disk space usage
- Monitor backup success

**Monthly:**

- Update system packages: `sudo apt update && sudo apt upgrade`
- Review and rotate logs if needed
- Test backup restoration process
- Review security updates

**Quarterly:**

- Update Node.js dependencies
- Review and update SSL certificates (automatic with Let's Encrypt)
- Performance audit
- Security audit

### Getting Help

If you encounter issues:

1. Check application logs (PM2, Nginx, PostgreSQL)
2. Review this deployment guide
3. Check the main README.md for development setup
4. Review the design document in `.kiro/specs/makeup-artist-website/design.md`

## Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Deployment Guide Version:** 1.0  
**Last Updated:** December 2024  
**Application:** Glow by Hanka Make Up Artist Website
