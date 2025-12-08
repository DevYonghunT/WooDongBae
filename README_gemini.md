
📂 프로젝트 우동배 (WooDongBae) 개발 명세서1. 프로젝트 개요서비스명: 우동배 (우리 동네 배움터)목적: 전국 도서관 및 공공기관의 강좌 정보를 수집하여, 사용자가 지역별/기관별로 쉽게 검색하고 신청할 수 있게 돕는 플랫폼.핵심 가치: 파편화된 공공 데이터(API + 크롤링 불가능한 사이트)를 통합하여 일관된 UI로 제공.2. 기술 스택 (Tech Stack)Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS v4, Lucide React (Icons), Framer Motion.Backend / DB: Supabase (PostgreSQL).Data Collection:Public API: 공공데이터포털 에버러닝 API.Scraping: Playwright (Headless Browser) + Google Gemini 1.5 Flash (AI 기반 비정형 데이터 추출).Map: Kakao Map API.3. 데이터베이스 스키마 (Supabase)모든 강좌 데이터는 courses 테이블 하나에서 관리하며, 출처(API/크롤링)에 상관없이 raw_data에 원본을 저장하고, lib/db-api.ts에서 가공하여 사용함.Table: courses컬럼명타입설명idbigintPrimary Key (Identity)titletext강좌명institutiontext기관명 (Unique Constraint 1)statustext상태 (접수중, 모집종료 등)image_urltext썸네일 이미지 URLraw_datajsonb[핵심] API 또는 크롤러가 가져온 원본 데이터 전체created_attimestamp생성일(기타)textregion, place, course_date 등 보조 컬럼 존재 (현재는 raw_data 매핑 위주 사용)Unique Constraint: institution + title 조합으로 중복 저장을 방지(upsert 사용).4. 핵심 기능 및 구현 로직A. 데이터 수집 파이프라인 (scrapers/main.ts)전략: "사이트별 선택자 분석"을 하지 않고, **"LLM(Gemini)에게 페이지 텍스트를 통째로 주고 JSON 추출"**을 요청하는 범용 크롤러 사용.Config: TARGET_SITES 배열에 { name, region, url }만 추가하면 됨.Process:Playwright로 URL 접속 -> script, style 제거 후 텍스트 추출.Google Gemini 1.5 Flash에게 텍스트 전달 -> 표준화된 JSON 포맷으로 응답 요청.Supabase에 upsert (중복 시 업데이트).Rate Limit: 도서관 간 이동 시 3초 딜레이 적용.B. 데이터 정제 및 매핑 (lib/db-api.ts)DB에 저장된 이질적인 데이터(API vs 크롤링)를 프론트엔드에서 쓸 수 있게 통일하는 핵심 로직.상태값 표준화:마감, 교육중, 진행중 -> 모집종료대기, 대기접수 -> 접수대기추가 -> 추가접수상태값이 없으면 날짜(today vs applyDate) 비교하여 자동 판별.이미지 매칭:picsum 등 랜덤 이미지가 들어있거나 없을 경우, 강좌 제목의 키워드(수영, 코딩, 요가 등)를 분석하여 미리 정의된 고화질 이미지(KEYWORD_IMAGES)를 배정.기관명 정제: 지도 검색 정확도를 위해 refineInstitutionName 함수로 기관명 보정 (예: "학생체육관" -> "서울특별시교육청학생체육관").C. 프론트엔드 UI검색 필터 (CourseExplorer):Cascading Dropdown: [지역 선택] -> 해당 지역의 [기관 목록]만 활성화.상태 필터: 모집중, 모집예정, 접수대기 등 필터링.리스트 뷰: 카드형(Grid) UI (반응형 벤토 그리드).상세 페이지:Kakao Map: 기관명 기반 위치 표시 (components/KakaoMap.tsx).신청 버튼: 외부 수강신청 사이트(에버러닝 등)로 다이렉트 연결. (URL 패턴 분석 또는 검색 링크 생성).공유하기: PC는 클립보드 복사, 모바일은 Native Share Sheet 호출.5. 현재 프로젝트 구조Bashwoodongbae/
├── app/
│   ├── api/sync/route.ts    # 공공데이터 API 연동 및 DB 저장 (Serverless Function)
│   ├── courses/[id]/page.tsx # 상세 페이지 (지도, 공유, 신청 기능 포함)
│   ├── page.tsx             # 메인 페이지 (추천 강좌, 검색 필터, 리스트)
│   └── layout.tsx           # GNB, Footer, Global Styles
├── components/
│   ├── CourseCard.tsx       # 강좌 카드 (이미지 에러 처리, 상태 배지)
│   ├── CourseExplorer.tsx   # 검색 필터 및 리스트 컨테이너
│   ├── KakaoMap.tsx         # 카카오 지도 컴포넌트
│   └── ShareButton.tsx      # 스마트 공유 버튼
├── lib/
│   └── db-api.ts            # [중요] 데이터 매핑, 정제, DB 통신 로직 집약체
├── scrapers/                # [독립 실행] 크롤링 스크립트 폴더
│   ├── main.ts              # 크롤링 실행 진입점 (설정 파일 역할)
│   ├── ai-scraper.ts        # Gemini 기반 범용 크롤러 클래스
│   ├── types.ts             # 타입 정의
│   └── .env                 # 크롤러 전용 환경변수
└── types/
    └── course.ts            # 프론트엔드 공통 인터페이스
6. 환경 변수 (.env.local)코드 스니펫# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Public Data API (Encoding Key 권장)
NEXT_PUBLIC_API_KEY=...
NEXT_PUBLIC_API_URL=https://apis.data.go.kr/7010000/everlearning

# External Services
NEXT_PUBLIC_KAKAO_MAP_KEY=...
GEMINI_API_KEY=... (scrapers/.env 에도 필요)
7. 향후 개발 계획 (To-Do)목록형/카드형 보기 전환 기능: 현재 카드형만 있음. 사용자가 선택 가능하도록 토글 버튼 구현 예정.자동화: GitHub Actions를 이용해 scrapers/main.ts를 매일 새벽 자동 실행.개인화: (장기 목표) 로컬 스토리지 기반 '찜하기' 기능.🤖 새로운 AI에게 전달할 프롬프트새로운 채팅창에서 시작할 때 아래 문구를 같이 입력하세요."위 내용은 내가 지금까지 개발한 '우동배' 서비스의 전체 명세서와 코드 현황이야. 이 내용을 바탕으로 이어서 개발을 진행하고 싶어. 현재 상태를 파악하고 다음 작업을 도와줘."
