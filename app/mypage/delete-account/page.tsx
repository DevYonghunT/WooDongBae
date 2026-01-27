"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Loader2, Trash2 } from "lucide-react";

const DELETION_REASONS = [
    "서비스가 만족스럽지 않습니다",
    "사용 빈도가 낮습니다",
    "원하는 강좌를 찾기 어렵습니다",
    "알림이 너무 많습니다",
    "개인정보 보호가 우려됩니다",
    "기타",
];

const CONFIRM_TEXT = "회원 탈퇴에 동의합니다";

export default function DeleteAccountPage() {
    const supabase = createClient();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const [selectedReason, setSelectedReason] = useState("");
    const [feedback, setFeedback] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [error, setError] = useState("");

    // 사용자 정보 로드
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

            // 프로필 로드
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            setProfile(profileData);

            setLoading(false);
        };

        loadUser();
    }, []);

    // 탈퇴 처리
    const handleDelete = async () => {
        if (!selectedReason) {
            setError("탈퇴 사유를 선택해주세요.");
            return;
        }

        if (confirmText !== CONFIRM_TEXT) {
            setError(`"${CONFIRM_TEXT}"를 정확히 입력해주세요.`);
            return;
        }

        const confirmed = window.confirm(
            "정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 삭제됩니다."
        );

        if (!confirmed) return;

        setDeleting(true);
        setError("");

        try {
            // 1. deleted_users 테이블에 정보 저장
            const { error: logError } = await supabase.from("deleted_users").insert({
                original_user_id: user.id,
                email: user.email,
                deletion_reason: selectedReason,
                feedback: feedback || null,
                total_bookmarks: profile?.total_bookmarks || 0,
                total_keywords: profile?.total_keywords || 0,
                total_posts: profile?.total_posts || 0,
                total_comments: profile?.total_comments || 0,
            });

            if (logError) {
                console.error("[Delete User Log Error]", logError);
                // 로그 실패는 탈퇴를 막지 않음
            }

            // 2. 계정 삭제 요청 (Supabase Admin API 필요)
            // 클라이언트에서는 직접 삭제 불가능하므로 서버 API 호출
            const response = await fetch("/api/delete-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "계정 삭제에 실패했습니다.");
            }

            // 3. 로그아웃
            await supabase.auth.signOut();

            // 4. 홈으로 리다이렉트
            alert("회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
            router.push("/");
        } catch (err: any) {
            console.error("[Delete Account Error]", err);
            setError(err.message || "탈퇴 처리 중 오류가 발생했습니다.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* 뒤로가기 */}
                <Link
                    href="/mypage"
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">마이페이지로 돌아가기</span>
                </Link>

                {/* 경고 카드 */}
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-red-800 mb-2">
                                회원 탈퇴
                            </h1>
                            <p className="text-sm text-red-700 leading-relaxed">
                                회원 탈퇴 시 다음 정보가 영구적으로 삭제됩니다:
                            </p>
                            <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                                <li>프로필 정보 (닉네임, 아바타 등)</li>
                                <li>찜한 강좌 목록</li>
                                <li>등록한 알림 키워드</li>
                                <li>활동 내역</li>
                                <li>작성한 게시글 및 댓글 (준비 중)</li>
                            </ul>
                            <p className="text-sm text-red-700 mt-3 font-medium">
                                ⚠️ 이 작업은 되돌릴 수 없습니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 탈퇴 폼 */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 space-y-6">
                    {/* 에러 메시지 */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* 탈퇴 사유 */}
                    <div>
                        <label className="block text-sm font-bold text-stone-800 mb-3">
                            탈퇴 사유를 선택해주세요 <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {DELETION_REASONS.map((reason) => (
                                <label
                                    key={reason}
                                    className="flex items-center gap-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="w-4 h-4 text-orange-500 focus:ring-orange-200"
                                    />
                                    <span className="text-sm text-stone-700">{reason}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 추가 피드백 */}
                    <div>
                        <label className="block text-sm font-bold text-stone-800 mb-2">
                            추가 의견 (선택)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="서비스 개선을 위해 의견을 남겨주세요."
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none resize-none"
                        />
                        <p className="text-xs text-stone-400 mt-1 text-right">
                            {feedback.length} / 500
                        </p>
                    </div>

                    {/* 확인 문구 입력 */}
                    <div>
                        <label className="block text-sm font-bold text-stone-800 mb-2">
                            확인 <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-stone-600 mb-3">
                            탈퇴를 진행하시려면 아래 문구를 정확히 입력해주세요:
                        </p>
                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 mb-3">
                            <p className="text-sm font-mono font-bold text-center text-stone-800">
                                {CONFIRM_TEXT}
                            </p>
                        </div>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="위 문구를 입력하세요"
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                        />
                    </div>

                    {/* 탈퇴 버튼 */}
                    <div className="pt-4 border-t border-stone-200">
                        <button
                            onClick={handleDelete}
                            disabled={deleting || !selectedReason || confirmText !== CONFIRM_TEXT}
                            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>탈퇴 처리 중...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5" />
                                    <span>회원 탈퇴</span>
                                </>
                            )}
                        </button>
                        <p className="text-xs text-stone-400 text-center mt-3">
                            탈퇴한 계정은 복구할 수 없습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
