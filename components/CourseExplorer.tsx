"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Building2, RotateCcw } from "lucide-react"; // 아이콘 추가
import BentoGrid from "./BentoGrid";
import { Course } from "@/types/course";
import { getCoursesFromDB } from "@/lib/db-api";

export default function CourseExplorer() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 필터 상태
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("전체 지역");
    const [selectedOrgan, setSelectedOrgan] = useState("전체 기관");

    // 데이터 로딩
    useEffect(() => {
        async function loadData() {
            const data = await getCoursesFromDB();
            setCourses(data);
            setIsLoading(false);
        }
        loadData();
    }, []);

    // 1. 지역 목록 추출 (중복 제거)
    const regions = useMemo(() => {
        const list = Array.from(new Set(courses.map(c => c.region || "기타"))).sort();
        return ["전체 지역", ...list];
    }, [courses]);

    // 2. 기관 목록 추출 (선택된 지역에 속한 기관만 필터링)
    const organs = useMemo(() => {
        let filtered = courses;
        if (selectedRegion !== "전체 지역") {
            filtered = courses.filter(c => c.region === selectedRegion);
        }
        const list = Array.from(new Set(filtered.map(c => c.institution))).sort();
        return ["전체 기관", ...list];
    }, [courses, selectedRegion]);

    // 3. 최종 필터링 (지역 -> 기관 -> 검색어)
    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            const matchesRegion = selectedRegion === "전체 지역" || course.region === selectedRegion;
            const matchesOrgan = selectedOrgan === "전체 기관" || course.institution === selectedOrgan;
            const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.category.includes(searchTerm);

            return matchesRegion && matchesOrgan && matchesSearch;
        });
    }, [courses, selectedRegion, selectedOrgan, searchTerm]);

    // 지역 변경 시 기관 선택 초기화
    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRegion(e.target.value);
        setSelectedOrgan("전체 기관");
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* Filter & Search Section */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-12 -mt-8 relative z-10 mx-4 lg:mx-0">
                <div className="flex flex-col md:flex-row gap-4 items-center">


                    {/* 1. 지역 선택 */}
                    <div className="relative w-full md:w-1/4">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <select
                            className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                            value={selectedRegion}
                            onChange={handleRegionChange}
                        >
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* 2. 기관 선택 */}
                    <div className="relative w-full md:w-1/4">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <select
                            className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                            value={selectedOrgan}
                            onChange={(e) => setSelectedOrgan(e.target.value)}
                        >
                            {organs.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    {/* 3. 검색창 */}
                    <div className="relative w-full md:w-2/4">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="배우고 싶은 강좌명, 카테고리 검색"
                            className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* 초기화 버튼 */}
                    <button
                        onClick={() => { setSelectedRegion("전체 지역"); setSelectedOrgan("전체 기관"); setSearchTerm(""); }}
                        className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                        title="필터 초기화"
                    >
                        <RotateCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Results Header */}
            <div className="mb-6 px-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                    {selectedRegion !== "전체 지역" ? `${selectedRegion} ` : ""}
                    {selectedOrgan !== "전체 기관" ? `> ${selectedOrgan}` : ""} 강좌 목록
                </h2>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {isLoading ? "로딩중..." : `${filteredCourses.length}개 검색됨`}
                </span>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-500">데이터를 불러오고 있습니다...</div>
            ) : filteredCourses.length > 0 ? (
                <BentoGrid courses={filteredCourses} />
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-lg text-gray-600 font-medium">조건에 맞는 강좌가 없어요.</p>
                    <p className="text-gray-400 text-sm mt-2">다른 지역이나 기관을 선택해보세요.</p>
                </div>
            )}
        </div>
    );
}