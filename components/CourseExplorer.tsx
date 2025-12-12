"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Building2, RotateCcw, Filter, LayoutGrid, List, Map, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import BentoGrid from "./BentoGrid";
import { Course } from "@/types/course";
import { getPaginatedCourses, getFilterMetadata, FilterMetadata } from "@/lib/db-api";

// 상태 필터 옵션
const STATUS_OPTIONS = ["전체 상태", "추가접수", "접수중", "접수예정", "접수대기", "모집종료"];

export default function CourseExplorer() {
    // 1. 데이터 상태
    const [courses, setCourses] = useState<Course[]>([]);
    const [filterData, setFilterData] = useState<FilterMetadata[]>([]); // 필터용 메타데이터
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null); // [추가] 에러 상태
    const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 12; // 한 번에 불러올 개수

    // 2. 필터 상태
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMajorRegion, setSelectedMajorRegion] = useState("전체 지역");
    const [selectedMinorRegion, setSelectedMinorRegion] = useState("전체");
    const [selectedOrgan, setSelectedOrgan] = useState("전체 기관");
    const [selectedStatus, setSelectedStatus] = useState("접수중");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // 무한 스크롤 감지용 Ref
    const observerTarget = useRef<HTMLDivElement>(null);

    // ─── [A] 초기 메타데이터 로드 (에러 핸들링 추가) ───
    useEffect(() => {
        async function loadMetadata() {
            try {
                const data = await getFilterMetadata();
                setFilterData(data);
            } catch (error) {
                console.error("필터 메타데이터 로드 실패:", error);
                // 메타데이터 로드 실패는 치명적이지 않으므로 콘솔 로그만 남기거나,
                // 필요 시 상단 배너로 알림
            }
        }
        loadMetadata();
    }, []);

    // ─── [B] 데이터 로딩 함수 ───
    const fetchCourses = useCallback(async (pageNum: number, isReset: boolean = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const newCourses = await getPaginatedCourses(pageNum, ITEMS_PER_PAGE, {
                majorRegion: selectedMajorRegion,
                minorRegion: selectedMinorRegion,
                organ: selectedOrgan,
                status: selectedStatus,
                search: searchTerm
            });

            if (isReset) {
                setCourses(newCourses);
            } else {
                setCourses(prev => [...prev, ...newCourses]);
            }

            // 가져온 데이터가 요청 개수보다 적으면 더 이상 데이터가 없는 것
            setHasMore(newCourses.length === ITEMS_PER_PAGE);
        } catch (err) {
            console.error("강좌 목록 불러오기 실패:", err);
            setError("강좌 정보를 불러오는 중 문제가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedMajorRegion, selectedMinorRegion, selectedOrgan, selectedStatus, searchTerm]);

    // ─── [C] 필터 변경 시 리셋 및 재조회 ───
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        // 디바운스 적용 (검색어 입력 시 과도한 요청 방지)
        const timer = setTimeout(() => {
            fetchCourses(1, true); // 1페이지부터 다시 로드 (리셋 모드)
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchCourses]);

    // ─── [D] 무한 스크롤 옵저버 설정 ───
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !error) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading, error]);

    // ─── [E] 페이지 변경 시 추가 로드 ───
    useEffect(() => {
        if (page > 1) {
            fetchCourses(page, false);
        }
    }, [page, fetchCourses]);


    // ─── 필터 목록 계산 로직 (기존 로직을 filterData 기반으로 변경) ───

    // 1. 대분류 목록
    const majorRegions = useMemo(() => {
        const regions = new Set<string>(["전체 지역"]);

        filterData.forEach(item => {
            const r = item.region?.trim();
            if (!r) return;
            // 서울 관련 지역은 모두 '서울특별시'로 통합
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


    // 핸들러 함수들
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
            {error && (
                <div className="mb-6 mx-4 lg:mx-0 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                    <button
                        onClick={() => fetchCourses(page, page === 1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        재시도
                    </button>
                </div>
            )}

            {/* ─── 검색 필터 UI (기존과 동일) ─── */}
            <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-12 relative z-10 mx-4 lg:mx-0 transition-transform ${error ? 'mt-4' : '-mt-8'}`}>
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
                            {organs.map(o => <option key={o} value={o}>{o}</option>)}
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

                        {/* 무한 스크롤 트리거 & 로딩 인디케이터 */}
                        <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
                            {isLoading && <Loader2 className="w-8 h-8 animate-spin text-primary-500" />}
                            {!hasMore && courses.length > 0 && (
                                <p className="text-gray-400 text-sm">모든 강좌를 불러왔습니다.</p>
                            )}
                        </div>
                    </>
                ) : (
                    !isLoading && !error && (
                        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-lg text-gray-600 font-medium">조건에 맞는 강좌가 없어요.</p>
                            <button onClick={handleReset} className="mt-4 text-primary-600 text-sm font-bold hover:underline">필터 초기화 하고 전체 보기</button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

// 상태 필터 옵션
const STATUS_OPTIONS = ["전체 상태", "추가접수", "접수중", "접수예정", "접수대기", "모집종료"];

export default function CourseExplorer() {
    // 1. 데이터 상태
    const [courses, setCourses] = useState<Course[]>([]);
    const [filterData, setFilterData] = useState<{ region: string, institution: string }[]>([]); // 필터용 메타데이터
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 12; // 한 번에 불러올 개수

    // 2. 필터 상태
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMajorRegion, setSelectedMajorRegion] = useState("전체 지역");
    const [selectedMinorRegion, setSelectedMinorRegion] = useState("전체");
    const [selectedOrgan, setSelectedOrgan] = useState("전체 기관");
    const [selectedStatus, setSelectedStatus] = useState("접수중");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // 무한 스크롤 감지용 Ref
    const observerTarget = useRef<HTMLDivElement>(null);

    // ─── [A] 초기 메타데이터 로드 (에러 핸들링 추가) ───
    useEffect(() => {
        async function loadMetadata() {
            try {
                const data = await getFilterMetadata();
                // @ts-ignore
                setFilterData(data);
            } catch (error) {
                console.error("필터 메타데이터 로드 실패:", error);
                // 필요 시 에러 상태를 설정하여 사용자에게 알림 UI 표시 가능
            }
        }
        loadMetadata();
    }, []);

    // ─── [B] 데이터 로딩 함수 ───
    const fetchCourses = useCallback(async (pageNum: number, isReset: boolean = false) => {
        setIsLoading(true);
        try {
            const newCourses = await getPaginatedCourses(pageNum, ITEMS_PER_PAGE, {
                majorRegion: selectedMajorRegion,
                minorRegion: selectedMinorRegion,
                organ: selectedOrgan,
                status: selectedStatus,
                search: searchTerm
            });

            if (isReset) {
                setCourses(newCourses);
            } else {
                setCourses(prev => [...prev, ...newCourses]);
            }

            // 가져온 데이터가 요청 개수보다 적으면 더 이상 데이터가 없는 것
            setHasMore(newCourses.length === ITEMS_PER_PAGE);
        } catch (error) {
            console.error("강좌 목록 불러오기 실패:", error);
            // 여기에 에러 발생 시 사용자에게 보여줄 토스트 메시지 등을 추가할 수 있습니다.
        } finally {
            setIsLoading(false);
        }
    }, [selectedMajorRegion, selectedMinorRegion, selectedOrgan, selectedStatus, searchTerm]);

    // ─── [C] 필터 변경 시 리셋 및 재조회 ───
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        // 디바운스 적용 (검색어 입력 시 과도한 요청 방지)
        const timer = setTimeout(() => {
            fetchCourses(1, true); // 1페이지부터 다시 로드 (리셋 모드)
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchCourses]);

    // ─── [D] 무한 스크롤 옵저버 설정 ───
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading]);

    // ─── [E] 페이지 변경 시 추가 로드 ───
    useEffect(() => {
        if (page > 1) {
            fetchCourses(page, false);
        }
    }, [page, fetchCourses]);


    // ─── 필터 목록 계산 로직 (기존 로직을 filterData 기반으로 변경) ───

    // 1. 대분류 목록
    const majorRegions = useMemo(() => {
        const regions = new Set<string>(["전체 지역"]);

        filterData.forEach(item => {
            const r = item.region?.trim();
            if (!r) return;
            // 서울 관련 지역은 모두 '서울특별시'로 통합
            if (r.endsWith("구") || r.includes("서울")) regions.add("서울특별시");
            else regions.add(r);
        });

        return Array.from(regions).sort((a, b) => {
            // [수정] 정렬 로직 강화
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
                    .filter(item => item.region?.endsWith("구") || item.region?.includes("서울"))
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
            filtered.map(item => item.institution?.trim()).filter(Boolean)
        )).sort();
        return ["전체 기관", ...list];
    }, [filterData, selectedMajorRegion, selectedMinorRegion]);


    // 핸들러 함수들
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
            {/* ─── 검색 필터 UI (기존과 동일) ─── */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-12 -mt-8 relative z-10 mx-4 lg:mx-0">
                <div className="flex flex-col lg:flex-row gap-3 items-center">
                    {/* ... (이전 코드의 select 박스들 그대로 유지) ... */}
                    {/* 아래는 변경된 변수명(majorRegions 등)을 사용하므로 기존 코드 복붙 시 주의 */}

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
                            {organs.map(o => <option key={o} value={o}>{o}</option>)}
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
                    {/* 총 개수는 이제 정확히 알 수 없으므로(무한스크롤) 현재 로드된 개수 표시 */}
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

                        {/* 무한 스크롤 트리거 & 로딩 인디케이터 */}
                        <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
                            {isLoading && <Loader2 className="w-8 h-8 animate-spin text-primary-500" />}
                            {!hasMore && courses.length > 0 && (
                                <p className="text-gray-400 text-sm">모든 강좌를 불러왔습니다.</p>
                            )}
                        </div>
                    </>
                ) : (
                    !isLoading && (
                        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-lg text-gray-600 font-medium">조건에 맞는 강좌가 없어요.</p>
                            <button onClick={handleReset} className="mt-4 text-primary-600 text-sm font-bold hover:underline">필터 초기화 하고 전체 보기</button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}