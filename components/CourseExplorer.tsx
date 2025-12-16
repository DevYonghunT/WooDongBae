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
            }
        }
        loadMetadata();
    }, []);

    // ─── [A-2] [추가] 로그인 상태 확인 후 찜 목록 동기화 ───
    // 페이지 로드 시점(또는 새로고침)에 Auth가 늦게 로드될 수 있으므로 별도 체크
    useEffect(() => {
        async function syncBookmarks() {
            try {
                const { data: { session } } = await import("@/utils/supabase/client").then(m => m.createClient().auth.getSession());

                if (session?.user) {
                    const { createClient } = await import("@/utils/supabase/client");
                    const supabase = createClient();

                    const { data: likeData } = await supabase
                        .from('bookmarks') // 테이블명 확인 (bookmarks or likes)
                        .select('course_id')
                        .eq('user_id', session.user.id);

                    if (likeData) {
                        const likedIds = new Set(likeData.map((item: any) => item.course_id));

                        setCourses(prevCourses =>
                            prevCourses.map(course => ({
                                ...course,
                                isBookmarked: likedIds.has(course.id) ? true : course.isBookmarked
                            }))
                        );
                    }
                }
            } catch (err) {
                console.error("찜 목록 동기화 실패:", err);
            }
        }

        // 약간의 지연 후 실행하여 목록이 로드된 뒤 매칭되도록 함 (선택사항)
        syncBookmarks();
    }, [isLoading]); // 로딩이 끝날 때마다 체크? 아니면 최초 1회?
    // 로딩이 끝난 직후(isLoading changes false)에 체크하는 게 좋음.
    // 하지만 courses가 바뀔 때마다 체크해야 할 수도 있음.
    // 일단 간단히 마운트 시 + isLoading(페이지네이션 결과물) 변경 시 체크.

    // ─── [B] 데이터 로딩 함수 ───
    const fetchCourses = useCallback(async (pageNum: number, isReset: boolean = false) => {
        setIsLoading(true);
        setError(null);
        try {
            // [추가] 유저 정보 가져오기 (비동기)
            // 컴포넌트 마운트 시점에 한 번만 가져와서 state로 관리할 수도 있지만,
            // 여기서는 요청 시점의 정확성을 위해 직접 호출
            const { data: { session } } = await import("@/utils/supabase/client").then(m => m.createClient().auth.getSession());
            const userId = session?.user?.id;

            const newCourses = await getPaginatedCourses(pageNum, ITEMS_PER_PAGE, {
                majorRegion: selectedMajorRegion,
                minorRegion: selectedMinorRegion,
                organ: selectedOrgan,
                status: selectedStatus,
                search: searchTerm
            }, userId); // userId 전달

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


    // ─── [추가] 기관명 포맷팅 헬퍼 ───
    const formatOrganLabel = (organ: string) => {
        if (organ === "전체 기관") return organ;
        if (selectedMajorRegion === "전체 지역") return organ;

        let formatted = organ.trim();

        // 공백 무시하고 접두어 제거하는 함수 (e.g. "서울 시" -> "서울시" 매칭)
        const removePrefix = (text: string, prefix: string) => {
            // 접두어의 각 글자 사이에 공백(\s*) 허용하도록 정규식 생성
            const escaped = prefix.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
            // 접두어 자체 앞뒤로도 공백 허용
            const regex = new RegExp(`^\\s*${escaped}\\s*`);
            return text.replace(regex, "");
        };

        if (selectedMajorRegion === "서울특별시") {
            // 1) 서울 접두어 제거
            const seoulPrefixes = ["서울특별시", "서울시", "서울"];
            for (const p of seoulPrefixes) {
                if (removePrefix(formatted, p) !== formatted) {
                    formatted = removePrefix(formatted, p);
                    break; // 가장 긴 것부터 매칭하거나 순서대로 하나만 제거
                }
            }
            // 2) 구 제거 (전체가 아닐 때)
            if (selectedMinorRegion !== "전체") {
                formatted = removePrefix(formatted, selectedMinorRegion);
            }
        } else {
            // 1) 광역 단위 + 지역명 결합 제거 시도
            // 광역 단위 목록
            const provinces = [
                "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도",
                "경상북도", "경상남도", "제주특별자치도", "세종특별자치시",
                "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시"
            ];

            let removedMajor = false;

            // 1-1) "광역 + 지역" 결합 형태 확인 (예: "경기도" + "하남시")
            for (const prov of provinces) {
                const combo = prov + selectedMajorRegion;
                if (removePrefix(formatted, combo) !== formatted) {
                    formatted = removePrefix(formatted, combo);
                    removedMajor = true;
                    break;
                }
            }

            // 1-2) 결합형이 아니면 지역명 단독 제거 시도 (예: "하남시어린이회관")
            if (!removedMajor) {
                if (removePrefix(formatted, selectedMajorRegion) !== formatted) {
                    formatted = removePrefix(formatted, selectedMajorRegion);
                }
            }

            // 2) 소분류 제거
            if (selectedMinorRegion !== "전체") {
                formatted = removePrefix(formatted, selectedMinorRegion);
            }
        }

        // 3) 빈 문자열이면 원래 값 반환, 아니면 정리된 값 반환
        return formatted.trim() === "" ? organ : formatted.trim();
    };

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
