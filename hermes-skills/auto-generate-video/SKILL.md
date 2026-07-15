---
name: auto-generate-video
description: Chạy pipeline render video (TTS + HyperFrames + ffmpeg) từ một file script.json có sẵn, dùng công cụ AI-auto-generate-video.
author: Hermes Agent
parameters:
  script_json_path:
    type: string
    description: Đường dẫn tuyệt đối hoặc tương đối đến file script.json chứa cấu hình tạo video.
    required: true
  work_directory:
    type: string
    description: Thư mục dự án AI-auto-generate-video.
    default: "<REPO_PATH>"
    required: false
---

# Auto-Generate Video Skill

> Trước khi cài: thay `<REPO_PATH>` bên trên (và trong body dưới đây) bằng đường dẫn
> tuyệt đối tới thư mục bạn đã `git clone` repo này về, ví dụ
> `/home/you/projects/AI-auto-generate-video`.

Chạy bước cuối của pipeline: nhận `script.json` đã có (do skill `create-video-from-content`
sinh ra, hoặc viết tay) và render thành `video.mp4` + `voice.mp3` + `script.txt`.

Dự án cần cài đặt đầy đủ tại `<REPO_PATH>` trước: Node ≥22, ffmpeg, Google Chrome,
`npm install` đã chạy, `.env.local` đã trỏ tới OmniVoice (xem README chính của repo,
mục "Setup").

## Điều kiện tiên quyết — OmniVoice TTS server

Pipeline gọi TTS local tại `OMNIVOICE_ENDPOINT` (mặc định `http://127.0.0.1:8123`).
**Kiểm tra server đang chạy trước khi render**:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8123/health
```

Nếu không trả về `200`, khởi động server TTS của bạn trước (cách khởi động tuỳ vào cách
bạn dựng OmniVoice — GPU nếu máy có GPU tương thích, nếu không thì CPU). Đợi tới khi
`curl .../health` trả `200` rồi mới render.

## Cách sử dụng

```python
from hermes_tools import terminal

terminal(
    command='npm run pipeline -- <script_json_path>',
    workdir='<REPO_PATH>',
)
```

`<script_json_path>` có thể là đường dẫn tuyệt đối tới bất kỳ `script.json` nào, không nhất
thiết phải nằm trong thư mục dự án.

## Các bước thực hiện

1.  Kiểm tra/khởi động OmniVoice server như trên.
2.  Chạy `npm run pipeline -- <script_json_path>` trong thư mục dự án.
3.  Đọc output cuối cùng — pipeline in ra đường dẫn `video.mp4`, `voice.mp3`, `script.txt`
    trong `output/<slug>/`.

## Các vấn đề cần lưu ý

*   `script.json` phải đúng schema: 8–12 scene, scene đầu `type: hook`, scene cuối
    `type: outro`, mỗi `templateId` phải có thật trong `templates/`. Xem skill
    `create-video-from-content` để sinh đúng schema.
*   Logo/tên thương hiệu KHÔNG hardcode — `script.json`'s `metadata.brand` (id thư mục
    trong `brands/`, mặc định `"default"`) chọn brand nào được dùng. Pipeline tự báo
    lỗi rõ ràng (kèm danh sách brand hợp lệ) nếu `metadata.brand` trỏ tới brand không
    tồn tại — không cần tự xử lý thêm.
*   **Pitfall: OmniVoice TTS Timeout.** Client timeout là 180s. Nếu vẫn gặp
    `AxiosError: timeout of 180000ms exceeded`, kiểm tra `curl .../health` — server có
    thể đang chạy CPU (chậm hơn GPU rất nhiều) hoặc quá tải. Rút gọn `voiceText` trong
    `script.json` nếu cần, hoặc chuyển server sang chạy GPU nếu máy có GPU tương thích
    PyTorch.
*   TTS/clip render là idempotent — xoá `voice/scene-<id>.mp3` hoặc `clips/scene-<id>.mp4`
    trong `outputDir` rồi chạy lại để re-render riêng scene đó.
