# API Documentation - Badminton Court Management System

## Base URL
```
/api
```

## Endpoints

### Players (Người chơi)
- `GET /api/players` - Lấy danh sách người chơi (có filter, search)
  - Query params: `gender` (male/female), `search` (tên), `has_debt` (true/false)
- `POST /api/players` - Tạo người chơi mới
- `GET /api/players/{id}` - Lấy thông tin người chơi (kèm debt summary)
- `PUT /api/players/{id}` - Cập nhật người chơi
- `DELETE /api/players/{id}` - Xóa người chơi
- `GET /api/players/{id}/debts` - Lấy danh sách nợ của người chơi

### Ratios (Mức tính)
- `GET /api/ratios` - Lấy danh sách mức tính
- `POST /api/ratios` - Tạo mức tính mới
- `GET /api/ratios/{id}` - Lấy thông tin mức tính
- `PUT /api/ratios/{id}` - Cập nhật mức tính
- `DELETE /api/ratios/{id}` - Xóa mức tính
- `GET /api/ratios/defaults` - Lấy mức tính mặc định theo gender
  - Query params: `gender` (male/female) - optional

### Menus (Menu nước)
- `GET /api/menus` - Lấy danh sách menu
- `POST /api/menus` - Tạo menu mới
- `GET /api/menus/{id}` - Lấy thông tin menu
- `PUT /api/menus/{id}` - Cập nhật menu
- `DELETE /api/menus/{id}` - Xóa menu

### Shuttles (Loại quả cầu)
- `GET /api/shuttles` - Lấy danh sách loại cầu
- `POST /api/shuttles` - Tạo loại cầu mới
- `GET /api/shuttles/{id}` - Lấy thông tin loại cầu
- `PUT /api/shuttles/{id}` - Cập nhật loại cầu
- `DELETE /api/shuttles/{id}` - Xóa loại cầu

### Bills (Phiếu thu)
- `GET /api/bills` - Lấy danh sách bills (có filter)
  - Query params: `date`, `date_from`, `date_to`, `player_id`
- `POST /api/bills` - Tạo bill mới (với tính toán tự động)
- `GET /api/bills/{id}` - Lấy thông tin bill (kèm bill_players, bill_shuttles)
- `PUT /api/bills/{id}` - Cập nhật bill (note)
- `DELETE /api/bills/{id}` - Xóa bill
- `POST /api/bills/{id}/players/{player_id}/pay` - Đánh dấu thanh toán
  - Body: `amount` (optional), `method` (optional)

### Debts (Nợ)
- `GET /api/debts` - Lấy danh sách nợ chưa giải quyết
- `POST /api/debts` - Tạo nợ mới
- `GET /api/debts/{id}` - Lấy thông tin nợ
- `PUT /api/debts/{id}` - Cập nhật nợ
- `DELETE /api/debts/{id}` - Xóa nợ

## Request Examples

### Tạo Bill mới
```json
POST /api/bills
{
  "date": "2025-12-05",
  "note": "Buổi đánh tối",
  "court_total": 200000,
  "court_count": 2,
  "shuttles": [
    {
      "shuttle_type_id": 1,
      "quantity": 2
    }
  ],
  "players": [
    {
      "user_id": 1,
      "ratio_value": 1.0,
      "menus": [
        {
          "menu_id": 1,
          "quantity": 2
        }
      ]
    },
    {
      "user_id": 2,
      "ratio_value": 0.7,
      "menus": []
    }
  ]
}
```

### Đánh dấu thanh toán
```json
POST /api/bills/{id}/players/{player_id}/pay
{
  "amount": 50000,
  "method": "cash"
}
```

### Lấy nợ của người chơi
```
GET /api/players/{id}/debts
```

### Lấy mức tính mặc định
```
GET /api/ratios/defaults
GET /api/ratios/defaults?gender=male
```

### Filter players
```
GET /api/players?gender=male
GET /api/players?search=Nguyen
GET /api/players?has_debt=true
```

### Filter bills
```
GET /api/bills?date=2025-12-05
GET /api/bills?date_from=2025-12-01&date_to=2025-12-31
GET /api/bills?player_id=1
```

## Công thức tính toán Bill

1. **Tổng tiền cầu**: Sum(price * quantity) cho tất cả các loại cầu
2. **Tổng tiền**: court_total + total_shuttle_price
3. **Tổng ratio**: Sum(ratio_value) của tất cả người chơi
4. **Unit price**: total_amount / sum_ratios
5. **Share amount** (mỗi người): round(ratio_value * unit_price)
6. **Total amount** (mỗi người): share_amount + menu_extra_total + debt_amount

## Database Schema

Tất cả các migrations đã được tạo trong `database/migrations/`:
- users (người chơi)
- ratios (mức tính)
- menus (menu nước)
- shuttle_types (loại cầu)
- bills (phiếu thu)
- bill_shuttles (chi tiết cầu trong bill)
- bill_players (người chơi trong bill)
- bill_player_menus (menu của từng người)
- debts (nợ)

