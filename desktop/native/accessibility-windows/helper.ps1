# Helper Accessibility cho Windows — tương đương native/accessibility-macos/main.swift
# nhưng viết bằng PowerShell (có sẵn trên mọi máy Windows 10/11, System.Windows.Automation
# là một phần của .NET Framework đi kèm hệ điều hành) thay vì Swift biên dịch sẵn — vì
# máy phát triển app này là macOS, không có toolchain Windows để build/ký một binary
# native thật. Xem dev/decisions/0006-accessibility-helper-swift-subprocess.md (macOS)
# cho lý do dùng subprocess thay vì native Node addon — cùng lý do áp dụng ở đây.
#
# ⚠️ CHƯA ĐO THỰC NGHIỆM TRÊN MÁY WINDOWS THẬT — viết theo tài liệu Microsoft
# (System.Windows.Automation namespace), CHƯA chạy thử. Rủi ro đã biết trước,
# xem roadmap/desktop-app-implementation-plan.md mục Phase 4:
#   - Hệ toạ độ: AutomationElement.FromPoint() có thể ở logic-96-DPI hoặc pixel
#     vật lý tuỳ chế độ DPI-awareness của tiến trình powershell.exe — ĐÃ set
#     Per-Monitor V2 dưới đây để cố định về pixel vật lý (khớp
#     screen.getCursorScreenPoint() của Electron), nhưng CHƯA kiểm chứng thật.
#     macOS từng phải kiểm chứng thực nghiệm y hệt việc này trước khi tin được
#     (xem AccessibilityText.bounds trong content.ts) — Windows cũng cần vậy.
#   - TextPattern không phải control nào cũng hỗ trợ — có fallback về
#     Name/BoundingRectangle, nhưng độ phủ thực tế trên các app khác nhau
#     (trình duyệt, Office, PDF reader, app Electron khác...) chưa được đo.
#
# Giao thức: JSON theo dòng trên stdin/stdout, giống hệt accessibility-macos —
# {id, cmd, ...} vào, {id, ...} hoặc {id, error} ra. TypeScript phía
# src/main/acquisition/accessibility/windows.ts dùng lại nguyên logic quản lý
# subprocess đã viết cho macOS (darwin.ts), chỉ đổi lệnh spawn.

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName WindowsBase

# Cố định DPI-awareness về Per-Monitor V2 — nếu không set, powershell.exe mặc
# định "System DPI aware" hoặc "Unaware" tuỳ phiên bản Windows, khiến toạ độ
# AutomationElement.FromPoint() không khớp screen.getCursorScreenPoint() của
# Electron trên máy nhiều màn hình có DPI khác nhau. -1 chỗ thứ hai tương ứng
# hằng số DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 (xem winuser.h).
$dpiHelperSrc = @"
using System;
using System.Runtime.InteropServices;
public class DpiHelper {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetProcessDpiAwarenessContext(IntPtr value);
}
"@
Add-Type -TypeDefinition $dpiHelperSrc -Language CSharp
[DpiHelper]::SetProcessDpiAwarenessContext([IntPtr](-4)) | Out-Null

# GetAsyncKeyState cho lệnh 'modifiers' — tương đương NSEvent.modifierFlags
# của macOS (main.swift): trạng thái phím NGAY LÚC gọi, không cần cửa sổ có
# focus hay đợi sự kiện. Bit cao nhất (0x8000) của giá trị trả về = phím đang
# được giữ tại thời điểm gọi; bit thấp (đã bỏ qua ở đây) mới là "có sự kiện
# nhấn kể từ lần gọi trước" — hai ý nghĩa khác nhau, dễ nhầm nếu không đọc kỹ
# tài liệu Win32.
$keyboardHelperSrc = @"
using System;
using System.Runtime.InteropServices;
public class KeyboardHelper {
    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);
}
"@
Add-Type -TypeDefinition $keyboardHelperSrc -Language CSharp

# Mã phím ảo (Virtual-Key Codes), xem winuser.h.
$VK_SHIFT = 0x10
$VK_CONTROL = 0x11
$VK_MENU = 0x12  # Alt — tương ứng 'option' trên macOS, không có phím Option thật trên Windows
$VK_LWIN = 0x5B
$VK_RWIN = 0x5C

