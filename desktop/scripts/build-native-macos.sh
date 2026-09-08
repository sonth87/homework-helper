#!/bin/sh
# Biên dịch mọi helper native macOS. KHÔNG commit binary — arm64-only, không
# tái tạo được kiểm chứng như code nguồn.
#
# Chạy lại sau khi sửa native/*/main.swift, hoặc trước `npm run dev` lần đầu
# trên máy mới. Xem dev/decisions/0006-accessibility-helper-swift-subprocess.md.
set -e
cd "$(dirname "$0")/.."

cd native/accessibility-macos
swiftc -O main.swift -o accessibility-helper -framework Cocoa -framework ApplicationServices
codesign -s - --force accessibility-helper
echo "✓ accessibility-helper đã biên dịch"
cd ../..

cd native/ocr-macos
swiftc -O main.swift -o ocr-helper -framework Cocoa -framework Vision
codesign -s - --force ocr-helper
echo "✓ ocr-helper đã biên dịch"
cd ../..
