-- Add auto_sync_routes column to downstream_api_keys table
ALTER TABLE downstream_api_keys ADD COLUMN auto_sync_routes INTEGER DEFAULT 0;
