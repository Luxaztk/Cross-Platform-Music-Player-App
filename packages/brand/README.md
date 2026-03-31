# Melovista Branding Package (@music/brand)

Gói chứa toàn bộ tài sản thương hiệu và quy chuẩn thiết kế của Melovista, dùng chung cho Desktop (Electron/React) và Mobile (React Native).

## 1. Logos & Icons (`/logos`)

Bộ logo đã được tối ưu hóa cho các mục đích sử dụng khác nhau:

- **Ứng dụng (App Icons):**
  - `app_icon_ios_dark.png`: Nền tối, dùng cho mobile/desktop taskbar.
  - `app_icon_ios_light.png`: Nền sáng.
- **Logo đầy đủ (Full Logos):**
  - `logo_horizontal_dark.png`: Dạng ngang, chữ trắng (dùng trên nền tối).
  - `logo_horizontal_light.png`: Dạng ngang, chữ đen (dùng trên nền sáng).
  - `logo_stacked_dark.png`: Dạng dọc, dùng cho màn hình Splash/About.
- **Biểu tượng (Symbol Only):**
  - `icon_only_flat.png`: Biểu tượng xanh phẳng.
  - `icon_only_gradient.png`: Biểu tượng hiệu ứng kính (Glassmorphism).

## 2. Colors (`/colors`)

Hệ thống màu sắc được định nghĩa để đảm bảo tính nhất quán:

- **`colors.json`**: Dùng cho Mobile (React Native styles) hoặc các công cụ build.
- **`colors.scss`**: Dùng cho Desktop (SASS variables).

**Màu chủ đạo:**
- `Primary Green`: `#10b981` (Emerald)
- `Primary Hover`: `#059669`

## 3. Typography (`/typography`)

- **Font Family**: Ưu tiên các font hệ thống hiện đại (San Francisco, Segoe UI, Roboto).
- **Scale**:
  - `xs`: 12px
  - `sm`: 13px
  - `base`: 15px (Mặc định cho văn bản)
  - `md`: 16px
  - `lg`: 20px
  - `xl`: 24px
  - `xxl`: 36px (Tiêu đề lớn)

## Hướng dẫn sử dụng

### Cho Desktop (SCSS):
```scss
@import "@music/brand/colors/colors.scss";
@import "@music/brand/typography/typography.scss";

.my-component {
  color: $color-primary;
  font-size: $f-base;
}
```

### Cho Mobile (JSON):
```javascript
import { theme } from '@music/brand/colors/colors.json';
const primaryColor = theme.dark.colors.primary;
```
