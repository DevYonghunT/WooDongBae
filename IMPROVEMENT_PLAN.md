# 🔍 우동배(WooDongBae) 프로젝트 종합 개선 계획서

> 작성일: 2026-01-26
> 대상: 지자체 도서관 강좌 스크래핑/제공 서비스
> 목표: 상용 서비스 수준으로 회원 기능 및 알림 시스템 고도화

---

## 📊 프로젝트 현황 요약

**기술 스택**: Next.js 16 + React 19 + TypeScript + Supabase + Tailwind CSS
**주요 기능**: 지자체 도서관 강좌 스크래핑/검색, 찜하기, 키워드 알림, 커뮤니티
**배포 환경**: Vercel (추정)

**현재 구현된 기능:**
- ✅ 카카오/구글 소셜 로그인
- ✅ 강좌 검색 및 필터링
- ✅ 찜하기 기능
- ✅ 키워드 알림 (이메일/푸시)
- ✅ 찜한 강좌 일정 알림
- ✅ 커뮤니티 (공지사항/자유게시판)
- ✅ PWA 지원
- ✅ AI 기반 스크래핑 (Playwright + Gemini)

---

## ⚠️ 핵심 문제점 및 개선 우선순위

### 🔴 Priority 1: 회원 기능 및 알림 시스템 강화 (즉시 개선 필요)

현재 회원 기능과 알림 시스템이 상용 서비스 수준에 비해 부족합니다:

**알림 시스템 문제:**
- ❌ 알림 설정 커스터마이징 불가 (시간대, 빈도, 채널 선택 등)
- ❌ 알림 히스토리 관리 미흡
- ❌ 실시간성 부족 (배치 Job 방식)
- ❌ 알림 통계 및 효과 측정 불가

**회원 기능 문제:**
- ❌ 프로필 편집 불가 (닉네임, 프로필 이미지 변경)
- ❌ 회원 활동 히스토리 없음
- ❌ 이메일 회원가입 미지원 (소셜 로그인만 가능)
- ❌ 회원 탈퇴 및 데이터 삭제 기능 없음
- ❌ 이용약관/개인정보 처리방침 미비

**보안 문제:**
- ❌ 커뮤니티 비밀번호 평문 저장 가능성
- ❌ Rate Limiting 부재
- ❌ CSRF 토큰 미흡
- ❌ 환경변수 일부 하드코딩

**성능 문제:**
- ❌ N+1 쿼리 문제 (찜 여부 확인 시)
- ❌ 캐싱 전략 부재
- ❌ DB 인덱스 최적화 필요
- ❌ 테스트 코드 전무

---

## 📝 종합 실행 계획 (우선순위별)

