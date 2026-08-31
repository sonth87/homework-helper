# ADR-0008: Offset ký tự phải tự kiểm chứng khứ hồi, không tin API Accessibility

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-08-31

## Bối cảnh

Lane A cần biết **ký tự nào đang nằm dưới con trỏ** để cắt đúng từ/câu mà người
dùng trỏ vào. Extension có `caretRangeFromPoint()` của DOM nên biết chính xác;
desktop không có DOM.

Bản đầu tiên (Phase 3) luôn lấy đoạn ĐẦU TIÊN của text thu được. Bản thứ hai
thay bằng nội suy hình học: vị trí con trỏ trong khung bao → ước lượng offset.
Cả hai đều được ship kèm báo cáo "test pass, typecheck sạch" — nhưng **chưa hề
đo bằng layout thật**.

Khi đo bằng font metric thật (CoreText, `CTLineGetStringIndexForPosition` và
`CTFramesetter`), kết quả cho thấy bản thứ hai **không giải quyết được vấn đề
nó sinh ra để giải quyết**.

## Số đo quyết định

Ba phép đo trên chính code đã ship, ground truth lấy từ CoreText:

| Ca | Luôn lấy đầu tiên | Nội suy hình học |
|---|---|---|
| **Từ** trên text **một dòng** | 20.1% | **90.1%** |
| **Câu** trong **đoạn văn 5 câu / 4 dòng** | 25.2% | **24.3%** |
| Bất kỳ, qua **OCR** | hằng số | hằng số 0.625 |

Ca thứ hai — đúng ca mà bản thứ hai được viết ra để sửa — **không cải thiện
gì**, và cả hai đều chỉ nhỉnh hơn đoán bừa (20% với 5 câu). Kể cả khi thay hằng
số chiều cao dòng bằng giá trị **đúng thật** đo được (30px thay vì 20px), cũng
chỉ lên 35.7%. Đây là giới hạn **cấu trúc**: giả định "mỗi dòng chứa số ký tự
xấp xỉ nhau" là sai, và ranh giới câu không liên quan gì tới ranh giới dòng.

Ca thứ ba vô hiệu vì `tryOcr()` dựng khung chụp **lấy con trỏ làm tâm**, nên
con trỏ luôn ở chính giữa khung theo cấu tạo — mọi lần hover đều cho cùng một
tỉ lệ 0.625.

## Phát hiện chính: API Accessibility trả sai một cách âm thầm

Khảo sát các app đang chạy rồi **gọi thật** `kAXRangeForPositionParameterized`
tại ba vị trí X khác nhau trong cùng một phần tử:

| App | Kết quả | |
|---|---|---|
| Finder | 15%→ký tự 12 ✓, 50%→46 ✓, **85%→0** | sai âm thầm |
| Terminal | ba vị trí → hai giá trị | đúng một phần |
| Notes | **cả ba → cùng offset 1848** | bỏ qua trục X |
| System Settings | **nil** | quảng cáo có, không chạy |
| VS Code | **nil** ở mọi biến thể | quảng cáo 100%, không chạy |

Nguy hiểm nhất không phải `nil` — mà là Finder trả **0**: một con số *trông hợp
lệ*, không thể phân biệt với câu trả lời đúng ở tầng trên.

**Quảng cáo có thuộc tính ≠ thuộc tính hoạt động.** `AXUIElementCopyParameterizedAttributeNames`
liệt kê tên; nó không hứa gì về việc gọi ra kết quả đúng.

## Quyết định

**Mọi offset ký tự lấy từ Accessibility phải tự chứng minh bằng một lượt khứ
hồi trước khi được dùng. Không kiểm chứng được thì coi như không có.**

```
toạ độ chuột ──AXRangeForPosition──> offset
                                        │
              offset ──AXBoundsForRange──> khung ký tự
                                        │
                    khung đó có bao con trỏ không?
                       ├── có   -> nhận, chính xác tuyệt đối
                       └── không-> LOẠI, rơi xuống tầng sau
```

