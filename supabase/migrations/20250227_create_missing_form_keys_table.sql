-- Create a table to track missing form keys
CREATE TABLE IF NOT EXISTS public.missing_form_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Add RLS policies
ALTER TABLE public.missing_form_keys ENABLE ROW LEVEL SECURITY;

-- Create an index on form_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_missing_form_keys_form_key ON public.missing_form_keys(form_key);

-- Add a policy to allow authenticated users to insert
CREATE POLICY insert_policy ON public.missing_form_keys 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Add a policy to allow authenticated users to select their own entries
CREATE POLICY select_policy ON public.missing_form_keys 
  FOR SELECT TO authenticated 
  USING (true);

-- Add comment to table
COMMENT ON TABLE public.missing_form_keys IS 'Table to track form keys requested by the OpenAI assistant that do not exist in formDefinitions';
