-- Brand Voice draft version history for autosave, assistant updates, and restores.
CREATE TABLE brand_voice_draft_versions (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES brand_voice_threads(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    draft_text TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('assistant', 'manual', 'restore')),
    created_by TEXT REFERENCES users(id),
    created_by_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_brand_voice_draft_versions_thread_version
  ON brand_voice_draft_versions(thread_id, version_number DESC);
