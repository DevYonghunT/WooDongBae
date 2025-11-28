import { Course } from "@/types/course";
import Image from "next/image";
import { motion } from "framer-motion";

interface CourseCardProps {
    course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
    const isClosingSoon = course.status === "마감임박";
    const isClosed = course.status === "마감";

    return (
        <motion.div
            whileHover={{ y: -6 }}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-all hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-primary-100/50 border border-gray-100 h-full"
        >
            {/* Image Section */}
            <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* D-Day Badge */}
                <div className="absolute right-3 top-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-900 shadow-sm backdrop-blur-md">
                    {course.dDay}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-6">
                {/* Tags */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                        {course.category}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs font-medium text-gray-500">
                        {course.target}
                    </span>
                </div>

                {/* Title */}
                <h3 className="mb-4 text-xl font-bold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                    {course.title}
                </h3>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                    <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${isClosingSoon ? "text-rose-600" :
                                isClosed ? "text-gray-400" : "text-emerald-600"
                            }`}
                    >
                        <span className={`h-2 w-2 rounded-full ${isClosingSoon ? "bg-rose-500 animate-pulse" :
                                isClosed ? "bg-gray-300" : "bg-emerald-500"
                            }`}></span>
                        {course.status}
                    </span>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-primary-600 transition-colors flex items-center gap-1">
                        자세히 보기 <span className="text-[10px]">➜</span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
