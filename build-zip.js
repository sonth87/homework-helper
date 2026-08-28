const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const rootDir = __dirname;
const extensionDir = path.join(rootDir, 'extension');
const buildDir = path.join(rootDir, '.build-tmp');
const outputZip = path.join(rootDir, 'homework-helper.zip');

if (!fs.existsSync(extensionDir)) {
  console.error(`❌ Error: Thư mục '${extensionDir}' không tồn tại!`);
  process.exit(1);
}

// Copies extension/ into buildDir, minifying every .js file along the way
// (comments and whitespace stripped, local/function-scope variable names
// shortened). mangle.toplevel stays at its default (false), so exported and
// other top-level names are never renamed — each file is minified
// independently with no visibility into who imports it, and renaming an
// export would silently break every other file's `import { name } from ...`.
// Everything else (manifest.json, html, css, fonts, wasm...) is copied as-is.
async function copyAndMinify(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyAndMinify(srcPath, destPath);
      continue;
    }

    if (entry.name.endsWith('.js')) {
      const code = fs.readFileSync(srcPath, 'utf8');
      try {
        const result = await minify(code, {
          module: true,
          compress: true,
          mangle: true,
          format: { comments: false },
        });
        fs.writeFileSync(destPath, result.code ?? code, 'utf8');
      } catch (err) {
        console.warn(`⚠️  Bỏ qua minify cho ${path.relative(extensionDir, srcPath)} (giữ nguyên): ${err.message}`);
        fs.copyFileSync(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

(async () => {
  try {
    if (fs.existsSync(outputZip)) fs.unlinkSync(outputZip);
    if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true, force: true });

    console.log('🔧 Đang minify JS...');
    await copyAndMinify(extensionDir, buildDir);

    console.log('📦 Đang đóng gói extension...');

    const excludePatterns = ['*.DS_Store', '*__MACOSX*', '*.git*', '*.tmp']
      .map(p => `"${p}"`)
      .join(' ');

    if (process.platform === 'win32') {
      execSync(
        `powershell -Command "Compress-Archive -Path '${buildDir}\\*' -DestinationPath '${outputZip}' -Force"`,
        { stdio: 'inherit' }
      );
    } else {
      execSync(`zip -r "${outputZip}" . -x ${excludePatterns}`, {
        cwd: buildDir,
        stdio: 'inherit'
      });
    }

    const stats = fs.statSync(outputZip);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n✅ Đã tạo thành công 'homework-helper.zip' (${sizeMB} MB)`);
    console.log(`📁 Đường dẫn: ${outputZip}\n`);
  } catch (error) {
    console.error('❌ Lỗi khi đóng gói:', error.message);
    process.exitCode = 1;
  } finally {
    if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true, force: true });
  }
})();
