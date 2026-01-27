"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Building2, RotateCcw, Filter, LayoutGrid, List, Map, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import BentoGrid from "./BentoGrid";
import { Course } from "@/types/course";
import { getPaginatedCourses, getFilterMetadata, FilterMetadata } from "@/lib/db-api";

// 상태 필터 옵션
const STATUS_OPTIONS = ["전체 상태", "추가접수", "접수중", "접수예정", "접수대기", "모집종료"];
const ITEMS_PER_PAGE = 12;

export default function CourseExplorer() {
    // ─── 필터 상태 ───
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedMajorRegion, setSelectedMajorRegion] = useState("전체 지역");
    const [selectedMinorRegion, setSelectedMinorRegion] = useState("전체");
    const [selectedOrgan, setSelectedOrgan] = useState("전체 기관");
    const [selectedStatus, setSelectedStatus] = useState("접수중");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [userId, setUserId] = useState<string | undefined>();

    // ─── 검색어 디바운스 ───
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ─── 유저 세션 가져오기 ───
    useEffect(() => {
        import("@/utils/supabase/client").then(m =>
            m.createClient().auth.getSession()
        ).then(({ data: { session } }) => {
            setUserId(session?.user?.id);
        });
    }, []);

    // ─── 무한 스크롤 감지 (react-intersection-observer) ───
    const { ref: observerRef, inView } = useInView({ threshold: 0.2, rootMargin: "300px" });

    // ─── [A] 필터 메타데이터 (React Query 캐싱) ───
    const { data: filterData = [] } = useQuery<FilterMetadata[]>({
        queryKey: ['filter-metadata'],
        queryFn: getFilterMetadata,
        staleTime: 5 * 60 * 1000, // 5분
    });

    // ─── [B] 강좌 무한 스크롤 (React Query useInfiniteQuery) ───
    const filters = useMemo(() => ({
        majorRegion: selectedMajorRegion,
        minorRegion: selectedMinorRegion,
        organ: selectedOrgan,
        status: selectedStatus,
        search: debouncedSearch,
    }), [selectedMajorRegion, selectedMinorRegion, selectedOrgan, selectedStatus, debouncedSearch]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['courses', filters, userId],
        queryFn: ({ pageParam }) => getPaginatedCourses(pageParam, ITEMS_PER_PAGE, filters, userId),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < ITEMS_PER_PAGE) return undefined;
            return allPages.length + 1;
        },
    });

    // ─── [C] 센티널 요소 보이면 다음 페이지 로드 ───
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ─── 강좌 목록 플래튼 ───
    const courses: Course[] = data?.pages.flat() ?? [];

    // ─── 필터 목록 계산 로직 ───

    // 1. 대분류 목록
    const majorRegions = useMemo(() => {
        const regions = new Set<string>(["전체 지역"]);

        filterData.forEach(item => {
            const r = item.region?.trim();
            if (!r) return;
            if (r.endsWith("구") || r.includes("서울")) regions.add("서울특별시");
            else regions.add(r);
        });

        return Array.from(regions).sort((a, b) => {
            if (a === "전체 지역") return -1;
            if (b === "전체 지역") return 1;
            if (a === "서울특별시") return -1;
            if (b === "서울특별시") return 1;
            return a.localeCompare(b, 'ko');
        });
    }, [filterData]);

    // 2. 소분류 목록
    const minorRegions = useMemo(() => {
        if (selectedMajorRegion === "서울특별시") {
            const districts = Array.from(new Set(
                filterData
                    .filter(item => (item.region?.endsWith("구") || item.region?.includes("서울")))
                    .map(item => item.region?.trim())
            )).sort();
            return ["전체", ...districts];
        }
        return ["전체"];
    }, [filterData, selectedMajorRegion]);

    // 3. 기관 목록 (선택된 지역에 맞는 기관만)
    const organs = useMemo(() => {
        let filtered = filterData;
        if (selectedMajorRegion === "서울특별시") {
            if (selectedMinorRegion !== "전체") {
                filtered = filtered.filter(item => item.region === selectedMinorRegion);
            } else {
                filtered = filtered.filter(item => item.region?.endsWith("구") || item.region?.includes("서울"));
            }
        } else if (selectedMajorRegion !== "전체 지역") {
            filtered = filtered.filter(item => item.region === selectedMajorRegion);
        }

        const list = Array.from(new Set(
            filtered.map(item => item.institution?.trim()).filter((s): s is string => !!s)
        )).sort();
        return ["전체 기관", ...list];
    }, [filterData, selectedMajorRegion, selectedMinorRegion]);


    // ─── 기관명 포맷팅 헬퍼 ───
    const formatOrganLabel = (organ: string) => {
        if (organ === "전체 기관") return organ;
        if (selectedMajorRegion === "전체 지역") return organ;

        let formatted = organ.trim();

        const removePrefix = (text: string, prefix: string) => {
            const escaped = prefix.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
            const regex = new RegExp(`^\\s*${escaped}\\s*`);
            return text.replace(regex, "");
        };

        if (selectedMajorRegion === "서울특별시") {
            const seoulPrefixes = ["서울특별시", "서울시", "서울"];
            for (const p of seoulPrefixes) {
                if (removePrefix(formatted, p) !== formatted) {
                    formatted = removePrefix(formatted, p);
                    break;
                }
            }
            if (selectedMinorRegion !== "전체") {
                formatted = removePrefix(formatted, selectedMinorRegion);
            }
        } else {
            const provinces = [
                "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도",
                "경상북도", "경상남도", "제주특별자치도", "세종특별자치시",
                "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시"
            ];

            let removedMajor = false;
            for (const prov of provinces) {
                const combo = prov + selectedMajorRegion;
                if (removePrefix(formatted, combo) !== formatted) {
                    formatted = removePrefix(formatted, combo);
                    removedMajor = true;
                    break;
                }
            }

            if (!removedMajor) {
                if (removePrefix(formatted, selectedMajorRegion) !== formatted) {
                    formatted = removePrefix(formatted, selectedMajorRegion);
                }
            }

            if (selectedMinorRegion !== "전체") {
                formatted = removePrefix(formatted, selectedMinorRegion);
            }
        }

        return formatted.trim() === "" ? organ : formatted.trim();
    };

    // ─── 핸들러 함수들 ───
    const handleReset = () => {
        setSelectedMajorRegion("전체 지역");
        setSelectedMinorRegion("전체");
        setSelectedOrgan("전체 기관");
        setSelectedStatus("접수중");
        setSearchTerm("");
    };

    const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMajorRegion(e.target.value);
        setSelectedMinorRegion("전체");
        setSelectedOrgan("전체 기관");
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* ─── 에러 배너 (API 실패 시 표시) ─── */}
            {isError && (
                <div className="mb-6 mx-4 lg:mx-0 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">강좌 정보를 불러오는 중 문제가 발생했습니다.</span>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        재시도
                    </button>
                </div>
            )}

            {/* ─── 검색 필터 UI ─── */}
            <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-12 relative z-10 mx-4 lg:mx-0 transition-transform ${isError ? 'mt-4' : '-mt-8'}`}>
                <div className="flex flex-col lg:flex-row gap-3 items-center">

                    {/* ① 대분류 지역 */}
                    <div className="relative w-full lg:w-[140px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Map className="h-5 w-5" /></div>
                        <select className="w-full h-12 pl-10 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium outline-none appearance-none cursor-pointer text-sm"
                            value={selectedMajorRegion} onChange={handleMajorChange}>
                            {majorRegions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* ② 소분류 지역 */}
                    <div className="relative w-full lg:w-[140px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MapPin className="h-5 w-5" /></div>
                        <select className={`w-full h-12 pl-10 pr-8 border border-gray-200 rounded-xl text-gray-700 font-medium outline-none appearance-none text-sm ${selectedMajorRegion === "서울특별시" ? "bg-gray-50 cursor-pointer" : "bg-gray-100 text-gray-400"}`}
                            value={selectedMinorRegion} onChange={(e) => { setSelectedMinorRegion(e.target.value); setSelectedOrgan("전체 기관"); }} disabled={selectedMajorRegion !== "서울특별시"}>
                            {selectedMajorRegion === "서울특별시" ? minorRegions.map(r => <option key={r} value={r}>{r === "전체" ? "전체 (구)" : r}</option>) : <option value="전체">전체</option>}
                        </select>
                    </div>

                    {/* ③ 기관 선택 */}
                    <div className="relative w-full lg:w-[180px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Building2 className="h-5 w-5" /></div>
                        <select className="w-full h-12 pl-10 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium outline-none appearance-none cursor-pointer text-sm truncate"
                            value={selectedOrgan} onChange={(e) => setSelectedOrgan(e.target.value)}>
                            {organs.map(o => <option key={o} value={o}>{formatOrganLabel(o)}</option>)}
                        </select>
                    </div>

                    {/* ④ 상태 선택 */}
                    <div className="relative w-full lg:w-[160px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter className="h-5 w-5" /></div>
                        <select className="w-full h-12 pl-10 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium outline-none appearance-none cursor-pointer text-sm"
                            value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* ⑤ 검색 */}
                    <div className="relative w-full lg:flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="h-5 w-5" /></div>
                        <input type="text" placeholder="강좌명, 카테고리 검색" className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none text-sm"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    {/* ⑥ 초기화 */}
                    <button onClick={handleReset} className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors shrink-0">
                        <RotateCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* ─── 결과 목록 표시 ─── */}
            <div className="mb-6 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                        {selectedStatus !== "전체 상태" ? `${selectedStatus} ` : ""}
                        강좌 목록
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {courses.length}개+
                    </span>
                </div>

                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400"}`}><LayoutGrid className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400"}`}><List className="w-5 h-5" /></button>
                </div>
            </div>

            {/* ─── 그리드 & 무한 스크롤 ─── */}
            <div className="w-full">
                {courses.length > 0 ? (
                    <>
                        <BentoGrid courses={courses} viewMode={viewMode} />

                        {/* 무한 스크롤 센티널 & 로딩 인디케이터 */}
                        <div ref={observerRef} className="h-20 flex items-center justify-center mt-8">
                            {isFetchingNextPage && <Loader2 className="w-8 h-8 animate-spin text-primary-500" />}
                            {!hasNextPage && courses.length > 0 && (
                                <p className="text-gray-400 text-sm">모든 강좌를 불러왔습니다.</p>
                            )}
                        </div>
                    </>
                ) : (
                    !isLoading && !isError && (
                        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-lg text-gray-600 font-medium">조건에 맞는 강좌가 없어요.</p>
                            <button onClick={handleReset} className="mt-4 text-primary-600 text-sm font-bold hover:underline">필터 초기화 하고 전체 보기</button>
                        </div>
                    )
                )}

                {/* 초기 로딩 스피너 */}
                {isLoading && courses.length === 0 && (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                    </div>
                )}
            </div>
        </div>
    );
}