Kèm chốt chặn kích thước: khung của **một** ký tự không thể rộng/cao quá 150px.
Không có chốt này, app trả khung cả dòng (đo được: Notes trả **987×19**) hoặc cả
phần tử sẽ lọt qua phép kiểm — vì khung to dĩ nhiên "bao" con trỏ.

Chiều `range → bounds` đáng tin hơn hẳn chiều thuận vì app **buộc phải cài đúng
nó** để tự vẽ vùng bôi đen của chính mình.

`charOffset` **vắng mặt** trong kết quả nghĩa là "không xác định được", **không
phải** "bằng 0".

## Kiến trúc tầng

Mỗi tầng **hoặc trả kết quả đã chứng minh, hoặc không trả gì**. Không tầng nào
được phép âm thầm đoán.

```
1. AXRangeForPosition + kiểm khứ hồi  -> chính xác tuyệt đối          [ĐÃ CÀI]
2. AXRangeForLine + nhị phân hai lần  -> chính xác tuyệt đối          [ĐÃ CÀI]
3. AXVisibleCharacterRange            -> giới hạn phạm vi cho tầng 2  [ĐÃ CÀI]
4. OCR block hit-test                 -> ca Chromium/PDF               [ĐÃ CÀI]
   + Vision per-char box              -> bỏ nốt giả định bề rộng đều   [chưa]
5. nội suy hình học                   -> CHỈ trong phạm vi một dòng    [ĐÃ CÀI]
```

**Nguyên tắc chung của mọi tầng: hạ bài toán về MỘT DÒNG rồi mới nội suy.** Nội
suy trong một dòng đo được ~93,5%; nội suy vượt dòng chỉ ~24%. Tầng 2 và tầng 4
khác nhau về nguồn thông tin dòng (AX vs. OCR) nhưng cùng phục vụ mục đích đó.

### Tầng 2+3 — phân rã theo dòng, nhị phân hai lần

Khi tầng 1 từ chối, không rơi thẳng xuống ước lượng mà thử một đường **cũng
chính xác tuyệt đối**:

1. `AXVisibleCharacterRange` → chỉ xét các dòng ĐANG HIỂN THỊ. Đây là thứ giải
   ca cuộn: đo được Notes hiển thị **261/2377** ký tự, Terminal **2347/29064** —
   không có thông tin này thì không thể biết phần nào đang trong tầm mắt.
2. `AXLineForIndex` ở hai đầu đoạn hiển thị → khoảng số dòng cần tìm.
3. **Nhị phân trên số dòng** — hợp lệ vì Y của khung dòng tăng đơn điệu theo số
   dòng. Phạm vi bị chặn bởi bước 1 nên không phụ thuộc tài liệu dài bao nhiêu.
4. **Nhị phân trong dòng theo trục X** → đúng ký tự.

Không bước nào nội suy. Đo thực nghiệm 2026-08-31: **6/6 đúng dòng** trên Notes
và Terminal, tốn **11–21 lệnh gọi AX và 1,1–1,5ms** — không đáng kể so với ngân
sách `hoverDelayMs`.

Khung từng dòng trả về toạ độ **trên màn hình thật** (ví dụ y 300..314), khác
hẳn khung phần tử (Terminal: y=-4061, cao 5057px). Một bằng chứng nữa cho việc
**khung phần tử ≠ vùng nhìn thấy**.

Lưu ý cài đặt: tham số dòng/chỉ số của `AXRangeForLine` và `AXLineForIndex` là
**CFNumber**, không phải `AXValue` — `AXValueType` không có thành viên tương
ứng, dựng bằng `AXValueCreate` sẽ không biên dịch được.

### Tầng 4 — hit-test theo khối OCR

Vision trả về mỗi khối kèm khung bao chính xác; `acquire.ts` trước đây ghép text
phẳng rồi **vứt toàn bộ hình học**. Nay `ocr/blocks.ts` giữ lại và dùng nó để:

- **Sắp xếp theo thứ tự đọc** (trên→dưới, trái→phải) thay vì tin thứ tự Vision
  trả về — Apple không cam kết thứ tự đó ở đâu cả, và bố cục nhiều cột sẽ cho ra
  chuỗi lộn xộn khiến mọi suy luận theo offset mất nền.
