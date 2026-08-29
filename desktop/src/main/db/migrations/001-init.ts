import type { Migration } from './index';

export const migration001: Migration = {
  version: 1,
  name: '001-init',
  up: `
    -- Cấu hình: một dòng một khoá, giá trị là JSON.
    -- Dạng khoá-giá trị thay vì mỗi setting một cột, để thêm setting không cần migration.
    CREATE TABLE settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE conversations (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL DEFAULT '',
      intent     TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      thumbnail  TEXT
    );
    CREATE INDEX idx_conversations_updated ON conversations (updated_at DESC);

    CREATE TABLE messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
      role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content         TEXT NOT NULL,
      image           TEXT,
      created_at      INTEGER NOT NULL
    );
    CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);

    -- Cache của Lane A. Khoá gồm cả cặp ngôn ngữ vì cùng một câu dịch sang hai
    -- thứ tiếng là hai kết quả khác nhau.
    CREATE TABLE translation_cache (
      source_hash TEXT NOT NULL,
      source_lang TEXT NOT NULL,
      target_lang TEXT NOT NULL,
      source_text TEXT NOT NULL,
      translated  TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      hit_count   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (source_hash, source_lang, target_lang)
    );
    CREATE INDEX idx_cache_created ON translation_cache (created_at);

    -- Theo dõi token để cảnh báo chi phí (ai.settings.monthlyTokenBudget).
    CREATE TABLE usage (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      provider      TEXT NOT NULL,
      model         TEXT NOT NULL,
      input_tokens  INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL
    );
    CREATE INDEX idx_usage_created ON usage (created_at);
  `,
};
