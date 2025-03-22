-- Migration file to create the thread_runs table
-- This table captures OpenAI Assistant run details for historical tracking

-- Create enum type for run status
CREATE TYPE run_status_type AS ENUM (
  'queued',
  'in_progress',
  'requires_action',
  'cancelling',
  'cancelled',
  'failed',
  'completed',
  'expired'
);

-- Create the thread_runs table
CREATE TABLE thread_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Core identifiers
  run_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  assistant_id TEXT,
  user_id UUID,
  
  -- Status information
  status run_status_type NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_error JSONB,
  
  -- Run configuration
  model TEXT,
  instructions TEXT,
  tools JSONB,
  metadata JSONB,
  
  -- Required action information
  required_action JSONB,
  
  -- Token usage
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Run configuration details
  temperature FLOAT,
  top_p FLOAT,
  max_prompt_tokens INTEGER,
  max_completion_tokens INTEGER,
  truncation_strategy JSONB,
  response_format TEXT,
  tool_choice TEXT,
  parallel_tool_calls BOOLEAN
);

-- Create indexes
CREATE INDEX thread_runs_run_id_idx ON thread_runs (run_id);
CREATE INDEX thread_runs_thread_id_idx ON thread_runs (thread_id);
CREATE INDEX thread_runs_user_id_idx ON thread_runs (user_id);
CREATE INDEX thread_runs_status_idx ON thread_runs (status);

-- Add foreign key to chat_threads (if UUID used instead of text)
-- ALTER TABLE thread_runs ADD CONSTRAINT fk_thread_id 
--   FOREIGN KEY (thread_id) REFERENCES chat_threads(thread_id);

-- Add comment
COMMENT ON TABLE thread_runs IS 'Store OpenAI Assistant run information including required actions and tool call details';

-- Add last_run and last_run_status columns to chat_threads if they don't exist
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS last_run TEXT;
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS last_run_status TEXT;
