"use client"; // useState 사용을 위해 필수

import { Course } from "@/types/course";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Building2, MapPin, Wallet, ClipboardList } from "lucide-react";
import { useState } from "react";

interface CourseCardProps {
    course: Course;
    viewMode?: 'grid' | 'list';
}

export default function CourseCard({ course, viewMode = 'grid' }: CourseCardProps) {
    const isFull = course.capacity > 0 && course.status.includes("마감");

    // [수정 1] 이미지 에러 처리를 위한 상태 관리
    // 초기값은 API 이미지 -> 에러 나면 대체 이미지로 변경
    const [imgSrc, setImgSrc] = useState(course.imageUrl);

    // 대체 이미지 URL (깔끔한 회색 톤)
    const fallbackImage = "https://placehold.co/800x600/f3f4f6/9ca3af?text=No+Image";

    if (viewMode === 'list') {
        return (
            <Link href={`/courses/${course.id}`} className="block h-full">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl border border-gray-100 h-full transition-all duration-300 cursor-pointer"
                >
                    {/* [List] 이미지 섹션 */}
                    <div className="relative h-48 md:h-auto w-full md:w-64 flex-shrink-0 bg-gray-100 overflow-hidden">
                        <Image
                            src={imgSrc}
                            alt={course.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImgSrc(fallbackImage)}
                        />
                        <div className="absolute top-3 right-3 flex gap-1">
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm backdrop-blur-md ${isFull
                                ? "bg-gray-900/80 text-white"
                                : "bg-white/90 text-primary-700"
                                }`}>
                                {course.status}
                            </span>
                        </div>
                    </div>

                    {/* [List] 내용 섹션 */}
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

                        <div className="mt-auto grid grid-cols-2 md:flex md:items-center md:gap-6 pt-4 border-t border-gray-50 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{course.courseDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={13} className="text-gray-400" />
                                <span className="truncate max-w-[150px]">{course.place}</span>
                            </div>
                            <div className="col-span-2 md:col-auto flex items-center gap-2 mt-2 md:mt-0 font-medium text-emerald-600 md:ml-auto">
                                <Wallet size={13} />
                                <span>{course.price}</span>
                                <span className="text-gray-400 font-normal ml-1">
                                    (정원 {course.capacity}명)
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        );
    }

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
                        onError={() => setImgSrc(fallbackImage)} // [핵심] 이미지 로드 실패 시 대체 이미지로 교체
                    />
                    <div className="absolute top-3 right-3 flex gap-1">
                        {/* 접수 상태 배지 */}
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm backdrop-blur-md ${isFull
                            ? "bg-gray-900/80 text-white"
                            : "bg-white/90 text-primary-700"
                            }`}>
                            {course.status}
                        </span>
                    </div>
                    {/* 지역 배지 */}
                    <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 text-[10px] font-bold bg-black/50 text-white rounded-md backdrop-blur-sm">
                            {course.region}
                        </span>
                    </div>
                </div>

                {/* 내용 섹션 */}
                <div className="flex flex-1 flex-col p-5">
                    {/* 타겟 & 카테고리 태그 */}
                    <div className="flex gap-2 mb-3">
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-primary-50 text-primary-700 rounded-md border border-primary-100">
                            {course.category}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-md">
                            {course.target}
                        </span>
                    </div>

                    {/* 제목 */}
                    <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {course.title}
                    </h3>

                    {/* 기관명 */}
                    <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                        <Building2 size={12} /> {course.institution}
                    </p>

                    {/* [수정 2] 상세 정보 그리드 (접수기간/수강기간 분리) */}
                    <div className="mt-auto space-y-1.5 pt-4 border-t border-gray-50">
                        {/* 수강 기간 */}
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                            <Calendar size={13} className="text-primary-500 mt-0.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-400 text-[10px]">수강기간</span>
                                <span>{course.courseDate}</span>
                            </div>
                        </div>

                        {/* 접수 기간 (추가됨) */}
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                            <ClipboardList size={13} className="text-primary-500 mt-0.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-400 text-[10px]">접수기간</span>
                                <span>{course.applyDate}</span>
                            </div>
                        </div>

                        {/* 장소 */}
                        <div className="flex items-center gap-2 text-xs text-gray-600 pt-1">
                            <MapPin size={13} className="text-gray-400 shrink-0" />
                            <span className="truncate">{course.place}</span>
                        </div>

                        {/* 가격 및 정원 */}
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