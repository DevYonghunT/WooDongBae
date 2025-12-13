"use client";

import { useLoginModal } from "../store/useLoginModal";
import KakaoLoginButton from "./KakaoLoginButton";
import GoogleLoginButton from "./GoogleLoginButton";
import { X } from "lucide-react";

export default function LoginModal() {
    const { isOpen, closeModal } = useLoginModal();

    if (!isOpen) return null;

    return (
        // 👇 [구조 변경] 가장 바깥 테두리 (화면 전체 덮기 & 스크롤 대비)
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">

            {/* 👇 [핵심 센터링] 내용물이 화면 중앙에 오도록 정렬하는 컨테이너 */}
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

                {/* 👇 배경 (검은색 반투명 오버레이) - 고정 위치 */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"
                    aria-hidden="true"
                    onClick={closeModal}
                ></div>

                {/* 👇 실제 모달 창 (흰색 박스) - 상대 위치로 배경 위에 띄움 */}
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">

                        {/* 닫기 버튼 */}
                        <div className="absolute right-4 top-4">
                            <button
                                onClick={closeModal}
                                type="button"
                                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors focus:outline-none"
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        {/* 모달 내용 */}
                        <div className="sm:flex sm:items-start justify-center">
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 className="text-xl font-bold leading-6 text-stone-900 text-center mt-2" id="modal-title">
                                    반가워요! 👋
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-stone-500 text-center">
                                        우동배와 함께 배움의 즐거움을 찾아보세요.
                                    </p>
                                </div>

                                {/* 로그인 버튼들 */}
                                <div className="mt-8 space-y-3">
                                    <KakaoLoginButton />
                                    <GoogleLoginButton />
                                </div>

                                {/* 하단 문구 */}
                                <p className="mt-6 text-center text-xs text-stone-400">
                                    로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}