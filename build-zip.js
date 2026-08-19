const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const extensionDir = path.join(rootDir, 'extension');
const outputZip = path.join(rootDir, 'homework-helper.zip');

if (!fs.existsSync(extensionDir)) {
  console.error(`❌ Error: Thư mục '${extensionDir}' không tồn tại!`);
  process.exit(1);
}

console.log('📦 Đang đóng gói extension...');

try {
  // Xóa file zip cũ nếu có
  if (fs.existsSync(outputZip)) {
    fs.unlinkSync(outputZip);
  }

  // Chạy lệnh zip từ thư mục extension
  const excludePatterns = ['*.DS_Store', '*__MACOSX*', '*.git*', '*.tmp']
    .map(p => `"${p}"`)
    .join(' ');

  if (process.platform === 'win32') {
    // Hỗ trợ Windows PowerShell nếu chạy trên Windows
    execSync(
      `powershell -Command "Compress-Archive -Path '${extensionDir}\\*' -DestinationPath '${outputZip}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    // macOS / Linux
    execSync(`zip -r "${outputZip}" . -x ${excludePatterns}`, {
      cwd: extensionDir,
      stdio: 'inherit'
    });
  }

  const stats = fs.statSync(outputZip);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n✅ Đã tạo thành công 'homework-helper.zip' (${sizeMB} MB)`);
  console.log(`📁 Đường dẫn: ${outputZip}\n`);
} catch (error) {
  console.error('❌ Lỗi khi nén file zip:', error.message);
  process.exit(1);
}
