# 🚀 Hướng Dẫn Thiết Lập Môi Trường VPS Đám Mây Cho MeloVista Discord Bot

Tài liệu này hướng dẫn chi tiết từng bước chuẩn bị môi trường trên máy chủ **Cloud VPS (Ubuntu 22.04 / 24.04 LTS / Debian 12 / Oracle Cloud Always Free)** từ một VPS trắng cho đến khi sẵn sàng tiếp nhận gói triển khai (Docker hoặc PM2).

---

## 📑 Mục Lục
1. [Lựa Chọn & Cấu Hình VPS Khuyến Nghị](#1-lựa-chọn--cấu-hình-vps-khuyến-nghị)
2. [Bước 1: Khởi Tạo & Bảo Mật VPS Cơ Bản](#bước-1-khởi-tạo--bảo-mật-vps-cơ-bản)
3. [Bước 2: Cài Đặt Node.js 20 LTS & Công Cụ Hệ Thống](#bước-2-cài-đặt-nodejs-20-lts--công-cụ-hệ-thống)
4. [Bước 3: Cài Đặt FFmpeg & yt-dlp (Kèm Tự Động Cập Nhật)](#bước-3-cài-đặt-ffmpeg--yt-dlp-kèm-tự-động-cập-nhật)
5. [Bước 4: Cài Đặt Docker & Docker Compose Plugin](#bước-4-cài-đặt-docker--docker-compose-plugin)
6. [Bước 5: Cài Đặt Cloudflare Tunnel (HTTPS/WSS Cho Discord Activity)](#bước-5-cài-đặt-cloudflare-tunnel-httpswss-cho-discord-activity)
7. [Bước 6: Khởi Tạo Cấu Trúc Thư Mục & Biến Môi Trường](#bước-6-khởi-tạo-cấu-trúc-thư-mục--biến-môi-trường)
8. [Checklist Sẵn Sàng Triển Khai (Readiness Checklist)](#checklist-sẵn-sàng-triển-khai-readiness-checklist)

---

## 1. Lựa Chọn & Cấu Hình VPS Khuyến Nghị

Phân hệ `apps/bot` cần CPU để transcode FFmpeg và RAM để build Vite/TypeScript:

| Nền Tảng Cloud | Gói Khuyến Nghị | Chi Phí | Đánh Giá |
| :--- | :--- | :---: | :--- |
| **Oracle Cloud Always Free** *(Khuyên dùng)* | VM.Standard.A1.Flex (ARM 2-4 OCPU, 12-24GB RAM) | **0đ / Trọn đời** | Cấu hình mạnh nhất, băng thông không giới hạn, hoạt động 24/7 ổn định tuyệt đối. |
| **Hetzner Cloud** | CX22 (2 vCPU x86, 4GB RAM, 40GB NVMe) | ~€3.79 / tháng | Hiệu năng cực cao, mạng châu Âu / Singapore mượt mà. |
| **DigitalOcean / Vultr / Linode** | Basic Droplet (1 vCPU, 1GB-2GB RAM) | $4 - $6 / tháng | Dễ sử dụng, có data center tại Singapore/Tokyo độ trễ thấp về VN. |

> [!TIP]
> **Hệ điều hành khuyến nghị:** `Ubuntu 22.04 LTS` hoặc `Ubuntu 24.04 LTS` (64-bit x86_64 hoặc aarch64 ARM).

---

## 2. Bước 1: Khởi Tạo & Bảo Mật VPS Cơ Bản

Đăng nhập vào VPS với quyền `root` qua SSH:
```bash
ssh root@<IP_VPS_CUA_BAN>
```

### 1.1. Cập nhật gói hệ thống
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2. Tạo user riêng (Không chạy bot trực tiếp bằng root)
```bash
# Tạo user 'deploy' (hoặc tên tùy chọn)
sudo adduser deploy

# Cấp quyền sudo cho user
sudo usermod -aG sudo deploy

# Copy SSH keys từ root sang deploy (để đăng nhập trực tiếp không cần mật khẩu)
sudo mkdir -p /home/deploy/.ssh
sudo cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
```

### 1.3. Cấu hình Firewall (UFW)
Discord Bot cần kết nối mạng như sau:
- **Inbound:** SSH (Port 22). (Nếu dùng Cloudflare Tunnel, bạn **không cần mở Port 80, 443 hay 3000** ra Internet).
- **Outbound:** Mặc định UFW cho phép toàn bộ outbound (TCP 443 cho YouTube/Discord API và UDP 50000-65535 cho Discord Voice WebRTC).

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH Port'
sudo ufw enable
```

Chuyển sang user `deploy`:
```bash
su - deploy
```

---

## 3. Bước 2: Cài Đặt Node.js 20 LTS & Công Cụ Hệ Thống

Cài đặt các gói công cụ cần thiết để build mã nguồn và quản lý tiến trình:

```bash
sudo apt install -y curl wget git build-essential ca-certificates python3
```

### Cài đặt Node.js 20.x (NodeSource LTS)
```bash
# Nạp NodeSource repository cho Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Cài đặt Node.js & npm
sudo apt install -y nodejs

# Kiểm tra phiên bản (Yêu cầu Node >= 20.x, npm >= 10.x)
node -v
npm -v
```

---

## 4. Bước 3: Cài Đặt FFmpeg & yt-dlp (Kèm Tự Động Cập Nhật)

Phân hệ Discord Music Bot cần `ffmpeg` để nén âm thanh `s16le 48kHz` và `yt-dlp` để trích xuất âm thanh từ YouTube.

### 4.1. Cài đặt FFmpeg
```bash
sudo apt install -y ffmpeg

# Kiểm tra ffmpeg
ffmpeg -version
```

### 4.2. Cài đặt yt-dlp Standalone Binary (Mới Nhất)
Không nên cài `yt-dlp` qua `apt` vì phiên bản repo Ubuntu thường rất cũ và bị YouTube chặn. Hãy tải trực tiếp binary chính thức từ GitHub:

```bash
# Tải binary yt-dlp mới nhất
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp

# Cấp quyền thực thi
sudo chmod a+rx /usr/local/bin/yt-dlp

# Kiểm tra phiên bản
yt-dlp --version
```

### 4.3. Thiết lập Cron Job tự động cập nhật `yt-dlp` (Tránh YouTube đổi thuật toán làm lỗi bot)
YouTube thường xuyên thay đổi cơ chế mã hóa video. Cấu hình tự động cập nhật `yt-dlp` vào 4 giờ sáng mỗi ngày:

```bash
# Mở crontab của root
sudo crontab -e
```
Thêm dòng sau vào cuối file crontab:
```cron
0 4 * * * /usr/local/bin/yt-dlp -U >/dev/null 2>&1
```

---

## 5. Bước 4: Cài Đặt Docker & Docker Compose Plugin

Nếu bạn muốn chạy Bot dưới dạng Container độc lập (Khuyến nghị chuẩn Production):

```bash
# Cài đặt các package hỗ trợ apt qua HTTPS
sudo apt install -y apt-transport-https software-properties-common

# Thêm GPG Key chính thức của Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Thêm Docker Repository vào APT sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cập nhật index và cài đặt Docker Engine + Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Cấp quyền chạy docker cho user deploy (không cần gõ sudo)
sudo usermod -aG docker deploy

# Kích hoạt nhóm mới ngay lập tức
newgrp docker

# Kiểm tra cài đặt Docker
docker --version
docker compose version
```

### (Tùy chọn) Cài đặt PM2 nếu bạn muốn chạy chế độ Non-Docker
```bash
sudo npm install -g pm2
```

---

## 6. Bước 5: Cài Đặt Cloudflare Tunnel (HTTPS/WSS Cho Discord Activity)

Discord Embedded Activity Webview **bắt buộc** phải sử dụng domain bảo mật có **HTTPS** và WebSocket **WSS**. 

**Cloudflare Tunnel (Zero Trust)** là giải pháp hoàn hảo:
- Miễn phí 100%.
- Không cần mở bất kỳ port nào trên VPS (chống scan port và DDoS).
- Tự động cấp chứng chỉ SSL/TLS được Discord công nhận.

### 6.1. Cài đặt `cloudflared` trên VPS
```bash
# Tải và cài đặt cloudflared deb package
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# (Nếu dùng VPS ARM như Oracle Ampere, đổi thành arm64):
# curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb

sudo dpkg -i cloudflared.deb
rm cloudflared.deb

# Kiểm tra cloudflared
cloudflared --version
```

### 6.2. Xác thực & Tạo Tunnel
```bash
# Đăng nhập vào tài khoản Cloudflare (mở link được in ra màn hình trên trình duyệt để cấp quyền cho domain của bạn)
cloudflared tunnel login

# Tạo tunnel mới có tên 'melovista-bot'
cloudflared tunnel create melovista-bot
```
*Lệnh trên sẽ tạo một file credentials JSON trong thư mục `~/.cloudflared/<TUNNEL_ID>.json`.*

### 6.3. Trỏ Domain về Tunnel
Giả sử bạn muốn dùng domain `music.yourdomain.com`:
```bash
cloudflared tunnel route dns melovista-bot music.yourdomain.com
```

### 6.4. Tạo file cấu hình `~/.cloudflared/config.yml`
```bash
mkdir -p ~/.cloudflared
cat << 'EOF' > ~/.cloudflared/config.yml
tunnel: melovista-bot
credentials-file: /home/deploy/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Trỏ toàn bộ traffic HTTPS/WSS về Web/RPC Server của Bot (Port 3000)
  - hostname: music.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
EOF
```
*(Thay `<TUNNEL_ID>` bằng mã ID được in ra ở bước tạo tunnel).*

### 6.5. Chạy Cloudflare Tunnel dưới dạng System Service (Tự chạy khi khởi động VPS)
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

---

## 7. Bước 6: Khởi Tạo Cấu Trúc Thư Mục & Biến Môi Trường

Tạo thư mục dành riêng để chứa ứng dụng và dữ liệu cấu hình của MeloVista Bot trên VPS:

```bash
# Tạo thư mục ứng dụng
sudo mkdir -p /opt/melovista-bot
sudo chown -R deploy:deploy /opt/melovista-bot
cd /opt/melovista-bot

# Tạo các thư mục dữ liệu con
mkdir -p data cookies music
```

### 7.1. Tạo file cấu hình `.env`
Tạo file `/opt/melovista-bot/.env`:
```bash
cat << 'EOF' > /opt/melovista-bot/.env
# --- CẤU HÌNH DISCORD BOT ---
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_primary_guild_id_here

# --- CẤU HÌNH SERVER ---
PORT=3000
NODE_ENV=production

# --- CẤU HÌNH YOUTUBE COOKIES (TÙY CHỌN) ---
# COOKIES_PATH=/opt/melovista-bot/cookies/youtube_cookies.txt
EOF
```

---

## 8. Checklist Sẵn Sàng Triển Khai (Readiness Checklist)

Trước khi tiến hành đóng gói mã nguồn và đưa lên VPS, hãy kiểm tra danh sách sau:

- [ ] **Node.js**: `node -v` trả về `>= v20.x`
- [ ] **FFmpeg**: `ffmpeg -version` hoạt động bình thường
- [ ] **yt-dlp**: `yt-dlp --version` trả về phiên bản mới nhất
- [ ] **Docker & Compose**: `docker compose version` chạy tốt không cần `sudo`
- [ ] **Cloudflare Tunnel**: `systemctl is-active cloudflared` trả về `active`
- [ ] **Thư mục ứng dụng**: `/opt/melovista-bot` đã được phân quyền cho user `deploy`
- [ ] **File `.env`**: Đã điền đầy đủ `DISCORD_TOKEN` và `CLIENT_ID`

---

*Tài liệu này là bước chuẩn bị nền tảng (Prerequisite) để tiếp nhận cấu hình đóng gói `Dockerfile`, `docker-compose.yml` hoặc `PM2`.*
