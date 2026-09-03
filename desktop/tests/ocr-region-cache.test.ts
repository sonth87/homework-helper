import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getCachedOcrResult, setCachedOcrResult } from '../src/main/acquisition/ocr/region-cache';
import type { OcrResult } from '../src/shared/types/content';

const result = (text: string): OcrResult => ({
  text,
  blocks: [],
  durationMs: 1,
  engine: 'vision-darwin',
});

test('getCachedOcrResult(): miss khi chưa từng set — không ném lỗi, trả null', () => {
  assert.equal(getCachedOcrResult('chua-tung-thay', 'native'), null);
});

test('setCachedOcrResult() + getCachedOcrResult(): cùng ảnh, cùng engine → cache hit đúng kết quả đã lưu', () => {
  const base64 = `unique-${Date.now()}-${Math.random()}`;
  const r = result('Hello Tesseract');
  setCachedOcrResult(base64, 'native', r);
  assert.deepEqual(getCachedOcrResult(base64, 'native'), r);
});

test('cùng ẢNH nhưng KHÁC engine → vẫn là cache miss — không được trả nhầm kết quả của engine khác', () => {
  // Bug thật đã tự bắt được lúc viết region-cache.ts: nếu khoá chỉ theo nội
  // dung ảnh (không kèm engine), tryOcr() thử native trước rồi rơi qua
  // Tesseract trên CÙNG một ảnh khi native confidence thấp — không có test
  // này, lần rơi qua Tesseract sẽ vô tình lấy lại đúng kết quả native đã
  // cache, dán nhãn sai hẳn nguồn gốc kết quả.
  const base64 = `unique-${Date.now()}-${Math.random()}`;
  setCachedOcrResult(base64, 'native', result('native result'));
  assert.equal(getCachedOcrResult(base64, 'tesseract'), null, 'engine khác nhau phải là hai khoá cache riêng biệt');
});

test('khác nội dung ảnh (khác hash) → cache miss, dù cùng engine', () => {
  const a = `unique-a-${Date.now()}-${Math.random()}`;
  const b = `unique-b-${Date.now()}-${Math.random()}`;
  setCachedOcrResult(a, 'native', result('A'));
  assert.equal(getCachedOcrResult(b, 'native'), null);
});

test('vượt quá MAX_ENTRIES (20) → mục CŨ NHẤT bị xoá, mục mới vẫn còn', () => {
  // Chèn hẳn 30 mục MỚI (nhiều hơn hẳn MAX_ENTRIES=20) để chắc chắn "nhấn
  // trôi" mọi trạng thái các test khác trong file này đã để lại trong cùng
  // cache singleton — không phụ thuộc đúng con số mục đã tồn tại từ trước.
  const prefix = `evict-${Date.now()}-${Math.random()}`;
  const keys = Array.from({ length: 30 }, (_, i) => `${prefix}-${i}`);

  for (const key of keys) setCachedOcrResult(key, 'native', result(key));

  assert.equal(getCachedOcrResult(keys[0]!, 'native'), null, 'mục đầu tiên (cũ nhất) phải đã bị xoá');
  assert.notEqual(getCachedOcrResult(keys[29]!, 'native'), null, 'mục cuối cùng (mới nhất) phải vẫn còn');
});
