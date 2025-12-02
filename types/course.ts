export interface Course {
    id: number | string;
    title: string;
    category: string;
    target: string;      // targetNm (초등학생 등)
    status: string;      // lectureStatusNm (접수예정 등)
    imageUrl: string;
    dDay: string;
    institution: string; // organNm (기관명)
    price: string;       // lectureCost (수강료)
    link: string; // [추가] 수강신청 링크

    // [추가된 상세 정보]
    region: string;      // sigunguNm (강서구)
    place: string;       // place (3층 수영장)
    courseDate: string;  // lectureStartYmd ~ End (강의 기간)
    applyDate: string;   // applyStartYmd ~ End (접수 기간)
    time: string;        // applyStartTm (시간)
    capacity: number;    // onApplyNum (정원)
    contact: string;     // organTelNo (전화번호)
}