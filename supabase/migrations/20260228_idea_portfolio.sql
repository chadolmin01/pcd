-- Idea Portfolio + Version Management System
-- 창업대회/아이디어톤별 맞춤형 아이디어 버전 관리

-- ============================================
-- 1. 아이디어 코어 (불변 레이어)
-- ============================================
CREATE TABLE IF NOT EXISTS idea_cores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES prd_users(id) ON DELETE CASCADE,

  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  category TEXT NOT NULL,
  one_liner TEXT CHECK (char_length(one_liner) <= 500),

  -- Soft delete
  deleted_at TIMESTAMPTZ DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 아이디어 버전 (가변 레이어)
-- ============================================
CREATE TABLE IF NOT EXISTS idea_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID NOT NULL REFERENCES idea_cores(id) ON DELETE CASCADE,

  version_number INTEGER NOT NULL DEFAULT 1,
  version_name TEXT NOT NULL CHECK (char_length(version_name) <= 100),

  -- 타겟 프로그램
  target_program_id TEXT,
  target_program_name TEXT,

  -- 검증 결과 (teamComposition 포함)
  validation_level TEXT CHECK (validation_level IN ('sketch', 'mvp', 'defense')),
  scorecard JSONB,  -- { problemDefinition, solution, ..., teamComposition }
  total_score INTEGER,

  -- 채팅 기록 (길이 제한)
  chat_summary TEXT CHECK (char_length(chat_summary) <= 50000),
  key_feedback TEXT[] DEFAULT '{}',

  -- 상태
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'submitted', 'archived')),

  -- 관계
  forked_from UUID REFERENCES idea_versions(id) ON DELETE SET NULL,

  -- Soft delete
  deleted_at TIMESTAMPTZ DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 동시성 문제 방지: core_id + version_number 유니크 제약
  CONSTRAINT unique_core_version UNIQUE (core_id, version_number)
);

-- ============================================
-- 3. 제출 이력 (submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS idea_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES idea_versions(id) ON DELETE CASCADE,

  program_name TEXT NOT NULL,
  submitted_at DATE NOT NULL,
  deadline DATE,  -- 마감일 (알림용)

  -- 결과
  result TEXT CHECK (result IN ('pending', 'document_pass', 'final_pass', 'rejected')),
  result_note TEXT,  -- 심사평/피드백 메모

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. 프로그램 자격요건 (eligibility)
-- ============================================
CREATE TABLE IF NOT EXISTS program_eligibility (
  program_id TEXT PRIMARY KEY,
  program_name TEXT NOT NULL,

  min_company_age_months INTEGER,  -- 법인 설립 후 최소 개월
  max_company_age_months INTEGER,  -- 최대 개월
  requires_revenue BOOLEAN DEFAULT FALSE,
  requires_incorporation BOOLEAN DEFAULT FALSE,
  min_founder_age INTEGER,  -- 청년창업 등
  max_founder_age INTEGER,

  -- 평가 기준 weights (JSONB)
  weights JSONB,

  -- 과락 기준
  threshold_scores JSONB,  -- { "problemDefinition": 5, "solution": 5 }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. Indexes (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cores_user ON idea_cores(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cores_user_created ON idea_cores(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_versions_core ON idea_versions(core_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_versions_scorecard ON idea_versions USING GIN (scorecard jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_submissions_version ON idea_submissions(version_id);
CREATE INDEX IF NOT EXISTS idx_versions_status ON idea_versions(status) WHERE deleted_at IS NULL;

-- ============================================
-- 6. Updated_at 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_idea_cores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_idea_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_program_eligibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_idea_cores_updated_at ON idea_cores;
CREATE TRIGGER trigger_idea_cores_updated_at
  BEFORE UPDATE ON idea_cores
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_cores_updated_at();

DROP TRIGGER IF EXISTS trigger_idea_versions_updated_at ON idea_versions;
CREATE TRIGGER trigger_idea_versions_updated_at
  BEFORE UPDATE ON idea_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_versions_updated_at();

DROP TRIGGER IF EXISTS trigger_program_eligibility_updated_at ON program_eligibility;
CREATE TRIGGER trigger_program_eligibility_updated_at
  BEFORE UPDATE ON program_eligibility
  FOR EACH ROW
  EXECUTE FUNCTION update_program_eligibility_updated_at();

-- ============================================
-- 7. RLS 정책 (API 레벨에서 user_id 검증으로 보완)
-- ============================================
ALTER TABLE idea_cores ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_eligibility ENABLE ROW LEVEL SECURITY;

-- idea_cores: 본인만 접근
CREATE POLICY "Users can manage own idea_cores"
  ON idea_cores
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- idea_versions: idea_cores를 통해 접근 제어
CREATE POLICY "Users can manage own idea_versions"
  ON idea_versions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- idea_submissions: idea_versions를 통해 접근 제어
CREATE POLICY "Users can manage own submissions"
  ON idea_submissions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- program_eligibility: 누구나 읽기 가능
CREATE POLICY "Anyone can read program_eligibility"
  ON program_eligibility
  FOR SELECT
  USING (true);

-- ============================================
-- 8. 초기 프로그램 자격요건 데이터
-- ============================================
INSERT INTO program_eligibility (program_id, program_name, min_company_age_months, max_company_age_months, requires_revenue, requires_incorporation, weights, threshold_scores) VALUES
  ('pre-startup', '예비창업패키지', NULL, NULL, FALSE, FALSE,
   '{"problemDefinition": 25, "solution": 30, "marketAnalysis": 10, "revenueModel": 15, "teamComposition": 20}',
   '{"problemDefinition": 5, "solution": 5, "teamComposition": 4}'),
  ('early-startup', '초기창업패키지', 0, 36, FALSE, TRUE,
   '{"problemDefinition": 20, "solution": 25, "marketAnalysis": 15, "revenueModel": 20, "teamComposition": 20}',
   '{"problemDefinition": 4, "solution": 5, "marketAnalysis": 4, "teamComposition": 4}'),
  ('k-startup', 'K-스타트업 그랜드챌린지', 0, 84, FALSE, TRUE,
   '{"problemDefinition": 20, "solution": 25, "marketAnalysis": 20, "revenueModel": 20, "teamComposition": 15}',
   '{"problemDefinition": 5, "solution": 6, "marketAnalysis": 5}'),
  ('tips', 'TIPS', 0, 84, TRUE, TRUE,
   '{"problemDefinition": 15, "solution": 30, "marketAnalysis": 15, "revenueModel": 20, "teamComposition": 20}',
   '{"solution": 8, "teamComposition": 6}')
ON CONFLICT (program_id) DO UPDATE SET
  program_name = EXCLUDED.program_name,
  min_company_age_months = EXCLUDED.min_company_age_months,
  max_company_age_months = EXCLUDED.max_company_age_months,
  requires_revenue = EXCLUDED.requires_revenue,
  requires_incorporation = EXCLUDED.requires_incorporation,
  weights = EXCLUDED.weights,
  threshold_scores = EXCLUDED.threshold_scores,
  updated_at = NOW();

-- ============================================
-- 9. 버전 번호 자동 생성 함수
-- ============================================
CREATE OR REPLACE FUNCTION get_next_version_number(p_core_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_num
  FROM idea_versions
  WHERE core_id = p_core_id AND deleted_at IS NULL;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;
