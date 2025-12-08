# 📚 Tài Liệu Deploy BAndF - Mục Lục

## 📖 Các File Hướng Dẫn

### 1. **DEPLOYMENT_GUIDE.md** - Hướng dẫn chi tiết
   - Hướng dẫn đầy đủ từng bước deploy
   - 3 phương án: VPS, Shared Hosting, Tách biệt Frontend/Backend
   - Cấu hình Nginx, SSL, Database
   - Troubleshooting và bảo mật

### 2. **QUICK_DEPLOY.md** - Hướng dẫn nhanh
   - Checklist nhanh
   - Script tự động
   - Các bước cơ bản

### 3. **API_CONFIG_GUIDE.md** - Cấu hình API
   - Cấu hình API cho các trường hợp khác nhau
   - CORS configuration
   - Environment variables
   - Troubleshooting API

## 🚀 Bắt Đầu Nhanh

### Nếu bạn mới bắt đầu:
1. Đọc **QUICK_DEPLOY.md** để có cái nhìn tổng quan
2. Chọn phương án deploy phù hợp
3. Đọc phần tương ứng trong **DEPLOYMENT_GUIDE.md**
4. Tham khảo **API_CONFIG_GUIDE.md** nếu cần tách Frontend/Backend

### Nếu bạn đã có kinh nghiệm:
1. Sử dụng script `deploy.sh` để tự động hóa
2. Tham khảo `nginx-config-example.conf` cho cấu hình Nginx
3. Kiểm tra checklist trong **QUICK_DEPLOY.md**

## 📁 Các File Hỗ Trợ

- **deploy.sh** - Script tự động deploy
- **nginx-config-example.conf** - Cấu hình Nginx mẫu
- **BACKEND/public/.htaccess** - Cấu hình Apache
- **FRONTEND/.env.production.example** - Environment variables mẫu

## 🎯 Lộ Trình Deploy Khuyến Nghị

### Bước 1: Chuẩn bị
- [ ] Đọc **QUICK_DEPLOY.md**
- [ ] Chọn phương án deploy
- [ ] Chuẩn bị server/hosting

### Bước 2: Setup Backend
- [ ] Cài đặt PHP, MySQL, Composer
- [ ] Tạo database
- [ ] Cấu hình `.env`
- [ ] Chạy migrations

### Bước 3: Build Frontend
- [ ] Cài đặt Node.js
- [ ] Build production
- [ ] Copy vào Backend public

### Bước 4: Cấu hình Web Server
- [ ] Cấu hình Nginx/Apache
- [ ] Cài SSL certificate
- [ ] Test các endpoints

### Bước 5: Kiểm tra
- [ ] Test toàn bộ chức năng
- [ ] Kiểm tra bảo mật
- [ ] Setup backup

## ❓ Câu Hỏi Thường Gặp

### Q: Nên chọn phương án nào?
**A:** 
- **VPS**: Nếu bạn có kinh nghiệm quản trị server, cần kiểm soát hoàn toàn
- **Shared Hosting**: Nếu bạn mới bắt đầu, dễ sử dụng, chi phí thấp
- **Tách biệt**: Nếu cần scale riêng Frontend và Backend

### Q: Có cần tách Frontend và Backend không?
**A:** Không bắt buộc. Nếu cùng domain thì đơn giản hơn và không cần cấu hình CORS phức tạp.

### Q: Script deploy.sh có an toàn không?
**A:** Script chỉ tự động hóa các bước thủ công. Bạn vẫn cần:
- Kiểm tra file `.env`
- Cấu hình web server
- Setup SSL

### Q: Làm sao để update sau khi deploy?
**A:** 
1. Pull code mới
2. Chạy lại `deploy.sh`
3. Hoặc chạy từng bước thủ công

## 🔗 Liên Kết Nhanh

- [Hướng dẫn chi tiết](./DEPLOYMENT_GUIDE.md)
- [Hướng dẫn nhanh](./QUICK_DEPLOY.md)
- [Cấu hình API](./API_CONFIG_GUIDE.md)

## 📞 Cần Hỗ Trợ?

1. Kiểm tra phần Troubleshooting trong **DEPLOYMENT_GUIDE.md**
2. Xem log files:
   - Laravel: `storage/logs/laravel.log`
   - Nginx: `/var/log/nginx/error.log`
   - PHP-FPM: `/var/log/php8.2-fpm.log`

---

**Chúc bạn deploy thành công! 🎉**

