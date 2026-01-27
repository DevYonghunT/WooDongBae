"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Smile, Lightbulb, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitFeedback } from "@/app/actions/submit-feedback";
import toast from "react-hot-toast";

type FeedbackType = "compliment" | "suggestion" | "bug";

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<FeedbackType>("suggestion");
    const [content, setContent] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("type", selectedType);
        formData.append("content", content);
        formData.append("email", email);

        const result = await submitFeedback(formData);

        setIsSubmitting(false);
        if (result.success) {
            setIsSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsSuccess(false);
                setContent("");
                setEmail("");
            }, 2000);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <>
            {/* 1. 플로팅 버튼 (좌측 하단 배치로 스크롤 버튼과 겹침 방지) */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 left-8 z-50 flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-stone-600 hover:text-primary-600 hover:border-primary-200 transition-colors group"
            >
                <MessageCircle className="w-5 h-5 group-hover:fill-primary-100" />
                <span className="text-sm font-bold">의견 보내기</span>
            </motion.button>

            {/* 2. 피드백 모달 */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:justify-start pointer-events-none">
                        {/* 백그라운드 오버레이 (모바일용) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none pointer-events-auto"
                        />

                        {/* 모달 본문 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="relative w-full max-w-sm m-4 sm:ml-8 sm:mb-20 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto"
                        >
                            {/* 헤더 */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-stone-50/50">
                                <h3 className="font-bold text-gray-900">소중한 의견을 들려주세요</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {isSuccess ? (
                                // 성공 화면
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                        <Send className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">전송 완료!</h4>
                                    <p className="text-sm text-gray-500 mt-2">
                                        보내주신 의견으로<br />더 좋은 우동배를 만들겠습니다.
                                    </p>
                                </div>
                            ) : (
                                // 입력 폼
                                <form onSubmit={handleSubmit} className="p-6">

                                    {/* 카테고리 선택 (탭 스타일) */}
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <TypeButton
                                            type="compliment"
                                            current={selectedType}
                                            onClick={setSelectedType}
                                            icon={Smile}
                                            label="칭찬"
                                        />
                                        <TypeButton
                                            type="suggestion"
                                            current={selectedType}
                                            onClick={setSelectedType}
                                            icon={Lightbulb}
                                            label="제안"
                                        />
                                        <TypeButton
                                            type="bug"
                                            current={selectedType}
                                            onClick={setSelectedType}
                                            icon={AlertTriangle}
                                            label="오류"
                                        />
                                    </div>

                                    {/* 내용 입력 */}
                                    <div className="space-y-4">
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder={
                                                selectedType === "compliment" ? "어떤 점이 마음에 드셨나요?" :
                                                    selectedType === "suggestion" ? "어떤 기능이 생기면 좋을까요?" :
                                                        "불편을 드려 죄송합니다. 어떤 오류인가요?"
                                            }
                                            className="w-full h-32 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-sm placeholder:text-gray-400"
                                            required
                                        />

                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="답변 받으실 이메일 (선택)"
                                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>

                                    {/* 전송 버튼 */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !content.trim()}
                                        className="w-full mt-6 py-3.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                의견 보내기 <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

// 타입 선택 버튼 컴포넌트
function TypeButton({ type, current, onClick, icon: Icon, label }: any) {
    const isSelected = type === current;
    return (
        <button
            type="button"
            onClick={() => onClick(type)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${isSelected
                    ? "bg-primary-50 border-primary-200 text-primary-700 ring-1 ring-primary-500"
                    : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
        >
            <Icon className={`w-6 h-6 mb-1 ${isSelected ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}
