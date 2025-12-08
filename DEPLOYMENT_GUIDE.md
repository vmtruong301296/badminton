# Hướng dẫn Deploy ứng dụng BAndF lên Host

## 📋 Tổng quan

Ứng dụng bao gồm:
- **Frontend**: ReactJS (Vite)
- **Backend**: Laravel 12 (PHP 8.2+)
- **Database**: MySQL

---

## 🎯 Phương án 1: Deploy lên VPS (Khuyến nghị)

### Yêu cầu hệ thống:
- VPS với Ubuntu 20.04/22.04 hoặc CentOS 7+
- RAM: Tối thiểu 2GB (khuyến nghị 4GB)
- CPU: 2 cores trở lên
- Disk: 20GB trở lên

### Bước 1: Chuẩn bị VPS

#### 1.1. Kết nối SSH vào VPS
```bash
ssh root@your-server-ip
```

#### 1.2. Cập nhật hệ thống
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.3. Cài đặt các package cần thiết

**Cài đặt Nginx:**
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Cài đặt PHP 8.2+ và các extension:**
```bash
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.2-fpm php8.2-cli php8.2-common php8.2-mysql php8.2-zip php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-bcmath -y
```

**Cài đặt MySQL:**
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

**Cài đặt Composer:**
```bash
cd ~
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

**Cài đặt Node.js và npm:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Cài đặt Git:**
```bash
sudo apt install git -y
```

### Bước 2: Cấu hình Database

#### 2.1. Tạo database và user
```bash
sudo mysql -u root -p
```

Trong MySQL console:
```sql
CREATE DATABASE bandf_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bandf_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON bandf_db.* TO 'bandf_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Bước 3: Deploy Backend (Laravel)

#### 3.1. Clone repository hoặc upload code
```bash
cd /var/www
sudo git clone https://your-repo-url.git bandf
# Hoặc upload code qua SFTP/SCP
```

#### 3.2. Cài đặt dependencies
```bash
cd /var/www/bandf/BACKEND
sudo composer install --optimize-autoloader --no-dev
```

#### 3.3. Cấu hình .env
```bash
sudo cp .env.example .env
sudo nano .env
```

Cập nhật các giá trị sau:
```env
APP_NAME="BAndF"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bandf_db
DB_USERNAME=bandf_user
DB_PASSWORD=your_strong_password

SESSION_DRIVER=file
SESSION_LIFETIME=120

# CORS settings
SANCTUM_STATEFUL_DOMAINS=your-domain.com
SESSION_DOMAIN=.your-domain.com
```

#### 3.4. Generate application key và migrate
```bash
sudo php artisan key:generate
sudo php artisan migrate --force
sudo php artisan db:seed --force  # Nếu cần seed data
```

#### 3.5. Cấu hình storage link
```bash
sudo php artisan storage:link
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache
```

#### 3.6. Tối ưu hóa Laravel
```bash
sudo php artisan config:cache
sudo php artisan route:cache
sudo php artisan view:cache
```

### Bước 4: Deploy Frontend (React)

#### 4.1. Build production
```bash
cd /var/www/bandf/FRONTEND
sudo npm install
sudo npm run build
```

#### 4.2. Copy build files vào thư mục public của Laravel
```bash
sudo cp -r dist/* /var/www/bandf/BACKEND/public/
```

**Lưu ý**: Nếu muốn tách biệt Frontend và Backend, xem phần "Cấu hình Nginx riêng biệt" bên dưới.

### Bước 5: Cấu hình Nginx

#### 5.1. Tạo Nginx config cho Backend
```bash
sudo nano /etc/nginx/sites-available/bandf
```

Nội dung config (nếu Frontend và Backend cùng domain):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS (sau khi cài SSL)
    # return 301 https://$server_name$request_uri;
    
    root /var/www/bandf/BACKEND/public;
    index index.php index.html;

    charset utf-8;

    # Frontend routes - serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API routes - Laravel
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Laravel routes
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 5.2. Enable site và test config
```bash
sudo ln -s /etc/nginx/sites-available/bandf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 6: Cài đặt SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot sẽ tự động cập nhật Nginx config để sử dụng HTTPS.

### Bước 7: Cấu hình Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 🎯 Phương án 2: Deploy lên Shared Hosting (cPanel)

### Bước 1: Upload Backend

1. Upload toàn bộ thư mục `BACKEND` lên hosting (thường là `public_html` hoặc `public_html/api`)
2. Đảm bảo file `.htaccess` có trong thư mục `public`

### Bước 2: Cấu hình Database

1. Tạo database và user qua cPanel
2. Cập nhật file `.env` với thông tin database

### Bước 3: Build và Upload Frontend

1. Build frontend: `npm run build`
2. Upload toàn bộ nội dung thư mục `dist` lên `public_html`
3. Hoặc cấu hình subdomain riêng cho frontend

### Bước 4: Cấu hình .htaccess

Tạo file `.htaccess` trong thư mục `public` của Laravel:
```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