### 🔴 Phase 1: 즉시 개선 (1-2주)
1. **알림 시스템 전면 개선** → [프롬프트 1번 참조](#1️⃣-알림-시스템-전면-개선-최우선)
2. **회원 기능 강화** → [프롬프트 2번 참조](#2️⃣-회원-기능-강화-상용-서비스-수준)
3. **보안 취약점 해결** → [프롬프트 4번 참조](#4️⃣-보안-취약점-해결)

### 🟡 Phase 2: 단기 개선 (2-4주)
4. **데이터베이스 최적화** → [프롬프트 3번 참조](#3️⃣-데이터베이스-최적화-및-보안-강화)
5. **성능 최적화** → [프롬프트 5번 참조](#5️⃣-성능-최적화)
6. **UX 개선** → [프롬프트 6번 참조](#6️⃣-사용자-경험ux-개선)

### 🟢 Phase 3: 중장기 개선 (1-2개월)
7. **테스트 및 모니터링** → [프롬프트 7번 참조](#7️⃣-테스트-및-모니터링)
8. **추가 기능 구현** → [프롬프트 8번 참조](#8️⃣-추가-기능-제안-우선순위-낮음-향후-확장)

---

## 🚀 AI 에이전트 실행 프롬프트 (카테고리별)

> 각 프롬프트는 독립적으로 실행 가능하며, AI 에이전트에 복사/붙여넣기하여 바로 사용할 수 있습니다.

---

## 1️⃣ 알림 시스템 전면 개선 (최우선)

```
# 작업 명: 알림 시스템 상용 서비스 수준 업그레이드

## 배경
현재 알림 기능은 키워드 매칭과 찜한 강좌 일정 알림만 제공하며, 다음 문제들이 있습니다:
- 알림 설정 커스터마이징 불가 (시간대, 빈도, 채널 선택 등)
- 알림 히스토리 관리 미흡 (notifications 테이블은 있으나 활용 제한적)
- 실시간성 부족 (배치 Job 방식)
- 알림 통계 및 효과 측정 불가

## 개선 작업

### 1-1. 알림 설정 테이블 확장
파일: supabase/schema.sql 또는 마이그레이션 파일 생성

다음 테이블을 추가하세요:

```sql
-- 사용자별 알림 설정
CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 알림 채널 ON/OFF
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,

    -- 알림 타입별 설정
    keyword_alert_enabled BOOLEAN DEFAULT true,
    bookmark_alert_enabled BOOLEAN DEFAULT true,
    community_reply_enabled BOOLEAN DEFAULT false, -- 향후 확장

    -- 알림 수신 시간대 (조용한 시간 설정)
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',

    -- 알림 빈도 제한 (1: 실시간, 2: 1시간 요약, 3: 1일 요약)
    frequency_type INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- 알림 전송 로그 (분석용)
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,

    type VARCHAR(50), -- 'keyword_match', 'bookmark_reminder', 'community_reply'
    channel VARCHAR(20), -- 'email', 'push'
    status VARCHAR(20), -- 'sent', 'failed', 'skipped'
    error_message TEXT,

    sent_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_user_sent (user_id, sent_at),
    INDEX idx_type_status (type, status)
);
```

### 1-2. 알림 설정 UI 구현
파일: /components/NotificationSettingsPanel.tsx (새 파일)

다음 기능을 포함하는 알림 설정 패널을 만드세요:
- 알림 채널별 ON/OFF 토글 (이메일, 푸시)
- 알림 타입별 세부 설정 (키워드 알림, 찜 알림 등)
- 조용한 시간 설정 (시작/종료 시간 선택)
- 알림 빈도 선택 (실시간/시간별 요약/일별 요약)
- 테스트 알림 발송 버튼

디자인은 기존 우동배 스타일(Tailwind + Lucide Icons)을 따르되, 다음 UX 원칙을 지키세요:
- 각 설정의 효과를 명확히 설명하는 도움말 툴팁
- 설정 변경 즉시 저장 (낙관적 UI)
- 에러 발생 시 원상복구 및 명확한 에러 메시지

이 컴포넌트를 /app/mypage/page.tsx에 세 번째 카드로 추가하세요.

### 1-3. 알림 히스토리 UI 개선
파일: /components/NotificationModal.tsx

현재 NotificationModal을 다음과 같이 개선하세요:
1. 필터링 기능 추가:
   - 알림 타입별 필터 (전체/키워드/찜/커뮤니티)
   - 읽음/안읽음 필터
   - 날짜 범위 필터

2. 무한 스크롤 구현:
   - 현재 limit(20) 대신 스크롤 시 추가 로드
   - react-intersection-observer 또는 네이티브 IntersectionObserver 사용

3. 알림 액션 추가:
   - 개별 알림 우측에 "다시 보지 않기" 버튼
   - 벌크 삭제 (선택된 항목 삭제)
   - 알림 스누즈 기능 (1시간 후/내일/1주일 후)

4. 알림 통계 섹션:
   - 상단에 "이번 주 받은 알림 통계" 카드 추가
   - 타입별 알림 수, 클릭률 등 표시

### 1-4. 실시간 알림 인프라 구축
파일: /lib/realtime-notification.ts (새 파일)

현재 배치 Job 방식 대신, Supabase Realtime을 활용한 실시간 알림 시스템을 구축하세요:

```typescript
// Supabase Realtime 구독 예시
export function subscribeToRealtimeNotifications(userId: string, onNotification: (noti: Notification) => void) {
    const supabase = createClient();

    const channel = supabase
        .channel('notifications')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                onNotification(payload.new as Notification);
                // 브라우저 알림 표시
                if (Notification.permission === 'granted') {
                    new Notification(payload.new.title, {
                        body: payload.new.message,
                        icon: '/icon.png'
                    });
                }
            }
        )
        .subscribe();

    return () => { channel.unsubscribe(); };
}
```

이를 Header.tsx 또는 layout.tsx에서 사용자 로그인 시 자동 구독하도록 구현하세요.

### 1-5. 스마트 알림 배치 시스템
파일: /scrapers/alert-job.ts, /scrapers/bookmark-alert-job.ts

기존 알림 Job들을 다음과 같이 개선하세요:

1. notification_preferences 테이블 참조:
   - 사용자의 알림 설정 확인 (채널, 조용한 시간, 빈도)
   - 설정에 따라 발송 여부 결정

2. 알림 그룹화 (빈도 설정이 "요약"인 경우):
   - 실시간이 아닌 경우, 임시 큐에 저장
   - 설정된 시간에 한 번에 요약 발송

3. 발송 로그 기록:
   - notification_logs 테이블에 모든 발송 시도 기록
   - 성공/실패 여부, 에러 메시지 저장

4. 실패 재시도 로직:
   - 실패한 알림은 exponential backoff로 3회 재시도
   - 3회 실패 시 사용자에게 "알림 설정 확인 필요" 메시지

예시 코드:
```typescript
// 사용자 설정 확인
const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

// 조용한 시간 체크
const now = new Date();
const currentTime = now.toTimeString().slice(0, 8);
if (prefs.quiet_hours_start < prefs.quiet_hours_end) {
    if (currentTime >= prefs.quiet_hours_start && currentTime <= prefs.quiet_hours_end) {
        console.log('조용한 시간 - 알림 스킵');
        return;
    }
}

// 채널별 발송
if (prefs.email_enabled) {
    const result = await sendEmail(...);
    await logNotification(userId, 'email', result.success ? 'sent' : 'failed');
}
if (prefs.push_enabled) {
    const result = await sendPush(...);
    await logNotification(userId, 'push', result.success ? 'sent' : 'failed');
}
```

### 1-6. 알림 분석 대시보드 (관리자용)
파일: /app/admin/notifications/page.tsx (새 파일)

관리자 페이지에 알림 통계 대시보드를 추가하세요:
- 총 발송 수, 성공률, 실패율
- 타입별 알림 통계
- 사용자별 알림 수신 현황
- 시간대별 발송량 그래프
- 실패 원인 Top 5

데이터는 notification_logs 테이블에서 집계하며, 차트는 간단한 HTML/CSS 막대 그래프 또는 recharts 라이브러리 사용을 권장합니다.

## 예상 결과
이 작업을 완료하면 다음과 같은 효과를 얻을 수 있습니다:
- 사용자가 알림을 세밀하게 제어 가능 (불필요한 알림 방지)
- 알림 전달 안정성 향상 (재시도 로직)
- 실시간 알림으로 사용자 경험 개선
- 알림 효과 측정을 통한 개선 방향 도출
```

---

## 2️⃣ 회원 기능 강화 (상용 서비스 수준)

```
# 작업 명: 회원 관리 시스템 고도화

## 배경
현재 회원 기능은 카카오/구글 소셜 로그인만 지원하며, 다음 기능이 부족합니다:
- 프로필 편집 (닉네임, 프로필 이미지 변경)
- 회원 활동 히스토리 (찜한 강좌 히스토리, 알림 수신 이력)
- 이메일 회원가입 옵션
- 회원 탈퇴 및 데이터 삭제 요청
- 비밀번호 재설정 (이메일 가입 시)

## 개선 작업

### 2-1. 프로필 편집 기능
파일: /components/ProfileEditModal.tsx (새 파일)

프로필 편집 모달을 생성하세요. 다음 기능 포함:
1. 닉네임 변경:
   - 2~20자, 특수문자 제한
   - 중복 체크 (profiles 테이블에 nickname 컬럼 추가 필요)
   - 변경 시 Supabase user_metadata 업데이트

2. 프로필 이미지 변경:
   - Supabase Storage에 업로드 (버킷: 'avatars')
   - 이미지 크기 제한 (2MB 이하)
   - 이미지 압축 및 리사이징 (browser-image-compression 라이브러리 사용)
   - 업로드 진행 상태 표시

3. 기본 정보 표시 (읽기 전용):
   - 가입일
   - 마지막 로그인 일시
   - 가입 방법 (카카오/구글/이메일)

파일: /app/mypage/page.tsx
- 프로필 카드 우측 상단에 "편집" 버튼 추가
- 클릭 시 ProfileEditModal 열기

### 2-2. 활동 히스토리 탭
파일: /app/mypage/history/page.tsx (새 파일)

마이페이지에 "활동 히스토리" 탭을 추가하세요:

```typescript
interface ActivityLog {
    id: string;
    user_id: string;
    action: string; // 'bookmark_added', 'bookmark_removed', 'keyword_added', 'keyword_removed', 'notification_received'
    target_id: string; // 강좌 ID, 키워드 ID 등
    metadata: Record<string, any>; // 액션별 추가 데이터
    created_at: string;
}

// DB 테이블 생성
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    target_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_user_created (user_id, created_at DESC)
);
```

UI 구성:
- 타임라인 형식으로 활동 표시
- 필터: 전체/찜하기/키워드/알림
- 날짜 범위 선택
- 무한 스크롤

각 활동 항목에 관련 강좌로 이동하는 링크 포함.

### 2-3. 이메일 회원가입 추가
파일: /components/EmailSignupModal.tsx (새 파일)

기존 LoginModal에 "이메일로 시작하기" 옵션을 추가하세요:

1. 회원가입 폼:
   - 이메일 (유효성 검사)
   - 비밀번호 (8자 이상, 영문+숫자 포함)
   - 비밀번호 확인
   - 닉네임
   - 이용약관 동의 체크박스

2. Supabase Auth 연동:
```typescript
const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: {
            full_name: nickname,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
    }
});
```

3. 이메일 인증:
   - Supabase에서 자동으로 인증 이메일 발송
   - 인증 완료 전까지 일부 기능 제한 (찜하기 가능, 알림 구독 불가)

4. 비밀번호 재설정:
   - "비밀번호를 잊으셨나요?" 링크 추가
   - 이메일 입력 → 재설정 링크 발송
   - Supabase `resetPasswordForEmail()` 사용

### 2-4. 회원 탈퇴 기능
파일: /app/mypage/delete-account/page.tsx (새 파일)

회원 탈퇴 페이지를 생성하세요:

1. 탈퇴 전 확인 사항 표시:
   - 삭제될 데이터 목록 (찜한 강좌, 알림 키워드, 활동 로그 등)
   - 복구 불가능 경고
   - 재가입 시 새 계정으로 시작됨을 안내

2. 탈퇴 사유 선택 (선택사항):
   - 드롭다운: "서비스가 유용하지 않음", "개인정보 우려", "사용 빈도 낮음", "기타"
   - 기타 선택 시 텍스트 입력란

3. 확인 절차:
   - "정말로 탈퇴하시겠습니까?" 체크박스
   - 소셜 로그인 사용자: "확인" 버튼 클릭
   - 이메일 사용자: 비밀번호 재입력 필수

4. 탈퇴 처리:
```typescript
// 서버 액션: /app/actions/delete-account.ts
export async function deleteAccount(userId: string, reason?: string) {
    // 1. 연관 데이터 삭제 (CASCADE로 자동 삭제되지 않는 것들)
    await supabase.from('activity_logs').delete().eq('user_id', userId);
    await supabase.from('notification_logs').delete().eq('user_id', userId);

    // 2. 탈퇴 로그 저장 (통계용, 별도 테이블)
    await supabase.from('deleted_users').insert({
        original_user_id: userId,
        deleted_at: new Date(),
        reason
    });

    // 3. Supabase Auth 계정 삭제
    await supabaseAdmin.auth.admin.deleteUser(userId);

    // 4. 쿠키 삭제 및 로그아웃
    await supabase.auth.signOut();
}
```

### 2-5. 개인정보 처리방침 및 이용약관 페이지
파일: /app/terms/page.tsx, /app/privacy/page.tsx (새 파일)

법적 요구사항을 충족하기 위한 페이지를 생성하세요:

1. 이용약관 (/terms):
   - 서비스 이용 규칙
   - 금지 행위
   - 면책 조항
   - 서비스 변경/중단 안내

2. 개인정보 처리방침 (/privacy):
   - 수집하는 정보 (이메일, 닉네임, 프로필 이미지, 활동 로그)
   - 정보 사용 목적
   - 정보 보관 기간
   - 제3자 제공 여부 (Supabase, Resend 등)
   - 사용자 권리 (열람, 정정, 삭제 요청)
   - 쿠키 사용

Footer에 링크 추가.

### 2-6. 계정 보안 설정
파일: /app/mypage/security/page.tsx (새 파일)

보안 설정 페이지 추가:
1. 비밀번호 변경 (이메일 가입자만):
   - 현재 비밀번호 확인
   - 새 비밀번호 입력 (강도 표시)
   - Supabase `updateUser()` 사용

2. 로그인 세션 관리:
   - 현재 활성 세션 목록 (기기, 위치, 마지막 활동 시간)
   - 다른 기기에서 로그아웃 버튼

3. 2단계 인증 (향후 확장):
   - 현재는 "준비 중" 상태로 표시

## 예상 결과
- 사용자가 자신의 정보를 직접 관리 가능
- 법적 리스크 감소 (이용약관, 개인정보 처리방침)
- 다양한 가입 방법 제공으로 사용자 유입 증가
- 회원 이탈 시 데이터 완전 삭제로 GDPR 준수
```

---

## 3️⃣ 데이터베이스 최적화 및 보안 강화

```
# 작업 명: DB 성능 및 보안 개선

## 배경
현재 DB는 기본 스키마만 있고 다음이 부족합니다:
- 인덱스 최적화
- RLS(Row Level Security) 정책 보완
- 감사 로그 (누가 언제 무엇을 했는지)
- 데이터 백업 및 복구 전략

## 개선 작업

### 3-1. 인덱스 추가
파일: supabase/migrations/001_add_indexes.sql (새 파일)

다음 인덱스를 추가하세요:

```sql
-- courses 테이블 (검색 쿼리 최적화)
CREATE INDEX idx_courses_region ON courses(region);
CREATE INDEX idx_courses_institution ON courses(institution);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_created ON courses(created_at DESC);
CREATE INDEX idx_courses_title_gin ON courses USING gin(to_tsvector('korean', title)); -- 전문 검색

-- bookmarks 테이블
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_course ON bookmarks(course_id);
CREATE INDEX idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);

-- keywords 테이블
CREATE INDEX idx_keywords_user ON keywords(user_id);
CREATE INDEX idx_keywords_word ON keywords(word);

-- notifications 테이블
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- push_subscriptions 테이블
CREATE INDEX idx_push_user ON push_subscriptions(user_id);
```

### 3-2. RLS 정책 강화
파일: supabase/migrations/002_enhance_rls.sql (새 파일)

```sql
-- bookmarks 테이블 RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- keywords 테이블 RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own keywords"
ON keywords FOR ALL
USING (auth.uid() = user_id);

-- notifications 테이블 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- push_subscriptions 테이블 RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
ON push_subscriptions FOR ALL
USING (auth.uid() = user_id);

-- posts 테이블 RLS (커뮤니티)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon'); -- 비로그인도 글 작성 가능

-- feedbacks 테이블 RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback"
ON feedbacks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view feedback"
ON feedbacks FOR SELECT
USING (auth.email() = 'devyongt@gmail.com'); -- 관리자 이메일
```

### 3-3. 감사 로그 시스템
파일: supabase/migrations/003_audit_log.sql (새 파일)

```sql
-- 감사 로그 테이블
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete'
    table_name VARCHAR(50) NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_audit_user (user_id),
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_created (created_at DESC)
);

