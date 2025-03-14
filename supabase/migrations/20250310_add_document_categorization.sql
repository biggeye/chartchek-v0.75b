-- Migration: Add document categorization fields
-- Description: Add patient_id, compliance_concern, and compliance_concern_other fields to documents table

-- Create enum type for compliance concern
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_concern_type') THEN
        CREATE TYPE compliance_concern_type AS ENUM ('jco', 'dhcs', 'carf', 'other', '');
    END IF;
END
$$;

-- Add patient_id column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES auth.users(id) NULL;

-- Add compliance_concern column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS compliance_concern compliance_concern_type NULL;

-- Add compliance_concern_other column (for when compliance_concern is 'other')
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS compliance_concern_other TEXT NULL;

-- Add has_embeddings column to track documents with generated embeddings
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS has_embeddings BOOLEAN DEFAULT FALSE;

-- Add indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_compliance_concern ON documents(compliance_concern);
CREATE INDEX IF NOT EXISTS idx_documents_has_embeddings ON documents(has_embeddings);

-- Add comments to explain the purpose of each column
COMMENT ON COLUMN documents.patient_id IS 'UUID of the patient associated with this document';
COMMENT ON COLUMN documents.compliance_concern IS 'Type of compliance concern: jco, dhcs, carf, other';
COMMENT ON COLUMN documents.compliance_concern_other IS 'Custom compliance concern description when compliance_concern is "other"';
COMMENT ON COLUMN documents.has_embeddings IS 'Indicates whether embeddings have been generated for this document';
