-- Persistent Brand Voice chat threads and messages (shared across users)
CREATE TABLE brand_voice_threads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('rewrite', 'draft')),
    style TEXT NOT NULL CHECK (style IN ('email', 'whatsapp', 'document', 'instagram', 'facebook', 'other')),
    custom_style_description TEXT,
    latest_draft TEXT NOT NULL DEFAULT '',
    pinned_draft TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_by_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE brand_voice_messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES brand_voice_threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    draft_text TEXT,
    created_by TEXT,
    created_by_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_brand_voice_threads_recent
  ON brand_voice_threads(last_message_at DESC, updated_at DESC);

CREATE INDEX idx_brand_voice_messages_thread
  ON brand_voice_messages(thread_id, created_at ASC);