-- 트리거 함수 (자동 감사 로그 기록)
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id::TEXT, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id::TEXT, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (auth.uid(), 'insert', TG_TABLE_NAME, NEW.id::TEXT, row_to_json(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 중요 테이블에 트리거 적용
CREATE TRIGGER audit_courses
AFTER INSERT OR UPDATE OR DELETE ON courses
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_bookmarks
AFTER INSERT OR UPDATE OR DELETE ON bookmarks
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- (필요한 테이블에 동일하게 적용)
```

### 3-4. 데이터 정합성 제약조건 추가
파일: supabase/migrations/004_constraints.sql (새 파일)

```sql
-- courses 테이블에 추가 필드 및 제약조건
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD CONSTRAINT check_status CHECK (status IN ('접수중', '마감임박', '마감', '접수예정', '접수대기', '추가접수', '모집종료'));

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- bookmarks 중복 방지 (user + course 조합 유니크)
ALTER TABLE bookmarks
ADD CONSTRAINT unique_user_course UNIQUE (user_id, course_id);

-- keywords 중복 방지
ALTER TABLE keywords
ADD CONSTRAINT unique_user_word UNIQUE (user_id, word);
```

### 3-5. 데이터 백업 전략 문서화
파일: /docs/database-backup.md (새 파일)

Supabase 백업 전략을 문서화하세요:

```markdown
# 데이터베이스 백업 및 복구 전략

## 자동 백업 (Supabase 기본 제공)
- Supabase는 매일 자동 백업 수행 (최근 7일 보관)
- Dashboard > Settings > Backups에서 확인 가능
- Point-in-Time Recovery (PITR) 활성화 권장 (Pro 플랜 이상)

## 수동 백업
정기적으로 중요 데이터를 로컬에 백업하세요:

```bash
# PostgreSQL dump 생성
pg_dump -h db.xxxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# 특정 테이블만 백업
pg_dump -h db.xxxx.supabase.co -U postgres -d postgres -t courses -t bookmarks > partial_backup.sql
```

## 복구 절차
1. Supabase Dashboard에서 복구 포인트 선택
2. 새 프로젝트로 복원 (테스트 후 전환)
3. 또는 SQL 파일로 복원: `psql -h ... -U postgres -d postgres < backup.sql`

## 백업 스케줄
- 매일 자동: Supabase
- 매주 수동: 중요 테이블 로컬 백업
- 매월: 전체 DB 덤프 + 외부 저장소(AWS S3 등)에 보관
```

## 예상 결과
- 쿼리 성능 대폭 향상 (인덱스)
- 데이터 무결성 보장 (제약조건)
- 보안 강화 (RLS)
- 장애 대응 능력 향상 (백업/복구)
- 규제 준수 (감사 로그)
```

---

## 4️⃣ 보안 취약점 해결

```
# 작업 명: 보안 취약점 제거 및 강화

## 배경
다음 보안 이슈들이 발견되었습니다:
- 커뮤니티 게시글 비밀번호가 평문일 가능성
- Rate limiting 부재 (무차별 대입 공격, 스팸 방지)
- CSRF 토큰 부재
- 환경변수 일부 하드코딩
- XSS 취약점 가능성

## 개선 작업

### 4-1. 커뮤니티 비밀번호 암호화
파일: /app/actions/community.ts

현재 posts 테이블의 password 필드 처리를 확인하고 암호화하세요:

```typescript
import { hash, compare } from 'bcryptjs';

// 게시글 작성 시
export async function createPost(formData: FormData) {
    const password = formData.get('password') as string;

    // bcrypt로 해싱 (saltRounds: 10)
    const hashedPassword = await hash(password, 10);

    const { data, error } = await supabase.from('posts').insert({
        title: formData.get('title'),
        content: formData.get('content'),
        password: hashedPassword, // 해시 저장
        nickname: formData.get('nickname'),
        tag: formData.get('tag'),
    });

    return { data, error };
}

// 게시글 삭제 시 비밀번호 확인
export async function deletePost(postId: string, inputPassword: string) {
    // 1. DB에서 게시글 조회
    const { data: post } = await supabase
        .from('posts')
        .select('password')
        .eq('id', postId)
        .single();

    if (!post) return { error: '게시글을 찾을 수 없습니다.' };

    // 2. 비밀번호 검증
    const isValid = await compare(inputPassword, post.password);
    if (!isValid) return { error: '비밀번호가 일치하지 않습니다.' };

    // 3. 삭제
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    return { error };
}
```

의존성 추가: `npm install bcryptjs @types/bcryptjs`

### 4-2. Rate Limiting 구현
파일: /lib/rate-limiter.ts (새 파일)

Upstash Redis 또는 간단한 메모리 기반 Rate Limiter를 구현하세요:

```typescript
// 메모리 기반 간단한 Rate Limiter (개발/소규모용)
const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    identifier: string, // IP 주소 또는 user ID
    maxRequests: number, // 허용 횟수
    windowMs: number // 시간 창 (밀리초)
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = requests.get(identifier);

    if (!record || now > record.resetAt) {
        // 새 윈도우 시작
        const resetAt = now + windowMs;
        requests.set(identifier, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (record.count >= maxRequests) {
        // 한도 초과
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    // 카운트 증가
    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// 주기적으로 만료된 항목 정리
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requests.entries()) {
        if (now > value.resetAt) {
            requests.delete(key);
        }
    }
}, 60000); // 1분마다
```

파일: /middleware.ts
미들웨어에 Rate Limiting 적용:

```typescript
import { checkRateLimit } from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
    // API 라우트에만 적용
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        const { allowed, remaining, resetAt } = checkRateLimit(ip, 100, 60000); // 분당 100회

        if (!allowed) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
                    'X-RateLimit-Remaining': '0',
                },
            });
        }

        const response = NextResponse.next({ request: { headers: request.headers } });
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        return response;
    }

    // 기존 로직...
}
```

### 4-3. CSRF 보호 강화
파일: /lib/csrf.ts (새 파일)

Next.js는 기본적으로 CSRF 보호가 되지만, 민감한 작업에는 추가 토큰을 사용하세요:

```typescript
import { cookies } from 'next/headers';
import crypto from 'crypto';

