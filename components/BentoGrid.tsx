"use client";

import { cn } from "@/lib/utils";
import { Course } from "@/types/course";
import CourseCard from "./CourseCard";
import { motion } from "framer-motion";

// [수정 1] 부모 그리드 설정 변경
// "md:auto-rows-[...]" 부분을 제거하여 행 높이를 내용에 맞게 자연스럽게 둡니다.
// "md:grid-cols-3" 대신 좀 더 촘촘한 느낌을 위해 "md:grid-cols-3 lg:grid-cols-4"로 변경합니다. (선택사항)
export default function BentoGrid({
    courses,
    viewMode = 'grid',
    className,
}: {
    courses: Course[];
    viewMode?: 'grid' | 'list';
    className?: string;
}) {
    // 리스트 뷰일 때는 1열로 표시
    if (viewMode === 'list') {
        return (
            <div className={cn("flex flex-col gap-4", className)}>
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} viewMode="list" />
                ))}
            </div>
        );
    }

    // 카드(그리드) 뷰
    return (
        <div
            className={cn(
                // [수정된 그리드 레이아웃]
                // 1. grid-cols-1 md:grid-cols-3 lg:grid-cols-4 : 화면 너비에 따라 1열 -> 3열 -> 4열로 보여줍니다.
                // 2. gap-6 : 카드 사이 간격을 적당히 줍니다.
                // 3. auto-rows-fr : 모든 카드의 높이를 동일하게 맞춥니다. (중요!)
                "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr",
                className
            )}
        >
            {courses.map((course, i) => (
                <BentoGridItem
                    key={course.id}
                    course={course}
                    viewMode="grid"
                    // [핵심 수정] 아래 줄을 제거하거나 빈 문자열로 바꿉니다.
                    // 기존: className={i === 0 || i === 3 ? "md:col-span-2" : ""} 
                    className="" // 모든 카드가 동일한 1칸을 차지하도록 설정
                />
            ))}
        </div>
    );
}

// 개별 아이템 래퍼 (변경 없음)
function BentoGridItem({
    course,
    viewMode,
    className,
}: {
    course: Course;
    viewMode: 'grid' | 'list';
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            // cn()을 통해 외부에서 들어온 className(이제는 빈 문자열)이 적용됨
            className={cn("row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none bg-white dark:bg-black dark:border-white/[0.2] justify-between flex flex-col space-y-4", className)}
        >
            <CourseCard course={course} viewMode={viewMode} />
        </motion.div>
    );
}