"use client";

import { Heart } from "lucide-react";
import { Course } from "@/types/course";
import { useBookmarks } from "@/hooks/useBookmarks";
import { motion } from "framer-motion";

export default function BookmarkButton({ course }: { course: Course }) {
    const { isBookmarked, toggleBookmark, isLoaded } = useBookmarks();

    if (!isLoaded) {
        return (
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
        );
    }

    const active = isBookmarked(course.id);

    return (
        <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
                e.preventDefault(); // 링크 이동 방지
                e.stopPropagation(); // 이벤트 전파 방지
                toggleBookmark(course);
            }}
            className={`p-2 rounded-full transition-all duration-300 shadow-sm border z-20 relative ${active
                    ? "bg-rose-50 border-rose-200 text-rose-500"
                    : "bg-white/90 border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-white"
                }`}
            aria-label={active ? "찜 해제" : "찜하기"}
        >
            <Heart
                className={`w-5 h-5 ${active ? "fill-current" : ""}`}
            />
        </motion.button>
    );
}
