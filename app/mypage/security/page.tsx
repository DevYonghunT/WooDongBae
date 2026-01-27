"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Shield,
    Lock,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    Key,
} from "lucide-react";

export default function SecurityPage() {
    const supabase = createClient();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [savingPassword, setSavingPassword] = useState(false);

    // 비밀번호 변경 상태
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    useEffect(() => {
        const loadUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.push("/");
                return;
            }
            setUser(user);
            setLoading(false);
        };

        loadUser();
    }, []);

    // 비밀번호 변경
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword || !newPasswordConfirm) {
            setPasswordError("모든 필드를 입력해주세요.");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("새 비밀번호는 최소 6자 이상이어야 합니다.");
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            setPasswordError("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        setSavingPassword(true);
        setPasswordError("");
        setPasswordSuccess("");

        try {
            // 현재 비밀번호 확인 (재로그인)
            if (currentPassword) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email!,
                    password: currentPassword,
                });

                if (signInError) {
                    throw new Error("현재 비밀번호가 올바르지 않습니다.");
                }
            }

            // 새 비밀번호로 변경
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            setPasswordSuccess("비밀번호가 성공적으로 변경되었습니다.");
            setCurrentPassword("");
            setNewPassword("");
            setNewPasswordConfirm("");
        } catch (err: any) {
            console.error("[Password Change Error]", err);
            setPasswordError(err.message || "비밀번호 변경에 실패했습니다.");
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    const isEmailUser = user.app_metadata.provider === "email";

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* 뒤로가기 */}
                <Link
                    href="/mypage"
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">마이페이지로 돌아가기</span>
                </Link>

                {/* 헤더 */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-7 h-7 text-orange-500" />
                        <h1 className="text-2xl font-bold text-stone-800">보안 설정</h1>
                    </div>
                    <p className="text-sm text-stone-500">계정 보안을 관리하세요.</p>
                </div>

                {/* 로그인 정보 */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
                    <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <Key className="w-5 h-5 text-stone-600" />
                        로그인 정보
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-stone-100">
                            <span className="text-stone-500">로그인 방식</span>
                            <span className="text-stone-800 font-medium">
                                {isEmailUser
                                    ? "이메일"
                                    : user.app_metadata.provider === "kakao"
                                    ? "카카오"
                                    : "구글"}
                            </span>
                        </div>
                        {!user.email?.includes("woodongbae.xyz") && (
                            <div className="flex justify-between py-2 border-b border-stone-100">
                                <span className="text-stone-500">이메일</span>
                                <span className="text-stone-800">{user.email}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2">
                            <span className="text-stone-500">가입일</span>
                            <span className="text-stone-800">
                                {new Date(user.created_at).toLocaleDateString("ko-KR")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 비밀번호 변경 (이메일 사용자만) */}
                {isEmailUser && (
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-stone-600" />
                            비밀번호 변경
                        </h2>

                        {/* 성공/에러 메시지 */}
                        {passwordSuccess && (
                            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{passwordSuccess}</span>
                            </div>
                        )}
                        {passwordError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{passwordError}</span>
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {/* 현재 비밀번호 */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    현재 비밀번호
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="현재 비밀번호 입력"
                                    required
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                                />
                            </div>

                            {/* 새 비밀번호 */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    새 비밀번호
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="최소 6자 이상"
                                        required
                                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                    >
                                        {showPasswords ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* 새 비밀번호 확인 */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    새 비밀번호 확인
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={newPasswordConfirm}
                                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                    placeholder="새 비밀번호 재입력"
                                    required
                                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                                />
                            </div>

                            {/* 제출 버튼 */}
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {savingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>변경 중...</span>
                                    </>
                                ) : (
                                    "비밀번호 변경"
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* 소셜 로그인 사용자 안내 */}
                {!isEmailUser && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                        <p className="text-sm text-blue-700">
                            소셜 로그인을 사용하시는 경우, 비밀번호는{" "}
                            {user.app_metadata.provider === "kakao" ? "카카오" : "구글"}에서 관리됩니다.
                            해당 플랫폼의 보안 설정에서 비밀번호를 변경하실 수 있습니다.
                        </p>
                    </div>
                )}

                {/* 2단계 인증 (준비 중) */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 opacity-60">
                    <h2 className="text-lg font-bold text-stone-800 mb-2">2단계 인증</h2>
                    <p className="text-sm text-stone-500 mb-4">
                        계정 보안을 강화하기 위한 2단계 인증 기능입니다.
                    </p>
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-stone-600">준비 중입니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
