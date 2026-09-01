# ADR-0011: OCR chụp dải ngang trọn bề rộng, không phải ô vuông quanh con trỏ

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-09-01

## Bối cảnh

Từ Phase 3, `tryOcr()` chụp một ô **500×80 lấy con trỏ làm tâm** rồi OCR. Lý do
ban đầu hợp lý: vùng nhỏ thì OCR nhanh, đủ bắt một dòng chữ.

Người dùng nêu đúng vấn đề mà mọi checklist đều bỏ lọt:

> trỏ vào text A lại dịch text B, hay trỏ vào câu C thì lại dịch 1 đoạn trong
> câu B C D theo ô vuông quanh con chuột. như vậy là cực kỳ tệ, và như thế thà
> không làm còn hơn.

## Hai phát hiện thực nghiệm

### 1. Vision trả về RỖNG khi chữ tràn cả hai mép ảnh

Cắt cùng một đoạn văn thành nhiều ô khác nhau rồi đo (tất định, lặp lại 3 lần
cho cùng kết quả):

| Ô cắt | Mép trái | Mép phải | Khối đọc được |
|---|---|---|---|
| 500×80 tại x=180 | cắt giữa chữ | cắt giữa chữ | **0** |
| 500×80 tại x=0 | còn lề 40px | cắt giữa chữ | 2 |
| 900×80 tại x=180 | cắt giữa chữ | cắt giữa chữ | **0** |
| 1400×80 (trọn dòng) | còn lề | còn lề | 2 |
| 500×160 tại x=180 | cắt giữa chữ | cắt giữa chữ | **0** |
| 500×80 tại x=300 | cắt giữa chữ | **còn lề phải** | 2 |

Yếu tố quyết định **không phải kích thước ô** mà là: dòng chữ có tràn ra **cả
hai** mép hay không. Còn khoảng trắng ở ít nhất một bên thì Vision đọc được;
tràn cả hai bên thì trả về rỗng, không lỗi, không cảnh báo.

Ô vuông quanh con trỏ rơi đúng vào trạng thái này mỗi khi hover giữa một đoạn
văn dày — tức **đúng tình huống OCR fallback sinh ra để phục vụ** (PDF, editor
ảo hoá cao). Hover im lặng không ra gì, và không có gì trong log nói vì sao.

### 2. Chụp rộng lại NHANH HƠN

| Vùng chụp | Khối | Thời gian |
|---|---|---|
| 500×80 (cách cũ, cắt cụt) | 2 | 169ms |
| 2560×120 | 4 | **79ms** |
| 2560×200 | 6 | **90ms** |

Rộng gấp 6–13 lần diện tích nhưng nhanh hơn gấp đôi — Vision không phải vật lộn
với chữ gãy ở rìa. Giả định "vùng nhỏ = nhanh" của thiết kế cũ là **sai**.

### 3. Kể cả khi đọc được, câu vẫn là mảnh vụn

Cùng một đoạn văn, cùng một vị trí con trỏ, chạy qua trọn pipeline thật:

```
CÁCH CŨ:  "Engineers now train models instead of writing rule by hand."
CÁCH MỚI: "Engineers now train models instead of writing every rule by hand."
```

Câu cũ **thiếu chữ "every"** (bị ô vuông cắt mất) nhưng vẫn đọc xuôi tai. Người
dùng nhận bản dịch của một câu sai mà **không có cách nào biết**. Đây chính là
thứ nguy hiểm hơn cả việc không dịch gì.

## Quyết định

**Chụp một DẢI NGANG trọn bề rộng màn hình, cao 240px, ghim trong màn hình,
thay cho ô 500×80 quanh con trỏ.**

240px ≈ 6–12 dòng văn bản thường — đủ để câu chứa con trỏ (thường trải 1–3
dòng) nằm trọn trong ảnh.

## Ba hệ quả phải xử lý kèm

Dải rộng giải quyết vấn đề gốc nhưng đẻ ra ba vấn đề mới, đều đã xử lý:

1. **Lẫn cột khác.** Dải ngang cắt qua sidebar, minimap, cửa sổ bên cạnh cùng độ
   cao. Ghép hết vào một chuỗi rồi cắt câu sẽ sinh câu lai giữa nội dung không
   liên quan. → `sameColumnAs()` giữ lại các khối có hình chiếu ngang chồng lên
   khối trúng ít nhất 30%; sidebar nằm ở dải x khác nên bị loại.

2. **Ghép dòng bằng `\n` chặt vụn câu.** `Intl.Segmenter` coi xuống dòng là
   ranh giới câu, nên câu trải hai dòng — chuyện thường trong mọi đoạn văn — bị
   chặt làm đôi. Xuống dòng trong đoạn văn là ngắt **thị giác**, không phải ngắt
   ngữ nghĩa. → nối bằng **khoảng trắng**; chỉ dùng `\n\n` khi khoảng cách dọc
   giữa hai khối vượt 1,6 lần chiều cao dòng (ngắt đoạn thật).

3. **Neo overlay sai chỗ.** `hitBounds` từng là khung cả dòng; với dải rộng, một
   dòng có thể rộng gần hết màn hình, đẩy thẻ dịch ra xa hẳn chỗ đang trỏ. →
   neo vào khung của **đúng từ** dưới con trỏ (đã có sẵn từ ADR-0008 tầng 4).

## Đánh đổi đã chấp nhận

- Chụp toàn màn hình rồi crop dải: vẫn là một lần `captureDisplay()` như trước,
  chi phí không đổi; chỉ vùng crop rộng hơn. OCR lại nhanh hơn, nên tổng thể
  không xấu đi.
- Ngưỡng chồng lấn 30% và hệ số 1,6 là số kinh nghiệm, chưa tối ưu bằng dữ liệu
  thật. Sai lệch chỉ ảnh hưởng mức "lấy dư/thiếu một dòng", không sai câu.
- Bố cục nhiều cột hẹp cạnh nhau (báo in số hoá) có thể vẫn lẫn nếu hai cột
  chồng x đáng kể. Chưa gặp, chưa tối ưu.

## Xem lại khi

- Có phản hồi thật về ca bố cục nhiều cột — cân nhắc dùng thêm khoảng cách dọc
  và độ thẳng hàng mép trái để tách cột chặt hơn.
- Làm nhánh Windows OCR (Phase 4) — **phải đo lại** hành vi tràn mép của Windows
  OCR API, không suy diễn từ Vision.
