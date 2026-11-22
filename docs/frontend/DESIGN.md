# SchoolCoin Design System: "The Warm Studio"

Tài liệu **bắt buộc** cho mọi giao diện của SchoolCoin (POS, Phụ huynh, Kiosk, Admin). Hệ thống này được chuyển từ design system của Ronan SAT ("The Warm Studio") và chỉnh cho SchoolCoin. Ai thiết kế hay code giao diện (người hoặc AI agent) đều làm theo file này.

**Nếu một màn hình khác với tài liệu này, sửa màn hình, đừng sửa tài liệu.** Muốn đổi quy tắc thì mở PR sửa file này trước, cả nhóm đồng ý rồi mới làm.

Tinh thần: **ấm, yên tĩnh, hiện đại**. Nền giấy trắng ngà, card trắng, đường viền mảnh 1px, bóng đổ mềm và thấp, và **một màu vàng nhạt (gold)** làm mọi việc nhấn mạnh. Trông như một công cụ tài chính đáng tin: trưởng thành, rõ ràng, không trẻ con, không loè loẹt.

Liên quan: [CONVENTIONS.md](./CONVENTIONS.md) (code, data fetching), [API-NOTES.md](./API-NOTES.md) (API).

---

## 1. Tokens: nguồn sự thật duy nhất

Mọi giá trị dùng chung nằm trong `packages/ui/src/styles.css` (khối `:root` và `@theme inline`). Đổi ở đó thì cả 4 app đổi theo. **Không bao giờ viết mã hex, radius hay shadow lẻ trong component.**

### 1.1 Màu

| Token (class Tailwind)                     | Giá trị                                                                | Vai trò                                                                                                                   |
| :----------------------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `paper-bg`                                 | `#faf9f7`                                                              | Nền trang. Trắng ngà hơi ấm, là "chữ ký" của hệ thống.                                                                    |
| `surface-white`                            | `#ffffff`                                                              | Card, dialog, input, popover: mọi thứ nằm _trên_ nền.                                                                     |
| `surface-inset`                            | `#f4f2ee`                                                              | Rãnh progress bar, vùng lõm.                                                                                              |
| `ink-fg`                                   | `#1c1917`                                                              | Tiêu đề, chữ chính, icon.                                                                                                 |
| `ink-muted`                                | `#78716c`                                                              | Chữ phụ, caption, nhãn, header bảng. Dùng `text-ink-muted`, **không** dùng `text-ink-fg/60`.                              |
| `ink-faint`                                | `#a8a29e`                                                              | Placeholder, chữ rất mờ.                                                                                                  |
| `border`                                   | `#e7e3dd`                                                              | Đường viền **mặc định**: divider, viền card.                                                                              |
| `border-strong`                            | `#d8d2c8`                                                              | Viền input, nút secondary, divider cần rõ hơn.                                                                            |
| `brand`                                    | `#e0b354`                                                              | **Màu nhấn duy nhất.** Nút chính, focus ring, trạng thái quan trọng. Luôn mang chữ `ink-fg`, **không bao giờ chữ trắng**. |
| `brand-strong`                             | `#c99b3f`                                                              | Hover/pressed của nút vàng, gạch chân tab đang chọn.                                                                      |
| `brand-tint`                               | `#faf1de`                                                              | Nền nhạt cho trạng thái _đang chọn_: menu, hàng bảng, pill, ô số tiền.                                                    |
| `brand-deep`                               | `#8a6420`                                                              | Icon/chữ vàng trên nền `brand-tint`.                                                                                      |
| `success` / `success-tint`                 | `#1f9d6b` / `#e6f5ee`                                                  | Nạp thành công, số dương, "Đã thanh toán".                                                                                |
| `danger` / `danger-tint`                   | `#e0592f` / `#fceee9`                                                  | Lỗi, từ chối, hủy đơn, khóa thẻ.                                                                                          |
| `warning` / `warning-tint` / `warning-ink` | `#c98a1b` / `#fbf1dc` / `#8f6110`                                      | Chờ xử lý, sắp hết hạn, cảnh báo. Chữ cảnh báo dùng `warning-ink`.                                                        |
| `info` / `info-tint`                       | `#2f6feb` / `#e8effd`                                                  | Thông tin trung tính, ghi chú hệ thống.                                                                                   |
| `pastel-*`                                 | sky, peach, mint, lavender, butter, rose, aqua, sage, periwinkle, clay | **Bảng màu mã hoá** duy nhất: danh mục thực đơn, avatar chữ cái.                                                          |

