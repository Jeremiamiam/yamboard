CREATE TABLE IF NOT EXISTS workflow_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workflow_slug TEXT NOT NULL,
  output_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast project+workflow lookup
CREATE INDEX IF NOT EXISTS idx_workflow_outputs_project_workflow
  ON workflow_outputs(project_id, workflow_slug);

-- RLS: all authenticated users can access outputs (2-user app, no multi-tenancy)
ALTER TABLE workflow_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_outputs_select ON workflow_outputs
  FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY workflow_outputs_insert ON workflow_outputs
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');
