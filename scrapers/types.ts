import { z } from 'zod';

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

// Raw course data from Gemini AI response
export interface RawCourseData {
    title?: string;
    category?: string;
    target?: string;
    status?: string;
    apply_date?: string;
    course_date?: string;
    time?: string;
    price?: string;
    capacity?: number | string;
    place?: string;
    institution?: string;
}

// Zod schema for validating raw course data from AI
export const RawCourseSchema = z.object({
    title: z.string().min(1).max(500),
    category: z.string().max(100).optional().default('기타'),
    target: z.string().max(100).optional().default('전체'),
    status: z.string().max(50).optional().default('접수중'),
    apply_date: z.string().max(100).optional(),
    course_date: z.string().max(100).optional(),
    time: z.string().max(100).optional(),
    price: z.string().max(50).optional().default('무료'),
    capacity: z.union([z.number(), z.string()]).optional().transform(val => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }),
    place: z.string().max(200).optional(),
    institution: z.string().max(200).optional(),
});

export const RawCoursesResponseSchema = z.object({
    courses: z.array(RawCourseSchema).default([]),
});

// Valid status values
export const VALID_STATUSES = [
    '접수중', '접수대기', '마감임박', '마감',
    '접수예정', '모집종료', '추가접수'
] as const;

export type ValidStatus = typeof VALID_STATUSES[number];