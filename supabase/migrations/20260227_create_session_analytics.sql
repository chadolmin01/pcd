-- Session Analytics Table for API wrapper escape
-- Collects anonymized session logs for failure pattern analysis and prompt improvement

-- Drop existing table if exists (for schema updates)
DROP TABLE IF EXISTS session_analytics CASCADE;

CREATE TABLE session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash CHAR(64) NOT NULL CHECK (session_hash ~ '^[a-f0-9]{64}$'),  -- SHA-256 hex

  -- Metadata
  validation_level TEXT NOT NULL CHECK (validation_level IN ('sketch', 'mvp', 'defense')),
  personas TEXT[] NOT NULL DEFAULT '{}',
  interaction_mode TEXT NOT NULL DEFAULT 'individual'
    CHECK (interaction_mode IN ('individual', 'discussion')),

  -- Session Metrics
  turn_count INTEGER NOT NULL DEFAULT 0 CHECK (turn_count >= 0),
  dropoff_point TEXT,  -- 'turn_3', 'completion', etc.
  completion_status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (completion_status IN ('in_progress', 'completed', 'abandoned', 'error')),

  -- Categories (LLM-extracted, no raw text stored)
  idea_categories TEXT[] NOT NULL DEFAULT '{}',

  -- Scores
  final_score INTEGER CHECK (final_score IS NULL OR (final_score >= 0 AND final_score <= 100)),
  score_history JSONB NOT NULL DEFAULT '[]',

  -- Engagement
  advice_shown_count INTEGER NOT NULL DEFAULT 0 CHECK (advice_shown_count >= 0),
  advice_reflected_count INTEGER NOT NULL DEFAULT 0 CHECK (advice_reflected_count >= 0),
  persona_engagement JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  total_duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN session_end IS NOT NULL
      THEN EXTRACT(EPOCH FROM (session_end - session_start))::INTEGER
      ELSE NULL
    END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Logical constraint: session_end must be after session_start
  CONSTRAINT valid_session_period CHECK (session_end IS NULL OR session_end >= session_start)
);

-- Indexes (allows multi-tab, no UNIQUE constraint)
CREATE INDEX idx_session_hash ON session_analytics(session_hash);
CREATE INDEX idx_session_level ON session_analytics(validation_level);
CREATE INDEX idx_session_status ON session_analytics(completion_status);
CREATE INDEX idx_session_categories ON session_analytics USING GIN(idea_categories);
CREATE INDEX idx_session_start ON session_analytics(session_start DESC);
-- Composite index for common analytics queries
CREATE INDEX idx_session_analytics_composite
  ON session_analytics(validation_level, completion_status, session_start DESC);

-- RLS: Service role only (corrected for Supabase)
-- Note: Service role bypasses RLS by default in Supabase.
-- This policy blocks anonymous and authenticated users while allowing service_role.
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all except service role" ON session_analytics
  FOR ALL USING (false);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_analytics_updated_at
  BEFORE UPDATE ON session_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_session_analytics_updated_at();

-- Documentation
COMMENT ON TABLE session_analytics IS 'Anonymized session logs for failure pattern analysis and prompt improvement';
COMMENT ON COLUMN session_analytics.session_hash IS 'SHA-256 hash for session identification (supports multi-tab)';
COMMENT ON COLUMN session_analytics.dropoff_point IS 'Turn identifier where user abandoned session (e.g., turn_3, completion)';
COMMENT ON COLUMN session_analytics.score_history IS 'JSON array of score snapshots [{turn: 1, score: 45}, ...]';
COMMENT ON COLUMN session_analytics.persona_engagement IS 'JSON object tracking per-persona interaction metrics';
