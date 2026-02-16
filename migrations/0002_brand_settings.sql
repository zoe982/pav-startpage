-- Brand settings: single-row table for brand voice rules
CREATE TABLE brand_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    rules_markdown TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed with empty row so GET always returns data
INSERT INTO brand_settings (id, rules_markdown) VALUES (1, '');
