# 📋 우동배(WooDongBae) 프로젝트 구조 분석

> 작성일: 2026-01-26
> 분석 범위: 전체 코드베이스

---

## 📊 프로젝트 개요

**프로젝트명**: 우동배 (WooDongBae - 우리 동네 배움터)
**목적**: 지자체 도서관 강좌 정보를 스크래핑하여 통합 제공
**타겟 사용자**: 지역 주민 (경기도 및 서울 중심)

---

## 🛠️ 기술 스택

### 프론트엔드
```json
{
  "프레임워크": "Next.js 16.0.7 (App Router)",
  "언어": "TypeScript 5",
  "UI 라이브러리": "React 19.2.1",
  "스타일링": [
    "Tailwind CSS v4",
    "Tailwind Merge",
    "@tailwindcss/postcss"
  ],
  "상태관리": "Zustand 5.0.9",
  "아이콘": "Lucide React 0.400.0",
  "애니메이션": "Framer Motion 11.0.0",
  "날짜 처리": "date-fns 4.1.0"
}
```

### 백엔드
```json
{
  "BaaS": "Supabase (PostgreSQL)",
  "인증": [
    "@supabase/ssr 0.8.0",
    "@supabase/supabase-js 2.86.0"
  ],
  "이메일": "Resend 6.6.0",
  "푸시 알림": "web-push 3.6.7"
}
```

### 스크래핑 & AI
```json
{
  "웹 스크래핑": "Playwright 1.57.0",
  "AI": "@google/generative-ai 0.24.1 (Gemini)",
  "XML 파싱": "fast-xml-parser 5.3.2"
}
```

### PWA & SEO
```json
{
  "PWA": "next-pwa 5.6.0",
  "SEO": "Built-in Next.js"
}
```

---

## 📁 디렉토리 구조

```
WooDongBae/
│
├── app/                          # Next.js App Router
│   ├── api/                       # API 라우트
│   │   ├── kakao-login/route.ts  # 카카오 로그인 시작
│   │   ├── kakao-callback/route.ts # 카카오 인증 콜백
│   │   └── sync/route.ts         # 데이터 동기화
│   │
│   ├── actions/                   # 서버 액션
│   │   ├── alert.ts              # 알림 키워드 등록
│   │   ├── community.ts          # 커뮤니티 게시글 관리
│   │   └── submit-feedback.ts    # 피드백 제출
│   │
│   ├── auth/
│   │   └── callback/route.ts     # 인증 콜백
│   │
│   ├── admin/
│   │   └── page.tsx              # 관리자 페이지
│   │
│   ├── mypage/
│   │   └── page.tsx              # 마이페이지 (찜, 키워드)
│   │
│   ├── courses/
│   │   └── [id]/page.tsx         # 강좌 상세 페이지
│   │
│   ├── bookmarks/
│   │   └── page.tsx              # 찜한 강좌 목록
│   │
│   ├── community/
│   │   └── page.tsx              # 커뮤니티 페이지
│   │
│   ├── page.tsx                  # 메인 페이지
│   ├── layout.tsx                # 루트 레이아웃 (GNB, Footer)
│   ├── robots.ts                 # SEO robots.txt
│   └── sitemap.ts                # SEO sitemap
│
├── components/                    # React 컴포넌트
│   ├── Header.tsx                # 헤더 (로그인/로그아웃 UI)
│   ├── LoginModal.tsx            # 로그인 모달
│   ├── KakaoLoginButton.tsx      # 카카오 로그인 버튼
│   ├── GoogleLoginButton.tsx     # 구글 로그인 버튼
│   ├── PushNotificationButton.tsx # 푸시 알림 토글
│   ├── NotificationModal.tsx     # 알림 센터 모달
│   ├── KeywordSection.tsx        # 알림 키워드 관리
│   ├── BookmarkButton.tsx        # 찜하기 버튼
│   ├── CourseExplorer.tsx        # 강좌 검색 필터 UI
│   ├── CourseCard.tsx            # 강좌 카드
│   ├── KakaoMap.tsx              # 카카오 지도
│   ├── ServiceWorkerRegister.tsx # 서비스 워커 등록
│   ├── FeedbackWidget.tsx        # 피드백 위젯
│   └── WritePostModal.tsx        # 커뮤니티 글작성
│
├── lib/                           # 유틸리티 및 비즈니스 로직
│   ├── db-api.ts                 # DB 데이터 매핑 및 조회
│   ├── send-push.ts              # 푸시 알림 발송
│   ├── send-mail.ts              # 이메일 발송
│   ├── supabase.ts               # Supabase 클라이언트 설정
│   └── utils.ts                  # 유틸 함수
│
├── utils/                         # 유틸리티
│   ├── supabase/
│   │   ├── client.ts             # 클라이언트 사이드
│   │   └── server.ts             # 서버 사이드
│   └── normalization.ts          # 데이터 정규화
│
├── store/                         # Zustand 상태 관리
│   └── useLoginModal.ts          # 로그인 모달 상태
│
├── types/                         # TypeScript 타입 정의
│   └── course.ts                 # Course 인터페이스
│
├── scrapers/                      # 독립실행형 크롤러
│   ├── main.ts                   # 메인 크롤러
│   ├── ai-scraper.ts             # Gemini 기반 AI 크롤러
│   ├── alert-job.ts              # 키워드 알림 발송
│   ├── bookmark-alert-job.ts     # 찜한 강좌 알림
│   ├── seoul-api.ts              # 서울시 공공API 연동
│   ├── classifier.ts             # 강좌 분류기
│   └── types.ts                  # 크롤러 타입
│
├── supabase/                      # DB 스키마
│   ├── schema.sql                # 기본 스키마
│   └── feedback_schema.sql       # 피드백 테이블
│
├── public/                        # 정적 파일
│   ├── icon.png                  # 앱 아이콘
│   ├── manifest.json             # PWA 설정
│   ├── sw.js                     # 서비스 워커
│   └── custom-sw.js              # 커스텀 SW
│
├── middleware.ts                  # Next.js 미들웨어
├── next.config.ts                # Next.js 설정
├── tsconfig.json                 # TypeScript 설정
├── tailwind.config.ts            # Tailwind 설정
└── package.json                  # 프로젝트 메타
```

