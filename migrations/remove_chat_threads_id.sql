-- Migration: Remove the auto-generated 'id' column from chat_threads
-- This migration assumes that no dependencies rely on the 'id' column.

ALTER TABLE chat_threads DROP COLUMN IF EXISTS id;
