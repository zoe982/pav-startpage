-- Add services description column to brand_settings
ALTER TABLE brand_settings ADD COLUMN services_markdown TEXT NOT NULL DEFAULT '';
