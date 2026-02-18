-- Add 'both' as a valid template type (Email + WhatsApp).
-- SQLite requires table recreation to alter a CHECK constraint.

PRAGMA foreign_keys = OFF;

CREATE TABLE templates_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'both')),
    subject TEXT,
    content TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL REFERENCES users(id),
    updated_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO templates_new SELECT * FROM templates;

DROP TABLE templates;

ALTER TABLE templates_new RENAME TO templates;

PRAGMA foreign_keys = ON;
