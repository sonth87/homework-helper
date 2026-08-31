import Cocoa
import ApplicationServices

// Helper Accessibility cho macOS — tiến trình SỐNG LÂU DÀI, giao tiếp qua
// JSON theo dòng trên stdin/stdout.
//
// VÌ SAO LÀ MỘT BINARY RIÊNG, KHÔNG PHẢI NATIVE NODE ADDON
// -----------------------------------------------------------
// Phase 1 đã va vào rủi ro native module thật với better-sqlite3: node-gyp
// dùng distutils (bị xoá khỏi Python 3.12), và bản mới hơn đòi Node >=22 trong
// khi Electron 33 chỉ có Node 20.18 — nạp vào là crash im lặng vì lệch ABI.
// AXUIElement chỉ gọi được từ code Objective-C/Swift, nên "viết native addon
// bằng N-API gọi AppKit" sẽ lặp lại đúng rủi ro đó, cộng thêm việc phải
// electron-rebuild mỗi lần đổi phiên bản Electron. Một binary Swift độc lập,
// giao tiếp qua stdio, tránh hoàn toàn lớp rủi ro đó.
//
// ĐÃ KIỂM CHỨNG THỰC NGHIỆM (2026-08-30, xem dev/decisions/):
//   - Hệ toạ độ Quartz (AX dùng) KHỚP TUYỆT ĐỐI với screen.getCursorScreenPoint()
//     / BrowserWindow.getBounds() của Electron trên macOS — không cần quy đổi.
//   - Chrome/Electron (Chromium nói chung) không dựng cây accessibility đầy đủ
//     cho tới khi có AT client kích hoạt qua thuộc tính riêng "AXManualAccessibility".
//     Việc kích hoạt là BẤT ĐỒNG BỘ — phải đợi rồi HIT-TEST LẠI TỪ ĐẦU, không
//     thể tiếp tục đào trên tham chiếu element đã lấy trước khi kích hoạt.

// ── JSON I/O ──────────────────────────────────────────────────────────────

struct Request: Decodable {
    let id: Int
    let cmd: String
    let x: Double?
    let y: Double?
}

func writeResponse(_ id: Int, _ fields: [String: Any]) {
    var obj: [String: Any] = ["id": id]
    for (k, v) in fields { obj[k] = v }
    guard let data = try? JSONSerialization.data(withJSONObject: obj) else { return }
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write("\n".data(using: .utf8)!)
}

// ── AX helpers ───────────────────────────────────────────────────────────

func stringAttr(_ el: AXUIElement, _ name: String) -> String? {
    var value: CFTypeRef?
    guard AXUIElementCopyAttributeValue(el, name as CFString, &value) == .success else { return nil }
    return value as? String
}

func frameOf(_ el: AXUIElement) -> CGRect? {
    var posRef: CFTypeRef?
    var sizeRef: CFTypeRef?
    guard AXUIElementCopyAttributeValue(el, kAXPositionAttribute as CFString, &posRef) == .success,
          AXUIElementCopyAttributeValue(el, kAXSizeAttribute as CFString, &sizeRef) == .success else { return nil }
    var origin = CGPoint.zero
    var size = CGSize.zero
    guard AXValueGetValue(posRef as! AXValue, .cgPoint, &origin),
          AXValueGetValue(sizeRef as! AXValue, .cgSize, &size) else { return nil }
    return CGRect(origin: origin, size: size)
}

func children(_ el: AXUIElement) -> [AXUIElement] {
    var value: CFTypeRef?
    guard AXUIElementCopyAttributeValue(el, kAXChildrenAttribute as CFString, &value) == .success,
          let arr = value as? [AXUIElement] else { return [] }
    return arr
}

/// Node có text thật, xếp theo độ ưu tiên: Value trước (text field/editor),
/// rồi SelectedText, rồi Description.
func textOf(_ el: AXUIElement) -> String? {
    if let v = stringAttr(el, kAXValueAttribute as String), !v.isEmpty { return v }
    if let s = stringAttr(el, kAXSelectedTextAttribute as String), !s.isEmpty { return s }
    if let d = stringAttr(el, kAXDescriptionAttribute as String), !d.isEmpty { return d }
    return nil
}