**Kỷ luật màu:**

- Một màn hình chủ yếu là **giấy + trắng + mực**. Vàng chỉ cho **một** hành động chính hoặc trạng thái đang chọn.
- **Một điểm nhấn vàng cho mỗi vùng** (mỗi panel, dialog, thanh header).
- Màu ngữ nghĩa (xanh lá, đỏ, cam, xanh dương) chỉ dùng cho **tag nhỏ, icon, chữ trạng thái**, hoặc dải tint của `<Notice>`. **Không bao giờ tô khối lớn.**
- Không neon, không gradient, không nhiều màu sặc sỡ cạnh nhau.
- Cần "mỗi mục một màu" (danh mục, avatar)? Lấy từ bảng pastel qua `pastelAt(i)` / `pastelFor(seed)` + `pastelStyle(key)` và class `pastel-tinted`. Class này tự sinh màu chữ đậm (`--pastel-ink`) cùng tông. **Không tự thêm mã pastel mới.**

### 1.2 Hình khối

| Token            | Giá trị     | Dùng cho                                                    |
| :--------------- | :---------- | :---------------------------------------------------------- |
| `--ui-radius`    | `0.625rem`  | Card, panel, input, nút lớn.                                |
| `--ui-radius-sm` | `0.4375rem` | Nút thường, chip, hàng danh sách, badge.                    |
| `--ui-radius-lg` | `0.875rem`  | Chỉ dialog.                                                 |
| `--ui-border`    | `1px`       | **Mọi đường viền đều 1px.** Không có `border-2`/`border-4`. |
| `--app-bar-h`    | `3.5rem`    | Chiều cao thanh trên cùng. Đọc token, **không gõ lại số**.  |
| `--sidebar-w`    | `15rem`     | Rộng sidebar admin.                                         |

Viết `rounded-[var(--ui-radius)]`. **Không** dùng `rounded-xl`, `rounded-2xl`. `rounded-full` chỉ cho avatar, chấm trạng thái, badge đếm số, thanh progress.

### 1.3 Độ sâu: mềm, nhiều lớp, không bao giờ offset cứng

| Token                          | Vai trò                                 |
| :----------------------------- | :-------------------------------------- |
| `shadow-[var(--ui-shadow-xs)]` | Nút, input khi nghỉ.                    |
| `shadow-[var(--ui-shadow)]`    | Card nghỉ (`workbook-panel` đã có sẵn). |
| `shadow-[var(--ui-shadow-md)]` | Hover, popover, toast.                  |
| `shadow-[var(--ui-shadow-lg)]` | Dialog.                                 |

Không dùng `shadow-sm/md/lg/xl` của Tailwind, không bóng kiểu brutalist lệch cứng.

### 1.4 Chuyển động

- Hover/press **chỉ đổi màu và bóng**, 150ms (class `workbook-press`, đã có trong mọi primitive). **Không transform** (`translate`, `scale`) khi hover hay bấm: trên màn cảm ứng nó tạo cảm giác giật và chậm.
- Popover/dialog xuất hiện bằng `menu-pop` (180ms, `--ease-out-expo` = `cubic-bezier(0.22, 1, 0.36, 1)`). Chuyển trạng thái màn hình dùng `fade-in` (220ms).
- Pill đang chọn trượt giữa các lựa chọn (framer-motion `layoutId` trong `<PillToggle>`).
- Mọi animation phải tắt khi `prefers-reduced-motion: reduce`.
- Không bounce, không confetti, không lấp lánh.

---

## 2. Chữ

| Vai trò                                    | Font                                  | Class                                       |
| :----------------------------------------- | :------------------------------------ | :------------------------------------------ |
| Tiêu đề, số tiền lớn                       | Bricolage Grotesque                   | `font-display font-semibold tracking-tight` |
| Chữ thường, nút, nhãn                      | Be Vietnam Pro (có đủ dấu tiếng Việt) | mặc định `font-sans`                        |
| Mã thẻ, mã nạp, mã học sinh, tên đăng nhập | Geist Mono                            | `font-mono`                                 |

