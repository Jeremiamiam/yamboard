-- Migration: project-files storage bucket + RLS policies
-- Purpose: Enable authenticated users to upload and manage files scoped to their projects.
-- Path convention: {user_id}/{project_id}/{filename}
-- The first path segment (user_id) is used by RLS to ensure users can only access their own files.

-- 1. Create the project-files bucket (private — no public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies on storage.objects for the project-files bucket
-- Note: PostgreSQL does not support IF NOT EXISTS on CREATE POLICY.

-- SELECT: authenticated users can read their own files
CREATE POLICY project_files_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- INSERT: authenticated users can upload their own files
CREATE POLICY project_files_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: authenticated users can delete their own files
CREATE POLICY project_files_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
