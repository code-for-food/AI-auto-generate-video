---
name: create-video-from-content
description: Tạo video tin tức 9:16 chuyên nghiệp (poster editorial, HyperFrames) từ URL bài báo hoặc nội dung văn bản tiếng Việt. Sinh script.json đúng schema rồi gọi skill auto-generate-video để render. Kích hoạt khi người dùng muốn "tạo video", "làm short news", "video từ bài báo".
author: Hermes Agent
parameters:
  content:
    type: string
    description: URL bài báo (http/https) HOẶC nội dung văn bản thô để tạo video.
    required: true
  title:
    type: string
    description: Tiêu đề video. Nếu không cung cấp, lấy từ bài báo hoặc dòng đầu của content.
    required: false
  channel:
    type: string
    description: Tên kênh, hiển thị ở outro/footer.
    default: "AI Coding"
    required: false
  brand:
    type: string
    description: Id thư mục brand trong brands/ (logo + tên + tagline + URL riêng cho từng khách hàng/kênh). Chạy `ls <REPO_PATH>/brands/` để xem danh sách.
    default: "default"
    required: false
  output_path_prefix:
    type: string
    description: Prefix thư mục output, tương đối với thư mục dự án AI-auto-generate-video.
    default: "output/"
    required: false
  aspect:
    type: string
    enum: ["9:16"]
    description: Tỷ lệ khung hình. Hiện chỉ có template 9:16.
    default: "9:16"
    required: false
---

# Create Video From Content Skill

> Trước khi cài: thay `<REPO_PATH>` ở mọi nơi bên dưới bằng đường dẫn tuyệt đối tới thư
> mục bạn đã `git clone` repo này về.

Sinh video tin tức 9:16 dùng các template HyperFrames trong dự án `<REPO_PATH>`. Bạn
(Hermes Agent) chỉ điền **chữ vào slot** của template có sẵn — toàn bộ thiết kế/animation
do template lo. Sau khi sinh `script.json`, skill này tự gọi tiếp skill
`auto-generate-video` để render ra file.

## Bước 0: Xác định brand

Chạy `terminal(command='ls brands/', workdir='<REPO_PATH>')` để xem các brand id có sẵn
(mỗi thư mục con có `brand.json` + logo riêng). Nếu tham số `brand` không được cung cấp →
dùng `"default"`. Nếu người dùng nêu brand không có trong danh sách → báo lại các brand
hiện có và hỏi họ chọn 1 cái hoặc tạo brand mới (xem `brands/README.md`), đừng tự bịa
brand id.

## Bước 1-3: Lấy nội dung + tạo thư mục output

Phát hiện `content` là gì rồi lấy nội dung:

- **URL** (bắt đầu `http://`/`https://`) → dùng công cụ fetch/browser sẵn có của bạn để
  lấy nội dung trang. Lấy `title`, `content` (~500–1500 từ), và domain (parse từ URL).
  Nếu extract lỗi/rỗng (paywall, cần JS, 4xx) → báo người dùng dán nội dung trực tiếp
  thay vì URL, rồi dừng.
- **Văn bản thô** (không phải URL) → dùng `content` trực tiếp. `title` = tham số `title`
  nếu có, nếu không thì lấy dòng đầu (≤80 ký tự) hoặc tự tóm tắt 1 câu. `domain` = `"local"`.

Tính:
- `slug` = tiêu đề chuyển ASCII không dấu (bỏ dấu tiếng Việt, đ→d), thay khoảng trắng
  bằng `-`, ≤40 ký tự.
- `timestamp` = `YYYYMMDD-HHmm` (giờ hiện tại).
- `outputDir` = `<REPO_PATH>/output/<slug>-<timestamp>/`
- Tạo thư mục này trước khi ghi file (`terminal(command='mkdir -p <outputDir>')`).

## Bước 4: Template có sẵn (CHỈ dùng đúng các `templateId` này)

**HOOK (luôn dùng đúng 1 cái, cho scene đầu):**
- `frame-liquid-bg-hero` — hero aurora (blob động + headline gradient + CTA). Slots:
  `kicker`, `headline`, `headline_from`?, `headline_to`?, `subheadline`, `cta`, `brand`.