function Test-KeyDown([int]$vKey) {
    return ([KeyboardHelper]::GetAsyncKeyState($vKey) -band 0x8000) -ne 0
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

function Write-Response($obj) {
    $json = ConvertTo-Json $obj -Compress -Depth 6
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
        if ($req.cmd -eq 'trusted') {
            # Windows không có mô hình xin quyền theo kiểu TCC của macOS cho UI
            # Automation — không có gì để "trust", luôn coi như sẵn sàng. Khớp
            # permissions.service.ts đã coi Windows luôn accessibility: true.
            $response.trusted = $true
        }
        elseif ($req.cmd -eq 'queryPoint') {
            $point = New-Object System.Windows.Point($req.x, $req.y)
            $element = [System.Windows.Automation.AutomationElement]::FromPoint($point)

            if ($null -eq $element) {
                $response.text = $null
            }
            else {
                $textPatternObj = $null
                $hasTextPattern = $element.TryGetCurrentPattern(
                    [System.Windows.Automation.TextPattern]::Pattern, [ref]$textPatternObj)

                if ($hasTextPattern) {
                    $textPattern = [System.Windows.Automation.TextPattern]$textPatternObj
                    $range = $textPattern.DocumentRange
                    $text = $range.GetText(-1)
                    $response.text = $text

                    $rects = $range.GetBoundingRectangles()
                    if ($rects.Length -gt 0) {
                        # Khung bao TRỌN VẸN toàn bộ vùng text (hợp nhất mọi dòng) —
                        # khớp cách macOS trả bounds của cả phần tử, không phải
                        # từng dòng riêng. acquire.ts không dùng bounds cho intent
                        # llm-lane (chỉ Lane A translate mới đặt tooltip theo đó).
                        $minX = ($rects | ForEach-Object { $_.X } | Measure-Object -Minimum).Minimum
                        $minY = ($rects | ForEach-Object { $_.Y } | Measure-Object -Minimum).Minimum
                        $maxX = ($rects | ForEach-Object { $_.X + $_.Width } | Measure-Object -Maximum).Maximum
                        $maxY = ($rects | ForEach-Object { $_.Y + $_.Height } | Measure-Object -Maximum).Maximum
                        $response.bounds = [ordered]@{
                            x = $minX; y = $minY; width = ($maxX - $minX); height = ($maxY - $minY)
                        }
                    }
                    # CHƯA làm charOffset (chỉ số ký tự chính xác dưới con trỏ) —
                    # macOS phải kiểm chứng khứ hồi để tin được số này (xem
                    # AccessibilityText.charOffset trong content.ts); TextPattern có
                    # RangeFromPoint() có thể làm được điều tương tự nhưng CHƯA viết,
                    # để tránh lặp lại đúng bẫy "AX trả offset sai âm thầm" mà macOS
                    # đã gặp — vắng mặt (không phải đoán bằng 0) là lựa chọn AN TOÀN
                    # hơn, tầng trên đã có sẵn quy ước "vắng mặt = không xác định".

                    $name = $element.Current.Name
                    if (-not [string]::IsNullOrWhiteSpace($name)) {
                        $response.app = $name
                    }
                }
                else {
                    # Không có TextPattern (nhiều control Win32 cũ, một số control
                    # custom-render) — phương án chót: Name hiển thị của phần tử,
                    # giống fallback macOS dùng khi AX không đọc được nội dung thật.
                    $name = $element.Current.Name
                    if (-not [string]::IsNullOrWhiteSpace($name)) {
                        $response.text = $name
                        $b = $element.Current.BoundingRectangle
                        $response.bounds = [ordered]@{ x = $b.X; y = $b.Y; width = $b.Width; height = $b.Height }
                    }
                    else {
                        $response.text = $null
                    }
                }
            }
        }
        elseif ($req.cmd -eq 'modifiers') {
            # Trạng thái phím bổ trợ NGAY LÚC hỏi — dùng cho setting
            # hoverModifiers, khớp cách main.swift trả lời lệnh 'modifiers' bên
            # macOS (NSEvent.modifierFlags). 'command' không có phím tương ứng
            # thật trên Windows — map sang phím Windows/Meta (trái hoặc phải)
            # làm quy ước, vì đó là phím "bổ trợ hệ điều hành" gần nghĩa nhất.
            $response.command = (Test-KeyDown $VK_LWIN) -or (Test-KeyDown $VK_RWIN)
            $response.control = Test-KeyDown $VK_CONTROL
            $response.option = Test-KeyDown $VK_MENU
            $response.shift = Test-KeyDown $VK_SHIFT
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
