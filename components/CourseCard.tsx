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
            whileHover={{ y: -5 }}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl border border-border"
        >
            {/* Image Section */}
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-text backdrop-blur-sm shadow-sm">
                    {course.dDay}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                    <span className="rounded-md bg-surface px-2 py-1 text-gray-600 border border-border">
                        {course.category}
                    </span>
                    <span>•</span>
                    <span>{course.target}</span>
                </div>

                <h3 className="mb-3 text-lg font-bold text-text line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                </h3>

                <div className="mt-auto flex items-center justify-between">
                    <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isClosingSoon
                                ? "bg-red-100 text-red-600"
                                : isClosed
                                    ? "bg-gray-100 text-gray-500"
                                    : "bg-green-100 text-green-600"
                            }`}
                    >
                        {course.status}
                    </span>
                    <button className="text-sm font-semibold text-primary hover:underline">
                        자세히 보기
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
