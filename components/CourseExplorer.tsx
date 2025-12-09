"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Building2, RotateCcw, Filter, LayoutGrid, List, Map } from "lucide-react";
import BentoGrid from "./BentoGrid";
import { Course } from "@/types/course";
import { getCoursesFromDB } from "@/lib/db-api";

// 상태 필터 옵션
const STATUS_OPTIONS = ["전체 상태", "추가접수", "접수중", "접수예정", "접수대기", "모집종료"];

// [설정] 대분류 지역 목록
const MAJOR_REGIONS = ["전체 지역", "서울특별시", "구리시", "하남시"];

export default function CourseExplorer() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 필터 상태 관리
    const [searchTerm, setSearchTerm] = useState("");

    // [변경] 지역 필터 분리 (대분류/소분류)
    const [selectedMajorRegion, setSelectedMajorRegion] = useState("전체 지역");
    const [selectedMinorRegion, setSelectedMinorRegion] = useState("전체"); // 구/동 선택

    const [selectedOrgan, setSelectedOrgan] = useState("전체 기관");
    const [selectedStatus, setSelectedStatus] = useState("전체 상태");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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

    // 1. [소분류 목록 계산] 대분류가 '서울특별시'일 때만 구 목록 추출
    const minorRegions = useMemo(() => {
        if (selectedMajorRegion === "서울특별시") {
            // 데이터 중 '구'로 끝나는 지역만 추출 (구리시, 하남시 등 제외하고 순수 구만)
            const districts = Array.from(new Set(
                courses
                    .map(c => c.region?.trim())
                    .filter(r => r && r.endsWith("구"))
            )).sort();
            return ["전체", ...districts];
        }
        // 구리시, 하남시, 전체 지역일 경우 하위 분류 없음
        return ["전체"];
    }, [courses, selectedMajorRegion]);

    // 2. [기관 목록] 선택된 지역 조건에 맞는 기관만 필터링
    const organs = useMemo(() => {
        let filtered = courses;

        // 대분류 필터링 적용
        if (selectedMajorRegion === "서울특별시") {
            // 서울특별시는 '구'로 끝나는 데이터들 중에서
            if (selectedMinorRegion !== "전체") {
                filtered = courses.filter(c => c.region === selectedMinorRegion);
            } else {
                filtered = courses.filter(c => c.region?.endsWith("구"));
            }
        } else if (selectedMajorRegion !== "전체 지역") {
            // 구리시, 하남시 등
            filtered = courses.filter(c => c.region === selectedMajorRegion);
        }

        const list = Array.from(new Set(
            filtered
                .map(c => c.institution?.trim())
                .filter(i => i && i !== "")
        )).sort();
        return ["전체 기관", ...list];
    }, [courses, selectedMajorRegion, selectedMinorRegion]);

    // 3. [최종 필터링]
    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            // [지역 체크 로직 변경]
            let regionMatch = true;
            if (selectedMajorRegion === "서울특별시") {
                if (selectedMinorRegion === "전체") {
                    regionMatch = course.region?.endsWith("구") || false;
                } else {
                    regionMatch = course.region === selectedMinorRegion;
                }
            } else if (selectedMajorRegion !== "전체 지역") {
                // 구리시, 하남시 선택 시
                regionMatch = course.region === selectedMajorRegion;
            }

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
    }, [courses, selectedMajorRegion, selectedMinorRegion, selectedOrgan, selectedStatus, searchTerm]);

    // 초기화 핸들러
    const handleReset = () => {
        setSelectedMajorRegion("전체 지역");
        setSelectedMinorRegion("전체");
        setSelectedOrgan("전체 기관");
        setSelectedStatus("전체 상태");
        setSearchTerm("");
    };

    // 대분류 변경 핸들러 (소분류 초기화 포함)
    const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMajorRegion(e.target.value);
        setSelectedMinorRegion("전체"); // 대분류 바뀌면 소분류 리셋
        setSelectedOrgan("전체 기관");
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* ─── 검색 및 필터 UI 섹션 ─── */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-12 -mt-8 relative z-10 mx-4 lg:mx-0">
                <div className="flex flex-col lg:flex-row gap-3 items-center">

                    {/* ① 대분류 지역 (시/도) */}
                    <div className="relative w-full lg:w-[140px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Map className="h-5 w-5" />
                        </div>
                        <select
                            className="w-full h-12 pl-10 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                            value={selectedMajorRegion}
                            onChange={handleMajorChange}
                        >
                            {MAJOR_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* ② 소분류 지역 (구) - 조건부 렌더링/활성화 */}
                    <div className="relative w-full lg:w-[140px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <select
                            className={`w-full h-12 pl-10 pr-8 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none appearance-none transition-colors text-sm ${selectedMajorRegion === "서울특별시"
                                    ? "bg-gray-50 cursor-pointer hover:bg-gray-100"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                            value={selectedMinorRegion}
                            onChange={(e) => {
                                setSelectedMinorRegion(e.target.value);
                                setSelectedOrgan("전체 기관");
                            }}
                            disabled={selectedMajorRegion !== "서울특별시"}
                        >
                            {selectedMajorRegion === "서울특별시" ? (
                                minorRegions.map(r => <option key={r} value={r}>{r === "전체" ? "전체 (구)" : r}</option>)
                            ) : (
                                <option value="전체">전체</option>
                            )}
                        </select>
                    </div>

                    {/* ③ 기관 선택 */}
                    <div className="relative w-full lg:w-[180px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <select
                            className="w-full h-12 pl-10 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors text-sm truncate"
                            value={selectedOrgan}
                            onChange={(e) => setSelectedOrgan(e.target.value)}
                        >
                            {organs.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    {/* ④ 상태 선택 */}
                    <div className="relative w-full lg:w-[120px]">
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

                    {/* ⑤ 텍스트 검색 */}
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

                    {/* ⑥ 초기화 버튼 */}
                    <button
                        onClick={handleReset}
                        className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors shrink-0"
                        title="필터 초기화"
                    >
                        <RotateCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* ─── 결과 목록 표시 (기존 코드 유지) ─── */}
            <div className="mb-6 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                        {selectedStatus !== "전체 상태" ? `${selectedStatus} ` : ""}
                        강좌 목록
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {isLoading ? "로딩중..." : `${filteredCourses.length}개`}
                    </span>
                </div>

                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                            ? "bg-white text-primary-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                        title="카드형 보기"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                            ? "bg-white text-primary-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                        title="리스트형 보기"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 그리드 */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-500">데이터를 불러오고 있습니다...</div>
            ) : filteredCourses.length > 0 ? (
                <div className="w-full">
                    <BentoGrid courses={filteredCourses} viewMode={viewMode} />
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