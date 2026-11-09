# Hướng dẫn dự án: Ứng dụng quản lý và tính chi phí xăng

## Mục tiêu

Xây dựng web app chạy trên trình duyệt để ghi lại các lần đổ xăng, theo dõi chi phí và tìm cây xăng gần người dùng. Ứng dụng cần triển khai được trên Vercel.

## Các tab chính

Ứng dụng có ba tab: **Ghi xăng**, **Thông tin cá nhân**, **Cây xăng gần nhất**.

### 1. Ghi xăng (Record xăng)

**Thông báo cố định**: luôn hiển thị ở đầu tab, không cho đóng:
> Để tính mức tiêu thụ xăng chính xác nhất, vui lòng đổ đầy bình mỗi lần đổ.
> (EN: For the most accurate fuel calculation, please fill the tank completely every time.)

**Form ghi một lần đổ xăng** gồm các input (đều có nhãn, kiểm tra dữ liệu đầu vào, thông báo lỗi dễ hiểu):

1. **Ngày đổ** (date picker): mặc định là hôm nay, không cho chọn ngày tương lai.
2. **Giá xăng/lít**: sau khi chọn ngày, gọi API lấy giá xăng của đúng ngày đó và hiển thị (đơn vị: đồng/lít).
   - Nếu API lỗi, không có dữ liệu cho ngày đó hoặc không có mạng: báo rõ và cho phép nhập giá thủ công; không tự điền giá giả.
   - Chỉ hiển thị giá như dữ liệu thực khi có nguồn xác thực; ghi rõ nguồn và ngày cập nhật của giá.
3. **Số tiền đã đổ** (đồng).
4. **Số km trên đồng hồ (odometer)** tại thời điểm đổ: cần để tính quãng đường giữa hai lần đổ đầy liên tiếp.

**Tính toán tự động** (hiển thị ngay khi đủ dữ liệu):

- Số lít = số tiền ÷ giá xăng/lít.
- Quãng đường = km hiện tại − km của lần đổ đầy liền trước.
- **Số lít/100 km** = số lít ÷ quãng đường × 100.
- **Số tiền/km** = số tiền ÷ quãng đường.
- Lần ghi đầu tiên chưa có lần trước để so sánh: chỉ tính số lít, hiển thị "chưa đủ dữ liệu" cho hai chỉ số còn lại. Báo lỗi nếu km nhỏ hơn hoặc bằng lần trước.

**Danh sách lịch sử**:

- Hiển thị các record dạng **thẻ (card)**, lần lượt từ mới đến cũ; mỗi thẻ gồm ngày, giá/lít, số tiền, số lít, quãng đường, lít/100 km, tiền/km.
- **Bộ lọc theo ngày và theo tháng** (chọn một ngày cụ thể hoặc một tháng); có nút xoá bộ lọc.
- Hiển thị tổng chi phí (và tổng số lít) của các record đang được lọc.
- Cho phép sửa/xoá record. Trạng thái rỗng: hướng dẫn người dùng thêm record đầu tiên.

### 2. Thông tin cá nhân (Account)

**Chưa triển khai ở giai đoạn này.** Giữ tab trong điều hướng nhưng chỉ hiển thị màn hình giữ chỗ "Sắp ra mắt / Coming soon". Không xây dựng form, đăng nhập hay lưu thông tin tài khoản.

### 3. Cây xăng gần nhất

- Hiển thị **Google Maps** trong tab.
- Khi người dùng chủ động bấm nút "Tìm cây xăng gần tôi", mới xin quyền vị trí (geolocation) của thiết bị; lấy vị trí hiện tại và đặt marker trên bản đồ.
- Gọi API (Google Places API – Nearby Search, loại `gas_station`) để lấy các cây xăng gần nhất; hiển thị marker trên bản đồ và danh sách bên cạnh/bên dưới, sắp xếp theo khoảng cách (tên, địa chỉ, khoảng cách, giờ mở cửa nếu có).
- Loại nhiên liệu/giá tại từng cây xăng chỉ hiển thị nếu nguồn dữ liệu cung cấp; nếu không thì không hiển thị.
- Nếu người dùng từ chối quyền hoặc không lấy được vị trí: cho phép nhập địa điểm thủ công (ô tìm địa chỉ) và tìm quanh địa điểm đó.
- Gọi Places qua route phía server (Vercel serverless function) khi cần để giấu key bí mật; key dùng cho Maps JavaScript phía trình duyệt phải được giới hạn theo domain (HTTP referrer) trong Google Cloud.

## Yêu cầu triển khai

