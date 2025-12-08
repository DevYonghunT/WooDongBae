"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    // 스크롤 위치 감지
    useEffect(() => {
        const toggleVisibility = () => {
            // 300px 이상 스크롤 되었을 때만 표시
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    // 최상단으로 스크롤 이동
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 p-3 bg-white border border-gray-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-stone-600 hover:text-primary-600 hover:border-primary-200 hover:shadow-primary-100 transition-colors duration-300 flex items-center justify-center group"
                    aria-label="맨 위로 가기"
                >
                    <ArrowUp className="w-6 h-6 stroke-[2.5px] group-hover:-translate-y-0.5 transition-transform duration-300" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
