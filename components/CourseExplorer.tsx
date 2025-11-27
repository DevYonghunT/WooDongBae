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
                <div className="relative flex items-center overflow-hidden rounded-full bg-white shadow-xl ring-1 ring-gray-200 transition-shadow focus-within:ring-2 focus-within:ring-primary hover:shadow-2xl">
                    <div className="flex h-14 w-14 items-center justify-center text-gray-400">
                        <Search className="h-6 w-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="배우고 싶은 강좌를 검색해보세요 (예: 요가, 코딩)"
                        className="h-14 w-full border-none bg-transparent pr-4 text-lg text-text placeholder-gray-400 focus:outline-none focus:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="absolute right-2 top-2 bottom-2 rounded-full bg-primary px-6 text-base font-bold text-white hover:bg-orange-600 transition-colors">
                        검색
                    </button>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="mt-8 flex w-full justify-center px-4">
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedFilter(filter)}
                            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${selectedFilter === filter
                                    ? "bg-primary text-white shadow-md scale-105"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
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
                    <h3 className="text-xl font-bold text-text">
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
