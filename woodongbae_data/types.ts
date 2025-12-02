export interface Course {
  title: string;       // 강좌명
  category: string;    // 분류 (없으면 '기타')
  target: string;      // 대상
  status: string;      // 상태 ('접수중', '마감임박', '접수예정', '대기접수', '모집종료')
  image_url: string;   // 썸네일 (없으면 랜덤 이미지)
  d_day: string;       // D-Day (자동 계산 또는 빈값)
  institution: string; // 기관명 (여기선 '하남시가밀도서관')
  price: string;       // 수강료
  region: string;      // 지역 ('하남시')
  place: string;       // 장소
  course_date: string; // 강좌 기간
  apply_date: string;  // 접수 기간
  time: string;        // 강의 시간
  capacity: number;    // 정원 (숫자)
  contact: string;     // 문의처
  link: string;        // 상세 페이지 링크 (Base URL + href)
}

export interface Scraper {
  scrape(): Promise<Course[]>;
}
