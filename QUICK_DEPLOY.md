# 🚀 Hướng dẫn Deploy Nhanh

## Tùy chọn 1: Sử dụng Script Tự động

```bash
# Cấp quyền thực thi
chmod +x deploy.sh

# Chạy deploy
./deploy.sh production
```

## Tùy chọn 2: Deploy Thủ Công

### 1. Build Frontend
```bash
cd FRONTEND
npm install
npm run build
```

### 2. Setup Backend
```bash
cd BACKEND
composer install --optimize-autoloader --no-dev
cp .env.example .env
# Sửa file .env với thông tin production
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

### 3. Copy Frontend vào Backend
```bash
cp -r FRONTEND/dist/* BACKEND/public/
```

### 4. Cấu hình Web Server
- Xem file `nginx-config-example.conf` cho Nginx
- Hoặc sử dụng `.htaccess` đã có sẵn cho Apache

## Checklist Nhanh

- [ ] Database đã được tạo và cấu hình
- [ ] File `.env` đã được cấu hình đúng
- [ ] Frontend đã build thành công
- [ ] Backend đã chạy migrations
- [ ] Web server (Nginx/Apache) đã được cấu hình
- [ ] SSL certificate đã được cài đặt
- [ ] Firewall đã được cấu hình

## Lưu Ý Quan Trọng

1. **Không commit file `.env`** - File này chứa thông tin nhạy cảm
2. **Đặt `APP_DEBUG=false`** trong production
3. **Sử dụng HTTPS** - Bắt buộc cho production
4. **Backup thường xuyên** - Database và files
5. **Cập nhật dependencies** - Đảm bảo bảo mật

## Xem Hướng Dẫn Chi Tiết

Xem file `DEPLOYMENT_GUIDE.md` để có hướng dẫn đầy đủ và chi tiết hơn.