- **Hit-test con trỏ vào khối** → biết chắc đang ở dòng nào.
- **Neo overlay vào khung của khối trúng**, không phải khung chụp 500×80.

Kiểm chứng E2E với binary Vision thật trên ảnh 3 dòng dựng sẵn: đọc đúng 3 khối
(314ms), hit-test bắt đúng dòng theo Y, và trong cùng một dòng thì X cho ra từ
khác nhau (`Alpha` → `bravo` → `delta`). Đường OCR đi từ **hằng số 0.625** sang
đúng từ đang trỏ.

Còn lại một ước lượng trong khối: giả định bề rộng ký tự đều nhau (~93,5%). Bỏ
nốt được bằng `VNRecognizedText.boundingBox(for:)` — chưa làm.

**Không bao giờ lấy trung bình giữa các tầng.** Trộn một giá trị chính xác với
một giá trị đoán chỉ làm hỏng giá trị chính xác. Kết hợp ở đây nghĩa là *bắt mỗi
tín hiệu tự chứng minh*, không phải bỏ phiếu.

## Độ phủ thực tế của tầng 1

Đo trên điểm đã ghim vào vùng thật sự hiển thị:

| App | Tỉ lệ nhận |
|---|---|
| Finder | 52% |
| Notes | 50% |
| Terminal | 33% |
| System Settings | 0% |
| VS Code / Chromium | 0% |

Không phải lời giải trọn vẹn — nhưng phần nó trả lời thì **đúng tuyệt đối**, và
phần còn lại từ chối sạch thay vì đoán sai. Một phần đáng kể ca bị loại là hover
ra ngoài phần chữ thật trong khung, tức **loại đúng**.

## Đính chính ADR-0007

ADR-0007 chép rằng Monaco/VS Code **không phơi text** qua Accessibility, và rút
ra rằng phải dùng OCR. Đo lại bằng duyệt cây tất định (bật `AXManualAccessibility`,
BFS, sâu 39): VS Code phơi **2964 phần tử có text** — 2921 `AXStaticText`, 3
`AXTextArea` — nội dung thật, đầy đủ. Nó còn quảng cáo trọn bộ TextMarker API ở
100%, gồm cả `AXSentenceTextMarkerRangeForTextMarker` và
`AXLeftWordTextMarkerRangeForTextMarker` — đúng ba mức chi tiết cần dùng.

Nhưng **mọi lệnh chuyển toạ độ → marker đều trả `nil`** (`AXTextMarkerForPosition`,
`AXEndTextMarkerForBounds`, `AXRangeForPosition`).

Phát biểu đúng: *Chromium phơi nội dung, nhưng không cho ánh xạ vị trí → ký tự.*
Kết luận thực hành của ADR-0007 (cần OCR) vẫn đúng; lý do thì sai. Khác biệt
này quan trọng — vì text của AX **có** dùng được, nên hướng đi mạnh nhất cho ca
Chromium là **hợp nhất text-của-AX với hình học-của-OCR** (tầng 4), chứ không
phải dùng text của OCR.

## Phương án đã cân nhắc và loại bỏ

- **Lấy trung bình / bỏ phiếu giữa nhiều ước lượng.** Trộn "ký tự 12" (chính
  xác) với "ký tự 47" (đoán) ra 29 — tệ hơn cả hai đầu vào.
- **Giả lập double-click để chọn từ rồi đọc `AXSelectedText`.** Chính xác gần
  tuyệt đối và chạy ở hầu hết app, nhưng **phá trạng thái người dùng**: đổi vùng
  bôi đen, cướp focus, có thể kích hoạt hành vi của app. Không chấp nhận được
  cho một tính năng hover thụ động.
- **Chiếu cột pixel tìm khe trắng giữa các từ.** Rẻ, không cần OCR — nhưng thua
  hộp bao per-character của Vision mà lại thêm một tầng tự chế phải bảo trì.