- Giao diện và nội dung hiển thị bằng tiếng Việt và tiếng Anh (có chuyển đổi ngôn ngữ); ưu tiên trải nghiệm tốt trên điện thoại lẫn máy tính.
- Giữ ba tab dễ nhận biết và điều hướng nhất quán; bảo đảm form có nhãn, kiểm tra dữ liệu đầu vào và thông báo lỗi dễ hiểu.
- Không hiển thị dữ liệu cây xăng, giá hoặc loại nhiên liệu như dữ liệu thực nếu chưa có nguồn xác thực. Tích hợp dịch vụ bản đồ/dữ liệu (API giá xăng, Google Maps/Places) qua biến môi trường; không đưa API key hoặc bí mật vào mã nguồn, không commit file `.env`. Với API giá xăng, gọi qua route phía server.
- Xử lý rõ trạng thái đang tải, không có kết quả, lỗi mạng và quyền vị trí bị từ chối.
- **Giao diện mobile-first**: thiết kế cho màn hình điện thoại trước, sau đó mở rộng cho máy tính.
  - Thanh điều hướng ba tab cố định ở cuối màn hình trên mobile (bottom navigation); có thể chuyển thành thanh bên/trên cùng ở màn hình lớn.
  - Vùng chạm tối thiểu 44×44 px; input dùng đúng kiểu bàn phím (`inputmode="numeric"` cho số tiền/km), cỡ chữ input ≥ 16px để iOS không tự phóng to.
  - Không có cuộn ngang; dùng `dvh` và tính đến safe-area (`env(safe-area-inset-*)`). Form và bộ lọc có thể dùng Drawer/Sheet dạng kéo từ dưới lên; bản đồ chiếm phần lớn chiều cao màn hình trên mobile.
  - Kiểm tra giao diện ở độ rộng 360px, 390px, 768px và desktop.
- **UI dùng shadcn/ui** (Tailwind CSS + Radix): ưu tiên dùng lại component có sẵn như `Tabs`, `Card`, `Input`, `Label`, `Button`, `Calendar` + `Popover` (date picker), `Select`, `Form`, `Alert`, `Drawer`/`Sheet`, `Dialog`/`AlertDialog` (xác nhận xoá), `Skeleton`, `Sonner`/`Toast`. Chỉ thêm component qua CLI của shadcn khi cần; không tự viết lại component đã có.
- **CSDL dùng SQLite** cho gọn nhẹ, truy cập qua một ORM/query builder nhẹ (ví dụ Drizzle) nếu dự án chưa có lựa chọn khác; schema và migration nằm trong repo.
  - Lưu ý Vercel: hệ thống file của serverless function là tạm thời và chỉ đọc, nên **file SQLite cục bộ không dùng được để lưu dữ liệu khi chạy trên Vercel**.
  - **Dịch vụ được chọn: Turso (libSQL, SQLite phía máy chủ)**, cài qua Vercel Marketplace hoặc tạo trực tiếp trên turso.tech; có gói miễn phí đủ cho giai đoạn này. Dùng driver `@libsql/client` (kết hợp `drizzle-orm/libsql`), chạy được trên Node và Edge runtime của Vercel.
  - Dùng **cùng một driver** cho mọi môi trường, chỉ đổi biến môi trường: phát triển cục bộ `DATABASE_URL=file:./local.db` (không cần token); production trên Vercel `DATABASE_URL=libsql://<tên-db>.turso.io` và `DATABASE_AUTH_TOKEN=<token>` đặt trong Project Settings → Environment Variables. Thêm `local.db` vào `.gitignore`.
  - Migration chạy bằng `drizzle-kit` (từ máy phát triển hoặc bước CI) trên DB Turso; không chạy migration tự động trong lúc request.
  - Bảng chính `fuel_records`: id, ngày đổ, giá/lít, nguồn giá (hoặc cờ nhập thủ công), số tiền, số lít, km đồng hồ, thời gian tạo/cập nhật. Chưa có tài khoản nên chưa có khoá người dùng; thiết kế để sau này thêm `user_id` dễ dàng.
  - Truy cập DB chỉ qua route/server action phía server, không để thông tin kết nối ở phía trình duyệt.
- Tương thích triển khai trên Vercel. Trước khi thêm thư viện hay thay đổi kiến trúc, kiểm tra cấu trúc và công nghệ sẵn có của dự án, rồi ưu tiên dùng lại chúng.
- Khi hoàn tất thay đổi, chạy các lệnh kiểm tra/build phù hợp với dự án hiện tại và cập nhật tài liệu liên quan nếu cần.

## Hướng dẫn triển khai lên Vercel từ đầu

Thực hiện theo thứ tự. Nếu dự án đã có sẵn framework/cấu trúc thì bỏ qua bước 1 và dùng lại cái đã có.

