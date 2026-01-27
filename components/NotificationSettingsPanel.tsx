"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Clock, Zap, Settings, CheckCircle2, XCircle, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

interface NotificationPreferences {
    id?: number;
    email_enabled: boolean;
    push_enabled: boolean;
    keyword_alert_enabled: boolean;
    bookmark_alert_enabled: boolean;
    community_reply_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
    frequency_type: number; // 1: 실시간, 2: 1시간 요약, 3: 1일 요약
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    email_enabled: true,
    push_enabled: true,
    keyword_alert_enabled: true,
    bookmark_alert_enabled: true,
    community_reply_enabled: false,
    quiet_hours_start: "22:00:00",
    quiet_hours_end: "08:00:00",
    frequency_type: 1,
};

export default function NotificationSettingsPanel() {
    const supabase = createClient();
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
    const [testingNotification, setTestingNotification] = useState(false);

    // 설정 불러오기
    useEffect(() => {
        const loadPreferences = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            setUserId(user.id);

            const { data, error } = await supabase
                .from("notification_preferences")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (data) {
                setPreferences({
                    id: data.id,
                    email_enabled: data.email_enabled,
                    push_enabled: data.push_enabled,
                    keyword_alert_enabled: data.keyword_alert_enabled,
                    bookmark_alert_enabled: data.bookmark_alert_enabled,
                    community_reply_enabled: data.community_reply_enabled,
                    quiet_hours_start: data.quiet_hours_start || "22:00:00",
                    quiet_hours_end: data.quiet_hours_end || "08:00:00",
                    frequency_type: data.frequency_type || 1,
                });
            }

            setLoading(false);
        };

        loadPreferences();
    }, []);

    // 설정 저장 (낙관적 UI)
    const savePreferences = async (newPreferences: NotificationPreferences) => {
        if (!userId) return;

        const oldPreferences = { ...preferences };
        setPreferences(newPreferences); // 즉시 UI 업데이트
        setSaving(true);

        try {
            const { error } = await supabase
                .from("notification_preferences")
                .upsert({
                    user_id: userId,
                    email_enabled: newPreferences.email_enabled,
                    push_enabled: newPreferences.push_enabled,
                    keyword_alert_enabled: newPreferences.keyword_alert_enabled,
                    bookmark_alert_enabled: newPreferences.bookmark_alert_enabled,
                    community_reply_enabled: newPreferences.community_reply_enabled,
                    quiet_hours_start: newPreferences.quiet_hours_start,
                    quiet_hours_end: newPreferences.quiet_hours_end,
                    frequency_type: newPreferences.frequency_type,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setSaveStatus("success");
            setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
            console.error("설정 저장 실패:", error);
            setPreferences(oldPreferences); // 에러 시 원상복구
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } finally {
            setSaving(false);
        }
    };

    // 토글 핸들러
    const handleToggle = (key: keyof NotificationPreferences) => {
        const newPreferences = {
            ...preferences,
            [key]: !preferences[key as keyof NotificationPreferences],
        };
        savePreferences(newPreferences);
    };

    // 시간 변경 핸들러
    const handleTimeChange = (key: "quiet_hours_start" | "quiet_hours_end", value: string) => {
        const newPreferences = {
            ...preferences,
            [key]: value + ":00",
        };
        savePreferences(newPreferences);
    };

    // 빈도 변경 핸들러
    const handleFrequencyChange = (value: number) => {
        const newPreferences = {
            ...preferences,
            frequency_type: value,
        };
        savePreferences(newPreferences);
    };

    // 테스트 알림 발송
    const sendTestNotification = async () => {
        if (!userId) return;

        setTestingNotification(true);
        try {
            // notifications 테이블에 테스트 알림 삽입
            const { error } = await supabase.from("notifications").insert({
                user_id: userId,
                title: "테스트 알림 🍊",
                message: "알림이 정상적으로 작동하고 있습니다!",
                link: "/mypage",
                type: "test",
            });

            if (error) throw error;

            toast.success("테스트 알림이 발송되었습니다! 알림 센터를 확인해보세요.");
        } catch (error) {
            console.error("테스트 알림 발송 실패:", error);
            toast.error("테스트 알림 발송에 실패했습니다.");
        } finally {
            setTestingNotification(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-bold text-stone-800">알림 설정</h2>
                </div>
                {saveStatus === "success" && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>저장됨</span>
                    </div>
                )}
                {saveStatus === "error" && (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" />
                        <span>저장 실패</span>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* 알림 채널 설정 */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">알림 채널</h3>
                    <div className="space-y-3">
                        <ToggleItem
                            icon={<Mail className="w-4 h-4" />}
                            label="이메일 알림"
                            description="새 강좌 정보를 이메일로 받습니다"
                            enabled={preferences.email_enabled}
                            onChange={() => handleToggle("email_enabled")}
                        />
                        <ToggleItem
                            icon={<Bell className="w-4 h-4" />}
                            label="푸시 알림"
                            description="브라우저 푸시 알림을 받습니다"
                            enabled={preferences.push_enabled}
                            onChange={() => handleToggle("push_enabled")}
                        />
                    </div>
                </div>

                {/* 알림 타입 설정 */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">알림 타입</h3>
                    <div className="space-y-3">
                        <ToggleItem
                            icon={<Zap className="w-4 h-4" />}
                            label="키워드 알림"
                            description="등록한 키워드에 해당하는 강좌 알림"
                            enabled={preferences.keyword_alert_enabled}
                            onChange={() => handleToggle("keyword_alert_enabled")}
                        />
                        <ToggleItem
                            icon={<Bell className="w-4 h-4" />}
                            label="찜한 강좌 알림"
                            description="찜한 강좌의 접수 일정 알림"
                            enabled={preferences.bookmark_alert_enabled}
                            onChange={() => handleToggle("bookmark_alert_enabled")}
                        />
                        <ToggleItem
                            icon={<Bell className="w-4 h-4" />}
                            label="커뮤니티 댓글 알림"
                            description="작성한 글에 댓글이 달리면 알림 (준비 중)"
                            enabled={preferences.community_reply_enabled}
                            onChange={() => handleToggle("community_reply_enabled")}
                            disabled
                        />
                    </div>
                </div>

                {/* 조용한 시간 설정 */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <h3 className="text-sm font-bold text-gray-700">조용한 시간</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                        이 시간대에는 알림을 받지 않습니다
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">시작</label>
                            <input
                                type="time"
                                value={preferences.quiet_hours_start.slice(0, 5)}
                                onChange={(e) => handleTimeChange("quiet_hours_start", e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                            />
                        </div>
                        <span className="text-gray-400 mt-5">→</span>
                        <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">종료</label>
                            <input
                                type="time"
                                value={preferences.quiet_hours_end.slice(0, 5)}
                                onChange={(e) => handleTimeChange("quiet_hours_end", e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 알림 빈도 설정 */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">알림 빈도</h3>
                    <div className="space-y-2">
                        <FrequencyOption
                            value={1}
                            label="실시간"
                            description="알림이 발생하면 즉시 전송"
                            selected={preferences.frequency_type === 1}
                            onChange={handleFrequencyChange}
                        />
                        <FrequencyOption
                            value={2}
                            label="1시간 요약"
                            description="1시간마다 모아서 전송 (준비 중)"
                            selected={preferences.frequency_type === 2}
                            onChange={handleFrequencyChange}
                            disabled
                        />
                        <FrequencyOption
                            value={3}
                            label="1일 요약"
                            description="하루에 한 번 모아서 전송 (준비 중)"
                            selected={preferences.frequency_type === 3}
                            onChange={handleFrequencyChange}
                            disabled
                        />
                    </div>
                </div>

                {/* 테스트 알림 버튼 */}
                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={sendTestNotification}
                        disabled={testingNotification}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {testingNotification ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>발송 중...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>테스트 알림 발송</span>
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        설정이 제대로 작동하는지 테스트합니다
                    </p>
                </div>
            </div>
        </div>
    );
}

// 토글 아이템 컴포넌트
function ToggleItem({
    icon,
    label,
    description,
    enabled,
    onChange,
    disabled = false,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    enabled: boolean;
    onChange: () => void;
    disabled?: boolean;
}) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
            enabled ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"
        } ${disabled ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 flex-1">
                <div className={`mt-0.5 ${enabled ? "text-orange-500" : "text-gray-400"}`}>
                    {icon}
                </div>
                <div>
                    <div className="font-medium text-sm text-gray-800">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                </div>
            </div>
            <button
                onClick={onChange}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? "bg-orange-500" : "bg-gray-300"
                } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                />
            </button>
        </div>
    );
}

// 빈도 선택 옵션 컴포넌트
function FrequencyOption({
    value,
    label,
    description,
    selected,
    onChange,
    disabled = false,
}: {
    value: number;
    label: string;
    description: string;
    selected: boolean;
    onChange: (value: number) => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={() => !disabled && onChange(value)}
            disabled={disabled}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
                selected
                    ? "bg-orange-50 border-orange-300 ring-2 ring-orange-100"
                    : "bg-white border-gray-200 hover:border-gray-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <div className="flex items-center gap-2">
                <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selected ? "border-orange-500" : "border-gray-300"
                    }`}
                >
                    {selected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                </div>
                <div>
                    <div className="font-medium text-sm text-gray-800">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                </div>
            </div>
        </button>
    );
}