---

## 🎯 Phương án 3: Deploy tách biệt Frontend và Backend

### Cấu hình Nginx cho Backend (API)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    
    root /var/www/bandf/BACKEND/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### Cấu hình Nginx cho Frontend

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/bandf/FRONTEND/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api.your-domain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Cập nhật Frontend API config

Sửa file `FRONTEND/src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.your-domain.com/api'  // Production API URL
    : '/api',  // Development
  // ... rest of config
});
```

Và build lại:
```bash
cd FRONTEND
npm run build
```

---

## 🔧 Cấu hình bổ sung

### 1. Cấu hình CORS trong Laravel

Sửa file `BACKEND/config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['https://your-domain.com'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

### 2. Cấu hình Session

Trong `.env`:
```env
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_DOMAIN=.your-domain.com
```

### 3. Tối ưu hóa Laravel cho Production

Thêm vào `composer.json`:
```json
"scripts": {
    "post-deploy": [
        "php artisan config:cache",
        "php artisan route:cache",
        "php artisan view:cache"
    ]
}
```

### 4. Cấu hình Queue (nếu sử dụng)

```bash
sudo nano /etc/systemd/system/bandf-queue.service
```

```ini
[Unit]
Description=BAndF Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/bandf/BACKEND/artisan queue:work --sleep=3 --tries=3

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable bandf-queue
sudo systemctl start bandf-queue
```

### 5. Backup tự động

Tạo script backup:
```bash
sudo nano /usr/local/bin/backup-bandf.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/bandf"
DB_NAME="bandf_db"
DB_USER="bandf_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/bandf

# Delete backups older than 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

Cấp quyền và thêm vào cron:
```bash
sudo chmod +x /usr/local/bin/backup-bandf.sh
sudo crontab -e
# Thêm dòng: 0 2 * * * /usr/local/bin/backup-bandf.sh
```

---

## ✅ Checklist trước khi deploy

- [ ] Đã test toàn bộ chức năng trên môi trường development
- [ ] Đã build frontend thành công (`npm run build`)
- [ ] Đã cấu hình `.env` với thông tin production
- [ ] Đã chạy migrations (`php artisan migrate`)
- [ ] Đã tạo storage link (`php artisan storage:link`)
- [ ] Đã cấu hình CORS đúng domain
- [ ] Đã cài SSL certificate
- [ ] Đã test API endpoints
- [ ] Đã cấu hình firewall
- [ ] Đã setup backup tự động

---

## 🐛 Troubleshooting

### Lỗi 500 Internal Server Error
- Kiểm tra quyền file: `sudo chmod -R 775 storage bootstrap/cache`
- Kiểm tra log: `tail -f storage/logs/laravel.log`
- Kiểm tra PHP-FPM: `sudo systemctl status php8.2-fpm`

### Lỗi CORS
- Kiểm tra config CORS trong Laravel
- Kiểm tra `APP_URL` trong `.env`
- Kiểm tra `SESSION_DOMAIN`

### Lỗi Database Connection
- Kiểm tra thông tin database trong `.env`
- Kiểm tra MySQL service: `sudo systemctl status mysql`
- Kiểm tra user và quyền database

### Frontend không load
- Kiểm tra Nginx config
- Kiểm tra file build có đầy đủ không
- Kiểm tra console browser để xem lỗi

---

## 📚 Tài liệu tham khảo

- [Laravel Deployment](https://laravel.com/docs/deployment)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

---

## 🔐 Bảo mật

1. **Không commit file `.env`**
2. **Sử dụng HTTPS**
3. **Cập nhật Laravel và dependencies thường xuyên**
4. **Cấu hình firewall đúng cách**
5. **Sử dụng mật khẩu mạnh cho database**
6. **Giới hạn quyền truy cập file**
7. **Sử dụng `.env` với `APP_DEBUG=false`**

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Log Laravel: `storage/logs/laravel.log`
2. Log Nginx: `/var/log/nginx/error.log`
3. Log PHP-FPM: `/var/log/php8.2-fpm.log`

