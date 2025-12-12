"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useLoginModal } from "@/store/useLoginModal";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BookmarkButtonProps {
    courseId: number; // 또는 string (DB 타입에 맞춰주세요)
    initialIsBookmarked?: boolean;
}

export default function BookmarkButton({ courseId, initialIsBookmarked = false }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const { openModal } = useLoginModal();

    // (선택사항) 처음 로드될 때 내가 찜했는지 확인하는 로직 추가 가능

    const toggleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault(); // 링크 이동 방지
        e.stopPropagation();

        // 1. 로그인 체크
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            openModal("관심 강좌를 찜하려면\n회원가입이 필요해요! ❤️");
            return;
        }

        // 2. 찜 토글 로직
        const newStatus = !isBookmarked;
        setIsBookmarked(newStatus); // UI 먼저 반영 (Optimistic UI)

        try {
            if (newStatus) {
                // 찜 추가
                const { error } = await supabase
                    .from("bookmarks")
                    .insert({ user_id: user.id, course_id: courseId });
                if (error) throw error;
            } else {
                // 찜 삭제
                const { error } = await supabase
                    .from("bookmarks")
                    .delete()
                    .match({ user_id: user.id, course_id: courseId });
                if (error) throw error;
            }
        } catch (error) {
            console.error("찜 변경 실패:", error);
            setIsBookmarked(!newStatus); // 에러나면 원상복구
            alert("오류가 발생했습니다.");
        }
    };

    return (
        <button
            onClick={toggleBookmark}
            className={`p-2 rounded-full transition-all ${isBookmarked
                    ? "text-red-500 bg-red-50 hover:bg-red-100"
                    : "text-gray-400 bg-black/5 hover:bg-black/10 hover:text-red-400"
                }`}
        >
            <Heart className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
        </button>
    );
}