export interface Course {
    title: string;       // 강좌명
    category: string;    // 분류
    target: string;      // 대상
    status: string;      // 상태
    image_url: string;   // 이미지 주소
    d_day: string;       // D-Day
    institution: string; // 기관명
    price: string;       // 수강료
    region: string;      // 지역
    place: string;       // 장소
    course_date: string; // 강좌 기간
    apply_date: string;  // 접수 기간
    time: string;        // 시간
    capacity: number;    // 정원
    contact: string;     // 문의처
    link: string;        // 링크
}

export interface TargetSite {
    name: string;
    region: string;
    url: string;
    isSeongnam?: boolean;
}