export function generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export async function setCSRFToken(): Promise<string> {
    const token = generateCSRFToken();
    (await cookies()).set('csrf-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1일
    });
    return token;
}

export async function verifyCSRFToken(token: string): Promise<boolean> {
    const storedToken = (await cookies()).get('csrf-token')?.value;
    return storedToken === token && token.length === 64;
}
```

파일: /app/actions/*.ts
모든 서버 액션에 CSRF 검증 추가:

```typescript
export async function deletePost(formData: FormData) {
    const csrfToken = formData.get('csrf-token') as string;
    if (!await verifyCSRFToken(csrfToken)) {
        return { error: 'Invalid CSRF token' };
    }

    // 기존 로직...
}
```

### 4-4. XSS 방지
파일: 모든 사용자 입력을 표시하는 컴포넌트

React는 기본적으로 XSS를 방어하지만, `dangerouslySetInnerHTML`을 사용하는 곳이 있다면 제거하세요.

커뮤니티 게시글 등에서 사용자 입력을 렌더링할 때:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// 사용자 입력 sanitize
const cleanContent = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href']
});

// 렌더링
<div dangerouslySetInnerHTML={{ __html: cleanContent }} />
```

의존성: `npm install isomorphic-dompurify`

또는 더 간단하게, HTML을 허용하지 않고 일반 텍스트만 표시:
```typescript
<p className="whitespace-pre-wrap">{post.content}</p>
```

