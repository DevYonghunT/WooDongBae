"use client";

import { useState } from "react";
import { X, Send, PenLine, Lock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPost } from "@/app/actions/community";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // [추가] 글 쓰기 성공 시 실행할 함수
}

const TAGS = ["잡담", "질문", "후기", "정보"];

export default function WritePostModal({ isOpen, onClose, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTag, setSelectedTag] = useState("잡담");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        formData.append("tag", selectedTag);

        const result = await createPost(formData);

        setIsSubmitting(false);
        if (result.success) {
            alert("게시글이 등록되었습니다!");
            onSuccess(); // [수정] 새로고침 대신 부모가 준 '데이터 다시 불러오기' 실행
            onClose();   // 모달 닫기
        } else {
            alert(result.message);
        }
    };

    // ... (아래 return 부분은 기존과 동일하므로 생략) ...
    // ... 기존 return 코드 그대로 유지 ...
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-stone-50">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <PenLine className="w-5 h-5 text-primary-500" />
                                새 글 작성하기
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* 태그 선택 */}
                            <div className="flex gap-2">
                                {TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setSelectedTag(tag)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedTag === tag
                                                ? "bg-primary-100 text-primary-700 ring-1 ring-primary-500"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {/* 작성자 정보 */}
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        name="nickname"
                                        placeholder="닉네임"
                                        required
                                        className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none text-sm transition-all"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="비밀번호 (4자리)"
                                        required
                                        maxLength={4}
                                        className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>

                            <input
                                name="title"
                                placeholder="제목을 입력하세요"
                                required
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none text-sm font-medium transition-all"
                            />

                            <textarea
                                name="content"
                                placeholder="자유롭게 이야기를 나누어보세요."
                                required
                                className="w-full h-40 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none text-sm resize-none transition-all"
                            />

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200 disabled:opacity-50"
                            >
                                {isSubmitting ? "등록 중..." : "글 등록하기"}
                                {!isSubmitting && <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}