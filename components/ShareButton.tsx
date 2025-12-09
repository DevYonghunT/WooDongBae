"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { Course } from "@/types/course";
import { motion, AnimatePresence } from "framer-motion";

export default function ShareButton({ course }: { course: Course }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const currentUrl = window.location.href;

        // [유지] 링크 중복 방지를 위한 텍스트 합치기 로직
        const shareText = `[우동배] ${course.title}\n\n${course.institution}에서 진행하는 강좌입니다.\n지금 바로 확인해보세요!\n\n${currentUrl}`;

        // 1. 모바일 공유하기
        if (navigator.share) {
            try {
                await navigator.share({
                    title: course.title,
                    text: shareText,
                    // url: currentUrl, // [중요] 중복 방지를 위해 url 필드는 생략
                });
                return;
            } catch (error) {
                console.log('공유 취소 또는 에러:', error);
            }
        }

        // 2. PC 또는 API 미지원 시 클립보드 복사
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('복사 실패:', err);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className={`
                relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-full 
                font-bold transition-all duration-300 shadow-sm border
                ${copied
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-white border-gray-200 text-gray-700 hover:border-primary-200 hover:text-primary-600 hover:shadow-md"
                }
            `}
            aria-label="공유하기"
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        <Check size={18} className="stroke-[3px]" />
                        <span>복사완료</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="share"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        <Share2 size={18} />
                        <span>공유하기</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
