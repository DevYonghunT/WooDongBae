"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
    const supabase = createClient();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);

    // 세션 확인
    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setIsValidSession(!!session);
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !passwordConfirm) {
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

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);

            // 3초 후 홈으로 이동
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } catch (err: any) {
            console.error("[Password Update Error]", err);
            setError(err.message || "비밀번호 변경에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 세션이 없으면 안내 표시
    if (!isValidSession) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">홈으로 돌아가기</span>
                    </Link>

                    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-stone-800 mb-2">
                            유효하지 않은 접근입니다
                        </h1>
                        <p className="text-sm text-stone-500 mb-6">
                            비밀번호 재설정 링크가 만료되었거나 올바르지 않습니다.
                            <br />
                            다시 시도해주세요.
                        </p>
                        <Link
                            href="/auth/forgot-password"
                            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                        >
                            재설정 링크 다시 받기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">홈으로 돌아가기</span>
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full mb-4">
                            <Lock className="w-6 h-6 text-orange-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-stone-800 mb-2">
                            새 비밀번호 설정
                        </h1>
                        <p className="text-sm text-stone-500">
                            새로운 비밀번호를 입력해주세요.
                        </p>
                    </div>

                    {/* 성공 메시지 */}
                    {success ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">비밀번호가 변경되었습니다!</p>
                                    <p className="text-sm">
                                        새로운 비밀번호로 로그인할 수 있습니다. 잠시 후 홈으로
                                        이동합니다...
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* 에러 메시지 */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {/* 새 비밀번호 */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    새 비밀번호
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="최소 6자 이상"
                                        required
                                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
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

                            {/* 비밀번호 확인 */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    비밀번호 확인
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    placeholder="비밀번호 재입력"
                                    required
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                                />
                            </div>

                            {/* 제출 버튼 */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>변경 중...</span>
                                    </>
                                ) : (
                                    "비밀번호 변경"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
