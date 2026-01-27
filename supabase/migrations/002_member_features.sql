-- ================================================================
-- 회원 기능 개선 마이그레이션
-- 작성일: 2026-01-27
-- 목적: 프로필, 활동 로그, 탈퇴 사용자 테이블 추가
-- ================================================================

-- ================================================================
-- 사용자 프로필 확장 테이블
-- ================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 기본 정보
    nickname VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,

    -- 통계
    total_bookmarks INTEGER DEFAULT 0,
    total_keywords INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_nickname UNIQUE(nickname)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- RLS 정책 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 프로필 조회 가능
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ================================================================
-- 활동 로그 테이블
-- ================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 활동 정보
    action_type VARCHAR(50) NOT NULL,  -- 'login', 'bookmark_add', 'bookmark_remove', 'keyword_add', 'keyword_remove', 'post_create', 'comment_create'
    target_type VARCHAR(50),  -- 'course', 'post', 'comment', 'keyword'
    target_id VARCHAR(255),

    -- 상세 정보
    description TEXT,
    metadata JSONB,  -- 추가 정보 저장 (유연성)

    -- IP 및 디바이스 정보
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created
ON activity_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type
ON activity_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
ON activity_logs(created_at DESC);

-- RLS 정책 활성화
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 활동 로그만 조회 가능
CREATE POLICY "Users can view own activity logs"
ON activity_logs FOR SELECT
USING (auth.uid() = user_id);

-- 시스템에서만 로그 삽입 가능
CREATE POLICY "System can insert activity logs"
ON activity_logs FOR INSERT
WITH CHECK (true);

-- ================================================================
-- 탈퇴 사용자 정보 보관 테이블
-- ================================================================

CREATE TABLE IF NOT EXISTS deleted_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 원래 사용자 정보
    original_user_id UUID NOT NULL,
    email VARCHAR(255),

    -- 탈퇴 정보
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deletion_reason TEXT,
    feedback TEXT,

    -- 통계 (탈퇴 당시)
    total_bookmarks INTEGER DEFAULT 0,
    total_keywords INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,

    -- 법적 보관 기간 (기본 30일)
    retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_at
ON deleted_users(deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_deleted_users_retention
ON deleted_users(retention_until);

-- RLS 정책 활성화
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
CREATE POLICY "Admins can view deleted users"
ON deleted_users FOR SELECT
USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
);

-- 시스템에서만 삽입 가능
CREATE POLICY "System can insert deleted users"
ON deleted_users FOR INSERT
WITH CHECK (true);

-- ================================================================
-- 자동 프로필 생성 트리거
-- ================================================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, created_at)
    VALUES (NEW.id, NOW())
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 신규 사용자 생성 시 자동으로 프로필 생성
DROP TRIGGER IF EXISTS on_auth_user_profile_created ON auth.users;
CREATE TRIGGER on_auth_user_profile_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- ================================================================
-- 활동 로그 기록 함수
-- ================================================================

CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_target_type VARCHAR(50) DEFAULT NULL,
    p_target_id VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        user_id,
        action_type,
        target_type,
        target_id,
        description,
        metadata
    ) VALUES (
        p_user_id,
        p_action_type,
        p_target_type,
        p_target_id,
        p_description,
        p_metadata
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 프로필 통계 업데이트 함수
-- ================================================================

CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 북마크 카운트 업데이트
    IF TG_TABLE_NAME = 'bookmarks' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE profiles
            SET total_bookmarks = total_bookmarks + 1, updated_at = NOW()
            WHERE id = NEW.user_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE profiles
            SET total_bookmarks = GREATEST(0, total_bookmarks - 1), updated_at = NOW()
            WHERE id = OLD.user_id;
        END IF;
    END IF;

    -- 키워드 카운트 업데이트
    IF TG_TABLE_NAME = 'keywords' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE profiles
            SET total_keywords = total_keywords + 1, updated_at = NOW()
            WHERE id = NEW.user_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE profiles
            SET total_keywords = GREATEST(0, total_keywords - 1), updated_at = NOW()
            WHERE id = OLD.user_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- bookmarks 테이블에 트리거 추가
DROP TRIGGER IF EXISTS update_profile_on_bookmark ON bookmarks;
CREATE TRIGGER update_profile_on_bookmark
    AFTER INSERT OR DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_stats();

-- keywords 테이블에 트리거 추가
DROP TRIGGER IF EXISTS update_profile_on_keyword ON keywords;
CREATE TRIGGER update_profile_on_keyword
    AFTER INSERT OR DELETE ON keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_stats();

-- ================================================================
-- 기존 사용자에 대한 프로필 생성
-- ================================================================

INSERT INTO profiles (id, created_at)
SELECT id, created_at FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 기존 사용자의 통계 초기화
-- ================================================================

UPDATE profiles p
SET
    total_bookmarks = (SELECT COUNT(*) FROM bookmarks WHERE user_id = p.id),
    total_keywords = (SELECT COUNT(*) FROM keywords WHERE user_id = p.id),
    updated_at = NOW();

-- ================================================================
-- 마이그레이션 완료 메시지
-- ================================================================

COMMENT ON TABLE profiles IS '사용자 프로필 확장 정보 (닉네임, 아바타, 통계)';
COMMENT ON TABLE activity_logs IS '사용자 활동 로그 (로그인, 찜, 키워드, 댓글 등)';
COMMENT ON TABLE deleted_users IS '탈퇴한 사용자 정보 보관 (법적 요구사항)';