### Bước 1. Khởi tạo dự án (chỉ khi chưa có mã nguồn)

Mặc định dùng **Next.js (App Router) + TypeScript + Tailwind CSS**, vì chạy trực tiếp trên Vercel và có sẵn route handler/server action cho API phía server.

```bash
npx create-next-app@latest gas_app --ts --tailwind --eslint --app --src-dir
cd gas_app
npx shadcn@latest init
npm i @libsql/client drizzle-orm
npm i -D drizzle-kit
```

Thêm component shadcn khi cần, ví dụ: `npx shadcn@latest add tabs card input label button calendar popover select form alert drawer alert-dialog skeleton sonner`.

### Bước 2. Tạo cơ sở dữ liệu Turso

```bash
curl -sSfL https://get.tur.so/install.sh | bash   # cài Turso CLI
turso auth login
turso db create gas-app
turso db show gas-app --url                       # -> DATABASE_URL (libsql://...)
turso db tokens create gas-app                    # -> DATABASE_AUTH_TOKEN
```

Hoặc thêm Turso trực tiếp từ Vercel Dashboard → Storage/Marketplace (biến môi trường được tự thêm vào project).

### Bước 3. Cấu hình biến môi trường

Tạo `.env.local` (đã nằm trong `.gitignore`, **không commit**) và tạo `.env.example` chỉ chứa tên biến, không chứa giá trị thật:

```
DATABASE_URL=file:./local.db
DATABASE_AUTH_TOKEN=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=     # key Maps JavaScript, giới hạn theo domain
GOOGLE_PLACES_API_KEY=               # key dùng phía server, không có tiền tố NEXT_PUBLIC_
FUEL_PRICE_API_URL=                  # nguồn giá xăng đã xác thực
FUEL_PRICE_API_KEY=
```

Chỉ biến có tiền tố `NEXT_PUBLIC_` mới bị lộ ra trình duyệt; mọi bí mật còn lại phải không có tiền tố này.

### Bước 4. Tạo khoá Google Maps

Trong Google Cloud Console: tạo project → bật **Maps JavaScript API** và **Places API** → bật thanh toán (có hạn mức miễn phí hằng tháng) → tạo hai API key:
- Key trình duyệt: giới hạn theo HTTP referrer (`localhost:3000/*` và domain Vercel/domain riêng), chỉ cho Maps JavaScript API.
- Key máy chủ: giới hạn chỉ cho Places API.

### Bước 5. Chạy thử và kiểm tra cục bộ

```bash
npx drizzle-kit push        # tạo bảng trong local.db (hoặc generate + migrate)
npm run dev                 # thử trên điện thoại/giả lập ở 360px và 390px
npm run lint && npm run build
```

Build phải thành công trước khi triển khai.

### Bước 6. Đưa mã lên GitHub

```bash
git init && git add . && git commit -m "Initial commit"
gh repo create gas-app --private --source=. --push
```

Kiểm tra `.env.local` và `local.db` chưa bị commit.

### Bước 7. Tạo project trên Vercel

1. Vào vercel.com → **Add New → Project** → import repo GitHub vừa tạo (Framework Preset tự nhận Next.js, giữ mặc định).
2. Trong **Environment Variables**, thêm các biến ở Bước 3 với giá trị production (`DATABASE_URL=libsql://...`, `DATABASE_AUTH_TOKEN`, hai key Google, thông tin API giá xăng).
3. Bấm **Deploy**.

Cách khác bằng CLI: `npm i -g vercel` → `vercel login` → `vercel link` → `vercel env add <TÊN>` → `vercel --prod`.

### Bước 8. Chạy migration trên DB production

Chạy từ máy phát triển, trỏ vào Turso (không chạy trong lúc request):

```bash
DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." npx drizzle-kit push
```

### Bước 9. Hoàn tất và kiểm tra sau triển khai

- Thêm domain Vercel (và domain riêng nếu có) vào danh sách referrer của key Google ở Bước 4.
- Kiểm tra trên bản production, ưu tiên điện thoại thật: thêm/sửa/xoá record, bộ lọc ngày/tháng, lấy giá xăng theo ngày, tìm cây xăng (cho phép và từ chối quyền vị trí), chuyển ngôn ngữ.
- Mỗi lần `git push` lên nhánh chính sẽ tự triển khai production; nhánh khác/PR tạo bản Preview. Nếu thay đổi schema, chạy lại Bước 8 trước hoặc ngay sau khi triển khai.
- Nếu lỗi: xem **Deployments → Logs** trên Vercel; lỗi thường gặp là thiếu biến môi trường hoặc key Google bị giới hạn sai referrer.
