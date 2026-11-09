# Mộc Mạc — Hướng dẫn tổng quan dự án (dễ hiểu)

Tài liệu này giải thích **toàn bộ dự án Mộc Mạc** theo cách đơn giản, để cả người chưa học công nghệ cũng có thể hiểu dự án làm gì, gồm những phần nào, và cách chạy thử trên máy.

---

## 1. Mộc Mạc là gì?

**Mộc Mạc** là một website bán **đặc sản và sản phẩm làng nghề Việt Nam** (quà tặng, đặc sản vùng miền, sản phẩm OCOP, câu chuyện làng nghề/vùng miền...).

Dự án gồm 2 phần chính làm việc cùng nhau:

| Phần | Tên thư mục | Nói đơn giản là gì? |
|---|---|---|
| **Giao diện website** (khách nhìn thấy) | `my-app/` | Trang web hiển thị sản phẩm, giỏ hàng, đặt hàng, tài khoản, trang quản trị... |
| **Máy chủ xử lý dữ liệu** (API) | `mocmac-api/` | Nơi nhận yêu cầu từ website, xử lý đăng nhập/đơn hàng/thanh toán, và lưu/đọc dữ liệu trong cơ sở dữ liệu |

Ngoài ra còn có **cơ sở dữ liệu MongoDB** (chạy riêng trên máy hoặc máy chủ): nơi lưu thông tin sản phẩm, người dùng, đơn hàng, mã giảm giá, đánh giá, tin nhắn hỗ trợ...

**Luồng hoạt động đơn giản:**

1. Người dùng thao tác trên website (`my-app`).
2. Website gửi yêu cầu đến máy chủ (`mocmac-api`).
3. Máy chủ đọc/ghi dữ liệu trong MongoDB.
4. Máy chủ trả kết quả về website để hiển thị.

---

## 2. Dự án này dành cho ai?

- **Khách hàng:** xem sản phẩm, tìm theo vùng miền/làng nghề/nhu cầu quà tặng, thêm vào giỏ, đặt hàng, thanh toán, theo dõi đơn, đánh giá, liên hệ/hỗ trợ.
- **Quản trị viên/Nhân viên (Admin):** vào khu vực quản trị để quản lý đơn hàng, sản phẩm, vùng miền, mã giảm giá, người dùng, liên hệ, thông báo, đánh giá, flash sale, nội dung pháp lý, quyền truy cập...

---

## 3. Những tính năng chính (tóm tắt)

### Dành cho khách hàng
- Trang chủ, giới thiệu, liên hệ, hỗ trợ.
- Danh sách sản phẩm, chi tiết sản phẩm, lọc/tìm theo danh mục và nội dung liên quan.
- Trang **vùng miền** và **làng nghề** (câu chuyện, sản phẩm theo vùng/làng).
- Trang **quà tặng**, quà theo nhu cầu, quà doanh nghiệp.
- **Giỏ hàng**: thêm/bớt/xóa sản phẩm (lưu tạm trên trình duyệt).
- **Đăng ký/Đăng nhập** (có xác thực OTP và các luồng đặt lại mật khẩu theo cấu hình).
- **Đặt hàng** và theo dõi đơn hàng; tra cứu đơn.
- **Thanh toán**: hỗ trợ COD (nhận hàng trả tiền) và VNPAY (môi trường kiểm thử/sandbox theo cấu hình).
- **Mã giảm giá/ưu đãi**, **flash sale** (săn sale).
- **Đánh giá** sản phẩm, **thông báo**, **chat hỗ trợ** (gửi tin nhắn tới quản trị; có thời gian thực qua Socket.IO).
- **Trợ lý AI** hỗ trợ tra cứu sản phẩm/mã giảm giá/đơn hàng và gợi ý thao tác (phụ thuộc cấu hình AI trên máy chủ).
- Hỗ trợ dịch/nội dung đa ngôn ngữ ở một số phần (theo dịch vụ cấu hình trong ứng dụng).

### Dành cho quản trị (Admin)
- Bảng điều khiển (dashboard).
- Quản lý: đơn hàng, sản phẩm, vùng miền, câu chuyện vùng/làng nghề, mã giảm giá, ưu đãi/deals, flash sale, người dùng, yêu cầu vai trò, phân quyền route, yêu cầu báo giá, liên hệ, thông báo, đánh giá, nhật ký kiểm tra (audit), nội dung pháp lý (điều khoản/chính sách).

> Lưu ý: Danh sách trên mô tả theo cấu trúc mã nguồn hiện có; một số tính năng cần cấu hình đúng (MongoDB, khóa bảo mật, email, AI, thanh toán...) mới hoạt động đầy đủ.