/// Đào từ root xuống lá theo điểm.
///
/// CHỈ đi vào con khi hình học rõ ràng: hoặc một con có frame chứa điểm, hoặc
/// node hiện tại có ĐÚNG MỘT con (wrapper đơn giản, phổ biến trong cây AX của
/// Chromium — một <div> bọc chỉ để nhóm). KHÔNG đoán bừa khi có nhiều con mà
/// không con nào khớp — đã kiểm chứng: làm vậy trả về element hoàn toàn sai vị
/// trí (ví dụ vùng Dock, đào vào "con đầu tiên" ra icon cách xa điểm thật hàng
/// trăm pixel). Thà trả "không có text" còn hơn trả text sai.
func drillDown(from el: AXUIElement, point: CGPoint, depth: Int, maxDepth: Int) -> AXUIElement {
    if depth >= maxDepth { return el }
    let kids = children(el)

    for child in kids {
        if let frame = frameOf(child), frame.contains(point) {
            return drillDown(from: child, point: point, depth: depth + 1, maxDepth: maxDepth)
        }
    }
    if kids.count == 1 {
        return drillDown(from: kids[0], point: point, depth: depth + 1, maxDepth: maxDepth)
    }
    return el
}

// ── Offset ký tự chính xác, CÓ TỰ KIỂM ──────────────────────────────────
//
// ĐO THỰC NGHIỆM 2026-08-31 (xem ADR-0008): kAXRangeForPositionParameterized
// KHÔNG đáng tin. Cùng một lệnh gọi, trên các app khác nhau:
//   Finder   — đúng ở giữa dòng, trả 0 khi hover cuối dòng (SAI, không phải nil)
//   Notes    — trả CÙNG một offset cho mọi vị trí X (bỏ qua trục X)
//   Terminal — đúng một phần
//   System Settings, VS Code — nil, dù QUẢNG CÁO là có hỗ trợ
//
// Nên không bao giờ tin thẳng kết quả. Mỗi offset phải tự chứng minh bằng một
// lượt KHỨ HỒI: offset -> AXBoundsForRange -> khung chữ đó có thật sự chứa con
// trỏ không. Chiều ngược (range -> bounds) đáng tin hơn hẳn chiều thuận vì app
// BUỘC phải cài đúng nó để tự vẽ vùng bôi đen của chính mình.
//
// Kết quả: hoặc một offset đã kiểm chứng, hoặc nil sạch sẽ. Không có đường thứ
// ba là "một con số trông hợp lệ nhưng sai" — đó chính là thứ nguy hiểm nhất,
// vì tầng trên không thể phân biệt được.

/// Một ký tự đơn không thể rộng/cao hơn ngần này. Chặn trường hợp app trả về
/// khung của CẢ phần tử (đã gặp: 590×64, 1033×1924) — khung đó dĩ nhiên "chứa"
/// con trỏ nên sẽ lọt qua phép kiểm nếu không giới hạn kích thước.
let maxGlyphSize: CGFloat = 150

