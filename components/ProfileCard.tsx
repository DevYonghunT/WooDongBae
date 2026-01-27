"use client";

import { useState, useEffect } from "react";
import { Edit2, History } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ProfileEditModal from "./ProfileEditModal";
import Link from "next/link";

interface ProfileCardProps {
    user: {
        id: string;
        email?: string;
        user_metadata: {
            avatar_url?: string;
            full_name?: string;
            name?: string;
        };
    };
}

export default function ProfileCard({ user }: ProfileCardProps) {
    const supabase = createClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 프로필 데이터 불러오기
    const loadProfile = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (data) {
                setProfile(data);
            }
        } catch (err) {
            console.error("[Profile Load Error]", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [user.id]);

    // 프로필 업데이트 후 재로드
    const handleProfileUpdated = () => {
        loadProfile();
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 animate-pulse">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    const displayName =
        profile?.nickname ||
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        "사용자";
    const avatarUrl =
        profile?.avatar_url ||
        user.user_metadata.avatar_url ||
        "https://via.placeholder.com/100";

    return (
        <>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 relative">
                {/* 버튼 그룹 */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                    <Link
                        href="/mypage/activity"
                        className="text-stone-400 hover:text-orange-500 transition-colors"
                        title="활동 내역"
                    >
                        <History className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-stone-400 hover:text-orange-500 transition-colors"
                        title="프로필 수정"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <img
                        src={avatarUrl}
                        alt="프로필"
                        className="w-24 h-24 rounded-full border-4 border-orange-50 object-cover"
                    />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-stone-800">
                            {displayName}님, 안녕하세요! 👋
                        </h1>
                        {profile?.bio && (
                            <p className="text-stone-500 mt-2 text-sm">{profile.bio}</p>
                        )}
                        {!user.email?.includes("woodongbae.xyz") && (
                            <p className="text-stone-400 mt-1 text-sm">{user.email}</p>
                        )}

                        {/* 통계 */}
                        <div className="flex gap-4 mt-3">
                            <div className="text-center">
                                <div className="text-lg font-bold text-orange-500">
                                    {profile?.total_bookmarks || 0}
                                </div>
                                <div className="text-xs text-stone-400">찜한 강좌</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-orange-500">
                                    {profile?.total_keywords || 0}
                                </div>
                                <div className="text-xs text-stone-400">알림 키워드</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 계정 설정 링크 */}
                <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-3 text-xs">
                    <Link
                        href="/mypage/security"
                        className="text-stone-400 hover:text-orange-500 transition-colors"
                    >
                        보안 설정
                    </Link>
                    <span className="text-stone-200">|</span>
                    <Link
                        href="/mypage/delete-account"
                        className="text-stone-400 hover:text-red-500 transition-colors"
                    >
                        회원 탈퇴
                    </Link>
                </div>
            </div>

            {/* 프로필 수정 모달 */}
            <ProfileEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentUser={user}
                currentProfile={profile}
                onProfileUpdated={handleProfileUpdated}
            />
        </>
    );
}
