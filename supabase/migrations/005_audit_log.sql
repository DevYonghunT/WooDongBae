-- ================================================================
-- 감사 로그 시스템 마이그레이션
-- 작성일: 2026-01-27
-- 목적: 주요 테이블의 변경 이력을 자동으로 기록하는 감사 로그 시스템
-- ================================================================

-- ================================================================
-- 감사 로그 테이블
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,       -- 'insert', 'update', 'delete'
    table_name VARCHAR(50) NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (별도 CREATE INDEX 사용 - PostgreSQL 표준)
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(table_name, record_id);

-- RLS 정책 활성화
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 감사 로그 조회 가능
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (auth.jwt() ->> 'email' = 'devyongt@gmail.com');

-- 시스템에서만 로그 삽입 가능
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- ================================================================
-- 트리거 함수 (자동 감사 로그 기록)
-- ================================================================
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id::TEXT, row_to_json(OLD)::JSONB);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id::TEXT, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (auth.uid(), 'insert', TG_TABLE_NAME, NEW.id::TEXT, row_to_json(NEW)::JSONB);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 중요 테이블에 트리거 적용
-- ================================================================

-- courses 테이블
DROP TRIGGER IF EXISTS audit_courses ON courses;
CREATE TRIGGER audit_courses
AFTER INSERT OR UPDATE OR DELETE ON courses
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- bookmarks 테이블
DROP TRIGGER IF EXISTS audit_bookmarks ON bookmarks;
CREATE TRIGGER audit_bookmarks
AFTER INSERT OR UPDATE OR DELETE ON bookmarks
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- keywords 테이블
DROP TRIGGER IF EXISTS audit_keywords ON keywords;
CREATE TRIGGER audit_keywords
AFTER INSERT OR UPDATE OR DELETE ON keywords
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- posts 테이블
DROP TRIGGER IF EXISTS audit_posts ON posts;
CREATE TRIGGER audit_posts
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- feedbacks 테이블
DROP TRIGGER IF EXISTS audit_feedbacks ON feedbacks;
CREATE TRIGGER audit_feedbacks
AFTER INSERT OR UPDATE OR DELETE ON feedbacks
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ================================================================
-- 마이그레이션 완료
-- ================================================================
COMMENT ON TABLE audit_logs IS '감사 로그 - 주요 테이블의 INSERT/UPDATE/DELETE 변경 이력 자동 기록';
COMMENT ON FUNCTION log_audit() IS '감사 로그 트리거 함수 - 변경 전후 데이터를 JSONB로 기록';
