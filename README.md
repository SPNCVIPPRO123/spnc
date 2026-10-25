# 🌱 Bạn Đồng Hành – Website tâm lý học đường

Website giúp học sinh:

1. **Tìm hiểu** tâm lý học đường là gì.
2. **Khảo sát nhanh** để tự nhìn lại tâm trạng của mình ✅ *(đã có, trang `/khao-sat`, bản thử nghiệm)*.
   Phiếu được gửi tới chuyên viên, xem ở trang riêng có mật khẩu `/chuyen-vien` ✅.
   Học sinh có thể tạo tài khoản bằng biệt danh để xem lại kết quả các lần khảo sát (`/dang-nhap`, `/tai-khoan`) ✅.
3. **Tham vấn trực tuyến** với chuyên viên tâm lý của trường, có thể **ẩn danh** *(đang xây dựng)*.
4. **Trò chuyện với chatbot AI** "Bạn Đồng Hành" ✅ *(đã có)*.
5. **Tin tức** tự động cập nhật mỗi giờ từ trang của Bộ GD&ĐT ✅ *(đã có, trang `/tin-tuc`)*.

## Chatbot hoạt động thế nào?

Chúng ta **không tự train AI từ đầu**. Website dùng một mô hình AI có sẵn (Claude của Anthropic) qua API,
rồi "định hướng" cho nó bằng một bản hướng dẫn riêng (system prompt) về tâm lý học đường.

```
Học sinh gõ tin nhắn
   │
   ▼
components/ChatWidget.tsx   ← khung chat trên trình duyệt
   │  (1) kiểm tra từ khoá khủng hoảng → hiện số điện thoại khẩn cấp
   ▼
app/api/chat/route.ts       ← máy chủ (giữ API key bí mật)
   │  (2) kiểm tra dữ liệu, giới hạn số tin nhắn mỗi phút
   │  (3) gửi tin nhắn + hướng dẫn (lib/systemPrompt.ts) cho AI
   ▼
Claude API → câu trả lời hiện dần trên màn hình
```

| File | Chức năng | Có nên sửa? |
|---|---|---|
| `lib/siteConfig.ts` | Tên trường, phòng tham vấn, số điện thoại khẩn cấp | ✅ **Sửa ngay** cho đúng trường bạn |
| `lib/systemPrompt.ts` | "Bộ não" của chatbot: vai trò, giới hạn, cách xử lý tình huống khẩn cấp, giọng điệu | ✅ Sửa để chatbot trả lời theo ý muốn |
| `lib/safety.ts` | Danh sách từ khoá khủng hoảng (tự hại, bạo hành…) | ✅ Nhờ chuyên viên tâm lý bổ sung |
| `app/page.tsx` | Nội dung trang chủ: tâm trạng, chủ đề, hiểu lầm, hỏi đáp (sửa chữ trong các danh sách ở đầu file) | ✅ Tuỳ ý |
| `app/globals.css` | Giao diện: màu sắc, bo góc, bố cục (đổi màu chủ đạo ở các biến `--brand-*` đầu file) | Tuỳ ý |
| `components/` | Thanh menu, chân trang, logo, khung chat, thẻ tin tức | Tuỳ ý |
| `lib/survey.ts` | Toàn bộ câu hỏi khảo sát (giữ mã câu như phiếu giấy) và cách tính kết quả DASS-21 | ✅ Sửa câu hỏi ở đây |
| `lib/news.ts` | Tin tức tự động lấy từ Cổng thông tin CTXH & TVTL trường học (Bộ GD&ĐT), cập nhật mỗi giờ; đổi các mục tin ở `NEWS_CATEGORIES` | Tuỳ ý |
| `app/api/chat/route.ts` | Phần máy chủ gọi AI | Chỉ sửa khi đã hiểu code |
| `app/api/khao-sat/route.ts`, `lib/submission.ts`, `lib/db.ts` | Nhận phiếu học sinh gửi, kiểm tra và lưu vào cơ sở dữ liệu | Chỉ sửa khi đã hiểu code |
| `app/chuyen-vien/`, `lib/staffAuth.ts`, `lib/staffData.ts` | Trang chuyên viên: danh sách phiếu, chi tiết phiếu | Chỉ sửa khi đã hiểu code |
| `app/dang-nhap/`, `app/tai-khoan/`, `lib/studentAuth.ts` | Trang đăng nhập chung (học sinh, chuyên viên) và tài khoản học sinh | Chỉ sửa khi đã hiểu code |

