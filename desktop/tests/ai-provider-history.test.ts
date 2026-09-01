/**
 * Kiểm thử việc dựng request có LỊCH SỬ HỘI THOẠI cho cả ba họ provider.
 *
 * Đáng test vì ba API bất đồng ở đúng chỗ dễ gõ nhầm: Gemini dùng role
 * 'model' cho lượt trợ lý (không phải 'assistant' như hai họ kia), và mỗi họ
 * đặt system prompt ở một chỗ khác nhau (systemInstruction/message đầu/trường
 * cấp cao nhất). Sai một trong ba sẽ không lộ ra ở typecheck — chỉ lộ khi gọi
 * API thật và nhận lỗi 400, hoặc tệ hơn: model nhận sai role mà vẫn trả lời
 * (không hỏi lại lịch sử) mà không ai biết.
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { truncateHistory } from '../src/main/ai/ai.service';
import { LIMITS } from '../config/limits.config';
import { geminiAdapter } from '../src/main/ai/providers/gemini';
import { openAiCompatibleAdapter } from '../src/main/ai/providers/openai-compatible';
import { claudeAdapter } from '../src/main/ai/providers/claude';
import type { RequestContext } from '../src/main/ai/providers/types';

const BASE: Omit<RequestContext, 'history'> = {
  baseUrl: 'https://example.test',
  apiKey: 'k',
  model: 'm',
  systemPrompt: 'hệ thống',
  userPrompt: 'lượt hiện tại',
  thinkingEnabled: false,
};

const HISTORY = [
  { role: 'user' as const, content: 'câu hỏi lượt trước' },
  { role: 'assistant' as const, content: 'trả lời lượt trước' },
];

test('gemini: role "assistant" nội bộ ánh xạ sang "model", lượt hiện tại luôn ở cuối', () => {
  const req = geminiAdapter.buildRequest({ ...BASE, history: HISTORY });
  const body = JSON.parse(req.init.body as string) as { contents: { role: string; parts: { text: string }[] }[] };

  assert.equal(body.contents.length, 3, '2 lượt lịch sử + 1 lượt hiện tại');
  assert.deepEqual(body.contents.map((c) => c.role), ['user', 'model', 'user']);
  assert.equal(body.contents[0]?.parts[0]?.text, 'câu hỏi lượt trước');
  assert.equal(body.contents[1]?.parts[0]?.text, 'trả lời lượt trước');
  assert.equal(body.contents[2]?.parts[0]?.text, 'lượt hiện tại', 'lượt hiện tại phải ở CUỐI, sau lịch sử');
});

test('gemini: không có history thì contents chỉ có đúng 1 phần tử (không vỡ hành vi cũ)', () => {
  const req = geminiAdapter.buildRequest(BASE);
  const body = JSON.parse(req.init.body as string) as { contents: unknown[] };
  assert.equal(body.contents.length, 1);
});

test('openai-compatible: role khớp thẳng, system prompt là message đầu tiên, lịch sử chen giữa', () => {
  const req = openAiCompatibleAdapter.buildRequest({ ...BASE, history: HISTORY });
  const body = JSON.parse(req.init.body as string) as { messages: { role: string; content: unknown }[] };

  assert.equal(body.messages.length, 4, 'system + 2 lượt lịch sử + 1 lượt hiện tại');
  assert.deepEqual(body.messages.map((m) => m.role), ['system', 'user', 'assistant', 'user']);
  assert.equal(body.messages[3]?.content, 'lượt hiện tại');
});

test('claude: role khớp thẳng, system prompt ở trường riêng (không nằm trong messages)', () => {
  const req = claudeAdapter.buildRequest({ ...BASE, history: HISTORY });
  const body = JSON.parse(req.init.body as string) as {
    system: string;
    messages: { role: string; content: { type: string; text?: string }[] }[];
  };

  assert.equal(body.system, 'hệ thống');
  assert.equal(body.messages.length, 3, '2 lượt lịch sử + 1 lượt hiện tại — system KHÔNG nằm trong messages');
  assert.deepEqual(body.messages.map((m) => m.role), ['user', 'assistant', 'user']);
  assert.equal(body.messages[2]?.content[0]?.text, 'lượt hiện tại');
});

test('truncateHistory: model local giữ ÍT lượt hơn cloud, cả hai đều giữ N lượt GẦN NHẤT', () => {
  const long: { role: 'user' | 'assistant'; content: string }[] = Array.from({ length: 50 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `lượt ${i}`,
  }));

  const local = truncateHistory(long, true);
  const cloud = truncateHistory(long, false);

  assert.equal(local.length, LIMITS.llmLane.historyTurnsLocal);
  assert.equal(cloud.length, LIMITS.llmLane.historyTurnsCloud);
  assert.ok(local.length < cloud.length, 'local phải giữ ít hơn cloud');

  // Phải là các lượt GẦN NHẤT (cuối mảng), không phải các lượt đầu tiên.
  assert.equal(local[local.length - 1]?.content, 'lượt 49');
  assert.equal(cloud[cloud.length - 1]?.content, 'lượt 49');
});

test('truncateHistory: mảng ngắn hơn ngưỡng thì giữ nguyên, không độn thêm', () => {
  const short = [{ role: 'user' as const, content: 'chỉ một lượt' }];
  assert.equal(truncateHistory(short, true).length, 1);
  assert.equal(truncateHistory(short, false).length, 1);
});

test('cả ba adapter: history rỗng cho kết quả GIỐNG HỆT trước khi có tính năng này', () => {
  const g = JSON.parse(geminiAdapter.buildRequest({ ...BASE, history: [] }).init.body as string) as { contents: unknown[] };
  const o = JSON.parse(openAiCompatibleAdapter.buildRequest({ ...BASE, history: [] }).init.body as string) as { messages: unknown[] };
  const c = JSON.parse(claudeAdapter.buildRequest({ ...BASE, history: [] }).init.body as string) as { messages: unknown[] };

  assert.equal(g.contents.length, 1);
  assert.equal(o.messages.length, 2); // system + user
  assert.equal(c.messages.length, 1);
});
