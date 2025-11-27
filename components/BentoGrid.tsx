import { Course } from "@/types/course";
import CourseCard from "./CourseCard";
import { motion, AnimatePresence } from "framer-motion";

interface BentoGridProps {
    courses: Course[];
}

export default function BentoGrid({ courses }: BentoGridProps) {
    return (
        <section className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="mb-8 text-2xl font-bold text-stone-800 md:text-3xl tracking-tight">
                    🔥 지금 뜨는 인기 강좌
                </h2>

                <motion.div
                    layout
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <AnimatePresence>
                        {courses.map((course, index) => (
                            <motion.div
                                layout
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`${index === 0 || index === 1 ? "sm:col-span-2" : "col-span-1"
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
