-- Guest grants: allow external users access to specific apps
CREATE TABLE guest_grants (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    app_key TEXT NOT NULL,
    granted_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(email, app_key)
);

CREATE INDEX idx_guest_grants_email ON guest_grants(email);

-- Track admin status set via admin panel (vs. env var)
ALTER TABLE users ADD COLUMN is_admin_managed INTEGER NOT NULL DEFAULT 0;
