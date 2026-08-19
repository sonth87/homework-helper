#!/bin/bash

# Di chuyển đến thư mục chứa script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

OUTPUT_ZIP="homework-helper.zip"
EXTENSION_DIR="extension"

if [ ! -d "$EXTENSION_DIR" ]; then
  echo "❌ Error: Thư mục '$EXTENSION_DIR' không tồn tại!"
  exit 1
fi

echo "📦 Đang đóng gói extension..."

# Xóa file zip cũ nếu có và nén lại sạch sẽ
rm -f "$OUTPUT_ZIP"
(cd "$EXTENSION_DIR" && zip -r "../$OUTPUT_ZIP" . -x "*.DS_Store" "*__MACOSX*" "*.git*" "*.tmp")

if [ $? -eq 0 ]; then
  FILE_SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
  echo "✅ Đã tạo thành công '$OUTPUT_ZIP' ($FILE_SIZE) tại $DIR/$OUTPUT_ZIP"
else
  echo "❌ Có lỗi xảy ra trong quá trình nén file."
  exit 1
fi