### 4-5. 환경변수 하드코딩 제거
파일: /app/api/kakao-callback/route.ts, /middleware.ts 등

코드에 하드코딩된 값들을 환경변수로 이동:

```typescript
// ❌ 하드코딩 (현재)
const ADMIN_EMAIL = "devyongt@gmail.com";
const KAKAO_CLIENT_ID = "b6a8f2791cd23f7995b4fba26c649c20";

// ✅ 환경변수로 이동
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;

if (!ADMIN_EMAIL || !KAKAO_CLIENT_ID) {
    throw new Error('Missing required environment variables');
}
```

.env.local.example 파일 생성:
```
# Admin
ADMIN_EMAIL=your-email@example.com

# Kakao OAuth
KAKAO_CLIENT_ID=your-client-id
KAKAO_CLIENT_SECRET=your-client-secret

# ... (기타 환경변수)
```

### 4-6. 보안 헤더 추가
파일: /next.config.ts

Next.js 설정에 보안 헤더 추가:

```typescript
const nextConfig = {
    // 기존 설정...

    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
        ];
    },
};
```

## 예상 결과
- 비밀번호 탈취 시에도 평문 노출 방지
- 자동화 공격(봇, 스크래핑) 차단
- CSRF 공격 방어
- 민감 정보 유출 방지
- XSS 공격 차단
```

---

## 5️⃣ 성능 최적화

```
# 작업 명: 프론트엔드 및 백엔드 성능 개선

## 배경
다음 성능 이슈가 있습니다:
- N+1 쿼리 문제 (찜 여부 확인 시)
- 캐싱 전략 부재
- 이미지 최적화 부족
- 페이지네이션 대신 무한 스크롤 필요

## 개선 작업

### 5-1. N+1 쿼리 해결
파일: /lib/db-api.ts

현재 `getPaginatedCourses` 함수는 찜 여부를 별도 쿼리로 확인합니다. 이를 단일 쿼리로 최적화:

```typescript
// ❌ 기존 (N+1 문제)
// 1. 강좌 목록 조회
const courses = await getCourses();
// 2. 각 강좌마다 찜 여부 확인
for (const course of courses) {
    const isBookmarked = await checkBookmark(course.id, userId);
}

// ✅ 개선 (단일 쿼리)
export async function getPaginatedCourses(...) {
    // 강좌 목록 조회 (기존과 동일)
    const { data: coursesData } = await query...;

    if (!userId) return coursesData.map(mapRawToCourse);

    // 찜 목록을 한 번에 조회
    const courseIds = coursesData.map(c => c.id);
    const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('course_id')
        .eq('user_id', userId)
        .in('course_id', courseIds);

    const bookmarkedSet = new Set(bookmarks?.map(b => b.course_id) || []);

    // 매핑
    return coursesData.map(c => ({
        ...mapRawToCourse(c),
        isBookmarked: bookmarkedSet.has(c.id)
    }));
}
```

이미 구현되어 있다면 확인만 하세요.

### 5-2. React Query 도입 (캐싱)
파일: /app/providers.tsx (새 파일)

React Query를 도입하여 클라이언트 사이드 캐싱 및 상태 관리를 개선:

```bash
npm install @tanstack/react-query
```

```typescript
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1분
                cacheTime: 5 * 60 * 1000, // 5분
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
```

파일: /app/layout.tsx
```typescript
import { Providers } from './providers';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
```

파일: /components/CourseExplorer.tsx
React Query로 강좌 목록 조회:

```typescript
import { useQuery } from '@tanstack/react-query';

export default function CourseExplorer() {
    const { data: courses, isLoading } = useQuery({
        queryKey: ['courses', page, filters],
        queryFn: () => fetchCourses(page, filters),
        keepPreviousData: true, // 페이지 전환 시 이전 데이터 유지
    });

    // 렌더링...
}
```

### 5-3. Next.js ISR (Incremental Static Regeneration) 활용
파일: /app/page.tsx, /app/courses/[id]/page.tsx

정적 생성 + 주기적 재생성으로 성능 개선:

```typescript
// 메인 페이지
export const revalidate = 300; // 5분마다 재생성

export default async function HomePage() {
    const courses = await getRecommendedCourses();
    return <div>...</div>;
}

// 강좌 상세 페이지
export const revalidate = 600; // 10분마다 재생성

export async function generateStaticParams() {
    // 인기 강좌 100개만 빌드 시 미리 생성
    const { data } = await supabase
        .from('courses')
        .select('id')
        .limit(100);

    return data?.map(c => ({ id: c.id.toString() })) || [];
}

export default async function CoursePage({ params }: { params: { id: string } }) {
    const course = await getCourseById(params.id);
    return <div>...</div>;
}
```

### 5-4. 이미지 최적화
파일: /components/CourseCard.tsx, /app/courses/[id]/page.tsx

Next.js Image 컴포넌트 사용:

