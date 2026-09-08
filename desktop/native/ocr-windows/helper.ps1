# Helper OCR cho Windows — tương đương native/ocr-macos/main.swift (dùng Vision
# framework) nhưng gọi Windows.Media.Ocr (WinRT, có sẵn từ Windows 10, không cần
# cài thêm gì) qua PowerShell thay vì biên dịch native — cùng lý do như
# accessibility-windows/helper.ps1 (không có toolchain Windows trên máy phát triển).
#
# ⚠️ CHƯA ĐO THỰC NGHIỆM TRÊN MÁY WINDOWS THẬT. Rủi ro lớn nhất đã biết trước:
# WinRT API trả về IAsyncOperation<T>, PowerShell không có cú pháp await/async
# native — cách bắc cầu chuẩn cộng đồng dùng (hàm Await() dưới đây, gọi
# WindowsRuntimeSystemExtensions.AsTask() qua reflection vì PowerShell không gọi
# được generic extension method trực tiếp) là kỹ thuật đã được nhiều người viết
# lại trong các script PowerShell OCR công khai, nhưng CHƯA được kiểm chứng cụ
# thể trong repo này. Nếu Await() không chạy đúng trên máy Windows thật, đây là
# điểm đầu tiên cần soi.
#
# Giao thức: JSON theo dòng trên stdin/stdout, giống hệt ocr-macos.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Runtime.WindowsRuntime

# Nạp các kiểu WinRT cần dùng — cú pháp [Type,Assembly,ContentType=WindowsRuntime]
# là cách PowerShell chiếu (project) một kiểu WinRT vào .NET, khác Add-Type
# thường dùng cho DLL .NET Framework thuần (xem accessibility-windows/helper.ps1).
[Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.DataWriter, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null

# Bắc cầu IAsyncOperation<T> (WinRT) → chờ được từ PowerShell (không có await).
# $ResultType phải khớp CHÍNH XÁC kiểu generic thật của tác vụ, không phải kiểu
# mong muốn suy diễn — sai kiểu ở đây ném lỗi reflection khó hiểu, không phải
# lỗi nghiệp vụ.
function Await($WinRtTask, [Type]$ResultType) {
    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    })[0].MakeGenericMethod($ResultType)

    $netTask = $asTaskGeneric.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

function Recognize-Image([byte[]]$bytes) {
    $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
    $writer = New-Object Windows.Storage.Streams.DataWriter($stream)
    $writer.WriteBytes($bytes)
    Await ($writer.StoreAsync()) ([uint32]) | Out-Null
    $writer.DetachStream() | Out-Null
    $stream.Seek(0)

    $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

    # Ngôn ngữ OCR lấy theo hồ sơ người dùng Windows — người dùng phải cài gói
    # ngôn ngữ tương ứng (Settings > Time & Language > Language). Không có gói
    # nào cài thì TryCreateFromUserProfileLanguages() trả null — xử lý như lỗi
    # rõ ràng thay vì âm thầm trả rỗng, để acquire.ts phân biệt được "không có
    # chữ ở đó" (kết quả rỗng hợp lệ) với "OCR hỏng hẳn" (throw).
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        throw "Không tạo được OcrEngine — máy chưa cài gói ngôn ngữ OCR nào (Settings > Time & Language > Language)."
    }

    return Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
}

function Write-Response($obj) {
    $json = ConvertTo-Json $obj -Compress -Depth 8
    [Console]::Out.WriteLine($json)
    [Console]::Out.Flush()
}

Write-Response @{ ready = $true }

while ($null -ne ($line = [Console]::In.ReadLine())) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    try { $req = ConvertFrom-Json $line } catch { continue }
    $id = $req.id
    $response = [ordered]@{ id = $id }

    try {
        if ($req.cmd -eq 'recognize') {
            $bytes = [System.Convert]::FromBase64String($req.imageBase64)
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            $result = Recognize-Image $bytes
            $sw.Stop()

            $blocks = @()
            foreach ($ln in $result.Lines) {
                $lineText = $ln.Text
                $words = @()
                $searchFrom = 0
                foreach ($w in $ln.Words) {
                    $wt = $w.Text
                    $start = $lineText.IndexOf($wt, $searchFrom)
                    if ($start -lt 0) { $start = $searchFrom }
                    $end = $start + $wt.Length
                    $searchFrom = $end
                    $words += [ordered]@{
                        text = $wt; startOffset = $start; endOffset = $end
                        x = $w.BoundingRect.X; y = $w.BoundingRect.Y
                        width = $w.BoundingRect.Width; height = $w.BoundingRect.Height
                    }
                }

                $minX = ($ln.Words | ForEach-Object { $_.BoundingRect.X } | Measure-Object -Minimum).Minimum
                $minY = ($ln.Words | ForEach-Object { $_.BoundingRect.Y } | Measure-Object -Minimum).Minimum
                $maxX = ($ln.Words | ForEach-Object { $_.BoundingRect.X + $_.BoundingRect.Width } | Measure-Object -Maximum).Maximum
                $maxY = ($ln.Words | ForEach-Object { $_.BoundingRect.Y + $_.BoundingRect.Height } | Measure-Object -Maximum).Maximum

                $blocks += [ordered]@{
                    text = $lineText
                    # Windows.Media.Ocr không trả điểm tin cậy theo dòng/từ — khác
                    # Vision của macOS. Gán 1.0 (mức tối đa hệ thống chấp nhận):
                    # acquire.ts chỉ dùng confidence để LỌC BỚT kết quả kém tin cậy
                    # (bestConfidence < minConfidence), không có nghĩa "đã đo thật" —
                    # gán 1.0 nghĩa là tầng lọc đó vô hiệu với nhánh Windows, không
                    # phải nói dối về độ chính xác nhận diện.
                    confidence = 1.0
                    x = $minX; y = $minY; width = ($maxX - $minX); height = ($maxY - $minY)
                    words = $words
                }
            }

            $response.text = $result.Text
            $response.blocks = $blocks
            $response.durationMs = $sw.ElapsedMilliseconds
        }
        else {
            $response.error = "Lệnh không rõ: $($req.cmd)"
        }
    }
    catch {
        $response.error = $_.Exception.Message
    }

    Write-Response $response
}