---

## 🗄️ 데이터베이스 구조

### 테이블 목록

#### 1. courses (강좌 정보)
```sql
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('접수중', '마감임박', '마감')),
  image_url TEXT NOT NULL,
  d_day TEXT NOT NULL,
  institution TEXT,
  price TEXT,
  region TEXT,
  place TEXT,
  course_date TEXT,
  apply_date TEXT,
  time TEXT,
  capacity NUMERIC,
  contact TEXT,
  link TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**인덱스 상태**: ⚠️ 부족 (개선 필요)
**RLS**: ✅ 활성화 (SELECT 전체 허용)

#### 2. bookmarks (찜한 강좌)
```sql
CREATE TABLE bookmarks (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  course_id BIGINT REFERENCES courses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**인덱스 상태**: ⚠️ 부족
**RLS**: ❌ 미설정 (개선 필요)

#### 3. keywords (알림 키워드)
```sql
CREATE TABLE keywords (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  word TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**인덱스 상태**: ⚠️ 부족
**RLS**: ❌ 미설정 (개선 필요)

#### 4. push_subscriptions (푸시 구독)
```sql
CREATE TABLE push_subscriptions (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**인덱스 상태**: ⚠️ 부족
**RLS**: ❌ 미설정 (개선 필요)

#### 5. notifications (알림 센터)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**인덱스 상태**: ⚠️ 부족
**RLS**: ❌ 미설정 (개선 필요)

#### 6. posts (커뮤니티 자유게시판)
```sql
CREATE TABLE posts (
  id BIGINT PRIMARY KEY,
  nickname TEXT NOT NULL,
  password TEXT NOT NULL,  -- ⚠️ 평문 저장 가능성
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**보안 상태**: ❌ 위험 (비밀번호 평문 가능성)
**RLS**: ❌ 미설정

#### 7. notices (커뮤니티 공지사항)
```sql
CREATE TABLE notices (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS**: ❌ 미설정

#### 8. feedbacks (사용자 피드백)
```sql
CREATE TABLE feedbacks (
  id BIGINT PRIMARY KEY,
  type TEXT NOT NULL,  -- 'compliment', 'suggestion', 'bug'
  content TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS**: ❌ 미설정

---

## 🔐 인증 및 권한

### 인증 방식
- **소셜 로그인**: 카카오, 구글
- **이메일 로그인**: ❌ 미지원 (개선 필요)
- **인증 제공자**: Supabase Auth

### 인증 플로우 (카카오 예시)

```
1. 사용자 카카오 로그인 버튼 클릭
   ↓
2. /api/kakao-login → Kakao OAuth 승인 URL로 리다이렉트
   ↓
3. 사용자가 카카오 로그인 완료
   ↓
4. /api/kakao-callback에서:
   - 인가 코드 받음
   - Kakao Token API에서 access_token 획득
   - Kakao User API에서 사용자 정보 조회
   - 가짜 이메일 생성: {kakaoId}@kakao.woodongbae.xyz
   - Supabase Admin으로 사용자 등록 또는 확인
   - 매직 링크 생성 → 서버에서 토큰 추출
   - 쿠키에 access_token, refresh_token 저장
   - 홈으로 리다이렉트
   ↓
5. 이후 모든 요청에 쿠키를 통해 인증 유지
```

### 권한 관리
- **관리자 페이지**: `/admin` 경로는 `devyongt@gmail.com`만 접근 가능
- **미들웨어**: `middleware.ts`에서 인증 상태 확인 및 세션 갱신

---

## 🔔 알림 시스템

### 현재 구현

#### 1. 키워드 알림 (`alert-job.ts`)
```
동작 방식:
1. 최근 24시간 내 새 강좌 조회
2. 사용자별 키워드 목록 가져오기
3. 키워드 매칭되는 강좌 찾기
4. 이메일 발송 (Resend)
5. 푸시 알림 발송 (web-push)

발송 채널:
- 이메일 ✅
- 푸시 알림 ✅

문제점:
- ❌ 알림 설정 커스터마이징 불가
- ❌ 배치 Job 방식 (실시간 아님)
- ❌ 발송 로그 없음
- ❌ 재시도 로직 없음
```

#### 2. 찜한 강좌 일정 알림 (`bookmark-alert-job.ts`)
```
동작 방식:
1. 모든 찜한 강좌 조회
2. 각 강좌의 apply_date 파싱
3. 다음 케이스에 알림 발송:
   - 접수 시작 1일 전
   - 접수 시작 당일
   - 접수 마감 당일

발송 채널:
- 푸시 알림만 ✅

문제점:
- ❌ 이메일 알림 미지원
- ❌ 알림 시간 설정 불가
```

#### 3. 알림 센터 UI (`NotificationModal.tsx`)
```
기능:
- 최근 20개 알림 표시 ✅
- 읽음/안읽음 상태 ✅
- 개별 삭제 ✅
- 전체 읽음 처리 ✅

문제점:
- ❌ 필터링 없음
- ❌ 무한 스크롤 없음
- ❌ 알림 통계 없음
```

### 개선 필요 사항
1. ❌ 알림 설정 UI (채널, 시간대, 빈도)
2. ❌ Supabase Realtime 활용
3. ❌ 알림 로그 및 통계
4. ❌ 실패 재시도 로직
5. ❌ 관리자 대시보드

---

## 🎨 UI/UX 현황

### 디자인 시스템
- **색상**: Orange 중심 (Primary: #f97316)
- **폰트**: 시스템 기본 폰트
- **아이콘**: Lucide React
- **애니메이션**: Framer Motion

### 반응형 디자인
- ✅ 기본적인 반응형 지원
- ⚠️ 일부 컴포넌트 모바일 최적화 필요

### 접근성(A11y)
- ⚠️ ARIA 속성 부족
- ⚠️ 키보드 네비게이션 미흡
- ⚠️ 스크린 리더 지원 미흡

### 로딩 상태
- ⚠️ 일부 컴포넌트만 로딩 표시
- ❌ 전역 로딩 바 없음
- ❌ 스켈레톤 UI 없음

### 에러 처리
- ⚠️ alert() 사용 (일관성 부족)
- ❌ Toast 시스템 없음

---

## ⚡ 성능 분석

### 현재 상태

#### 긍정적인 부분
- ✅ Next.js App Router 사용 (서버 컴포넌트)
- ✅ 이미지 키워드 기반 매칭 (DB 저장)
- ✅ Tailwind CSS (최적화된 CSS)

#### 개선 필요 부분
- ❌ N+1 쿼리 문제 (찜 여부 확인)
- ❌ 클라이언트 캐싱 없음
- ❌ 서버 사이드 캐싱 없음
- ❌ DB 인덱스 부족
- ❌ 이미지 최적화 미흡 (Next/Image 미사용)
- ❌ 코드 스플리팅 부족

### 쿼리 분석

#### getPaginatedCourses (db-api.ts)
```typescript
// ✅ 좋은 점: 단일 쿼리로 강좌 목록 조회
// ✅ 좋은 점: 찜 목록도 단일 쿼리로 조회
// ⚠️ 개선 필요: 인덱스 없어서 느릴 수 있음
```

#### getFilterMetadata (db-api.ts)
```typescript
// ⚠️ 문제: 배치 방식으로 전체 데이터 로드
// ⚠️ 문제: 메모리에서 중복 제거
// 💡 개선: DB에서 DISTINCT 사용하거나 뷰 생성
```

---

## 🔒 보안 분석

### 현재 보안 상태

#### ✅ 잘 구현된 부분
1. **Supabase RLS**: courses 테이블에 활성화
2. **HTTPS**: Vercel 배포 시 자동 적용
3. **쿠키 보안**: httpOnly, secure 플래그 사용
4. **CORS 설정**: middleware.ts에서 허용 도메인 관리

#### ❌ 보안 취약점

1. **비밀번호 평문 저장 가능성**
   - 위치: `posts` 테이블 `password` 필드
   - 위험도: 🔴 높음
   - 해결: bcrypt 암호화 필요

2. **Rate Limiting 부재**
   - 위험도: 🔴 높음
   - 영향: 무차별 대입 공격, API 남용 가능
   - 해결: Rate Limiter 구현 필요

3. **RLS 미설정**
   - 테이블: bookmarks, keywords, notifications 등
   - 위험도: 🟡 중간
   - 영향: 다른 사용자 데이터 조회 가능
   - 해결: RLS 정책 추가 필요

4. **환경변수 하드코딩**
   - 위치: `middleware.ts`, `kakao-callback/route.ts`
   - 예시: `devyongt@gmail.com`, 카카오 클라이언트 ID
   - 위험도: 🟡 중간
   - 해결: 환경변수로 분리 필요

5. **CSRF 토큰 부재**
   - 위험도: 🟡 중간
   - 영향: CSRF 공격 가능
   - 해결: CSRF 토큰 구현 필요

6. **XSS 방어 미흡**
   - 위치: 커뮤니티 게시글 렌더링
   - 위험도: 🟡 중간
   - 해결: DOMPurify 또는 텍스트만 표시

---

## 🧪 테스트 현황

### 현재 상태
- ❌ 단위 테스트 없음
- ❌ 통합 테스트 없음
- ❌ E2E 테스트 없음 (Playwright는 설치되어 있으나 스크래핑용)

### 개선 필요
1. Jest 설정 및 단위 테스트 작성
2. Playwright E2E 테스트 작성
3. 테스트 커버리지 목표 설정 (최소 60%)

---

## 📊 모니터링 및 로깅

### 현재 상태
- ⚠️ console.log만 사용
- ❌ 에러 추적 시스템 없음
- ❌ 성능 모니터링 없음
- ❌ 사용자 행동 분석 없음 (Google Analytics 스크립트는 추가됨)

### 개선 필요
1. Sentry 에러 추적
2. Vercel Analytics
3. Google Analytics 4 이벤트 추적
4. 헬스체크 엔드포인트

---

## 🔄 스크래핑 시스템

### 현재 구조

#### 1. 메인 크롤러 (`main.ts`)
```typescript
동작 방식:
1. TARGET_SITES 배열에서 도서관 목록 순회
2. Playwright로 각 도서관 사이트 접속
3. HTML 파싱 (script, style 제거)
4. AI 크롤러에 텍스트 전달
5. Gemini 기반 JSON 추출
6. 데이터 정규화 (classifier.ts)
7. Supabase에 upsert
8. 3초 딜레이 (Rate Limit)

대상 지역:
- 하남시, 구리시, 남양주시, 광주시
- 용인시, 이천시, 여주시, 포천시, 가평군
- 서울시 (에버러닝 API)
```

#### 2. AI 스크래퍼 (`ai-scraper.ts`)
```typescript
특징:
- Google Gemini 1.5 Flash 사용
- 비정형 HTML에서 구조화된 JSON 추출
- CSS 선택자 불필요 (범용성 높음)

장점:
✅ 다양한 웹사이트 레이아웃 대응
✅ HTML 구조 변경 시에도 안정적

단점:
⚠️ API 비용 발생
⚠️ 응답 시간 느림 (평균 3-5초)
⚠️ 토큰 한계로 긴 페이지 처리 어려움
```

#### 3. 서울시 API 연동 (`seoul-api.ts`)
```typescript
데이터 소스: 서울시 평생학습포털 (에버러닝)
형식: XML
장점: ✅ 구조화된 데이터, 빠른 응답
단점: ⚠️ 서울시만 지원
```

### 실행 방법
```bash
# 모든 도서관 크롤링
npx ts-node scrapers/main.ts

# 특정 범위만 크롤링
npx ts-node scrapers/main.ts --start=0 --end=5

# 특정 도서관 검색
npx ts-node scrapers/main.ts --target="성남시"

# 알림 작업만 실행
npx ts-node scrapers/run-alert-only.ts
```

---

## 🌐 배포 환경 (추정)

### Vercel 배포
- ✅ Next.js 최적화
- ✅ 자동 HTTPS
- ✅ Edge Network (CDN)
- ✅ 서버리스 함수

### 환경변수 관리
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
GEMINI_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_KAKAO_MAP_KEY
NEXT_PUBLIC_GA_ID (Google Analytics)
```

---

## 📈 개선 우선순위 요약

### 🔴 긴급 (1-2주)
1. **보안 취약점 해결**
   - 비밀번호 암호화
   - RLS 정책 추가
   - Rate Limiting

2. **알림 시스템 개선**
   - 알림 설정 UI
   - 실시간 알림
   - 발송 로그

3. **회원 기능 강화**
   - 프로필 편집
   - 이메일 가입
   - 회원 탈퇴

### 🟡 중요 (2-4주)
4. **DB 최적화**
   - 인덱스 추가
   - 쿼리 최적화

5. **성능 개선**
   - 캐싱 전략
   - 이미지 최적화

6. **UX 개선**
   - Toast 시스템
   - 스켈레톤 UI
   - 접근성

### 🟢 장기 (1-2개월)
7. **테스트 및 모니터링**
   - Jest, Playwright
   - Sentry
   - Analytics

8. **추가 기능**
   - 리뷰 시스템
   - 소셜 기능
   - AI 추천

---

## 📝 참고 사항

### 강점
- ✅ 현대적인 기술 스택 (Next.js 16, React 19)
- ✅ AI 기반 범용 스크래퍼
- ✅ PWA 지원
- ✅ 깔끔한 디자인

### 약점
- ❌ 보안 취약점 (비밀번호, RLS, Rate Limiting)
- ❌ 테스트 부재
- ❌ 모니터링 부재
- ❌ 성능 최적화 부족

### 기회
- ✅ 다른 지역으로 확장 가능
- ✅ B2B 모델 (지자체 협력)
- ✅ 광고 수익화 가능

### 위협
- ⚠️ 경쟁 서비스 등장 가능
- ⚠️ 스크래핑 차단 위험
- ⚠️ API 비용 증가

---

**분석 완료일**: 2026-01-26
**분석자**: Claude Sonnet 4.5
**다음 단계**: [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) 참조
