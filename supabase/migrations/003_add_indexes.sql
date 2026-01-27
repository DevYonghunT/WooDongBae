-- ================================================================
-- 인덱스 추가 마이그레이션
-- 작성일: 2026-01-27
-- 목적: 주요 테이블 쿼리 성능 최적화
-- ================================================================

-- courses 테이블 (검색 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_courses_region ON courses(region);
CREATE INDEX IF NOT EXISTS idx_courses_institution ON courses(institution);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_title_gin ON courses USING gin(to_tsvector('korean', title)); -- 전문 검색

-- bookmarks 테이블
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_course ON bookmarks(course_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);

-- keywords 테이블
CREATE INDEX IF NOT EXISTS idx_keywords_user ON keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_word ON keywords(word);

-- notifications 테이블
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- push_subscriptions 테이블
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- ================================================================
-- 마이그레이션 완료
-- ================================================================
COMMENT ON INDEX idx_courses_region IS '지역별 검색 최적화';
COMMENT ON INDEX idx_courses_institution IS '기관별 검색 최적화';
COMMENT ON INDEX idx_courses_status IS '상태별 필터링 최적화';
COMMENT ON INDEX idx_courses_created IS '최신순 정렬 최적화';
COMMENT ON INDEX idx_courses_title_gin IS '한국어 전문 검색 인덱스';
