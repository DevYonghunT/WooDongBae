-- ================================================================
-- 알림 시스템 개선 마이그레이션
-- 작성일: 2026-01-26
-- 목적: 알림 설정 및 로그 테이블 추가
-- ================================================================

-- 사용자별 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 알림 채널 ON/OFF
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,

    -- 알림 타입별 설정
    keyword_alert_enabled BOOLEAN DEFAULT true,
    bookmark_alert_enabled BOOLEAN DEFAULT true,
    community_reply_enabled BOOLEAN DEFAULT false,

    -- 알림 수신 시간대 (조용한 시간 설정)
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',

    -- 알림 빈도 제한 (1: 실시간, 2: 1시간 요약, 3: 1일 요약)
    frequency_type INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
ON notification_preferences(user_id);

-- RLS 정책 활성화
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 설정만 조회/수정 가능
CREATE POLICY "Users can view own preferences"
ON notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- ================================================================
-- 알림 전송 로그 테이블 (분석용)
-- ================================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,

    type VARCHAR(50) NOT NULL,  -- 'keyword_match', 'bookmark_reminder', 'community_reply'
    channel VARCHAR(20) NOT NULL,  -- 'email', 'push'
    status VARCHAR(20) NOT NULL,  -- 'sent', 'failed', 'skipped'
    error_message TEXT,

    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent
ON notification_logs(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_type_status
ON notification_logs(type, status);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at
ON notification_logs(sent_at DESC);

-- RLS 정책 활성화
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 로그만 조회 가능
CREATE POLICY "Users can view own logs"
ON notification_logs FOR SELECT
USING (auth.uid() = user_id);

-- 관리자는 모든 로그 조회 가능 (환경변수의 관리자 이메일 사용)
CREATE POLICY "Admins can view all logs"
ON notification_logs FOR SELECT
USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
);

-- 시스템에서만 로그 삽입 가능 (서비스 역할 키 필요)
CREATE POLICY "System can insert logs"
ON notification_logs FOR INSERT
WITH CHECK (true);

-- ================================================================
-- notifications 테이블에 type 컬럼 추가 (기존 테이블이 있다면)
-- ================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'general';
    END IF;
END $$;

-- ================================================================
-- 유틸리티 함수: 알림 로그 기록
-- ================================================================

CREATE OR REPLACE FUNCTION log_notification(
    p_user_id UUID,
    p_notification_id UUID,
    p_type VARCHAR(50),
    p_channel VARCHAR(20),
    p_status VARCHAR(20),
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO notification_logs (
        user_id,
        notification_id,
        type,
        channel,
        status,
        error_message
    ) VALUES (
        p_user_id,
        p_notification_id,
        p_type,
        p_channel,
        p_status,
        p_error_message
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 알림 설정 자동 생성 트리거
-- ================================================================

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 신규 사용자 생성 시 자동으로 기본 설정 생성
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- ================================================================
-- 마이그레이션 완료 메시지
-- ================================================================

COMMENT ON TABLE notification_preferences IS '사용자별 알림 설정 (채널, 시간대, 빈도)';
COMMENT ON TABLE notification_logs IS '알림 전송 로그 (분석 및 디버깅용)';
