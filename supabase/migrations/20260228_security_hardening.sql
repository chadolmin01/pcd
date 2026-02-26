-- Security Hardening Migration
-- Fixes CRITICAL vulnerabilities: session binding, client fingerprint validation

-- Add client_fingerprint column for session-client binding
ALTER TABLE session_analytics
ADD COLUMN IF NOT EXISTS client_fingerprint CHAR(64)
  CHECK (client_fingerprint IS NULL OR client_fingerprint ~ '^[a-f0-9]{64}$');

-- Add index for client fingerprint lookups
CREATE INDEX IF NOT EXISTS idx_session_client_fingerprint
  ON session_analytics(client_fingerprint);

-- Add comment for documentation
COMMENT ON COLUMN session_analytics.client_fingerprint IS 'SHA-256 hash of client identity (IP + User-Agent) for session binding';
