"use client";

import { useState } from "react";
import { Bell, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeAlert } from "@/app/actions/alert";
import toast from "react-hot-toast";

export default function AlertWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const result = await subscribeAlert(formData);

        setIsSubmitting(false);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }

        if (result.success) {
            setIsOpen(false);
            e.currentTarget.reset();
        }
    };

    return (
        <div className="fixed bottom-24 right-4 z-40">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Bell className="w-4 h-4 text-orange-500" />
                                키워드 알림 받기
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            원하는 강좌 키워드(예: 수영, 요가)를 등록하면,
                            새로운 강좌가 떴을 때 이메일로 알려드려요!
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                name="email"
                                type="email"
                                placeholder="이메일 주소"
                                required
                                className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-100 outline-none"
                            />
                            <input
                                name="keyword"
                                type="text"
                                placeholder="키워드 (예: 테니스, 도예)"
                                required
                                className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-100 outline-none"
                            />
                            <button
                                disabled={isSubmitting}
                                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? "등록 중..." : "알림 신청하기"}
                                {!isSubmitting && <Send className="w-3 h-3" />}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-white text-orange-500 rounded-full shadow-lg border border-orange-100 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Bell className="w-6 h-6 fill-orange-500" />}
            </button>
        </div>
    );
}