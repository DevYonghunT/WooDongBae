"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { courses } from "@/data/courses";
import BentoGrid from "./BentoGrid";
import { Course } from "@/types/course"; // 명시적 타입 import

const FILTERS = [
    "전체", "성인", "초등", "청소년", "유아", "문화예술", "IT", "어학", "인문교양",
];

export default function CourseExplorer() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("전체");

    const filteredCourses = useMemo(() => {
        return courses.filter((course: Course) => {
            const matchesSearch = course.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesFilter =
                selectedFilter === "전체" ||
                course.target === selectedFilter ||
                course.category === selectedFilter;

            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, selectedFilter]);

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* Search Bar */}
            <div className="relative mx-auto max-w-3xl mb-12">
                <div className="relative flex items-center rounded-full bg-white shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/80 p-2 transition-all focus-within:ring-primary-400 focus-within:shadow-primary-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full text-gray-400 pl-2">
                        <Search className="h-6 w-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="배우고 싶은 강좌를 검색해보세요 (예: 도예, 코딩)"
                        className="h-14 w-full bg-transparent text-lg font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="hidden sm:block rounded-full bg-primary-600 px-8 py-3.5 text-base font-bold text-white hover:bg-primary-700 transition-all shadow-md">
                        검색
                    </button>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="mb-14 flex w-full justify-center">
                <div className="flex gap-2.5 overflow-x-auto pb-4 px-4 scrollbar-hide">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedFilter(filter)}
                            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 border ${selectedFilter === filter
                                    ? "bg-gray-800 text-white border-gray-800 shadow-md transform scale-105"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Header */}
            <div className="mb-8 flex items-end gap-3 px-2">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    🔥 지금 뜨는 인기 강좌
                </h2>
                <span className="mb-1.5 text-sm font-medium text-gray-500">
                    총 {filteredCourses.length}개
                </span>
            </div>

            {/* Grid or Empty State */}
            {filteredCourses.length > 0 ? (
                <BentoGrid courses={filteredCourses} />
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl bg-white border border-dashed border-gray-300">
                    <div className="mb-6 text-6xl opacity-80">🤔</div>
                    <h3 className="text-xl font-bold text-gray-900">
                        검색 결과가 없어요
                    </h3>
                    <p className="mt-2 text-gray-500">
                        오타가 없는지 확인하거나, 다른 키워드로 검색해보세요.
                    </p>
                    <button
                        onClick={() => { setSearchTerm(""); setSelectedFilter("전체"); }}
                        className="mt-8 text-primary-600 font-bold hover:underline underline-offset-4"
                    >
                        전체 강좌 보기
                    </button>
                </div>
            )}
        </div>
    );
}