- **Không viết HOA toàn bộ, không giãn chữ trang trí.** Không dùng class `uppercase` hay `tracking-[…]` rộng, kể cả cho nhãn nhỏ, header bảng, badge. Mọi chữ viết theo kiểu câu ("Nạp tiền mặt", không phải "NẠP TIỀN MẶT"). Ngoại lệ là chữ vốn viết hoa: PIN, QR, SePay, VietQR, CSV, mã lớp (6A1).
- Thứ bậc dùng **cỡ, độ đậm, màu**, không dùng chữ hoa.
- Mọi con số thay đổi (số dư, tổng, đồng hồ đếm ngược) có class `tabular` để không nhảy.
- Cỡ tham khảo: tiêu đề trang `text-2xl`; tiêu đề panel `text-base`; chữ thường `text-sm`; caption `text-[0.8125rem]`; số dư lớn `<Money size="hero">`.

---

## 3. Component: luôn dùng primitive trong `@schoolcoin/ui`

Thiếu component thì **thêm vào `packages/ui`** (PR riêng, FE-1 review), không tự vẽ lại trong app.

### Nút

- `<Button variant="primary">`: nền vàng, chữ mực. **Một nút primary mỗi vùng.** Mọi nút còn lại là `secondary` (trắng, viền mảnh) hoặc `ghost`.
- `danger`: nút trắng chữ đỏ cho hành động phá huỷ (hủy đơn, khóa thẻ, gỡ liên kết). Không tô đỏ cả nút.
- Kích thước: `sm` h-8, `md` h-9 (mặc định admin), `lg` h-12 (≥ 48px, POS, form phụ huynh), `xl` h-16 (≥ 64px, kiosk, nút thu tiền POS).
- Nút gọn và yên tĩnh. **Không tự phóng to** bằng `px-6 py-3`, `font-bold`, `font-black`, `text-base+` hay chữ hoa.
- Nút chữ ghi rõ hành động: "Thu 35 xu", "Hủy đơn", "Gán cho học sinh". Không dùng "OK", "Submit".
- Link trông như nút dùng `<LinkButton href>`. **Không lồng `<Button>` trong `<Link>`** (HTML không hợp lệ).
- Nút chỉ có icon dùng `<IconButton label="…">`; `label` thành `aria-label`.

### Bề mặt

- `<Panel>` = card trắng + viền mảnh + bóng nghỉ. `<Panel muted>` = nền giấy, không bóng (panel lồng bên trong).
- `<PanelHeader title description actions>`: một tiêu đề, tối đa một dòng phụ.
- Divider: `border-b border-border`.

### Form

- Mỗi ô nhập nằm trong `<Field label hint error>`. **Giải thích trên màn hình** bằng dòng `hint` dưới ô, **không bao giờ dùng `title=` tooltip** (vô hình trên cảm ứng, bàn phím không tới được).
- Focus: viền vàng + vòng `brand` 18% (có sẵn trong `workbook-input`).
- Lỗi: một dòng đỏ dưới ô (`error`), nội dung từ `errorMessage(err)`.
- Bật/tắt dùng `<Switch>`; chọn một trong vài lựa chọn dùng `<PillToggle>`; chọn số tiền dùng `<AmountPicker>`; nhập PIN dùng `<PinPad>`.

### Trạng thái đang chọn

Menu, tab, pill, hàng đã chọn đều dùng `bg-brand-tint text-ink-fg` (có thể thêm viền `border-brand`). Chưa chọn: nền trong suốt, `text-ink-muted`, hover `bg-paper-bg`. **Nền vàng đặc chỉ dành cho nút primary**, không dùng cho hàng đang chọn. Tab gạch chân dùng `<Tabs>` (chữ mực + gạch vàng).

### Nhãn và badge

- `<Badge tone>`: tag viền mảnh, `rounded-[var(--ui-radius-sm)]`. **Không dùng pill tròn cho nhãn.**
- Chữ trạng thái luôn lấy từ map trong `@schoolcoin/ui`: `ORDER_STATUS`, `TOPUP_STATUS`, `REQUEST_STATUS`, `SEPAY_STATUS`, `CARD_STATUS`, `LEDGER_TYPE`, `USER_STATUS`, `ROLE_LABEL`. Viết `<Badge tone={X[s].tone}>{X[s].label}</Badge>`. Bốn app phải dùng chung một từ cho một trạng thái.
- `<CountBadge>` (tròn, đỏ) chỉ cho số chưa đọc/chờ xử lý.

### Avatar

