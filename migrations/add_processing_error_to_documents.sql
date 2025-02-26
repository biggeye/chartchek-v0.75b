-- Add processing_error column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS processing_error TEXT DEFAULT NULL;

-- Ensure processing_status has appropriate values
COMMENT ON COLUMN documents.processing_status IS 'Status of document processing: pending, processing, indexed, failed, unsupported_format';

-- Update any NULL processing_status to 'pending'
UPDATE documents 
SET processing_status = 'pending' 
WHERE processing_status IS NULL;
