"use client";

import { useState } from "react";
import { X, Send, PenLine, Lock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPost } from "@/app/actions/community";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const postSchema = z.object({
    nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다."),
    password: z.string().min(4, "비밀번호는 4자리여야 합니다.").max(4, "비밀번호는 4자리여야 합니다."),
    title: z.string().min(2, "제목은 2자 이상이어야 합니다.").max(100, "제목은 100자 이하여야 합니다."),
    content: z.string().min(10, "내용은 10자 이상이어야 합니다."),
});

type PostForm = z.infer<typeof postSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TAGS = ["잡담", "질문", "후기", "정보"];

export default function WritePostModal({ isOpen, onClose, onSuccess }: Props) {
    const [selectedTag, setSelectedTag] = useState("잡담");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<PostForm>({
        resolver: zodResolver(postSchema),
    });

    const onSubmit = async (data: PostForm) => {
        const formData = new FormData();
        formData.append("nickname", data.nickname);
        formData.append("password", data.password);
        formData.append("title", data.title);
        formData.append("content", data.content);
        formData.append("tag", selectedTag);

        const result = await createPost(formData);

        if (result.success) {
            toast.success("게시글이 등록되었습니다!");
            reset();
            onSuccess();
            onClose();
        } else {
            toast.error(result.message);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
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
                        role="dialog"
                        aria-modal="true"
                        aria-label="새 글 작성하기"
                        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-stone-50">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <PenLine className="w-5 h-5 text-primary-500" />
                                새 글 작성하기
                            </h3>
                            <button onClick={onClose} aria-label="닫기" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                            {/* 태그 선택 */}
                            <div className="flex gap-2" role="radiogroup" aria-label="게시글 태그">
                                {TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        role="radio"
                                        aria-checked={selectedTag === tag}
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
                                    <label htmlFor="write-nickname" className="sr-only">닉네임</label>
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="write-nickname"
                                        {...register("nickname")}
                                        placeholder="닉네임"
                                        className={`w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none text-sm transition-all ${errors.nickname ? "border-red-300" : "border-gray-200"}`}
                                    />
                                    {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname.message}</p>}
                                </div>
                                <div className="relative flex-1">
                                    <label htmlFor="write-password" className="sr-only">비밀번호</label>
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="write-password"
                                        {...register("password")}
                                        type="password"
                                        placeholder="비밀번호 (4자리)"
                                        maxLength={4}
                                        className={`w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none text-sm transition-all ${errors.password ? "border-red-300" : "border-gray-200"}`}
                                    />
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="write-title" className="sr-only">제목</label>
                                <input
                                    id="write-title"
                                    {...register("title")}
                                    placeholder="제목을 입력하세요"
                                    className={`w-full px-4 py-3 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none text-sm font-medium transition-all ${errors.title ? "border-red-300" : "border-gray-200"}`}
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label htmlFor="write-content" className="sr-only">내용</label>
                                <textarea
                                    id="write-content"
                                    {...register("content")}
                                    placeholder="자유롭게 이야기를 나누어보세요."
                                    className={`w-full h-40 p-4 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none text-sm resize-none transition-all ${errors.content ? "border-red-300" : "border-gray-200"}`}
                                />
                                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
                            </div>

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
