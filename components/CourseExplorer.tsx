"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Building2, RotateCcw, Filter } from "lucide-react";
import BentoGrid from "./BentoGrid";
import { Course } from "@/types/course";
import { getCoursesFromDB } from "@/lib/db-api";

// 상태 필터 옵션
const STATUS_OPTIONS = ["전체 상태", "추가접수", "접수중", "접수예정", "접수대기", "모집종료"];

export default function CourseExplorer() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 필터 상태 관리
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("전체 지역");
    const [selectedOrgan, setSelectedOrgan] = useState("전체 기관");
    const [selectedStatus, setSelectedStatus] = useState("전체 상태");

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getCoursesFromDB();
                setCourses(data);
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // 1. [지역 목록] 데이터에서 중복 제거 및 정제
    const regions = useMemo(() => {
        const list = Array.from(new Set(
            courses
                .map(c => c.region?.trim()) // 공백 제거
                .filter(r => r && r !== "") // 빈 값 제거
        )).sort();
        return ["전체 지역", ...list];
    }, [courses]);

    // 2. [기관 목록] 선택된 지역에 해당하는 기관만 필터링
    const organs = useMemo(() => {
        let filtered = courses;
        if (selectedRegion !== "전체 지역") {
            filtered = courses.filter(c => c.region?.trim() === selectedRegion);
        }
        const list = Array.from(new Set(
            filtered
                .map(c => c.institution?.trim())
                .filter(i => i && i !== "")
        )).sort();
        return ["전체 기관", ...list];
    }, [courses, selectedRegion]);

    // 3. [최종 필터링]
    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            // 지역 체크 (공백 제거 후 비교)
            const regionMatch = selectedRegion === "전체 지역" || course.region?.trim() === selectedRegion;

            // 기관 체크
            const organMatch = selectedOrgan === "전체 기관" || course.institution?.trim() === selectedOrgan;

            // 상태 체크
            let statusMatch = false;
            if (selectedStatus === "전체 상태") {
                statusMatch = true;
            } else if (selectedStatus === "접수중") {
                statusMatch = course.status === "접수중" || course.status === "마감임박";
            } else {
                statusMatch = course.status === selectedStatus;
            }

            // 검색어 체크
            const searchLower = searchTerm.toLowerCase();
            const searchMatch = !searchTerm ||
                course.title.toLowerCase().includes(searchLower) ||
                course.category.toLowerCase().includes(searchLower);

            return regionMatch && organMatch && statusMatch && searchMatch;
        });
    }, [courses, selectedRegion, selectedOrgan, selectedStatus, searchTerm]);

    const handleReset = () => {
        setSelectedRegion("전체 지역");
        setSelectedOrgan("전체 기관");
        setSelectedStatus("전체 상태");
        setSearchTerm("");
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* ─── 검색 및 필터 UI 섹션 ─── */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-12 -mt-8 relative z-10 mx-4 lg:mx-0">
                <div className="flex flex-col lg:flex-row gap-3 items-center">

                    {/* ① 지역 선택 */}
                    <div className="relative w-full lg:w-1/5">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <select
                            className="w-full h-12 pl-10 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                            value={selectedRegion}
                            onChange={(e) => {
                                setSelectedRegion(e.target.value);
                                setSelectedOrgan("전체 기관");
                            }}
                        >
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* ② 기관 선택 */}
                    <div className="relative w-full lg:w-1/5">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <select
                            className="w-full h-12 pl-10 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                            value={selectedOrgan}
                            onChange={(e) => setSelectedOrgan(e.target.value)}
                        >
                            {organs.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    {/* ③ 상태 선택 */}
                    <div className="relative w-full lg:w-[15%]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Filter className="h-5 w-5" />
                        </div>
                        <select
                            className="w-full h-12 pl-10 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* ④ 텍스트 검색 */}
                    <div className="relative w-full lg:flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="강좌명, 카테고리 검색"
                            className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* ⑤ 초기화 버튼 */}
                    <button
                        onClick={handleReset}
                        className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors shrink-0"
                        title="필터 초기화"
                    >
                        <RotateCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* ─── 결과 목록 표시 ─── */}
            <div className="mb-6 px-4 flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                    {selectedStatus !== "전체 상태" ? `${selectedStatus} ` : ""}
                    강좌 목록
                </h2>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {isLoading ? "로딩중..." : `${filteredCourses.length}개`}
                </span>
            </div>

            {/* 그리드 */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-500">데이터를 불러오고 있습니다...</div>
            ) : filteredCourses.length > 0 ? (
                // [핵심] 여기에 w-full을 주어 그리드가 꽉 차게 함
                <div className="w-full">
                    <BentoGrid courses={filteredCourses} />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-lg text-gray-600 font-medium">조건에 맞는 강좌가 없어요.</p>
                    <button
                        onClick={handleReset}
                        className="mt-4 text-primary-600 text-sm font-bold hover:underline"
                    >
                        필터 초기화 하고 전체 보기
                    </button>
                </div>
            )}
        </div>
    );
}