## Chạy thử trên máy của bạn

**Bước 1. Cài đặt công cụ**
- Cài [Node.js](https://nodejs.org) (bản LTS, từ 20 trở lên).
- Cài [Git](https://git-scm.com) và [VS Code](https://code.visualstudio.com) (khuyên dùng).

**Bước 2. Lấy API key**
1. Đăng ký tài khoản tại <https://platform.claude.com>.
2. Nạp một ít tiền (vài USD là đủ để thử nghiệm).
3. Vào mục **API Keys** → **Create Key** → sao chép key (bắt đầu bằng `sk-ant-...`).

> ⚠️ **Tuyệt đối không** đưa API key lên GitHub hay gửi cho người khác. Ai có key là dùng được tiền của bạn.

**Bước 3. Tải code và cài thư viện**
```bash
git clone https://github.com/SPNCVIPPRO123/spnc.git
cd spnc
npm install
```

**Bước 4. Khai báo API key**

Sao chép file `.env.example` thành file mới tên `.env.local`, rồi dán key vào:
```
ANTHROPIC_API_KEY=sk-ant-...
```
(File `.env.local` đã được cấu hình để **không** bị đưa lên GitHub.)

**Bước 5. Chạy web**
```bash
npm run dev
```
Mở trình duyệt vào <http://localhost:3000> rồi bấm nút **💬 Trò chuyện**.

## Đưa web lên mạng (miễn phí với Vercel)

1. Đăng nhập <https://vercel.com> bằng tài khoản GitHub.
2. **Add New → Project** → chọn repo `spnc` → **Import**.
3. Ở mục **Environment Variables**, thêm `ANTHROPIC_API_KEY` = key của bạn.
4. Bấm **Deploy**. Vài phút sau bạn sẽ có đường link để gửi giảng viên.

## Lưu phiếu khảo sát cho chuyên viên xem

Khi học sinh bấm **Gửi phiếu** ở cuối `/khao-sat`, câu trả lời được lưu vào cơ sở dữ liệu Postgres (Neon, gói miễn phí).
Chuyên viên bấm **Đăng nhập** trên menu, chọn tab **Chuyên viên** và nhập mật khẩu để xem danh sách phiếu. Phiếu trả lời “Có” ở câu C5 luôn nằm trên cùng
(viền đỏ), tiếp theo là phiếu có cảnh báo Phần 8 hoặc bạo lực, xâm hại. Chuyên viên có thể đánh dấu “Đã xử lý” và xóa phiếu.

**Cài đặt trên Vercel (làm một lần):**
1. Vào project trên <https://vercel.com> → tab **Storage** → **Create Database** → chọn **Neon** (Serverless Postgres)
   → gói **Free** → khu vực **Singapore** → **Create**. Ở bước kết nối, chọn project này và để nguyên tên biến.
   Vercel tự thêm biến `DATABASE_URL`.
2. Tab **Settings → Environment Variables** → thêm `STAFF_PASSWORD` = một mật khẩu dài (ít nhất 10 ký tự, nên 16 ký tự trở lên).
3. Tab **Deployments** → bấm **⋯** ở bản mới nhất → **Redeploy**.
4. Mở `https://<tên-web>.vercel.app/chuyen-vien` và đăng nhập. Bảng dữ liệu tự được tạo khi có phiếu đầu tiên.

**Bảo mật đã có sẵn:** mật khẩu chỉ được so sánh trên máy chủ; phiên đăng nhập là cookie đã ký, JavaScript không đọc được, hết hạn
sau 8 giờ; nhập sai 5 lần phải chờ 15 phút; dữ liệu phiếu chỉ được đọc ở máy chủ sau khi kiểm tra đăng nhập; trang không cho
công cụ tìm kiếm lập chỉ mục. Phiếu không hỏi họ tên, không lưu IP; cách liên lạc chỉ được lưu khi học sinh tự chọn để lại.
Đổi mật khẩu (sửa `STAFF_PASSWORD` rồi Redeploy) sẽ đăng xuất mọi người.

**Tài khoản học sinh:** ở cùng trang Đăng nhập, học sinh tạo tài khoản bằng biệt danh và mật khẩu (không hỏi họ tên, email hay
số điện thoại). Khi đã đăng nhập, phiếu em gửi được lưu vào tài khoản để em xem lại ở `/tai-khoan`; chuyên viên không thấy biệt
danh. Mật khẩu được băm bằng scrypt; quên mật khẩu thì không lấy lại được. Học sinh có thể tự xóa tài khoản.

> ⚠️ Đây là dữ liệu nhạy cảm của học sinh dưới 18 tuổi. Trước khi cho học sinh làm thật, hãy hỏi giảng viên và nhà trường về
> việc xin đồng ý của phụ huynh, ai được giữ mật khẩu, phiếu được giữ bao lâu, và quy trình khi có phiếu cảnh báo C5.

## Chi phí

Mỗi tin nhắn tốn một khoản nhỏ tiền API, tuỳ độ dài cuộc trò chuyện. Để giảm chi phí:
- Đổi model rẻ hơn: thêm dòng `CLAUDE_MODEL=claude-sonnet-5-5` vào `.env.local`.
- Đặt **giới hạn chi tiêu hằng tháng** trong trang quản lý của platform.claude.com.
- Code đã giới hạn sẵn mỗi người tối đa 15 tin nhắn/phút và mỗi tin nhắn tối đa 2000 ký tự.

## Nguyên tắc an toàn đã có sẵn

- Chatbot **không chẩn đoán bệnh, không bàn về thuốc**, luôn nói rõ mình là AI.
- Khi phát hiện dấu hiệu tự hại, tự tử hoặc bị bạo hành: **luôn hiện khung số điện thoại khẩn cấp**
  (111, 115, 113) và AI được nhắc ưu tiên hỗ trợ khẩn cấp.
- **Không lưu nội dung trò chuyện**, không cần đăng nhập, khuyên học sinh không ghi thông tin cá nhân.
- Câu hỏi ngoài chủ đề sẽ được chatbot nhẹ nhàng đưa về chủ đề tâm lý học đường.

> 💡 Vì người dùng là học sinh (trẻ vị thành niên), **hãy nhờ giáo viên/chuyên viên tâm lý đọc duyệt**
> `lib/systemPrompt.ts` và thử chatbot với nhiều tình huống trước khi cho học sinh dùng thật.

## Bước tiếp theo

- [ ] Sửa `lib/siteConfig.ts` cho đúng thông tin trường.
- [ ] Thử chatbot với khoảng 30 câu hỏi học sinh hay hỏi, ghi lại câu nào trả lời chưa tốt rồi chỉnh `lib/systemPrompt.ts`.
- [x] Trang **Khảo sát nhanh**. Còn lại: thay 21 câu Phần 3 bằng bản DASS-21 tiếng Việt đã kiểm định, nhờ chuyên viên duyệt Phần 8 và các câu nhạy cảm; phiếu đã gửi được tới chuyên viên (trang `/chuyen-vien`).
- [ ] Làm trang **Tham vấn ẩn danh** (`app/tham-van/page.tsx`): đặt lịch, chat với chuyên viên (cần thêm cơ sở dữ liệu và đăng nhập cho chuyên viên).
- [ ] (Nâng cao) Cho chatbot đọc thêm tài liệu riêng của trường (kỹ thuật RAG).
