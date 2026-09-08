/** Ghi số token đã dùng, phục vụ cảnh báo hạn mức hàng tháng. */

import type { DatabaseSync } from 'node:sqlite';

export class UsageRepo {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  record(provider: string, model: string, inputTokens: number, outputTokens: number): void {
    this.db
      .prepare('INSERT INTO usage (provider, model, input_tokens, output_tokens, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(provider, model, inputTokens, outputTokens, Date.now());
  }

  /** Tổng token trong 30 ngày qua — dùng cho monthlyTokenBudget. */
  totalLast30Days(): number {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const row = this.db
      .prepare('SELECT COALESCE(SUM(input_tokens + output_tokens), 0) AS total FROM usage WHERE created_at > ?')
      .get(cutoff) as { total: number } | undefined;
    return row?.total ?? 0;
  }
}
