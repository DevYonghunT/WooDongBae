"use client";

import Link from "next/link";
import { ChevronLeft, BookOpen, HeartOff } from "lucide-react";
import BentoGrid from "@/components/BentoGrid"; // 기존 Grid 컴포넌트 재사용
import { useBookmarks } from "@/hooks/useBookmarks"; // 찜하기 훅

export default function BookmarksPage() {
    // 찜 목록 데이터 가져오기
    const { bookmarks, isLoaded } = useBookmarks();

    const pageTitle = "나의 찜 목록";
    const pageDescription = "찜하기 버튼을 눌러 저장한 강좌들을 모아보세요.";

    // 1. 로딩 상태 처리 (Hydration Error 방지)
    if (!isLoaded) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
                <p className="mt-4 text-gray-500 text-sm">보관함을 불러오는 중...</p>
            </div>
        );
    }

    // 2. 찜 목록이 비었을 때 (Empty State)
    if (bookmarks.length === 0) {
        return (
            <main className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                        <p className="mt-2 text-gray-500">{pageDescription}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <HeartOff className="w-8 h-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">아직 찜한 강좌가 없어요</h2>
                        <p className="mt-2 text-gray-500 text-center max-w-md">
                            관심 있는 강좌의 하트 버튼을 눌러보세요.<br />
                            저장된 강좌는 언제든 여기서 다시 볼 수 있습니다.
                        </p>
                        <Link
                            href="/"
                            className="mt-8 flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-200"
                        >
                            <BookOpen className="w-5 h-5" />
                            강좌 찾아보기
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // 3. 찜 목록이 있을 때 (Grid 뷰)
    return (
        <main className="min-h-screen bg-white pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* 상단 네비게이션 & 타이틀 */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6 group"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        메인으로 돌아가기
                    </Link>

                    <div className="flex items-end gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                        <span className="text-primary-600 font-bold text-lg mb-1">{bookmarks.length}</span>
                    </div>
                    <p className="mt-2 text-gray-500">{pageDescription}</p>
                </div>

                {/* 강좌 목록 그리드 (BentoGrid 재사용) */}
                <div className="w-full">
                    <BentoGrid courses={bookmarks} viewMode="grid" />
                </div>
            </div>
        </main>
    );
}
