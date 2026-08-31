const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { minify } = require('terser');

const rootDir = __dirname;
const extensionDir = path.join(rootDir, 'extension');
const buildDir = path.join(rootDir, '.build-tmp');
const outputZip = path.join(rootDir, 'homework-helper.zip');

if (!fs.existsSync(extensionDir)) {
  console.error(`❌ Error: Thư mục '${extensionDir}' không tồn tại!`);
  process.exit(1);
}

// Thư viện bên thứ ba: KHÔNG BAO GIỜ minify lại.
//
// Chúng đã được minify sẵn từ upstream (tesseract.min.js, katex.min.js,
// worker.min.js) hoặc là mã dán keo Emscripten sinh tự động
// (tesseract-core*.wasm.js). Minify lại chỉ tiết kiệm vài KB nhưng phá vỡ hợp
// đồng biến toàn cục của chúng: `var TesseractCore = ...` ở top-level bị đổi
// tên, và offscreen/ocr.html nạp tệp đó như classic script rồi đọc
// `window.TesseractCore` — bản đóng gói 1.6.0 chết đúng ở đây (OCR luôn báo
// "TesseractCore WASM chưa sẵn sàng"), trong khi bản unpacked chạy bình thường.
// Giữ nguyên byte cũng đồng thời giữ lại banner giấy phép của upstream.
const VENDOR_PREFIXES = ['assets/ocr/', 'shared/katex/'];

// Hợp đồng biến toàn cục phải còn nguyên sau khi build. Kiểm tra này chính là
// thứ lẽ ra đã chặn được lỗi đóng gói 1.6.0.
const GLOBAL_CONTRACTS = [
  ['assets/ocr/tesseract-core-lstm.wasm.js', 'TesseractCore'],
  ['assets/ocr/tesseract-core-simd-lstm.wasm.js', 'TesseractCore'],
  ['assets/ocr/tesseract.min.js', 'Tesseract'],
  ['shared/katex/katex.min.js', 'katex'],
];

// Tệp minify hỏng — gom lại để chặn đóng gói ở bước kiểm tra, thay vì chỉ cảnh
// báo giữa hàng trăm dòng log rồi vẫn xuất ra một gói đáng ngờ.
const minifyFailures = [];

const toPosix = (p) => p.split(path.sep).join('/');
const isVendor = (rel) => VENDOR_PREFIXES.some((prefix) => rel.startsWith(prefix));

// Tệp có `import`/`export` ở đầu dòng là ES module thật; phần còn lại
// (content/loader.js, content/main-world-bridge.js...) là classic script, nơi
// tên top-level chính là biến toàn cục nên không được phép mangle.
const isEsModule = (code) => /^[ \t]*(?:import|export)[\s{('"*]/m.test(code);

function minifyOptions(esm) {
  if (esm) {
    // mangle.toplevel vẫn mặc định theo `module: true` — terser giữ nguyên tên
    // trong mệnh đề `export {}` nên các tệp khác vẫn `import` được.
    return { module: true, compress: true, mangle: true, format: { comments: false } };
  }
  return {
    module: false,
    compress: { toplevel: false },
    mangle: { toplevel: false },
    format: { comments: false },
  };
}

async function copyAndMinify(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    const rel = toPosix(path.relative(extensionDir, srcPath));

    if (entry.isDirectory()) {
      await copyAndMinify(srcPath, destPath);
      continue;
    }

    if (entry.name.endsWith('.js') && !isVendor(rel)) {
      const code = fs.readFileSync(srcPath, 'utf8');
      try {
        const result = await minify(code, minifyOptions(isEsModule(code)));
        fs.writeFileSync(destPath, result.code ?? code, 'utf8');
      } catch (err) {
        minifyFailures.push(`${rel}: minify thất bại — ${err.message}`);
        fs.copyFileSync(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function listFiles(dir, base = dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, base, acc);
    else if (entry.name !== '.DS_Store') acc.push(toPosix(path.relative(base, full)));
  }
  return acc;
}

/** Chạy một classic script trong sandbox và trả về `true` nếu nó khai báo `globalName`. */
function definesGlobal(file, globalName) {
  const sandbox = { console: { log() {}, warn() {}, error() {} } };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  try {
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file, timeout: 30000 });
  } catch (err) {
    return `ném lỗi khi nạp: ${err.message}`;
  }
  return sandbox[globalName] !== undefined ? true : `không khai báo biến toàn cục '${globalName}'`;
}

function verifyBuild() {
  const problems = [...minifyFailures];

  const srcFiles = listFiles(extensionDir).sort();
  const outFiles = listFiles(buildDir).sort();
  for (const rel of srcFiles) {
    if (!outFiles.includes(rel)) problems.push(`thiếu tệp trong gói: ${rel}`);
  }

  for (const rel of srcFiles.filter(isVendor)) {
    const a = fs.readFileSync(path.join(extensionDir, rel));
    const b = fs.readFileSync(path.join(buildDir, rel));
    if (!a.equals(b)) problems.push(`tệp thư viện bị sửa đổi: ${rel}`);
  }

  for (const [rel, globalName] of GLOBAL_CONTRACTS) {
    const built = path.join(buildDir, rel);
    if (!fs.existsSync(built)) {
      problems.push(`thiếu tệp trong gói: ${rel}`);
      continue;
    }
    const verdict = definesGlobal(built, globalName);
    if (verdict !== true) problems.push(`${rel}: ${verdict}`);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(buildDir, 'manifest.json'), 'utf8'));
  const referenced = [
    ...Object.values(manifest.icons || {}),
    manifest.action?.default_popup,
    manifest.background?.service_worker,
    manifest.side_panel?.default_path,
    manifest.options_ui?.page,
    ...(manifest.content_scripts || []).flatMap((cs) => [...(cs.js || []), ...(cs.css || [])]),
  ].filter(Boolean);
  for (const rel of referenced) {
    if (!fs.existsSync(path.join(buildDir, rel))) {
      problems.push(`manifest trỏ tới tệp không tồn tại: ${rel}`);
    }
  }

  return problems;
}

(async () => {
  try {
    if (fs.existsSync(outputZip)) fs.unlinkSync(outputZip);
    if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true, force: true });

    console.log('🔧 Đang minify JS (bỏ qua thư viện bên thứ ba)...');
    await copyAndMinify(extensionDir, buildDir);

    console.log('🔍 Đang kiểm tra gói build...');
    const problems = verifyBuild();
    if (problems.length) {
      console.error('❌ Gói build không hợp lệ — huỷ đóng gói:');
      for (const p of problems) console.error(`   • ${p}`);
      process.exitCode = 1;
      return;
    }
    console.log('   ✔ Đủ tệp, thư viện nguyên vẹn, biến toàn cục còn sống.');

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