`<Avatar name src>`: ảnh nếu có, không thì chữ cái trên nền pastel cố định theo tên. **Không viền, không bóng.** POS dùng `size="2xl"` hoặc `xl` để thu ngân đối chiếu mặt học sinh.

### Bảng

`<Table>` + `THead/TBody/TR/TH/TD`: header là dải giấy nhạt, chữ `ink-muted`; các hàng ngăn bằng đường mảnh; hover nền giấy. **Không kẻ sọc ngựa vằn.** Cột số dùng `align="right"` (tự có `tabular`, không xuống dòng). Bảng rộng hơn panel thì cuộn ngang **bên trong panel**, không làm rộng trang. Bảng không có dữ liệu dùng `<TableEmpty>`; phân trang dùng `<Pagination>`.

### Dialog

- Chỉ dùng `<Modal>` / `<ConfirmDialog>`. Cả hai render qua portal vào `body`, đóng bằng Escape hoặc bấm nền, body cuộn được, footer ghim dưới.
- Nền mờ là **dim phẳng** (`workbook-modal-backdrop`, mực 45%). **Không `backdrop-blur`** sau dialog, sheet hay overlay.
- Dưới 640px dialog thành màn hình đầy đủ (không viền, không bo góc).
- Hành động phá huỷ hoặc liên quan tiền: `<ConfirmDialog destructive>`. Hủy đơn hay bỏ qua giao dịch thì bắt nhập lý do (`reasonLabel`).
- Footer: `ghost` "Hủy" bên trái, một `primary` hoặc `danger` bên phải.

### Thông báo, rỗng, đang tải

- Mutation thành công: `toast.success("Đã …")`. Lỗi: `toast.error(errorMessage(err))`, hoặc `<Notice tone="danger">` khi người dùng phải đọc kỹ.
- **Không bao giờ hiện `error.message`** (là tiếng Anh từ server, có thể lộ chi tiết nội bộ).
- Mọi màn hình có dữ liệu đều xử lý **ba trạng thái**: đang tải (`<LoadingBlock>` / `<Skeleton>`), lỗi (`<Notice tone="danger">` + nút "Thử lại"), rỗng (`<EmptyState title>`).
- Trạng thái rỗng nói rõ **nó là gì** trong một dòng ("Chưa có đơn hàng hôm nay") và đưa ra lối thoát nếu có. Không minh hoạ, không câu quảng cáo.
- `<Splash>` (logo đồng xu nhấp nháy) **chỉ dùng lúc mở app**. Mọi lần chờ khác dùng `LoadingBlock`/`Skeleton` hoặc `loading` trên nút.

---

## 4. Bố cục

- **Header trang:** đúng một `<PageHeader title description actions>`. Không sticker hay pill phía trên tiêu đề, không câu phụ lặp lại tiêu đề.
- **Cắt bớt, đừng thêm.** Trước khi thêm badge, dòng phụ hay khung lồng, hỏi xem màn hình có đọc được không cần nó không. Thường là được.
- **Cuộn:** thanh cuộn nằm ở mép ngoài vùng nó cuộn. `overflow-*` và `mx-auto max-w-*` **không được nằm cùng một element**: đặt max-width ở element con bên trong vùng cuộn.
- Giữ bố cục cố định khi trạng thái đổi (ví dụ dòng lỗi PinPad luôn giữ chỗ) để màn hình không nhảy.

### Theo từng app

| App           | Thiết bị chuẩn                     | Quy tắc riêng                                                                                                                                                                                                                                                    |
| :------------ | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **POS**       | Màn cảm ứng 1366×768, máy quét USB | Không cuộn trang; cột menu và cột giỏ cuộn bên trong. Vùng chạm ≥ 48px, nút thu tiền `xl`. Ô quét thẻ luôn nhận input (`useCardScanner`). Đơn thường (2 món + quét + thu) = 3 chạm + quét. Chỉ hiện thông tin học sinh mà `PosLookupResult` có (quyền riêng tư). |
| **Kiosk**     | Cảm ứng 1280×800 ngang             | Toàn màn hình, không cuộn trình duyệt. Vùng chạm ≥ 64px (`xl`), chữ thường ≥ `text-lg`, đọc được từ 1m. Tự đăng xuất sau 30 giây, có thanh cảnh báo 10 giây cuối. Khi đăng xuất xoá sạch dữ liệu học sinh khỏi màn hình.                                         |
| **Phụ huynh** | Điện thoại từ 360px, PWA           | Thiết kế mobile trước, một cột `max-w-3xl`. Thanh điều hướng dưới trên điện thoại. Độ tương phản WCAG 2.1 AA. Nút hành động chính rộng hết chiều ngang trên điện thoại.                                                                                          |
| **Admin**     | Desktop ≥ 1280px                   | Sidebar trái chỉ hiện mục vai trò đó được dùng (`can(role, Capability…)`). Nội dung `max-w-[90rem]`. Mật độ thông tin cao nhưng vẫn một nút vàng mỗi vùng.                                                                                                       |

