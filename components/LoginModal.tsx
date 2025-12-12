"use client";

import { X } from "lucide-react";
import KakaoLoginButton from "./KakaoLoginButton";
import GoogleLoginButton from "./GoogleLoginButton";
import { useEffect } from "react";
import { useLoginModal } from "../store/useLoginModal"; // 👈 스토어 가져오기

export default function LoginModal() {
    // 스토어에서 상태와 함수를 꺼내 씁니다.
    const { isOpen, closeModal, message } = useLoginModal();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={closeModal}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 transform transition-all scale-100">
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center">
                    {/* 👇 상황에 따른 안내 메시지 표시 */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {message ? "잠깐만요! ✋" : "우동배에 오신 것을 환영해요! 🎉"}
                    </h2>
                    <p className="text-gray-600 mb-8 whitespace-pre-wrap">
                        {message || "로그인하고 우리 동네 강좌를 더 편하게 찾아보세요."}
                    </p>

                    <div className="flex flex-col gap-3 space-y-2">
                        <KakaoLoginButton />
                        <GoogleLoginButton />
                    </div>

                    <p className="mt-8 text-xs text-gray-500">
                        로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}