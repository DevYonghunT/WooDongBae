"use client";

import { Course } from "@/types/course";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Building2, MapPin, Wallet, ClipboardList } from "lucide-react";
import { useState } from "react";
import BookmarkButton from "./BookmarkButton"; // [추가]

interface CourseCardProps {
    course: Course;
    viewMode?: 'grid' | 'list';
}

export default function CourseCard({ course, viewMode = 'grid' }: CourseCardProps) {
    const isFull = course.capacity > 0 && course.status.includes("마감");
    const [imgSrc, setImgSrc] = useState(course.imageUrl);
    const fallbackImage = "https://placehold.co/800x600/f3f4f6/9ca3af?text=No+Image";

    // ─── [1] 리스트형 보기 (List Mode) ───
    if (viewMode === 'list') {
        return (
            <Link href={`/courses/${course.id}`} className="block h-full">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl border border-gray-100 h-full transition-all duration-300 cursor-pointer"
                >
                    {/* 이미지 섹션 */}
                    <div className="relative h-48 md:h-auto w-full md:w-64 flex-shrink-0 bg-gray-100 overflow-hidden">
                        <Image
                            src={imgSrc}
                            alt={course.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImgSrc(fallbackImage)}
                        />

                        {/* [배치 변경] 상태 배지 -> 좌측 상단 */}
                        <div className="absolute top-3 left-3 z-10">
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm backdrop-blur-md ${isFull
                                ? "bg-gray-900/80 text-white"
                                : "bg-white/90 text-primary-700"
                                }`}>
                                {course.status}
                            </span>
                        </div>

// 1st occurrence (List View)
                        <div className="absolute top-3 right-3 z-10">
                            {/* course.id를 courseId 속성에 넣어줍니다. (숫자면 숫자로, 문자면 문자로 DB에 맞게) */}
                            <BookmarkButton
                                courseId={Number(course.id)}
                                initialIsBookmarked={course.isBookmarked} // [추가] 초기 상태 전달
                            />
                        </div>

// 2nd occurrence (Grid View)
                        <div className="absolute top-3 right-3 z-10">
                            {/* ✅ courseId 라는 이름으로, ID 숫자를 넘겨줘야 합니다 */}
                            <BookmarkButton
                                courseId={Number(course.id)}
                                initialIsBookmarked={course.isBookmarked} // [추가] 초기 상태 전달
                            />
                        </div>
                    </div>

                    {/* 내용 섹션 */}
                    <div className="flex flex-1 flex-col p-5">
                        <div className="flex gap-2 mb-2">
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-primary-50 text-primary-700 rounded-md border border-primary-100">
                                {course.category}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-md">
                                {course.target}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-50 text-gray-500 rounded-md border border-gray-200">
                                {course.region}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-primary-600 transition-colors">
                            {course.title}
                        </h3>

                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                            <Building2 size={12} /> {course.institution}
                        </p>

                        <div className="mt-auto pt-4 border-t border-gray-50 text-xs text-gray-600">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={13} className="text-gray-400 shrink-0" />
                                    <span className="truncate">수강: {course.courseDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ClipboardList size={13} className="text-primary-500 shrink-0" />
                                    <span className="font-medium text-primary-700 truncate">
                                        접수: {course.applyDate}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={13} className="text-gray-400 shrink-0" />
                                    <span className="truncate">{course.place}</span>
                                </div>
                                <div className="flex items-center gap-2 font-medium text-emerald-600">
                                    <Wallet size={13} className="shrink-0" />
                                    <span>{course.price}</span>
                                    <span className="text-gray-400 font-normal ml-1">
                                        (정원 {course.capacity}명)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        );
    }

    // ─── [2] 카드형 보기 (Grid Mode) ───
    return (
        <Link href={`/courses/${course.id}`} className="block h-full">
            <motion.div
                whileHover={{ y: -5 }}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl border border-gray-100 h-full transition-all duration-300 cursor-pointer"
            >
                {/* 이미지 섹션 */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <Image
                        src={imgSrc}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImgSrc(fallbackImage)}
                    />

                    {/* [배치 변경] 상태 배지 -> 좌측 상단 */}
                    <div className="absolute top-3 left-3 z-10">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm backdrop-blur-md ${isFull
                            ? "bg-gray-900/80 text-white"
                            : "bg-white/90 text-primary-700"
                            }`}>
                            {course.status}
                        </span>
                    </div>

                    {/* [추가] 찜하기 버튼 -> 우측 상단 */}
                    <div className="absolute top-3 right-3 z-10">
                        {/* ✅ courseId 라는 이름으로, ID 숫자를 넘겨줘야 합니다 */}
                        <BookmarkButton courseId={Number(course.id)} />
                    </div>

                    {/* 지역 배지 (기존 유지) */}
                    <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 text-[10px] font-bold bg-black/50 text-white rounded-md backdrop-blur-sm">
                            {course.region}
                        </span>
                    </div>
                </div>

                {/* 내용 섹션 (기존 코드 유지) */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="flex gap-2 mb-3">
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-primary-50 text-primary-700 rounded-md border border-primary-100">
                            {course.category}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-md">
                            {course.target}
                        </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {course.title}
                    </h3>

                    <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                        <Building2 size={12} /> {course.institution}
                    </p>

                    <div className="mt-auto space-y-1.5 pt-4 border-t border-gray-50">
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                            <Calendar size={13} className="text-primary-500 mt-0.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-400 text-[10px]">수강기간</span>
                                <span>{course.courseDate}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                            <ClipboardList size={13} className="text-primary-500 mt-0.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-400 text-[10px]">접수기간</span>
                                <span>{course.applyDate}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 pt-1">
                            <MapPin size={13} className="text-gray-400 shrink-0" />
                            <span className="truncate">{course.place}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium pt-2 mt-2 border-t border-dashed border-gray-100">
                            <div className="flex items-center gap-1.5 text-emerald-600">
                                <Wallet size={13} />
                                <span>{course.price}</span>
                            </div>
                            <span className="text-gray-400 text-[10px]">
                                정원 {course.capacity}명
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}