---

## 5. Nội dung và chữ

- Giao diện **tiếng Việt** tự nhiên, lịch sự (NFR-USE-01). Gọi phụ huynh và học sinh là "bạn". Code, tên biến và comment viết **tiếng Anh**.
- **Tiền:** đơn vị là **xu** (1 xu = 1.000 ₫). Luôn format qua helper: `formatCredits` → "25 xu", `formatCreditsWithVnd` → "25 xu (25.000 ₫)", `<Money>`, `formatVnd`. Không tự ghép chuỗi số tiền.
- **Thời gian:** luôn theo giờ Việt Nam qua `formatDateTime`, `formatTime`, `formatWhen`, `formatRelative`, `formatWeekdayDate`. "Hôm nay" là ngày theo `Asia/Ho_Chi_Minh` (`vnDate()`).
- Mã thẻ hiển thị theo nhóm 4 (`formatCardCode`), font mono.
- Lỗi: luôn qua `errorMessage(err)`, đã có sẵn câu tiếng Việt kèm số ("Không đủ xu: số dư 12 xu, đơn 25 xu.").
- Câu ngắn, nói thẳng. Không emoji, không "Chào mừng bạn đến với…".

---

## 6. Quy tắc cho người và AI agent (checklist khi viết UI)

1. **Chỉ dùng token**, không dùng giá trị lẻ: không hex, không `rounded-xl/2xl`, không `shadow-lg`, không `bg-blue-500`, không gradient.
2. **Vàng làm việc, và chỉ vàng được tô khối.** Hành động chính dùng `brand`; trạng thái chọn dùng `brand-tint`; màu ngữ nghĩa chỉ là tag nhỏ.
3. **Viền 1px** màu `border`/`border-strong`, không bao giờ `border-ink-fg`.
4. **Độ sâu mềm.** Bóng mờ nhiều lớp; hover/press chỉ đổi màu và bóng; overlay sau dialog là dim phẳng, không blur.
5. **Cắt bớt, đừng thêm.**
6. **Hiện đại, không trẻ con.** Không xoay nghiêng, không card cầu vồng, không đồ trang trí.
7. **Không viết HOA**, không giãn chữ trang trí.
8. **Control gọn.** Không phóng to nút.
9. **Dùng primitive** của `@schoolcoin/ui`; primitive mới thì thêm vào `packages/ui`, re-skin theo token trước khi dùng.
10. **Component nhỏ.** Trang trên khoảng 300 dòng thì tách ra `src/components/`.
11. **Có đủ loading / lỗi / rỗng** cho mọi màn hình có dữ liệu.
12. **Tiếng Việt cho giao diện, tiếng Anh cho code.**

## 7. Không được vi phạm

- Chủ yếu giấy/trắng/mực; vàng cho một hành động + `brand-tint` cho trạng thái chọn; màu khác chỉ là tag nhỏ. Không neon.
- Một độ dày viền (1px), bóng mềm (không offset cứng), radius từ token, một kiểu thanh cuộn.
- Không pill cho nhãn, không header quá to, không chữ giải thích dài dòng.
- Không chữ HOA trang trí.
- Mọi control tương tác có `workbook-press` (primitive đã có sẵn).
- Không `title=` tooltip, không `backdrop-blur` sau overlay, không `error.message` trên màn hình.

## 8. Kiểm tra trước khi mở PR

```bash
pnpm lint:design      # quét màu lẻ, radius/shadow lẻ, uppercase, blur, title tooltip, error.message, chữ tiếng Việt bị lỗi mã hoá
pnpm lint && pnpm typecheck
pnpm shoot <app>      # chụp màn hình các route (app phải đang chạy) → screenshots/
```

Đính kèm ảnh chụp màn hình trước/sau vào PR khi đổi giao diện. Màn hình mẫu để đối chiếu chất lượng: `apps/admin/src/app/(app)/page.tsx` (dashboard).