```typescript
import Image from 'next/image';

// ❌ 기존
<img src={course.imageUrl} alt={course.title} />

// ✅ 개선
<Image
    src={course.imageUrl}
    alt={course.title}
    width={800}
    height={600}
    placeholder="blur"
    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    className="rounded-lg"
    priority={index < 4} // 상위 4개만 우선 로드
/>
```

파일: /next.config.ts
외부 이미지 도메인 허용:

```typescript
const nextConfig = {
    images: {
        domains: ['images.unsplash.com', 'via.placeholder.com', 'placehold.co'],
        formats: ['image/avif', 'image/webp'],
    },
};
```

### 5-5. 무한 스크롤 구현
파일: /components/CourseExplorer.tsx

기존 페이지네이션 대신 무한 스크롤:

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

export default function CourseExplorer() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['courses', filters],
        queryFn: ({ pageParam = 1 }) => fetchCourses(pageParam, 20, filters),
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.length < 20) return undefined; // 마지막 페이지
            return pages.length + 1;
        },
    });

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    return (
        <div>
            {data?.pages.map((page, i) => (
                <React.Fragment key={i}>
                    {page.map(course => <CourseCard key={course.id} course={course} />)}
                </React.Fragment>
            ))}

            {/* 센티널 요소 (화면에 보이면 다음 페이지 로드) */}
            <div ref={ref} className="h-10">
                {isFetchingNextPage && <LoadingSpinner />}
            </div>
        </div>
    );
}
```

의존성: `npm install react-intersection-observer`

### 5-6. 코드 스플리팅 및 지연 로딩
파일: 무거운 컴포넌트들

```typescript
import dynamic from 'next/dynamic';

// 지도는 사용자가 상세 페이지에 들어올 때만 로드
const KakaoMap = dynamic(() => import('@/components/KakaoMap'), {
    ssr: false, // 서버 사이드 렌더링 비활성화
    loading: () => <div>지도 로딩 중...</div>,
});

// 커뮤니티 글쓰기 모달도 필요할 때만 로드
const WritePostModal = dynamic(() => import('@/components/WritePostModal'));
```

### 5-7. DB 쿼리 결과 캐싱 (서버 사이드)
파일: /lib/cache.ts (새 파일)

간단한 메모리 캐시:

```typescript
interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

export async function cachedQuery<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
): Promise<T> {
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now < cached.expiresAt) {
        return cached.data;
    }

    const data = await fetcher();
    cache.set(key, {
        data,
        expiresAt: now + ttlSeconds * 1000,
    });

    return data;
}

// 사용 예
export async function getFilterMetadata() {
    return cachedQuery(
        'filter-metadata',
        () => supabase.from('courses').select('region, institution'),
        300 // 5분 캐시
    );
}
```

## 예상 결과
- 페이지 로드 속도 50% 향상
- 데이터베이스 쿼리 수 70% 감소
- 이미지 로딩 시간 단축
- 더 부드러운 UX (무한 스크롤)
- 서버 비용 절감 (캐싱)
```

---

## 6️⃣ 사용자 경험(UX) 개선

```
# 작업 명: UX 개선 및 접근성 강화

## 배경
다음 UX 이슈가 있습니다:
- 에러 메시지 일관성 부족
- 로딩 상태 표시 미흡
- 모바일 반응형 디자인 개선 여지
- 키보드 네비게이션 및 스크린 리더 지원 부족

## 개선 작업

### 6-1. 전역 Toast 시스템 구현
파일: /components/Toast.tsx (새 파일)

일관된 알림 메시지 표시:

```bash
npm install react-hot-toast
```

```typescript
'use client';
import { Toaster, toast } from 'react-hot-toast';

export function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#1f2937',
                    color: '#fff',
                },
                success: {
                    icon: '🍊',
                },
                error: {
                    icon: '❌',
                },
            }}
        />
    );
}

// 사용 예
import { toast } from 'react-hot-toast';

toast.success('찜 목록에 추가되었습니다!');
toast.error('로그인이 필요합니다.');
toast.loading('처리 중...');
```

파일: /app/layout.tsx
```typescript
import { ToastProvider } from '@/components/Toast';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                {children}
                <ToastProvider />
            </body>
        </html>
    );
}
```

모든 `alert()` 호출을 `toast()`로 교체하세요.

### 6-2. 전역 로딩 상태 관리
파일: /components/GlobalLoadingBar.tsx (새 파일)

페이지 전환 시 진행 상태 표시:

```bash
npm install nprogress
```

```typescript
'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

export function GlobalLoadingBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        NProgress.done();
    }, [pathname, searchParams]);

    useEffect(() => {
        const handleStart = () => NProgress.start();
        const handleComplete = () => NProgress.done();

        // Next.js 라우트 변경 이벤트 (App Router에서는 수동 처리 필요)
        window.addEventListener('beforeunload', handleStart);

        return () => {
            window.removeEventListener('beforeunload', handleStart);
        };
    }, []);

    return null;
}
```

파일: /app/layout.tsx에 추가.

### 6-3. 스켈레톤 로딩 UI
파일: /components/Skeleton.tsx (새 파일)

로딩 중 스켈레톤 표시:

```typescript
export function CourseSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
    );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CourseSkeleton key={i} />
            ))}
        </div>
    );
}
```

파일: /app/page.tsx
```typescript
import { Suspense } from 'react';
import { SkeletonList } from '@/components/Skeleton';

export default function HomePage() {
    return (
        <Suspense fallback={<SkeletonList />}>
            <CourseList />
        </Suspense>
    );
}
```

### 6-4. 반응형 디자인 개선
파일: 모든 컴포넌트

Tailwind 반응형 클래스 확인 및 개선:

```typescript
// ❌ 모바일에서 잘림
<div className="grid grid-cols-3 gap-4">

// ✅ 모바일 1열, 태블릿 2열, 데스크톱 3열
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ 모바일에서 텍스트 너무 큼
<h1 className="text-4xl font-bold">

// ✅ 반응형 텍스트
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">

// ❌ 모바일에서 패딩 과도
<div className="px-8 py-12">

// ✅ 반응형 패딩
<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
```

특히 NotificationModal, LoginModal 등 모달들의 모바일 대응 확인.

### 6-5. 접근성(A11y) 개선
파일: 모든 인터랙티브 컴포넌트

ARIA 속성 및 시맨틱 HTML 추가:

```typescript
// ❌ 접근성 부족
<div onClick={handleClick}>클릭</div>

// ✅ 버튼으로 변경 + 키보드 지원
<button
    onClick={handleClick}
    onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    aria-label="강좌 찜하기"
    className="..."
>
    클릭
</button>

// ❌ 이미지 alt 누락
<img src="..." />