func verifiedOffset(_ el: AXUIElement, at point: CGPoint, textLength: Int) -> Int? {
    guard textLength > 0 else { return nil }

    var pt = point
    guard let posValue = AXValueCreate(.cgPoint, &pt) else { return nil }
    var rangeRef: CFTypeRef?
    guard AXUIElementCopyParameterizedAttributeValue(
            el, "AXRangeForPosition" as CFString, posValue, &rangeRef) == .success,
          let rangeVal = rangeRef else { return nil }

    var range = CFRange()
    guard AXValueGetValue(rangeVal as! AXValue, .cfRange, &range) else { return nil }
    let offset = range.location
    guard offset >= 0, offset < textLength else { return nil }

    // KHỨ HỒI: lấy khung của đúng ký tự đó rồi kiểm tra nó bao con trỏ.
    var charRange = CFRange(location: offset, length: 1)
    guard let rangeValue = AXValueCreate(.cfRange, &charRange) else { return nil }
    var boundsRef: CFTypeRef?
    guard AXUIElementCopyParameterizedAttributeValue(
            el, "AXBoundsForRange" as CFString, rangeValue, &boundsRef) == .success,
          let boundsVal = boundsRef else { return nil }

    var glyph = CGRect.zero
    guard AXValueGetValue(boundsVal as! AXValue, .cgRect, &glyph) else { return nil }
    guard !glyph.isEmpty, glyph.width <= maxGlyphSize, glyph.height <= maxGlyphSize else { return nil }

    // Dung sai nhỏ cho sai số làm tròn giữa hệ toạ độ và vị trí hotspot con trỏ.
    return glyph.insetBy(dx: -3, dy: -3).contains(point) ? offset : nil
}

/// Đoạn ký tự ĐANG HIỂN THỊ của một view có cuộn. Giải bài toán: bounds là
/// khung nhìn nhưng text là CẢ tài liệu — không có thông tin này thì không thể
/// biết phần nào đang nằm trong tầm mắt người dùng. Đo được: Notes hiển thị
/// 261/2377 ký tự, Terminal 2347/29064.
func visibleRange(_ el: AXUIElement) -> (Int, Int)? {
    var ref: CFTypeRef?
    guard AXUIElementCopyAttributeValue(el, "AXVisibleCharacterRange" as CFString, &ref) == .success,
          let val = ref else { return nil }
    var r = CFRange()
    guard AXValueGetValue(val as! AXValue, .cfRange, &r), r.length > 0 else { return nil }
    return (r.location, r.length)
}

func boundsForRange(_ el: AXUIElement, _ range: CFRange) -> CGRect? {
    var r = range
    guard let arg = AXValueCreate(.cfRange, &r) else { return nil }
    var out: CFTypeRef?
    guard AXUIElementCopyParameterizedAttributeValue(
            el, "AXBoundsForRange" as CFString, arg, &out) == .success, let v = out else { return nil }
    var g = CGRect.zero
    guard AXValueGetValue(v as! AXValue, .cgRect, &g) else { return nil }
    return g
}

/// Tham số dòng/chỉ số của các thuộc tính này là CFNumber, KHÔNG phải AXValue —
/// `AXValueType` không có thành viên tương ứng, dựng bằng AXValueCreate sẽ không
/// biên dịch được.
func rangeForLine(_ el: AXUIElement, _ line: Int) -> CFRange? {
    var out: CFTypeRef?
    guard AXUIElementCopyParameterizedAttributeValue(
            el, "AXRangeForLine" as CFString, line as CFNumber, &out) == .success, let v = out else { return nil }
    var r = CFRange()
    guard AXValueGetValue(v as! AXValue, .cfRange, &r) else { return nil }
    return r
}

func lineForIndex(_ el: AXUIElement, _ index: Int) -> Int? {
    var out: CFTypeRef?
    guard AXUIElementCopyParameterizedAttributeValue(
            el, "AXLineForIndex" as CFString, index as CFNumber, &out) == .success else { return nil }
    return (out as? NSNumber)?.intValue
}

