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
            whileHover={{ y: -4 }}
            className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all duration-300 border border-transparent hover:border-orange-200 hover:shadow-orange-100/50 hover:shadow-lg"
        >
            {/* Image Section */}
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-stone-800 backdrop-blur-sm shadow-sm">
                    {course.dDay}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium">
                    <span className="rounded-md bg-stone-100 px-2.5 py-1 text-stone-600">
                        {course.category}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500">{course.target}</span>
                </div>

                <h3 className="mb-4 text-lg font-bold text-stone-800 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
                    {course.title}
                </h3>

                <div className="mt-auto flex items-center justify-between">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${isClosingSoon
                                ? "bg-red-50 text-red-600"
                                : isClosed
                                    ? "bg-stone-100 text-stone-500"
                                    : "bg-green-100 text-green-700"
                            }`}
                    >
                        {course.status}
                    </span>
                    <button className="text-sm font-bold text-orange-500 hover:underline">
                        자세히 보기
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
