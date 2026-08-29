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
        let text = textOf(leafElement) ?? textOf(root)
        _ = activationOk // đã dùng để quyết định có hit-test lại hay không, không cần trả ra ngoài

        var fields: [String: Any] = ["app": appName, "pid": Int(pid)]
        if let t = text {
            fields["text"] = t
            if let f = frameOf(leafElement) {
                fields["bounds"] = ["x": f.origin.x, "y": f.origin.y, "width": f.width, "height": f.height]
            }
        } else {
            fields["text"] = NSNull()
        }
        writeResponse(req.id, fields)

    default:
        writeResponse(req.id, ["error": "unknown_cmd"])
    }
}
