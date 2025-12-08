# Hướng Dẫn Cấu Hình API cho Frontend

## Tình huống 1: Frontend và Backend cùng domain

**Cấu hình hiện tại (mặc định):**
```javascript
// FRONTEND/src/services/api.js
const api = axios.create({
  baseURL: '/api',  // Relative path - hoạt động tốt
  // ...
});
```

**Không cần thay đổi gì!** Cấu hình này sẽ hoạt động khi:
- Frontend được serve từ `/` 
- Backend API được serve từ `/api`

---

## Tình huống 2: Frontend và Backend tách biệt (subdomain khác nhau)

### Cấu hình Frontend

**Tạo file `.env.production`:**
```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

**Cập nhật `FRONTEND/src/services/api.js`:**
```javascript
import axios from 'axios';

// Lấy API URL từ environment variable hoặc dùng default
const getApiBaseUrl = () => {
  // Development
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Production - từ environment variable
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ... rest of code
```

**Cập nhật `FRONTEND/vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // Thêm để Vite load env variables
  envPrefix: 'VITE_',
})
```

**Build với environment variable:**
```bash
cd FRONTEND
npm run build
# Vite sẽ tự động load .env.production
```

---

## Tình huống 3: Sử dụng Environment Variables động

**Cập nhật `FRONTEND/src/services/api.js` để hỗ trợ cả hai trường hợp:**

```javascript
import axios from 'axios';

// Function để lấy API base URL
const getApiBaseUrl = () => {
  // Kiểm tra environment variable trước
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Development mode - dùng proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Production - mặc định dùng relative path (cùng domain)
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ... rest of code
```

---

## Cấu hình CORS cho Backend

Khi Frontend và Backend tách biệt, cần cấu hình CORS:

**File `BACKEND/config/cors.php`:**
```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://your-domain.com',
        'https://www.your-domain.com',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

**Hoặc trong `.env`:**
```env
# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

## Kiểm tra cấu hình

### Test API từ Frontend:

1. **Mở Developer Console (F12)**
2. **Vào tab Network**
3. **Thực hiện một request từ app**
4. **Kiểm tra:**
   - Request URL có đúng không?
   - Status code là gì?
   - Có lỗi CORS không?

### Test trực tiếp API:

```bash
# Test API endpoint
curl https://api.your-domain.com/api/me \
  -H "Cookie: laravel_session=your_session_cookie"
```

---

## Troubleshooting

### Lỗi CORS

**Triệu chứng:**
```
Access to XMLHttpRequest at 'https://api.domain.com/api/...' 
from origin 'https://domain.com' has been blocked by CORS policy
```

**Giải pháp:**
1. Kiểm tra `config/cors.php` trong Laravel
2. Đảm bảo domain frontend có trong `allowed_origins`
3. Clear config cache: `php artisan config:clear`

### Lỗi 401 Unauthorized

**Triệu chứng:**
- API trả về 401 khi đã login

**Giải pháp:**
1. Kiểm tra `withCredentials: true` trong axios config
2. Kiểm tra CORS `supports_credentials: true`
3. Kiểm tra session domain trong `.env`

### API không kết nối được

**Triệu chứng:**
- Network error hoặc timeout

**Giải pháp:**
1. Kiểm tra API URL có đúng không
2. Kiểm tra firewall có chặn không
3. Kiểm tra SSL certificate có hợp lệ không
4. Test API trực tiếp bằng curl hoặc Postman

---

## Best Practices

1. **Luôn sử dụng HTTPS** trong production
2. **Không hardcode API URL** trong code
3. **Sử dụng environment variables** cho các môi trường khác nhau
4. **Test CORS** trước khi deploy
5. **Monitor API calls** trong production
6. **Sử dụng API versioning** nếu cần: `/api/v1/...`

