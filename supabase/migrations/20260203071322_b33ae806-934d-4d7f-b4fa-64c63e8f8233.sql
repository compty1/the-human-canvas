-- Add new status values to the project_status enum
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'finishing_stages';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'final_review';