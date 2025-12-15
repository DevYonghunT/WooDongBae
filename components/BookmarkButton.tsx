"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLoginModal } from "@/store/useLoginModal";

// 👇 [변경] 공통 클라이언트 사용 (쿠키 공유됨)
const supabase = createClient();

interface BookmarkButtonProps {
    courseId: number; // 또는 string (DB 타입에 맞춰주세요)
    initialIsBookmarked?: boolean;
}

export default function BookmarkButton({ courseId, initialIsBookmarked = false }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const { openModal } = useLoginModal();

    // [추가] 부모로부터 내려오는 props가 변경되면 내부 상태도 동기화
    useEffect(() => {
        setIsBookmarked(initialIsBookmarked);
    }, [initialIsBookmarked]);

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

        // 2. 찜 토글 로직 (Check-then-Act)
        // Optimistic UI는 유지하되, 실제 로직은 DB 상태를 확인 후 수행
        const newStatus = !isBookmarked;
        setIsBookmarked(newStatus);

        try {
            // [중요] 먼저 DB에 이미 찜이 되어있는지 확인
            // (내 로컬 state와 DB 상태가 다를 수 있으므로)
            const { data: existingBookmark, error: checkError } = await supabase
                .from("bookmarks")
                .select("id")
                .eq("user_id", user.id)
                .eq("course_id", courseId)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingBookmark) {
                // 이미 존재함 -> 삭제 (Delete)
                const { error: deleteError } = await supabase
                    .from("bookmarks")
                    .delete()
                    .eq("id", existingBookmark.id); // ID로 정확히 삭제

                if (deleteError) throw deleteError;

                // 만약 UI가 "찜 안됨" 상태였다면(newStatus === true),
                // 근데 실제론 DB에 있어서 삭제했다면? -> UI를 다시 false로 맞춰줌
                if (newStatus === true) {
                    // 사용자는 "찜하기"를 눌렀는데, 실제론 "취소"가 된 셈.
                    // 이 경우 그냥 찜 상태를 유지하는 게 나을 수도 있고 취소하는 게 나을 수도 있음.
                    // 보통 "토글"이니까 삭제했으면 빈 하트가 맞음.
                    setIsBookmarked(false);
                }

            } else {
                // 없음 -> 추가 (Insert)
                const { error: insertError } = await supabase
                    .from("bookmarks")
                    .insert({ user_id: user.id, course_id: courseId });

                if (insertError) {
                    // 동시성 이슈로 그새 누가 넣었을 수도 있음 (409) -> 무시하거나 성공 취급
                    if (insertError.code === "23505") {
                        // 이미 있음. OK.
                        setIsBookmarked(true);
                    } else {
                        throw insertError;
                    }
                }
            }

        } catch (error) {
            console.error("찜 변경 실패:", error);
            // 에러 발생 시 UI 원상복구
            setIsBookmarked(!newStatus);
            alert(`오류가 발생했습니다.\n${error instanceof Error ? error.message : "알 수 없는 오류"}`);
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