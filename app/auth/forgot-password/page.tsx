"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError("이메일을 입력해주세요.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            console.error("[Password Reset Request Error]", err);
            setError(err.message || "비밀번호 재설정 요청에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* 뒤로가기 */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">홈으로 돌아가기</span>
                </Link>

                {/* 카드 */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full mb-4">
                            <Mail className="w-6 h-6 text-orange-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-stone-800 mb-2">
                            비밀번호 재설정
                        </h1>
                        <p className="text-sm text-stone-500">
                            가입하신 이메일 주소를 입력하시면
                            <br />
                            비밀번호 재설정 링크를 보내드립니다.
                        </p>
                    </div>

                    {/* 성공 메시지 */}
                    {success ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">이메일을 확인해주세요!</p>
                                    <p className="text-sm">
                                        <strong>{email}</strong>로 비밀번호 재설정 링크를
                                        보냈습니다. 이메일을 확인하여 비밀번호를 재설정해주세요.
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-stone-400 text-center">
                                이메일이 도착하지 않았나요? 스팸 메일함을 확인해보세요.
                            </p>
                            <Link
                                href="/"
                                className="block w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-medium transition-colors"
                            >
                                홈으로 돌아가기
                            </Link>
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

                            {/* 이메일 입력 */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    이메일 주소
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
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
                                        <span>전송 중...</span>
                                    </>
                                ) : (
                                    "재설정 링크 보내기"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
