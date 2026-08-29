#!/bin/sh
# Biên dịch accessibility-helper cho macOS. KHÔNG commit binary — arm64 build
# hỏng trên máy Intel, và không tái tạo được kiểm chứng như code nguồn.
#
# Chạy lại sau khi sửa native/accessibility-macos/main.swift, hoặc trước
# `npm run dev` lần đầu trên máy mới. Xem dev/decisions/0006-accessibility-helper-swift-subprocess.md.
set -e
cd "$(dirname "$0")/../native/accessibility-macos"
swiftc -O main.swift -o accessibility-helper -framework Cocoa -framework ApplicationServices
codesign -s - --force accessibility-helper
echo "✓ accessibility-helper đã biên dịch"
