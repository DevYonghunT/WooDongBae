-- ================================================================
-- RLS 정책 강화 마이그레이션
-- 작성일: 2026-01-27
-- 목적: 주요 테이블에 Row Level Security 정책 추가/강화
-- ================================================================

-- ================================================================
-- bookmarks 테이블 RLS
-- ================================================================
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
CREATE POLICY "Users can insert own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- ================================================================
-- keywords 테이블 RLS
-- ================================================================
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own keywords" ON keywords;
CREATE POLICY "Users can manage own keywords"
ON keywords FOR ALL
USING (auth.uid() = user_id);

-- ================================================================
-- notifications 테이블 RLS
-- ================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- ================================================================
-- push_subscriptions 테이블 RLS
-- ================================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions"
ON push_subscriptions FOR ALL
USING (auth.uid() = user_id);

-- ================================================================
-- posts 테이블 RLS (커뮤니티)
-- ================================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon'); -- 비로그인도 글 작성 가능

-- ================================================================
-- feedbacks 테이블 RLS (기존 정책 교체)
-- ================================================================
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 후 새 정책 적용
DROP POLICY IF EXISTS "Enable insert for everyone" ON feedbacks;
DROP POLICY IF EXISTS "Enable read for service role only" ON feedbacks;

DROP POLICY IF EXISTS "Users can submit feedback" ON feedbacks;
CREATE POLICY "Users can submit feedback"
ON feedbacks FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view feedback" ON feedbacks;
CREATE POLICY "Only admins can view feedback"
ON feedbacks FOR SELECT
USING (auth.jwt() ->> 'email' = 'devyongt@gmail.com'); -- 관리자 이메일

-- ================================================================
-- 마이그레이션 완료
-- ================================================================
