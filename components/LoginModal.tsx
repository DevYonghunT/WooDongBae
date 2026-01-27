"use client";

import { useState } from "react";
import { useLoginModal } from "../store/useLoginModal";
import KakaoLoginButton from "./KakaoLoginButton";
import GoogleLoginButton from "./GoogleLoginButton";
import { X, Mail, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type TabType = "social" | "email";
type EmailModeType = "login" | "signup";

export default function LoginModal() {
    const { isOpen, closeModal } = useLoginModal();
    const supabase = createClient();

    const [tab, setTab] = useState<TabType>("social");
    const [emailMode, setEmailMode] = useState<EmailModeType>("login");

    // 이메일 로그인/회원가입 상태
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // 모달 닫기 (초기화)
    const handleClose = () => {
        closeModal();
        setTimeout(() => {
            setTab("social");
            setEmailMode("login");
            setEmail("");
            setPassword("");
            setPasswordConfirm("");
            setShowPassword(false);
            setError("");
            setSuccess("");
        }, 200);
    };

    // 이메일 로그인
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // 로그인 성공
            console.log("[Email Login Success]", data);
            handleClose();
        } catch (err: any) {
            console.error("[Email Login Error]", err);
            if (err.message.includes("Invalid login credentials")) {
                setError("이메일 또는 비밀번호가 올바르지 않습니다.");
            } else {
                setError(err.message || "로그인에 실패했습니다.");
            }
        } finally {
            setLoading(false);
        }
    };

    // 이메일 회원가입
    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password || !passwordConfirm) {
            setError("모든 필드를 입력해주세요.");
            return;
        }

        if (password.length < 6) {
            setError("비밀번호는 최소 6자 이상이어야 합니다.");
            return;
        }

        if (password !== passwordConfirm) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            // 회원가입 성공
            console.log("[Email Signup Success]", data);
            setSuccess(
                "회원가입이 완료되었습니다! 이메일로 전송된 인증 링크를 확인해주세요."
            );
            setEmail("");
            setPassword("");
            setPasswordConfirm("");
        } catch (err: any) {
            console.error("[Email Signup Error]", err);
            if (err.message.includes("already registered")) {
                setError("이미 가입된 이메일입니다.");
            } else {
                setError(err.message || "회원가입에 실패했습니다.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                {/* 배경 */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"
                    aria-hidden="true"
                    onClick={handleClose}
                ></div>

                {/* 모달 창 */}
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        {/* 닫기 버튼 */}
                        <div className="absolute right-4 top-4">
                            <button
                                onClick={handleClose}
                                type="button"
                                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors focus:outline-none"
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        {/* 모달 내용 */}
                        <div className="w-full">
                            <h3
                                className="text-xl font-bold leading-6 text-stone-900 text-center mt-2"
                                id="modal-title"
                            >
                                반가워요! 👋
                            </h3>
                            <p className="text-sm text-stone-500 text-center mt-2">
                                우동배와 함께 배움의 즐거움을 찾아보세요.
                            </p>

                            {/* 탭 */}
                            <div className="mt-6 flex gap-2 border-b border-stone-200">
                                <button
                                    onClick={() => setTab("social")}
                                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                                        tab === "social"
                                            ? "text-orange-500 border-b-2 border-orange-500"
                                            : "text-stone-400 hover:text-stone-600"
                                    }`}
                                >
                                    소셜 로그인
                                </button>
                                <button
                                    onClick={() => setTab("email")}
                                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                                        tab === "email"
                                            ? "text-orange-500 border-b-2 border-orange-500"
                                            : "text-stone-400 hover:text-stone-600"
                                    }`}
                                >
                                    이메일
                                </button>
                            </div>

                            {/* 소셜 로그인 탭 */}
                            {tab === "social" && (
                                <div className="mt-6 space-y-3">
                                    <KakaoLoginButton />
                                    <GoogleLoginButton />
                                </div>
                            )}

                            {/* 이메일 탭 */}
                            {tab === "email" && (
                                <div className="mt-6">
                                    {/* 로그인/회원가입 서브탭 */}
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={() => {
                                                setEmailMode("login");
                                                setError("");
                                                setSuccess("");
                                            }}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                emailMode === "login"
                                                    ? "bg-orange-500 text-white"
                                                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                            }`}
                                        >
                                            로그인
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEmailMode("signup");
                                                setError("");
                                                setSuccess("");
                                            }}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                emailMode === "signup"
                                                    ? "bg-orange-500 text-white"
                                                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                            }`}
                                        >
                                            회원가입
                                        </button>
                                    </div>

                                    {/* 에러/성공 메시지 */}
                                    {error && (
                                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            {success}
                                        </div>
                                    )}

                                    {/* 로그인 폼 */}
                                    {emailMode === "login" && (
                                        <form onSubmit={handleEmailLogin} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                                    이메일
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="example@email.com"
                                                    required
                                                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                                    비밀번호
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="••••••"
                                                        required
                                                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Link
                                                    href="/auth/forgot-password"
                                                    onClick={handleClose}
                                                    className="text-xs text-stone-500 hover:text-orange-500 transition-colors"
                                                >
                                                    비밀번호를 잊으셨나요?
                                                </Link>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>로그인 중...</span>
                                                    </>
                                                ) : (
                                                    "로그인"
                                                )}
                                            </button>
                                        </form>
                                    )}

                                    {/* 회원가입 폼 */}
                                    {emailMode === "signup" && (
                                        <form onSubmit={handleEmailSignup} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                                    이메일
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="example@email.com"
                                                    required
                                                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                                    비밀번호
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="최소 6자 이상"
                                                        required
                                                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                                    비밀번호 확인
                                                </label>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={passwordConfirm}
                                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                                    placeholder="비밀번호 재입력"
                                                    required
                                                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>가입 중...</span>
                                                    </>
                                                ) : (
                                                    "회원가입"
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* 하단 문구 */}
                            <p className="mt-6 text-center text-xs text-stone-400">
                                로그인 시{" "}
                                <Link
                                    href="/terms"
                                    onClick={handleClose}
                                    className="text-orange-500 hover:underline"
                                >
                                    이용약관
                                </Link>{" "}
                                및{" "}
                                <Link
                                    href="/privacy"
                                    onClick={handleClose}
                                    className="text-orange-500 hover:underline"
                                >
                                    개인정보처리방침
                                </Link>
                                에 동의하게 됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}