- **Đo chuột bằng `CGEventTap` thay cho polling.** Cho toạ độ float và timestamp
  chuẩn hơn, nhưng vị trí chuột **chưa bao giờ là khâu yếu** — không cải thiện
  độ chính xác nhận diện chữ. Chỉ xét lại nếu cần tối ưu CPU.

## Hệ quả

- Helper Swift dài thêm ~60 dòng, mỗi lần hover tốn thêm tối đa 2 lệnh gọi AX.
- Tầng trên phải xử lý tường minh hai đường (đã kiểm chứng / phải ước lượng) và
  **ghi log phân biệt được hai đường**, để đo tỉ lệ thật khi dùng thật.
- `pickSegmentAtIndex()` cắt trên text **thô**, không chuẩn hoá trước:
  `normalizeWhitespace()` gộp khoảng trắng nên làm **dịch chuyển** mọi chỉ số ký
  tự, tra cứu theo offset của native sẽ tra nhầm chỗ.

## Kiểm chứng E2E qua binary thật

Hỏi `accessibility-helper` bằng đúng giao thức JSON nó dùng khi chạy thật, tại
các toạ độ lấy tất định từ cây AX (không dùng chuột):

- **VS Code**: 5/7 điểm **đọc được text**, nhưng **cả hai tầng đều từ chối** —
  không tầng nào trả số rác. Đúng nguyên tắc "đúng hoặc im lặng", và khớp với
  phát hiện Chromium không cài phần vị trí → ký tự.
- Không E2E được tầng 2 qua binary vì cửa sổ Notes/Terminal đang **bị VS Code
  che** — `AXUIElementCopyElementAtPosition` luôn trả cửa sổ trên cùng. Tầng 2
  đã kiểm chứng trực tiếp qua AX (6/6) nhưng chưa qua binary end-to-end. Cần
  làm lại khi cửa sổ mục tiêu ở trên cùng.

Bài học lặp lại lần nữa: toạ độ suy ra từ cây AX của một cửa sổ **nền** không
dùng được cho hit-test — cây AX không biết gì về thứ tự chồng cửa sổ.

## Đánh đổi đã chấp nhận

- Tầng 1 chỉ phủ 33–52% ở app AppKit, 0% ở Chromium. Phần Chromium nay do tầng
  4 gánh; phần AppKit còn lại rơi xuống nội suy. Chấp nhận vì "đúng hoặc im
  lặng" tốt hơn "luôn có câu trả lời, 1/4 số lần là sai".
- Tầng 4 gọi OCR nên tốn thêm một lượt chụp màn hình + nhận dạng mỗi lần hover
  (đo được 314ms trên ảnh 500×80 sau khi model đã nạp). Chưa đo xem có lọt ngân
  sách `hoverDelayMs` khi dùng thật hay không — nhưng nó vốn chỉ chạy khi
  Accessibility đã trả `null`, tức không phải đường đi thường xuyên.
- Giữ nguyên nội suy hình học làm tầng chót dù biết nó chỉ 24% với nhiều dòng —
  vì bỏ hẳn sẽ khiến tính năng im lặng ở phần lớn trường hợp. Nhưng nó **không
  còn là đường mặc định**, và đã có log để đo tần suất nó được dùng.

## Xem lại khi

- Có số liệu log từ dùng thật về tỉ lệ "đã kiểm chứng / ước lượng" — nếu tỉ lệ
  ước lượng cao, ưu tiên xây tầng 2 và 4 ngay.
- Xây tầng 4 (hợp nhất text-AX × hình học-OCR) — cần đo chi phí độ trễ của việc
  gọi OCR mỗi lần hover, và độ tin cậy của phép khớp chuỗi mờ giữa text OCR và
  text AX trên nội dung lặp lại (bảng số).
- Làm nhánh Windows (Phase 4) — UI Automation có `TextPatternRange` với
  `RangeFromPoint()`, về nguyên tắc là API đúng; **phải đo trước khi tin**, đúng
  bài học của ADR này.
- Chromium sửa phần position → marker của macOS AX. Khi đó ca VS Code chuyển từ
  tầng 4 về tầng 1.