---

## 4. Cấu trúc thư mục (giải thích đơn giản)

```text
MocMac/
├─ README.md                  ← Tài liệu tổng quan (file này)
├─ fix-stock.ps1              ← Script hỗ trợ khởi động backend/đồng bộ tồn kho/sold (Windows PowerShell)
├─ my-app/                    ← Website (Angular)
│  ├─ package.json            ← Danh sách công cụ/thư viện và lệnh chạy frontend
│  ├─ proxy.conf.json         ← Cấu hình chuyển tiếp /api, /uploads sang backend khi chạy local
│  ├─ angular.json            ← Cấu hình dự án Angular
│  ├─ public/data/            ← Dữ liệu mẫu (ví dụ: product.json, province.json, hình ảnh)
│  └─ src/app/                ← Mã nguồn giao diện, trang, dịch vụ, admin, routing...
└─ mocmac-api/                ← Máy chủ/API (Node.js + Express + MongoDB)
   ├─ package.json            ← Lệnh chạy backend và thư viện
   ├─ .env.example            ← Mẫu cấu hình môi trường (cần tạo file .env riêng)
   ├─ src/index.js            ← Điểm khởi động máy chủ + Socket.IO chat
   ├─ src/routes/             ← Các đường dẫn API (auth, products, orders, payments, chat, ai...)
   ├─ src/controllers/        ← Xử lý nghiệp vụ
   ├─ src/models/             ← Cấu trúc dữ liệu lưu trong MongoDB
   ├─ src/middleware/         ← Kiểm tra đăng nhập/phân quyền...
   └─ public/uploads/         ← Thư mục chứa file tải lên (ảnh...)
```

---

## 5. Cần chuẩn bị gì trước khi chạy?

Bạn cần cài trên máy:

1. **Node.js** (khuyến nghị phiên bản LTS mới) — để chạy website và máy chủ.
2. **npm** — thường đi kèm Node.js (dự án frontend ghi nhận npm 11.x).
3. **MongoDB** — cơ sở dữ liệu. Có thể dùng MongoDB cài local (ví dụ chạy tại `mongodb://127.0.0.1:27017/mocmac`) hoặc MongoDB Atlas (đám mây).
4. (Tùy chọn) **mongosh** — nếu muốn chạy các lệnh MongoDB thủ công như script `fix-stock.ps1` gợi ý.

> Nếu bạn không rành kỹ thuật: hãy nhờ người hỗ trợ cài Node.js và MongoDB, sau đó làm theo các bước bên dưới.

---

## 6. Cách chạy dự án trên máy (local)

### Bước A — Chạy máy chủ API (`mocmac-api`)

Mở cửa sổ dòng lệnh (PowerShell/Terminal) và thực hiện:

```powershell
cd D:\MocMac\mocmac-api
```

1. Tạo file cấu hình môi trường:
   - Sao chép `.env.example` thành `.env`.
   - Mở `.env` và điền/chỉnh các giá trị cần thiết.

**Các mục quan trọng trong `.env` (giải thích dễ hiểu):**
- `MONGODB_URI`: địa chỉ kết nối MongoDB.
- `JWT_SECRET`: chuỗi bí mật dùng cho đăng nhập (phải tự đặt, giữ kín).
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: thông tin tạo tài khoản quản trị ban đầu khi chạy seed (nếu chưa có).
- `FRONTEND_URL`: địa chỉ website frontend (local thường là `http://localhost:4200`).
- `PORT`: cổng chạy API (mặc định thường `3000`).
- Cấu hình **email (SMTP)**: dùng cho gửi OTP/quên mật khẩu (nếu cần dùng tính năng này).
- Cấu hình **AI/Google/VNPAY/MoMo** (nếu có): chỉ cần khi bạn muốn bật các tính năng tương ứng.

> **Bảo mật:** Không chia sẻ file `.env` và không đăng các khóa/mật khẩu lên nơi công khai.

2. Cài thư viện:

```powershell
npm install
```

3. (Tùy chọn/lần đầu) Nạp dữ liệu mẫu:

```powershell
npm run seed
```

**Cảnh báo quan trọng:** `npm run seed` sẽ **xóa toàn bộ sản phẩm hiện có** trong cơ sở dữ liệu rồi nạp lại từ file `my-app/public/data/product.json` (và có thể tạo tài khoản admin ban đầu nếu phù hợp). Chỉ chạy khi bạn hiểu rõ.

4. Chạy máy chủ:

```powershell
npm run dev
```