/// TẦNG 2 — phân rã theo DÒNG rồi nhị phân, khi tầng 1 (AXRangeForPosition) từ
/// chối. Không nội suy ở bất kỳ bước nào.
///
/// Hai lần nhị phân:
///   1. Trên SỐ DÒNG — hợp lệ vì Y của khung dòng tăng đơn điệu theo số dòng.
///      Phạm vi giới hạn trong các dòng ĐANG HIỂN THỊ (AXVisibleCharacterRange),
///      nên không phụ thuộc tài liệu dài bao nhiêu.
///   2. Trong dòng đã tìm được, theo trục X, để ra đúng ký tự.
///
/// ĐO THỰC NGHIỆM 2026-08-31: 6/6 lần ra đúng dòng trên Notes và Terminal, tốn
/// 11–21 lệnh gọi AX và 1,1–1,5ms — không đáng kể so với ngân sách hoverDelayMs.
func offsetViaLines(_ el: AXUIElement, at point: CGPoint, textLength: Int) -> Int? {
    guard let (visStart, visLength) = visibleRange(el),
          let firstLine = lineForIndex(el, visStart),
          let lastLine = lineForIndex(el, min(textLength - 1, visStart + visLength - 1)),
          lastLine >= firstLine else { return nil }

    var lo = firstLine, hi = lastLine
    var hitLine: CFRange? = nil
    while lo <= hi {
        let mid = (lo + hi) / 2
        guard let lineRange = rangeForLine(el, mid),
              let box = boundsForRange(el, lineRange) else { return nil }
        if point.y < box.minY { hi = mid - 1 }
        else if point.y > box.maxY { lo = mid + 1 }
        else { hitLine = lineRange; break }
    }
    guard let line = hitLine, line.length > 0, line.location >= 0 else { return nil }

    var a = line.location
    var b = line.location + line.length - 1
    while a < b {
        let mid = (a + b) / 2
        guard let g = boundsForRange(el, CFRange(location: mid, length: 1)) else { break }
        if point.x < g.minX { b = mid - 1 }
        else if point.x > g.maxX { a = mid + 1 }
        else { return mid }
    }
    let candidate = max(line.location, min(a, line.location + line.length - 1))
    return candidate < textLength ? candidate : nil
}

/// Chromium/Electron không dựng cây accessibility đầy đủ tới khi có AT client
/// kích hoạt. "AXManualAccessibility" ép bật full tree không cần VoiceOver —
/// đã kiểm chứng thực nghiệm, không có trong tài liệu Apple chính thức.
///
/// Việc dựng tree là BẤT ĐỒNG BỘ phía Chromium. Trả về true nếu đã sẵn sàng
/// (hoặc app không cần kích hoạt), false nếu hết thời gian chờ.
var activatedPids = Set<pid_t>()

func ensureActivated(_ pid: pid_t) -> Bool {
    if activatedPids.contains(pid) { return true }

    let appElement = AXUIElementCreateApplication(pid)
    _ = AXUIElementSetAttributeValue(appElement, "AXManualAccessibility" as CFString, kCFBooleanTrue)

    // Poll thay vì đợi cố định — cửa sổ lớn có thể mất tới vài giây, cửa sổ
    // nhỏ gần như tức thì. Giới hạn 2s để không treo một lần hover quá lâu.
    for _ in 0..<10 {
        if !children(appElement).isEmpty {
            activatedPids.insert(pid)
            return true
        }
        Thread.sleep(forTimeInterval: 0.2)
    }
    // Hết thời gian chờ: KHÔNG đánh dấu đã activate — lần hover sau vẫn thử
    // lại, phòng trường hợp app chỉ đơn giản chưa có children thật (cửa sổ rỗng).
    return false
}

// ── Vòng lặp chính ───────────────────────────────────────────────────────

writeResponse(0, ["ready": true, "trusted": AXIsProcessTrusted()])

