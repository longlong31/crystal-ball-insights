## Mục tiêu
1. Sửa lỗi: file upload đang mock/không đọc được nội dung thật → parse thật bằng SheetJS (xlsx) cho Excel/CSV và pdf-parse/pdfjs cho PDF.
2. Tích hợp n8n hai chiều (webhook out + callback in) để chạy automation phân tích.
3. Embed Power BI report ngay trong app để người dùng xem dashboard tổng hợp.
4. Phạm vi dữ liệu: kết quả dự án (NPV/IRR/WACC), AI metrics, lịch sử phân tích, market & sentiment.

## Phần 1 — Sửa file upload thật (ưu tiên cao)
- Kiểm tra `src/components/FinancialStatementReader.tsx` & `src/lib/excelParser.ts`: nếu đang dùng mock thì thay bằng parse thật.
- **Excel/CSV**: dùng `xlsx` (SheetJS) đã có trong project → đọc tất cả sheet, lấy headers (row 1) + rows (limit 500), giữ nguyên kiểu số/ngày.
- **PDF**: thêm parse client-side bằng `pdfjs-dist` (đã có) → trích toàn bộ text → gom thành 1 "sheet" tên "PDF" với các dòng text → vẫn gửi sang edge function `ai-extract-financials` y hệt Excel.
- Hiển thị preview thực tế các sheet/headers/sample rows trước khi bấm "Trích xuất bằng AI", thay vì giả số.
- Edge function `ai-extract-financials` đã ổn — chỉ cần đảm bảo client gửi đúng `{sheets:[{name,headers,rows}], fileName}`.

## Phần 2 — Tích hợp n8n hai chiều
Yêu cầu user nhập **n8n Webhook URL** (1 secret) — KHÔNG hard-code.

**Outbound (App → n8n):**
- Edge function mới `n8n-dispatch`: nhận `{ workflow, payload }`, validate JWT, đẩy POST tới `N8N_WEBHOOK_URL/{workflow}` kèm header `X-Callback-Url` = URL của edge function `n8n-callback` và `X-Run-Id` (UUID).
- Lưu run vào bảng mới `n8n_runs` (status: pending/running/done/failed, payload, result, user_id).

**Inbound (n8n → App):**
- Edge function `n8n-callback` (verify_jwt=false, dùng shared secret `N8N_CALLBACK_SECRET` qua header `X-Callback-Secret`): nhận `{ runId, status, result }` → update `n8n_runs`.
- Realtime subscription tới `n8n_runs` để UI cập nhật ngay khi workflow xong.

**UI:**
- Trong `/project` thêm card "Gửi sang n8n để phân tích sâu" → chọn workflow (dropdown từ list workflows trong DB hoặc free text) → bấm gửi → hiển thị status realtime + kết quả JSON trả về.

## Phần 3 — Power BI Embed
- Trang mới `/project` → tab "Power BI Dashboard" hoặc trang riêng `/powerbi`.
- Component `PowerBIEmbed` nhận `reportUrl` (publish-to-web URL hoặc embed URL public) → render qua `<iframe>` responsive 16:9.
- Cho phép user dán/quản lý nhiều report URL (lưu trong bảng `powerbi_reports`: name, url, user_id) hoặc cấu hình mặc định qua secret `POWERBI_DEFAULT_REPORT_URL`.
- Lưu ý: chỉ hỗ trợ Publish-to-Web (anonymous) ở phase này. Embed for Customers/Organization cần Azure AD app registration → phase sau.

## Phần 4 — Dữ liệu sang n8n/Power BI
n8n workflow sẽ pull dữ liệu từ Supabase REST API (RLS bypass dùng service role) hoặc nhận trực tiếp trong payload:
- `project_analysis_history` (NPV/IRR/WACC + ai_analysis)
- AI metrics (gửi snapshot từ FinancialStatementReader)
- Market data & sentiment (gửi snapshot khi trigger)

n8n có thể đẩy ngược lên Power BI Streaming Dataset (user tự cấu hình bên n8n, ngoài app).

## Database changes
```sql
-- n8n_runs
CREATE TABLE public.n8n_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workflow text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb, result jsonb, error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- + RLS: user xem/insert/update của mình; admin xem tất cả

-- powerbi_reports
CREATE TABLE public.powerbi_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL, embed_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- + RLS owner-only

-- Realtime publication cho n8n_runs
```

## Secrets cần
- `N8N_WEBHOOK_URL` — base webhook URL của instance n8n
- `N8N_CALLBACK_SECRET` — shared secret để callback xác thực
- (tùy chọn) `POWERBI_DEFAULT_REPORT_URL`

## Files
**New:** `supabase/functions/n8n-dispatch/index.ts`, `supabase/functions/n8n-callback/index.ts`, `src/components/N8nDispatchPanel.tsx`, `src/components/PowerBIEmbed.tsx`, `src/hooks/useN8nRuns.ts`, migration SQL.
**Edit:** `src/components/FinancialStatementReader.tsx` (parse thật), `src/lib/excelParser.ts` (nếu cần), `src/pages/ProjectAnalysis.tsx` (gắn 2 panel mới).

## Thứ tự thực hiện
1. Sửa file upload thật trước (giải quyết "lỗi vẫn lỗi") — không cần secret.
2. Tạo migration `n8n_runs` + `powerbi_reports`.
3. Yêu cầu user nhập 2 secrets n8n.
4. Build edge functions n8n + UI panel.
5. Build Power BI embed component + UI quản lý URL.

## Câu hỏi xác nhận
- Bạn có **n8n instance riêng** (URL + có thể tạo webhook) chưa? Nếu chưa → mình sẽ làm Power BI embed + fix upload trước, n8n để sau khi bạn có URL.
- Power BI report bạn muốn embed đã **Publish-to-Web** chưa? (vào Power BI Service → File → Embed report → Publish to web). Nếu chưa, mình tạo trước UI để dán URL khi bạn có.