**BODY (chọn đa dạng theo nội dung từng scene, đừng lặp 1 template cho mọi body):**
- `frame-vignelli` — 1 con số/stat, nền than tối + đỏ. Slots: `kicker`, `number`, `label`,
  `note`, `brand`.
- `frame-pentagram-stat` — 1 con số/benchmark, nền tối neon cam/cyan + biểu đồ cột. Slots:
  `label`, `headline` (số), `subtitle`, `anchor`, `footer_left`, `footer_right`.
- `frame-bold-poster` — tuyên bố mạnh nhiều dòng + figure số lớn, nền giấy đỏ. Slots:
  `kicker`, `date`, `figure`, `headline[]` (≤3 dòng), `standfirst`, `footer_left`,
  `footer_right`.
- `frame-build-minimal` — câu chốt ngắn quanh 1 từ khoá, nền tối, chữ lớn glow cam. Slots:
  `eyebrow`, `hero` (1 từ ngắn), `desc`, `side_left`, `side_right`.
- `frame-creative-voltage` — câu sáng tạo/khẩu hiệu, split xanh điện + viết tay. Slots:
  `meta`, `display_lines[]` (≤4 dòng), `accent_index`, `script`, `caption`.
- `frame-glitch-title` — tin sốc/breaking/công nghệ, cyberpunk glitch RGB-split. Slots:
  `title`, `subtitle`.
- `frame-aicoding-list` — **DANH SÁCH 2–5 mục** (icon + tag mức độ), nền tối gradient.
  Slots: `title`, `accent`?, `accent_from`?, `accent_to`?, `subtitle`, `items[]` — mỗi item
  `{icon, title, desc, tag, level}` (`level`: `danger`/`warn`/`good`/`info`; `icon`: bạn tự
  chọn emoji hợp mục, không cố định).
- `frame-aicoding-comparison` — **SO SÁNH ĐÚNG 2 thứ** (cũ vs mới, A vs B). Slots: `badge`,
  `pre`?, `vs`, `post`?, `left{}`, `right{}` — mỗi vế `{label, from, to, icon?, bullets[],
  stat?, stat_label?, win?}` (`from`/`to` là màu hex gradient bạn tự chọn cho mỗi vế).

**OUTRO (scene cuối, luôn 1 trong 2):**
- `frame-logo-outro` — mặc định. Slots: `brand_name`, `tagline`, `primary_url`.
- `frame-statement-outro` — thay thế, card đỏ nền giấy. Slots: `cta`, `channel`, `source`.

## Bước 5: Sinh `script.json`

Cấu trúc bắt buộc:

```json
{
    "version": "1.0",
    "renderer": "hyperframes",
    "aspect": "9:16",
    "metadata": {
        "title": "...",
        "source": { "url": "...", "domain": "...", "image": null },
        "channel": "AI Coding",
        "brand": "default"
    },
    "voice": { "provider": "omnivoice", "speed": 1.0 },
    "scenes": [ /* 8-12 scene: 1 hook + 6-10 body + 1 outro */ ]
}
```

- `metadata.brand` = id đã xác định ở Bước 0. Pipeline tự điền logo + tên + tagline +
  URL + wordmark kênh từ `brands/<brand>/brand.json` vào các scene liên quan — KHÔNG
  cần tự set `logo_url`/`brand_name`/`brand_label`/`tagline`/`primary_url` trong
  `inputs` trừ khi muốn override riêng 1 scene.
- `voice.provider` luôn là `"omnivoice"` — TTS local, không cần API key.
- Mỗi scene: `{ id: "<string>", type, voiceText, templateId, inputs }`. **`id` PHẢI là
  string (ví dụ `"1"`, `"2"`), KHÔNG được number.** Zod schema validate sẽ reject nếu
  `id` là number. `inputs` khớp đúng slot ở Bước 4.
- `scenes[0].type = "hook"` (templateId luôn `frame-liquid-bg-hero`); scene cuối
  `.type = "outro"`.
- **8–12 scene tổng cộng**; tổng `voiceText` ~270–360 từ (~90–120 giây audio). Mỗi body
  scene ~25–40 từ, **1 ý duy nhất mỗi scene** — nếu 1 đoạn có 2 ý thì tách thành 2 scene.