// ✅ alt 추가
<img src="..." alt="수영 강좌 썸네일" />

// ❌ 폼 라벨 없음
<input type="text" placeholder="검색" />

// ✅ 라벨 추가
<label htmlFor="search" className="sr-only">강좌 검색</label>
<input id="search" type="text" placeholder="검색" />

// 모달 접근성
<div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
>
    <h2 id="modal-title">로그인</h2>
    ...
</div>
```

파일: /tailwind.config.ts
스크린 리더 전용 클래스 추가:

```typescript
module.exports = {
    theme: {
        extend: {
            // 기존 설정...
        },
    },
    plugins: [
        function({ addUtilities }) {
            addUtilities({
                '.sr-only': {
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: '0',
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    borderWidth: '0',
                },
            });
        },
    ],
};
```

### 6-6. 폼 유효성 검사 개선
파일: /components/WritePostModal.tsx, /components/LoginModal.tsx 등

React Hook Form + Zod로 폼 관리:

```bash
npm install react-hook-form zod @hookform/resolvers
```

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const postSchema = z.object({
    title: z.string().min(2, '제목은 2자 이상이어야 합니다.').max(100, '제목은 100자 이하여야 합니다.'),
    content: z.string().min(10, '내용은 10자 이상이어야 합니다.'),
    password: z.string().min(4, '비밀번호는 4자 이상이어야 합니다.'),
    nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다.'),
    tag: z.string(),
});

type PostForm = z.infer<typeof postSchema>;

export default function WritePostModal() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PostForm>({
        resolver: zodResolver(postSchema),
    });

    const onSubmit = async (data: PostForm) => {
        // 제출 로직...
        toast.success('게시글이 등록되었습니다!');
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div>
                <input {...register('title')} placeholder="제목" />
                {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            <div>
                <textarea {...register('content')} placeholder="내용" />
                {errors.content && <p className="text-red-500 text-sm">{errors.content.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '작성 중...' : '작성하기'}
            </button>
        </form>
    );
}
```

### 6-7. 빈 상태(Empty State) 개선
파일: 데이터가 없을 때 표시되는 모든 컴포넌트

현재 "데이터가 없습니다" 메시지를 더 친근하고 액션 가능하게:

```typescript
// ❌ 기존
{courses.length === 0 && <p>강좌가 없습니다.</p>}

// ✅ 개선
{courses.length === 0 && (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-10 h-10 text-orange-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
            검색 결과가 없어요
        </h3>
        <p className="text-gray-500 mb-6">
            다른 키워드로 검색해보시거나<br />
            필터 조건을 변경해보세요.
        </p>
        <button
            onClick={resetFilters}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600"
        >
            필터 초기화
        </button>
    </div>
)}
```

## 예상 결과
- 일관된 사용자 경험
- 시각적 피드백 증가 (로딩, 성공/실패)
- 모바일 사용성 향상
- 장애인 사용자도 접근 가능
- 폼 입력 오류 감소
```

---

## 7️⃣ 테스트 및 모니터링

```
# 작업 명: 테스트 인프라 구축 및 모니터링 설정

## 배경
현재 테스트 코드가 전혀 없으며, 에러 추적 시스템도 부재합니다.
상용 서비스는 반드시 테스트 및 모니터링이 필요합니다.

## 개선 작업

### 7-1. 단위 테스트 설정
파일: jest.config.js (새 파일)

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
};

module.exports = createJestConfig(customJestConfig);
```

파일: jest.setup.js
```javascript
import '@testing-library/jest-dom';
```

파일: __tests__/components/BookmarkButton.test.tsx (예시)
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookmarkButton from '@/components/BookmarkButton';

jest.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } }
            })
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null })
        }))
    })
}));

describe('BookmarkButton', () => {
    it('찜하기 버튼이 렌더링된다', () => {
        render(<BookmarkButton courseId={123} />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('클릭 시 찜 상태가 토글된다', async () => {
        render(<BookmarkButton courseId={123} />);
        const button = screen.getByRole('button');

        fireEvent.click(button);

        await waitFor(() => {
            // 하트 아이콘이 채워졌는지 확인
            expect(button.querySelector('.fill-current')).toBeInTheDocument();
        });
    });
});
```

package.json에 스크립트 추가:
```json
{
    "scripts": {
        "test": "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage"
    }
}
```

### 7-2. E2E 테스트 (Playwright)
Playwright는 이미 설치되어 있으므로 테스트만 추가:

파일: e2e/courses.spec.ts (새 파일)
```typescript
import { test, expect } from '@playwright/test';

test.describe('강좌 검색 및 찜하기', () => {
    test('메인 페이지에서 강좌 목록이 표시된다', async ({ page }) => {
        await page.goto('/');

        // 강좌 카드가 최소 1개 이상 있는지
        const courseCards = page.locator('[data-testid="course-card"]');
        await expect(courseCards).toHaveCountGreaterThan(0);
    });

    test('로그인하지 않고 찜하기를 누르면 로그인 모달이 뜬다', async ({ page }) => {
        await page.goto('/');

        // 첫 번째 강좌의 찜 버튼 클릭
        await page.locator('[data-testid="bookmark-button"]').first().click();

        // 로그인 모달이 표시되는지
        await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    });

    test('카카오 로그인 플로우가 동작한다', async ({ page }) => {
        await page.goto('/');

        // 로그인 버튼 클릭
        await page.click('text=로그인');

        // 카카오 로그인 버튼 클릭
        await page.click('text=카카오로 시작하기');

        // 카카오 OAuth 페이지로 리다이렉트 확인
        await expect(page).toHaveURL(/kauth.kakao.com/);
    });
});
```

package.json:
```json
{
    "scripts": {
        "test:e2e": "playwright test",
        "test:e2e:ui": "playwright test --ui"
    }
}
```

### 7-3. Sentry 에러 추적
파일: sentry.client.config.ts, sentry.server.config.ts (새 파일)

```bash
npx @sentry/wizard@latest -i nextjs
```

위 명령어로 자동 설정 후, 추가 설정:

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,

    beforeSend(event, hint) {
        // 민감 정보 필터링
        if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
        }
        return event;
    },
});
```

파일: /lib/error-handler.ts (새 파일)
```typescript
import * as Sentry from '@sentry/nextjs';

export function reportError(error: Error, context?: Record<string, any>) {
    console.error('Error:', error);

    if (process.env.NODE_ENV === 'production') {
        Sentry.captureException(error, {
            extra: context,
        });
    }
}