Nếu thành công, API thường chạy tại: `http://localhost:3000`.

---

### Bước B — Chạy website (`my-app`)

Mở **một cửa sổ dòng lệnh khác**:

```powershell
cd D:\MocMac\my-app
npm install
npm start
```

- `npm start` chạy Angular với proxy (`/api` và `/uploads` được chuyển tới `http://localhost:3000`).
- Mở trình duyệt tại: **http://localhost:4200**

Chạy giao diện admin trên cổng khác (nếu cần):

```powershell
npm run start:admin
```

(Theo cấu hình hiện tại: chạy ở cổng **4201**.)

---

## 7. Các lệnh thường dùng

### Frontend (`my-app`)
| Lệnh | Ý nghĩa |
|---|---|
| `npm start` | Chạy web ở chế độ phát triển (có proxy API) |
| `npm run start:admin` | Chạy web dev ở cổng 4201 |
| `npm run build` | Đóng gói website để triển khai |
| `npm test` | Chạy kiểm thử (Vitest/Angular unit test) |

### Backend (`mocmac-api`)
| Lệnh | Ý nghĩa |
|---|---|
| `npm run dev` | Chạy API ở chế độ phát triển (tự tải lại khi sửa code) |
| `npm start` | Chạy API |
| `npm run seed` | Nạp dữ liệu sản phẩm mẫu/tạo admin ban đầu (**xóa sản phẩm cũ**) |
| `npm run seed:stories` | Nạp dữ liệu câu chuyện vùng miền (nếu script sử dụng) |
| `npm run upload-server` | Chạy server upload riêng (nếu dự án dùng luồng này) |
| `npm run migrate-images` | Chạy script chuyển đổi/di trú ảnh (nếu cần) |

---

## 8. Script hỗ trợ `fix-stock.ps1` (Windows)

File `D:\MocMac\fix-stock.ps1` là script PowerShell hỗ trợ:
- dừng tiến trình đang dùng cổng `3000` (nếu có),
- khởi động lại `mocmac-api`,
- kiểm tra API,
- gọi đồng bộ số lượng đã bán (`/api/products/sync-sold`),
- gợi ý/cập nhật `totalStock` trong MongoDB (nếu có `mongosh`).

Chỉ dùng khi bạn hiểu tác động của script và đã cấu hình môi trường phù hợp.

---

## 9. Dữ liệu, hình ảnh và file tải lên

- Dữ liệu mẫu sản phẩm/tỉnh thành nằm trong `my-app/public/data/`.
- API phục vụ file upload qua đường dẫn `/uploads` (thư mục `mocmac-api/public/uploads`).
- Khi chạy local, frontend dùng proxy để gọi `/api` và `/uploads` sang backend.

---

## 10. Gặp lỗi thường gặp thì kiểm tra gì?

1. **Website mở được nhưng không có dữ liệu / lỗi API**
   - Đã chạy `mocmac-api` chưa?
   - MongoDB đã chạy và `MONGODB_URI` trong `.env` đúng chưa?
   - Frontend có chạy bằng `npm start` (để dùng proxy) không?

2. **Đăng nhập/OTP/email không hoạt động**
   - Kiểm tra cấu hình SMTP trong `.env`.
   - Kiểm tra `JWT_SECRET`, `FRONTEND_URL`.

3. **Thanh toán VNPAY/AI không hoạt động**
   - Các tính năng này cần cấu hình khóa/môi trường tương ứng. Môi trường test/sandbox có thể khác sản phẩm thật.

4. **Mất dữ liệu sản phẩm sau khi seed**
   - Đây là hành vi đã được cảnh báo: `seed` xóa sản phẩm cũ và nạp lại từ JSON.

---

## 11. Ghi chú quan trọng

- Đây là dự án gồm **frontend + backend + database**; cần chạy đủ các phần liên quan để trải nghiệm đầy đủ.
- Không đưa thông tin nhạy cảm (`.env`, mật khẩu, khóa API, token) vào README hoặc kho mã công khai.
- Một số nội dung/tên hiển thị trong mã có thể cần chuẩn hóa encoding (UTF-8) tùy môi trường soạn thảo; chức năng chương trình không phụ thuộc vào README này.

---

## 12. Muốn tìm hiểu sâu hơn?

- Frontend (Angular): xem `my-app/README.md` và mã trong `my-app/src/app/`.
- Backend (API): xem `mocmac-api/readme.md`, `mocmac-api/src/routes/route.js` và các controller/model tương ứng.
- Cấu hình chạy local: `my-app/proxy.conf.json`, `mocmac-api/.env.example`, `fix-stock.ps1`.
