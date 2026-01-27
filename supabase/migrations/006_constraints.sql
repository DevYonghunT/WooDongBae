-- ================================================================
-- 데이터 정합성 제약조건 추가 마이그레이션
-- 작성일: 2026-01-27
-- 목적: 데이터 무결성 보장을 위한 제약조건 및 자동 업데이트 트리거
-- ================================================================

-- ================================================================
-- courses 테이블: updated_at 컬럼 및 상태 제약조건
-- ================================================================

-- updated_at 컬럼 추가
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 기존 status CHECK 제약조건 제거 후 확장된 제약조건 추가
-- (기존 제약조건 이름은 PostgreSQL 자동 생성 규칙에 따름)
DO $$
BEGIN
    -- 기존 CHECK 제약조건 제거 시도
    ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_status_check;
    ALTER TABLE courses DROP CONSTRAINT IF EXISTS check_status;

    -- 확장된 상태값 제약조건 추가
    ALTER TABLE courses
    ADD CONSTRAINT check_status CHECK (
        status IN ('접수중', '마감임박', '마감', '접수예정', '접수대기', '추가접수', '모집종료')
    );
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- 이미 존재하면 무시
END $$;

-- ================================================================
-- updated_at 자동 업데이트 트리거
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON courses;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- bookmarks 중복 방지 (user + course 조합 유니크)
-- ================================================================
DO $$
BEGIN
    ALTER TABLE bookmarks
    ADD CONSTRAINT unique_user_course UNIQUE (user_id, course_id);
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- 이미 존재하면 무시
END $$;

-- ================================================================
-- keywords 중복 방지 (user + word 조합 유니크)
-- ================================================================
DO $$
BEGIN
    ALTER TABLE keywords
    ADD CONSTRAINT unique_user_word UNIQUE (user_id, word);
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- 이미 존재하면 무시
END $$;

-- ================================================================
-- 마이그레이션 완료
-- ================================================================
COMMENT ON CONSTRAINT check_status ON courses IS '과정 상태값 제한: 접수중, 마감임박, 마감, 접수예정, 접수대기, 추가접수, 모집종료';
COMMENT ON CONSTRAINT unique_user_course ON bookmarks IS '사용자별 과정 북마크 중복 방지';
COMMENT ON CONSTRAINT unique_user_word ON keywords IS '사용자별 키워드 중복 방지';