### ⚠️ Quy tắc TTS tiếng Việt (BẮT BUỘC cho `voiceText`)

OmniVoice đọc `voiceText` to. Số/ký hiệu bị đọc theo nghĩa đen (vd "5.5" → "năm rưỡi" —
sai cho số phiên bản). **Luôn viết số ra chữ tiếng Việt trong `voiceText`.** `inputs`
(chữ hiển thị trên màn hình) thì GIỮ NGUYÊN định dạng số đẹp ("5.5", "82.7%").

| Dạng số             | SAI (đọc nhầm)   | ĐÚNG (viết ra chữ)                     |
| -------------------- | ---------------- | --------------------------------------- |
| Phiên bản thập phân | `GPT 5.5`         | `GPT năm chấm năm`                       |
| Số liệu thập phân    | `82.7%`           | `tám mươi hai phẩy bảy phần trăm`        |
| Phiên bản nguyên     | `iPhone 17`       | `iPhone mười bảy`                        |
| Thông số kỹ thuật    | `200MP`           | `hai trăm megapixel`                     |
| Pin                  | `5000mAh`         | `năm nghìn miliampe giờ`                 |
| Token                | `1M tokens`       | `một triệu token`                        |
| Giá VND              | `21 triệu đồng`   | `hai mươi mốt triệu đồng`                |
| Giá USD              | `$5`              | `năm đô la`                              |
| Bội số               | `2x`              | `gấp đôi`                                |
| Phần trăm            | `30%`             | `ba mươi phần trăm`                      |
| Tỉ lệ                | `3:1`             | `ba trên một`                            |

- Dấu thập phân: `chấm` (tự nhiên) hoặc `phẩy` (trang trọng) — chọn nhất quán.
- `voiceText` **TUYỆT ĐỐI KHÔNG** emoji/icon, không URL, không `→ & % $ # + =`. Kết câu
  bằng `.` hoặc `?`.
- `inputs` (chữ hiển thị) ĐƯỢC PHÉP emoji vừa phải (0–1 icon/field, ví dụ kicker
  "🔥 Tin nóng"). Đừng nhét emoji vào field pop từng ký tự (`hero` của build-minimal).

## Bước 6: Tự kiểm tra trước khi ghi

- `scenes[0]` = hook (frame-liquid-bg-hero), scene cuối = outro.
- Mỗi `templateId` nằm trong danh sách Bước 4; mỗi `inputs` đủ slot bắt buộc.
- `voiceText` đã viết số ra chữ, không emoji/URL/ký hiệu.

## Bước 7: Ghi script.json

Dùng tool ghi file của bạn để ghi `<outputDir>/script.json`.

## Bước 8: Render video

Gọi skill `auto-generate-video` với `script_json_path=<outputDir>/script.json` (skill đó
tự kiểm tra/khởi động OmniVoice server rồi chạy `npm run pipeline`). Thời gian render phụ
thuộc CPU/GPU của máy bạn — xem ghi chú trong skill `auto-generate-video`.

## Bước 9: Báo kết quả

```
✓ Video: <outputDir>/video.mp4
✓ Audio: <outputDir>/voice.mp3
✓ Script: <outputDir>/script.txt (cho CapCut auto-caption)
```

## Lưu ý

- Idempotent: xoá `voice/scene-<id>.mp3` hoặc `clips/scene-<id>.mp4` trong `outputDir` rồi
  chạy lại `auto-generate-video` để re-render riêng scene đó, không cần làm lại từ đầu.
- Không có `assets/sfx/` thì video vẫn render bình thường, chỉ thiếu hiệu ứng âm thanh —
  không phải lỗi.

## Pitfalls

- **OmniVoice TTS Timeout:** client timeout là 180s. Nếu `npm run pipeline` vẫn thất bại
  với `AxiosError: timeout of 180000ms exceeded`, xem mục troubleshooting trong skill
  `auto-generate-video` (kiểm tra server có đang chạy GPU không, rút gọn `voiceText` nếu
  cần). Đây là vấn đề vận hành của TTS server, không phải lỗi `script.json` hay bug trong
  code `AI-auto-generate-video` — `npm run test`/`typecheck`/`build` không sửa được lỗi này.
