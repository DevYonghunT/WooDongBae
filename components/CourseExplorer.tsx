"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { courses } from "@/data/courses";
import BentoGrid from "./BentoGrid";

const FILTERS = [
    "전체",
    "성인",
    "초등",
    "청소년",
    "유아",
    "문화예술",
    "IT",
    "어학",
    "인문교양",
];

export default function CourseExplorer() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("전체");

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
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
        <div className="w-full">
            {/* Search Bar */}
            <div className="relative mx-auto max-w-2xl px-4 sm:px-0">
                <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center justify-center text-gray-400">
                        <Search className="h-6 w-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="배우고 싶은 강좌를 검색해보세요 (예: 요가, 코딩)"
                        className="h-16 w-full rounded-2xl border-2 border-orange-100 bg-white pl-14 pr-32 text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-0 shadow-xl shadow-orange-100/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="absolute right-2 top-2 bottom-2 rounded-xl bg-orange-500 px-6 text-base font-bold text-white hover:bg-orange-600 transition-colors shadow-md">
                        검색
                    </button>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="mt-10 flex w-full justify-center px-4">
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedFilter(filter)}
                            className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 border ${selectedFilter === filter
                                    ? "bg-orange-500 text-white border-orange-500 shadow-md scale-105"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-500 hover:text-orange-500"
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {filteredCourses.length > 0 ? (
                <BentoGrid courses={filteredCourses} />
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="mb-4 text-6xl">😢</div>
                    <h3 className="text-xl font-bold text-gray-900">
                        앗, 찾으시는 강좌가 없네요
                    </h3>
                    <p className="mt-2 text-gray-500">
                        다른 검색어나 카테고리로 다시 찾아보세요.
                    </p>
                </div>
            )}
        </div>
    );
}
