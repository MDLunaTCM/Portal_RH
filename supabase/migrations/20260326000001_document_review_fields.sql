-- TASK-019: Add review workflow support to employee_documents
--
-- 1. Extend document_status enum with review-aware values needed by
--    the employee expediente module and the HR review panel (TASK-023).
-- 2. Add reviewer columns to employee_documents (stored by TASK-023).
-- 3. Change default status from 'active' → 'pending_review' so every
--    new employee upload enters the review queue automatically.
--
-- NOTE: PostgreSQL requires enum values to be committed before they
-- can be used as column defaults, so the ALTER COLUMN is in a separate
-- statement after the ADD VALUE commits within the same transaction.

-- 1. Extend enum (idempotent via IF NOT EXISTS)
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'approved';

-- 2. Reviewer columns (idempotent via IF NOT EXISTS)
ALTER TABLE employee_documents
  ADD COLUMN IF NOT EXISTS reviewer_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMPTZ;

-- 3. Change default so new uploads enter the review queue
--    (existing rows already have 'active', which maps to approved in UI)
ALTER TABLE employee_documents
  ALTER COLUMN status SET DEFAULT 'pending_review';

-- Index for HR queries by status
CREATE INDEX IF NOT EXISTS idx_employee_documents_status
  ON employee_documents (status);

-- Index for HR queries by reviewer
CREATE INDEX IF NOT EXISTS idx_employee_documents_reviewer
  ON employee_documents (reviewer_id);