// 사용 예
try {
    await supabase.from('courses').insert(...);
} catch (error) {
    reportError(error as Error, { action: 'insert_course', userId });
    toast.error('오류가 발생했습니다. 다시 시도해주세요.');
}
```

### 7-4. 성능 모니터링 (Vercel Analytics)
파일: /app/layout.tsx

Vercel에 배포된 경우 자동으로 Analytics 활성화되지만, 명시적으로 추가:

```bash
npm install @vercel/analytics
```

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
```

### 7-5. 사용자 행동 추적 (Google Analytics 4)
파일: /app/layout.tsx

이미 gtag.js가 추가되어 있다면 확인만, 없다면 추가:

```typescript
import Script from 'next/script';

export default function RootLayout({ children }) {
    return (
        <html>
            <head>
                <Script
                    src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                    `}
                </Script>
            </head>
            <body>{children}</body>
        </html>
    );
}
```

파일: /lib/analytics.ts (새 파일)
커스텀 이벤트 추적:

```typescript
export function trackEvent(name: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', name, params);
    }
}

// 사용 예
trackEvent('bookmark_added', { course_id: 123, course_title: '수영 초급반' });
trackEvent('search', { search_term: '요가', result_count: 15 });
```

### 7-6. 헬스체크 엔드포인트
파일: /app/api/health/route.ts (새 파일)

시스템 상태 확인용 엔드포인트:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const checks = {
        api: 'ok',
        database: 'unknown',
        timestamp: new Date().toISOString(),
    };

    try {
        // DB 연결 확인
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase.from('courses').select('id').limit(1);
        checks.database = error ? 'error' : 'ok';
    } catch (error) {
        checks.database = 'error';
    }

    const allOk = Object.values(checks).every(v => v === 'ok' || typeof v === 'string' && v !== 'error');

    return NextResponse.json(checks, {
        status: allOk ? 200 : 503,
    });
}
```

외부 모니터링 서비스(UptimeRobot, Pingdom 등)에서 주기적으로 호출.

## 예상 결과
- 배포 전 버그 조기 발견
- 프로덕션 에러 실시간 감지
- 성능 병목 지점 파악
- 사용자 행동 패턴 분석
- 서비스 안정성 향상
```

---

## 8️⃣ 추가 기능 제안 (우선순위 낮음, 향후 확장)

```
# 작업 명: 추가 기능 구현 (장기 로드맵)

## 다음 기능들은 즉시 필요하지 않지만, 향후 고려할 수 있습니다:

### 8-1. 강좌 리뷰 및 평점 시스템
- 수강 후기 작성
- 별점 평가
- 도움이 되었어요 투표

### 8-2. 소셜 기능
- 친구 추가 및 팔로우
- 찜한 강좌 공유
- 추천 강좌 공유

### 8-3. AI 기반 추천 시스템
- 사용자 취향 분석 (찜한 강좌, 검색 이력)
- 개인화된 강좌 추천
- 유사한 강좌 찾기

### 8-4. 캘린더 연동
- 강좌 일정을 Google Calendar/Outlook에 추가
- iCal 파일 다운로드

### 8-5. 강좌 알림 채널 확장
- 카카오톡 알림톡 (비용 발생)
- SMS 알림 (중요 강좌만)
- Slack/Discord 웹훅 (커뮤니티용)

### 8-6. 관리자 기능 강화
- 강좌 수동 등록/편집 UI
- 사용자 관리 (정지, 경고)
- 통계 대시보드 (가입자 수, 활성 사용자, 인기 강좌 등)

### 8-7. PWA 기능 활용
- 오프라인 모드 (캐시된 강좌 목록 표시)
- 홈 화면 추가 프롬프트
- 앱 같은 네비게이션

### 8-8. 다국어 지원
- i18next 도입
- 영어, 일본어 등 추가

### 8-9. 다크 모드
- 시스템 설정 감지
- 수동 토글

### 8-10. 강좌 필터 고도화
- 가격 범위 필터
- 요일/시간대 필터
- 난이도 필터
- 강사명 검색
```

---

## ✅ 각 프롬프트 실행 방법

1. **AI 에이전트에 프롬프트 복사/붙여넣기**
   - 위의 각 섹션(1번~8번) 중 하나를 선택
   - 전체 코드 블록을 복사
   - AI 에이전트에 붙여넣기

2. **에이전트가 코드 생성 및 파일 수정**
   - 에이전트가 자동으로 파일 생성/수정
   - 필요한 의존성 설치 명령어 제공

3. **로컬에서 테스트**
   ```bash
   npm install  # 새 의존성 설치
   npm run dev  # 개발 서버 실행
   ```

4. **문제없으면 커밋 및 배포**
   ```bash
   git add .
   git commit -m "feat: [개선 내용]"
   git push
   ```

5. **다음 프롬프트로 진행**
   - 다음 우선순위 프롬프트 실행

---

## 📚 참고 자료

### 현재 기술 스택 문서
- [Next.js 16 공식 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Playwright](https://playwright.dev/)
- [React Query (TanStack Query)](https://tanstack.com/query/latest)

### 보안 가이드
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js 보안 모범 사례](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#runtime-environment-variables)

### 성능 최적화
- [Next.js 성능 가이드](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)

---

## 🎯 마무리

이 문서는 우동배 프로젝트를 **상용 서비스 수준**으로 끌어올리기 위한 종합 개선 계획입니다.

**핵심 개선사항:**
- 🔔 알림 시스템 고도화 (설정, 실시간, 통계)
- 👤 회원 기능 강화 (프로필 편집, 활동 히스토리, 이메일 가입, 탈퇴)
- 🔒 보안 강화 (비밀번호 암호화, Rate Limiting, CSRF)
- 🗄️ DB 최적화 (인덱스, RLS, 감사 로그)
- ⚡ 성능 개선 (캐싱, 무한 스크롤, 이미지 최적화)
- 🎨 UX 개선 (Toast, 스켈레톤, 접근성)
- 🧪 테스트 & 모니터링 (Jest, Playwright, Sentry)

**예상 소요 시간:**
- Phase 1 (최우선): 1-2주
- Phase 2 (단기): 2-4주
- Phase 3 (중장기): 1-2개월

**실행 순서:**
1. 알림 시스템 개선 (프롬프트 1)
2. 회원 기능 강화 (프롬프트 2)
3. 보안 취약점 해결 (프롬프트 4)
4. 이후 우선순위에 따라 진행

각 프롬프트는 독립적으로 실행 가능하며, AI 에이전트가 바로 작업할 수 있도록 구체적인 코드 예시와 파일 경로가 포함되어 있습니다.

**문의사항이 있으면 이 문서를 참고하여 추가 작업을 요청하세요!**
