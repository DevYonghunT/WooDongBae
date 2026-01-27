"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import imageCompression from "browser-image-compression";

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: {
        id: string;
        email?: string;
        user_metadata: {
            avatar_url?: string;
            full_name?: string;
            name?: string;
        };
    };
    currentProfile?: {
        nickname?: string;
        avatar_url?: string;
        bio?: string;
    };
    onProfileUpdated: () => void;
}

export default function ProfileEditModal({
    isOpen,
    onClose,
    currentUser,
    currentProfile,
    onProfileUpdated,
}: ProfileEditModalProps) {
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [nickname, setNickname] = useState(currentProfile?.nickname || "");
    const [bio, setBio] = useState(currentProfile?.bio || "");
    const [avatarUrl, setAvatarUrl] = useState(
        currentProfile?.avatar_url || currentUser.user_metadata.avatar_url || ""
    );
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>("");
    const [nicknameError, setNicknameError] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setNickname(currentProfile?.nickname || "");
            setBio(currentProfile?.bio || "");
            setAvatarUrl(
                currentProfile?.avatar_url || currentUser.user_metadata.avatar_url || ""
            );
            setPreviewUrl("");
            setAvatarFile(null);
            setError("");
            setNicknameError("");
        }
    }, [isOpen, currentProfile, currentUser]);

    // 닉네임 중복 체크 (디바운스)
    useEffect(() => {
        if (!nickname || nickname === currentProfile?.nickname) {
            setNicknameError("");
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("nickname", nickname)
                    .neq("id", currentUser.id)
                    .single();

                if (data) {
                    setNicknameError("이미 사용 중인 닉네임입니다.");
                } else {
                    setNicknameError("");
                }
            } catch (err) {
                // 중복이 없으면 에러가 발생하므로 무시
                setNicknameError("");
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [nickname, currentProfile?.nickname, currentUser.id]);

    // 이미지 파일 선택 핸들러
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 크기 체크 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError("이미지 크기는 10MB 이하여야 합니다.");
            return;
        }

        // 이미지 파일 타입 체크
        if (!file.type.startsWith("image/")) {
            setError("이미지 파일만 업로드 가능합니다.");
            return;
        }

        setUploading(true);
        setError("");

        try {
            // 이미지 압축
            const options = {
                maxSizeMB: 1, // 최대 1MB
                maxWidthOrHeight: 500, // 최대 500px
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);
            console.log(
                `[Image Compression] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Compressed: ${(
                    compressedFile.size /
                    1024 /
                    1024
                ).toFixed(2)}MB`
            );

            setAvatarFile(compressedFile);

            // 미리보기 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (err) {
            console.error("[Image Compression Error]", err);
            setError("이미지 압축 중 오류가 발생했습니다.");
        } finally {
            setUploading(false);
        }
    };

    // 프로필 저장
    const handleSave = async () => {
        if (nicknameError) {
            setError("닉네임을 확인해주세요.");
            return;
        }

        if (nickname && (nickname.length < 2 || nickname.length > 20)) {
            setError("닉네임은 2~20자 사이여야 합니다.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            let finalAvatarUrl = avatarUrl;

            // 1. 새 이미지 업로드
            if (avatarFile) {
                const fileExt = avatarFile.name.split(".").pop();
                const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
                const filePath = `${currentUser.id}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, avatarFile, {
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (uploadError) {
                    console.error("[Avatar Upload Error]", uploadError);
                    throw new Error("이미지 업로드에 실패했습니다.");
                }

                // 공개 URL 가져오기
                const {
                    data: { publicUrl },
                } = supabase.storage.from("avatars").getPublicUrl(filePath);

                finalAvatarUrl = publicUrl;
            }

            // 2. 프로필 업데이트
            const { error: updateError } = await supabase
                .from("profiles")
                .upsert({
                    id: currentUser.id,
                    nickname: nickname || null,
                    bio: bio || null,
                    avatar_url: finalAvatarUrl || null,
                    updated_at: new Date().toISOString(),
                });

            if (updateError) {
                console.error("[Profile Update Error]", updateError);
                throw new Error("프로필 업데이트에 실패했습니다.");
            }

            // 3. 활동 로그 기록
            await supabase.rpc("log_user_activity", {
                p_user_id: currentUser.id,
                p_action_type: "profile_update",
                p_description: "프로필 정보 수정",
            });

            // 성공
            onProfileUpdated();
            onClose();
        } catch (err: any) {
            console.error("[Profile Save Error]", err);
            setError(err.message || "프로필 저장 중 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-stone-800">프로필 수정</h2>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 본문 */}
                <div className="p-6 space-y-6">
                    {/* 에러 메시지 */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* 아바타 */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <img
                                src={
                                    previewUrl ||
                                    avatarUrl ||
                                    "https://via.placeholder.com/120"
                                }
                                alt="프로필"
                                className="w-28 h-28 rounded-full object-cover border-4 border-orange-100"
                            />
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <p className="text-xs text-stone-400 text-center">
                            권장: 500x500px 이하, 10MB 이하
                        </p>
                    </div>

                    {/* 닉네임 */}
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">
                            닉네임
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="닉네임을 입력하세요 (2~20자)"
                            maxLength={20}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all ${
                                nicknameError
                                    ? "border-red-300 bg-red-50"
                                    : "border-stone-200"
                            }`}
                        />
                        {nicknameError && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {nicknameError}
                            </p>
                        )}
                        {nickname &&
                            !nicknameError &&
                            nickname !== currentProfile?.nickname && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    사용 가능한 닉네임입니다.
                                </p>
                            )}
                    </div>

                    {/* 소개 */}
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">
                            소개
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="간단한 소개를 입력하세요"
                            maxLength={200}
                            rows={3}
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none resize-none transition-all"
                        />
                        <p className="text-xs text-stone-400 mt-1 text-right">
                            {bio.length} / 200
                        </p>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="sticky bottom-0 bg-white border-t border-stone-100 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-4 py-3 border border-stone-200 rounded-xl font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading || !!nicknameError}
                        className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>저장 중...</span>
                            </>
                        ) : (
                            "저장"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