while let line = readLine(strippingNewline: true) {
    guard let data = line.data(using: .utf8),
          let req = try? JSONDecoder().decode(Request.self, from: data) else { continue }

    switch req.cmd {
    case "trusted":
        writeResponse(req.id, ["trusted": AXIsProcessTrusted()])

    case "queryPoint":
        guard let x = req.x, let y = req.y else {
            writeResponse(req.id, ["error": "missing x/y"]); continue
        }
        guard AXIsProcessTrusted() else {
            writeResponse(req.id, ["error": "not_trusted"]); continue
        }

        let point = CGPoint(x: x, y: y)
        let systemWide = AXUIElementCreateSystemWide()

        var elementRef: AXUIElement?
        _ = AXUIElementCopyElementAtPosition(systemWide, Float(x), Float(y), &elementRef)
        guard var root = elementRef else {
            writeResponse(req.id, ["text": NSNull()]); continue
        }

        var pid: pid_t = 0
        AXUIElementGetPid(root, &pid)
        let appName = NSRunningApplication(processIdentifier: pid)?.localizedName ?? ""

        // Lần đầu gặp app Chromium chưa kích hoạt: activate, ĐỢI, rồi HIT-TEST
        // LẠI TỪ ĐẦU — root cũ được lấy TRƯỚC khi activate nên không phản ánh
        // tree đã dựng đầy đủ, dù có đào xuống cũng chỉ thấy cây rỗng cũ.
        var activationOk: Bool? = nil
        if !activatedPids.contains(pid) {
            activationOk = ensureActivated(pid)
            if activationOk == true {
                var refreshed: AXUIElement?
                _ = AXUIElementCopyElementAtPosition(systemWide, Float(x), Float(y), &refreshed)
                if let r = refreshed { root = r }
            }
        }

        let leafElement = drillDown(from: root, point: point, depth: 0, maxDepth: 25)
        _ = activationOk // đã dùng để quyết định có hit-test lại hay không, không cần trả ra ngoài

        // BUG THẬT đã gặp: `text` từng lấy từ `textOf(leafElement) ?? textOf(root)`
        // nhưng mọi lệnh gọi offset SAU ĐÓ (verifiedOffset/offsetViaLines/
        // visibleRange/frameOf) vẫn luôn thao tác trên `leafElement` — nếu
        // leafElement KHÔNG có text riêng (rơi vào nhánh `?? textOf(root)`),
        // các lệnh đó hỏi nhầm element không hề giữ chuỗi đó, chắc chắn trả
        // nil hết. Quan sát được thật trên Notes: drillDown() tới đúng vùng
        // soạn thảo nhưng leaf không mang text riêng, root mới có — kết quả
        // "text": 2377 ký tự đúng (nhờ fallback) nhưng charOffset LUÔN vắng
        // mặt dù verifiedOffset/offsetViaLines đã kiểm chứng hoạt động đúng
        // khi gọi trực tiếp trên root. Từ nay: element nào THỰC SỰ cho text,
        // mọi lệnh gọi offset đi theo đúng element đó.
        let textElement: AXUIElement
        let text: String?
        if let t = textOf(leafElement) {
            textElement = leafElement
            text = t
        } else {
            textElement = root
            text = textOf(root)
        }

        var fields: [String: Any] = ["app": appName, "pid": Int(pid)]
        if let t = text {
            fields["text"] = t
            if let f = frameOf(textElement) {
                fields["bounds"] = ["x": f.origin.x, "y": f.origin.y, "width": f.width, "height": f.height]
            }
            // Hai tầng, thử theo thứ tự rẻ trước. Cả hai đều CHỨNG MINH kết quả
            // bằng hình học thật, không tầng nào nội suy. Vắng cả hai = tầng
            // trên phải tự ước lượng, và biết rõ là mình đang ước lượng.
            //
            // `offsetSource` để đo được tầng nào thực sự gánh việc khi dùng thật
            // — chính là dữ liệu mà ADR-0008 nói cần có trước khi xây tiếp.
            if let off = verifiedOffset(textElement, at: point, textLength: t.count) {
                fields["charOffset"] = off
                fields["offsetSource"] = "position"
            } else if let off = offsetViaLines(textElement, at: point, textLength: t.count) {
                fields["charOffset"] = off
                fields["offsetSource"] = "lines"
            }
            if let (loc, len) = visibleRange(textElement) {
                fields["visibleStart"] = loc
                fields["visibleLength"] = len
            }
        } else {
            fields["text"] = NSNull()
        }
        writeResponse(req.id, fields)

    default:
        writeResponse(req.id, ["error": "unknown_cmd"])
    }
}
