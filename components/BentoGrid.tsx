import { Course } from "@/types/course";
import CourseCard from "./CourseCard";
import { motion, AnimatePresence } from "framer-motion";

interface BentoGridProps {
    courses: Course[];
}

export default function BentoGrid({ courses }: BentoGridProps) {
    return (
        <section className="py-4">
            {/* [수정] max-w 등은 상위에서 제어하므로 여기선 제거하거나 w-full 유지 */}
            <div className="w-full">
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <AnimatePresence mode="popLayout">
                        {courses.map((course, index) => (
                            <motion.div
                                layout
                                key={course.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                // 첫 번째, 두 번째 아이템 크게 보여주는 로직은 유지하되, 
                                // 데이터가 적을 때 깨지지 않도록 조건 강화
                                className={`h-full ${(index === 0 || index === 1) && courses.length > 2
                                        ? "sm:col-span-2"
                                        : "col-span-1"
                                    }`}
                            >
                                <CourseCard course={course} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}