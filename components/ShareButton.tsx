"use client";

import { Share2 } from "lucide-react";

interface ShareButtonProps {
    course: {
        title: string;
        institution: string;
        category: string;
    };
}

export default function ShareButton({ course }: ShareButtonProps) {
    const handleShare = async () => {
        const currentUrl = window.location.href;
        const shareText = `[우동배] 우리 동네 배움터 추천! 🎓\n\n"${course.title}"\n\n지금 바로 상세 내용을 확인해보세요 👇\n${currentUrl}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: course.title,
                    text: shareText,
                    url: currentUrl,
                });
            } catch (error) {
                console.error("공유 실패:", error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                alert("주소가 복사되었습니다! 친구에게 공유해보세요.");
            } catch (error) {
                console.error("복사 실패:", error);
                alert("주소 복사에 실패했습니다.");
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className="w-full py-3 mt-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            aria-label="친구에게 공유하기"
        >
            <span>친구랑 같이 들을래요? 📤</span>
        </button>
    );
}
