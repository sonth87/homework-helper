import Cocoa
import Vision

// Helper OCR cho macOS — Vision framework, cùng kiến trúc subprocess độc lập
// với native/accessibility-macos/ (xem ADR-0006 cho lý do không viết native
// Node addon). Vision, giống AXUIElement, chỉ gọi được từ Objective-C/Swift.
//
// Tách BINARY riêng khỏi accessibility-helper dù cùng mẫu JSON-stdio: hai mối
// quan tâm khác nhau (đọc cây UI vs. đọc pixel), và OCR không cần trạng thái
// "activatedPids" mà Accessibility cần — gộp chung sẽ trộn hai vòng đời khác
// bản chất vào một file.
//
// ĐÃ ĐO THỰC NGHIỆM (2026-08-30): request OCR ĐẦU TIÊN trong một tiến trình
// mất ~20-27 GIÂY (Vision nạp model nhận diện chữ lần đầu) — vượt xa ngân sách
// hoverDelayMs. Request thứ 2 trở đi chỉ 15-25ms, dư sức đáp ứng. Đây CHÍNH XÁC
// là lý do tiến trình phải SỐNG LÂU DÀI (giống accessibility-helper, xem
// ADR-0006) thay vì spawn mới mỗi lần: chi phí nạp model chỉ trả một lần mỗi
// phiên làm việc, không phải mỗi lần hover.

// ── JSON I/O ──────────────────────────────────────────────────────────────

struct Request: Decodable {
    let id: Int
    let cmd: String
    /// Base64 PNG, KHÔNG kèm tiền tố data URL — khớp quy ước `cropToBase64()`
    /// đã dùng ở Phase 2 (screen-capture.ts).
    let imageBase64: String?
}

func writeResponse(_ id: Int, _ fields: [String: Any]) {
    var obj: [String: Any] = ["id": id]
    for (k, v) in fields { obj[k] = v }
    guard let data = try? JSONSerialization.data(withJSONObject: obj) else { return }
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write("\n".data(using: .utf8)!)
}

// ── OCR ──────────────────────────────────────────────────────────────────

struct RecognizedBlock {
    let text: String
    let confidence: Float
    /// Toạ độ ẢNH (pixel, gốc trên-trái) — ĐÃ quy đổi từ hệ Vision, xem ghi
    /// chú ở decodeAndRecognize().
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

enum OcrError: Error { case decodeFailed, requestFailed(String) }

func decodeAndRecognize(base64: String) throws -> (blocks: [RecognizedBlock], imageWidth: Int, imageHeight: Int) {
    guard let data = Data(base64Encoded: base64),
          let source = CGImageSourceCreateWithData(data as CFData, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw OcrError.decodeFailed
    }

    let imageWidth = cgImage.width
    let imageHeight = cgImage.height

    var blocks: [RecognizedBlock] = []
    var thrown: Error?

    let request = VNRecognizeTextRequest { req, error in
        if let error = error { thrown = error; return }
        guard let observations = req.results as? [VNRecognizedTextObservation] else { return }

        for obs in observations {
            guard let candidate = obs.topCandidates(1).first else { continue }
            let box = obs.boundingBox

            // GHI CHÚ QUAN TRỌNG — khác AXManualAccessibility ở chỗ đây là hành
            // vi CÓ tài liệu chính thức của Apple, chỉ là rất dễ quên: Vision
            // trả boundingBox CHUẨN HOÁ (0..1) với GỐC DƯỚI-TRÁI (quy ước
            // Quartz/Core Image), khác với gốc TRÊN-TRÁI mà phần còn lại của
            // codebase dùng cho Rect<'image'> (khớp NativeImage.crop() ở
            // screen-capture.ts). Không quy đổi Y sẽ làm mọi bounding box của
            // OCR bị lật ngược theo chiều dọc — tên thấy "đúng" nếu ảnh có
            // đúng một dòng ở giữa, nhưng sai hẳn với ảnh nhiều dòng.
            let x = box.origin.x * Double(imageWidth)
            let y = (1 - box.origin.y - box.height) * Double(imageHeight)
            let width = box.width * Double(imageWidth)
            let height = box.height * Double(imageHeight)

            blocks.append(RecognizedBlock(
                text: candidate.string, confidence: candidate.confidence,
                x: x, y: y, width: width, height: height
            ))
        }
    }

    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    if let thrown = thrown { throw OcrError.requestFailed(thrown.localizedDescription) }
    return (blocks, imageWidth, imageHeight)
}

// ── Vòng lặp chính ───────────────────────────────────────────────────────

writeResponse(0, ["ready": true])

while let line = readLine(strippingNewline: true) {
    guard let data = line.data(using: .utf8),
          let req = try? JSONDecoder().decode(Request.self, from: data) else { continue }

    switch req.cmd {
    case "recognize":
        guard let base64 = req.imageBase64 else {
            writeResponse(req.id, ["error": "missing imageBase64"]); continue
        }

        let started = Date()
        do {
            let (blocks, width, height) = try decodeAndRecognize(base64: base64)
            let durationMs = Int(Date().timeIntervalSince(started) * 1000)

            let blocksJson = blocks.map { b -> [String: Any] in
                [
                    "text": b.text, "confidence": b.confidence,
                    "x": b.x, "y": b.y, "width": b.width, "height": b.height,
                ]
            }
            let fullText = blocks.map { $0.text }.joined(separator: "\n")

            writeResponse(req.id, [
                "text": fullText, "blocks": blocksJson,
                "durationMs": durationMs, "imageWidth": width, "imageHeight": height,
            ])
        } catch {
            writeResponse(req.id, ["error": "\(error)"])
        }

    default:
        writeResponse(req.id, ["error": "unknown_cmd"])
    }
}
