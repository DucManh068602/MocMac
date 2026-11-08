# ============================================================
# SCRIPT KHỞI ĐỘNG LẠI BACKEND + ĐỒNG BỘ SOLD + SET TOTALSTOCK
# Chạy tại: D:\MocMac\mocmac-api (PowerShell)
# ============================================================

Write-Host "=== BƯỚC 1: Dừng process cũ trên cổng 3000 ===" -ForegroundColor Cyan
$proc = Get-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Đang dừng $($proc.ProcessName) (PID $($proc.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $proc.Id -Force
    Start-Sleep -Seconds 2
} else {
    Write-Host "Không có process nào đang chạy cổng 3000." -ForegroundColor Green
}

Write-Host "`n=== BƯỚC 2: Khởi động lại mocmac-api (nohup, chạy nền) ===" -ForegroundColor Cyan
# Nếu bạn dùng pm2/nodemon, hãy thay dòng dưới bằng lệnh tương ứng của bạn
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "D:\MocMac\mocmac-api" -WindowStyle Hidden
Write-Host "Đã khởi động backend. Đợi 5 giây..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n=== BƯỚC 3: Kiểm tra backend đã sống chưa ===" -ForegroundColor Cyan
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Get -TimeoutSec 10
    Write-Host "Backend OK, có $($resp.products?.count ?? '?') sản phẩm." -ForegroundColor Green
} catch {
    Write-Host "Backend chưa phản hồi. Vui lòng khởi động thủ công: cd D:\MocMac\mocmac-api && npm start" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== BƯỚC 4: Đồng bộ số lượng đã bán (sold) từ đơn hàng cũ ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/products/sync-sold" -Method Post -TimeoutSec 30
    Write-Host "Đã đồng bộ $($result.synced) sản phẩm." -ForegroundColor Green
} catch {
    Write-Host "Lỗi gọi sync-sold: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== BƯỚC 5: Set totalStock = 100 cho tất cả sản phẩm (nếu chưa có) ===" -ForegroundColor Cyan
# Cần MongoDB shell (mongosh) đã cài và đang chạy local
if (Get-Command mongosh -ErrorAction SilentlyContinue) {
    mongosh "mongodb://127.0.0.1:27017/mocmac" --eval "db.products.updateMany({totalStock: {\$exists: false}}, {\$set: {totalStock: 100}}); print('Done');"
    Write-Host "Đã set totalStock cho sản phẩm chưa có." -ForegroundColor Green
} else {
    Write-Host "Không tìm thấy mongosh. Hãy chạy thủ công trong MongoDB Compass/Shell:" -ForegroundColor Yellow
    Write-Host "  db.products.updateMany({totalStock: {$exists: false}}, {$set: {totalStock: 100}})" -ForegroundColor Yellow
}

Write-Host "`n=== HOÀN TẤT ===" -ForegroundColor Green
Write-Host "Bây giờ hard-refresh trình duyệt (Ctrl+F5) tại http://localhost:4200/san-pham" -ForegroundColor Green
