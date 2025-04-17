# 💸 Discord Payment Bot

Bot thanh toán tự động dành cho Discord server — tích hợp với API thanh toán và PostgreSQL.  
Hỗ trợ slash command, kiểm tra trạng thái, và quản lý giao dịch.

---

## 🛠 Cài đặt & Khởi chạy

### 1. Thiết lập biến môi trường `.env`

Tạo file `.env` và điền các biến sau:

```env
DISCORD_BOT_TOKEN=your-discord-bot-token
DATABASE_URL=your-postgres-url
PAYMENT_API_KEY=your-payment-api-key
```

---

### 2. Khởi động ứng dụng
#### 🪠 Trên Windows:
```bash
node index.js
```

---

## 💬 Các Slash Command

| Lệnh | Mô tả |
|------|------|
| `/ticket` | Để tạo tickets |
| `/ticketmessage` | Thông báo tin nhắn tạo tickets |
| `!setcounter` | Chỉnh sửa số lượng tickets muốn hiển thị |

---

## ✨ Tính năng nổi bật

- 🧠 **Auto pdate số lượng tickets**: Tự động update channel mỗi 30s 
- 🔔 **Chọn chủ đề bằng cách click chọn ô**: gửi vào kênh `payment-notifications` và `payment-complete`  
- 📋 **Quản lý số lượng tickets**: dành cho Admin để theo dõi và chỉnh sửa  
- 💾 **Claim + Gửi logs ticket**: Để helper dễ dàng quản lý mà không bị người khác can thiệp

---

## 🤝 Đóng góp

Pull request và feedback luôn được chào đón ❤️  
Đây là một dự án mã nguồn mở, được tạo ra với mục đích học hỏi và chia sẻ.  

📩 Nhận đóng góp + liên hệ tại:  
[![Facebook](https://img.shields.io/badge/Facebook-Cương_Trực-blue?logo=facebook&style=flat-square)](https://facebook.com/npctruc)  
✉️ **Email:** [cuongtruc10@gmail.com](mailto:cuongtruc10@gmail.com)

---

## 📜 Bản quyền

**🔐 Thuộc sở hữu của: Cương Trực © 2025**

