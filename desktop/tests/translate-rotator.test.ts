import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { translateRotator } from '../src/main/translate/translate-rotator';
import { LIMITS } from '../config/limits.config';
import type { TranslateProviderConfig } from '../config/settings';
import type { TranslateProviderId } from '../src/shared/types/translate';

const cfg = (id: TranslateProviderId, priority: number, isEnabled = true): TranslateProviderConfig =>
  ({ id, priority, isEnabled }) as TranslateProviderConfig;

/**
 * `translateRotator` là singleton dùng chung cho cả tiến trình test — dọn sạch
 * cooldown của cả ba id thật trước MỖI test để chúng không lẫn trạng thái của
 * nhau (chỉ có đúng 3 id hợp lệ, không thể dựng id giả để cách ly như các test
 * khác trong repo hay làm).
 */
const resetAll = () => {
  translateRotator.reportSuccess('google');
  translateRotator.reportSuccess('bing');
  translateRotator.reportSuccess('mymemory');
};

test('candidates(): sắp theo priority tăng dần, không theo thứ tự khai báo', () => {
  resetAll();
  const out = translateRotator.candidates([cfg('bing', 5), cfg('mymemory', 1), cfg('google', 3)]);
  assert.deepEqual(out.map((c) => c.id), ['mymemory', 'google', 'bing']);
});

test('candidates(): loại provider đang tắt (isEnabled: false)', () => {
  resetAll();
  const out = translateRotator.candidates([cfg('google', 0, true), cfg('bing', 1, false)]);
  assert.deepEqual(out.map((c) => c.id), ['google']);
});

test('reportFailure() + candidates(): provider vừa lỗi bị loại tạm thời khỏi danh sách', () => {
  resetAll();
  translateRotator.reportFailure('google', new Error('lỗi máy chủ 500'));
  const out = translateRotator.candidates([cfg('google', 0), cfg('bing', 1)]);
  assert.deepEqual(out.map((c) => c.id), ['bing'], 'google vừa lỗi phải bị loại, bing vẫn còn');
});

test('reportSuccess(): xoá cooldown ngay, provider dùng lại được', () => {
  resetAll();
  translateRotator.reportFailure('mymemory', new Error('lỗi tạm thời'));
  assert.deepEqual(translateRotator.candidates([cfg('mymemory', 0)]).map((c) => c.id), []);

  translateRotator.reportSuccess('mymemory');
  assert.deepEqual(translateRotator.candidates([cfg('mymemory', 0)]).map((c) => c.id), ['mymemory']);
});

test('reportFailure(): lỗi có "429" trong message dùng cooldown DÀI hơn lỗi thường', () => {
  // Giả lập đồng hồ thay vì chờ thật (LIMITS.cooldown.serverErrorMs = 30s) —
  // xác nhận đúng CON SỐ, không chỉ "cả hai đều bị chặn ngay sau khi lỗi".
  assert.ok(LIMITS.cooldown.rateLimitMs > LIMITS.cooldown.serverErrorMs, 'giả định nền của test này');
  resetAll();

  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    translateRotator.reportFailure('google', new Error('HTTP 429 Too Many Requests'));
    translateRotator.reportFailure('bing', new Error('HTTP 500 Internal Server Error'));

    // Vượt qua cooldown-lỗi-thường nhưng CHƯA hết cooldown-429.
    now += LIMITS.cooldown.serverErrorMs + 1;
    const mid = translateRotator.candidates([cfg('google', 0), cfg('bing', 1)]);
    assert.deepEqual(mid.map((c) => c.id), ['bing'], 'bing (lỗi thường) đã hết cooldown, google (429) vẫn còn bị chặn');

    // Vượt qua luôn cooldown-429.
    now += LIMITS.cooldown.rateLimitMs;
    const later = translateRotator.candidates([cfg('google', 0), cfg('bing', 1)]);
    assert.deepEqual(later.map((c) => c.id).sort(), ['bing', 'google'], 'cả hai đều hết cooldown');
  } finally {
    Date.now = realNow;
    resetAll();
  }
});

test('reportFailure(): lỗi 401/403 dùng cooldown DÀI HƠN cả 429 — nhiều khả năng chặn dài hạn', () => {
  assert.ok(
    LIMITS.cooldown.authErrorMs > LIMITS.cooldown.rateLimitMs,
    'giả định nền: authErrorMs phải dài hơn rateLimitMs, không chỉ dài hơn serverErrorMs',
  );
  resetAll();

  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    // Đúng thông điệp lỗi thật của bing.provider.ts khi bị hệ chống bot chặn.
    translateRotator.reportFailure('bing', new Error('Bing Translate trả lỗi HTTP 401'));
    translateRotator.reportFailure('google', new Error('HTTP 429 Too Many Requests'));

    // Vượt qua cooldown-429 nhưng CHƯA hết cooldown-401.
    now += LIMITS.cooldown.rateLimitMs + 1;
    const mid = translateRotator.candidates([cfg('bing', 0), cfg('google', 1)]);
    assert.deepEqual(mid.map((c) => c.id), ['google'], 'google (429) đã hết cooldown, bing (401) vẫn còn bị chặn');

    now += LIMITS.cooldown.authErrorMs;
    const later = translateRotator.candidates([cfg('bing', 0), cfg('google', 1)]);
    assert.deepEqual(later.map((c) => c.id).sort(), ['bing', 'google'], 'cả hai đều hết cooldown');
  } finally {
    Date.now = realNow;
    resetAll();
  }
});

test('candidates(): danh sách rỗng không ném lỗi', () => {
  assert.deepEqual(translateRotator.candidates([]), []);
});
