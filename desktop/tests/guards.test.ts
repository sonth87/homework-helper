/**
 * Kiểm thử `checkTrigger`/`RateLimiter` — chốt an toàn quan trọng nhất dự án
 * (chặn Lane B tự kích hoạt bởi chuột, tránh cháy chi phí LLM). Bằng tay đã
 * verify đúng khi audit, nhưng "verify tay một lần" không phải lưới an toàn —
 * quy hồi ở đây sau này sẽ không có gì bắt được nếu không có test.
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { checkTrigger, RateLimiter } from '../src/main/pipeline/guards';
import { INTENTS } from '../config/intents.config';
import type { Intent, TriggerSource } from '../src/shared/types/intent';

test('checkTrigger: intent lane llm KHÔNG BAO GIỜ được phép kích hoạt bởi mouse-move', () => {
  const llmIntents = (Object.keys(INTENTS) as Intent[]).filter((id) => INTENTS[id].lane === 'llm');
  assert.ok(llmIntents.length > 0, 'phải có ít nhất một intent lane llm để test này có ý nghĩa');

  for (const intent of llmIntents) {
    const verdict = checkTrigger(intent, 'mouse-move');
    assert.equal(verdict.allowed, false, `intent "${intent}" (lane llm) phải bị chặn khi nguồn là mouse-move`);
  }
});

test('checkTrigger: intent lane fast (translate) được phép kích hoạt bởi mouse-move', () => {
  const fastIntents = (Object.keys(INTENTS) as Intent[]).filter((id) => INTENTS[id].lane === 'fast');
  for (const intent of fastIntents) {
    assert.equal(checkTrigger(intent, 'mouse-move').allowed, true, `intent "${intent}" (lane fast) không được chặn`);
  }
});

test('checkTrigger: intent lane llm được phép với mọi nguồn KHÁC mouse-move', () => {
  const llmIntents = (Object.keys(INTENTS) as Intent[]).filter((id) => INTENTS[id].lane === 'llm');
  const otherSources: TriggerSource[] = ['hotkey', 'tray', 'clipboard', 'file-drop', 'ui'];

  for (const intent of llmIntents) {
    for (const source of otherSources) {
      assert.equal(checkTrigger(intent, source).allowed, true, `intent "${intent}" nguồn "${source}" không được chặn`);
    }
  }
});

test('checkTrigger: lý do chặn nêu rõ tên intent và nguồn', () => {
  const llmIntent = (Object.keys(INTENTS) as Intent[]).find((id) => INTENTS[id].lane === 'llm');
  assert.ok(llmIntent);
  const verdict = checkTrigger(llmIntent, 'mouse-move');
  assert.equal(verdict.allowed, false);
  assert.match(verdict.reason, new RegExp(llmIntent));
});

test('RateLimiter: cho phép đúng bằng hạn mức, từ chối lượt vượt quá', () => {
  const limiter = new RateLimiter(3);
  const now = 1_000_000;
  assert.equal(limiter.tryAcquire(now).allowed, true);
  assert.equal(limiter.tryAcquire(now).allowed, true);
  assert.equal(limiter.tryAcquire(now).allowed, true);
  assert.equal(limiter.tryAcquire(now).allowed, false, 'lượt thứ 4 trong cùng phút phải bị từ chối');
});

test('RateLimiter: cửa sổ trượt 60 giây — request cũ hết hạn thì lại được phép', () => {
  const limiter = new RateLimiter(2);
  const t0 = 1_000_000;
  assert.equal(limiter.tryAcquire(t0).allowed, true);
  assert.equal(limiter.tryAcquire(t0 + 100).allowed, true);
  assert.equal(limiter.tryAcquire(t0 + 200).allowed, false, 'đã đạt hạn mức 2 trong cửa sổ hiện tại');

  // Quá 60s kể từ request ĐẦU TIÊN — nó rơi khỏi cửa sổ trượt, còn lại 1 cái.
  const t1 = t0 + 60_001;
  assert.equal(limiter.tryAcquire(t1).allowed, true, 'request đầu đã hết hạn, phải còn chỗ');
});

test('RateLimiter: reset() xoá sạch lịch sử', () => {
  const limiter = new RateLimiter(1);
  const now = 1_000_000;
  assert.equal(limiter.tryAcquire(now).allowed, true);
  assert.equal(limiter.tryAcquire(now).allowed, false);
  limiter.reset();
  assert.equal(limiter.tryAcquire(now).allowed, true, 'sau reset phải tính lại từ đầu');
});

test('RateLimiter: hạn mức 0 chặn tuyệt đối', () => {
  const limiter = new RateLimiter(0);
  assert.equal(limiter.tryAcquire(1_000_000).allowed, false);
});
