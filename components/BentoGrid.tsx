import { Course } from "@/types/course";
import CourseCard from "./CourseCard";
import { motion, AnimatePresence } from "framer-motion";

interface BentoGridProps {
    courses: Course[];
    viewMode?: 'grid' | 'list';
}

export default function BentoGrid({ courses, viewMode = 'grid' }: BentoGridProps) {
    return (
        <section className="py-4">
            <div className="w-full">
                <motion.div
                    layout
                    className={viewMode === 'grid'
                        ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                        : "flex flex-col gap-4"
                    }
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
                                className={`h-full ${viewMode === 'grid' && (index === 0 || index === 1) && courses.length > 2
                                        ? "sm:col-span-2"
                                        : "col-span-1 w-full"
                                    }`}
                            >
                                <CourseCard course={course} viewMode={viewMode} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}