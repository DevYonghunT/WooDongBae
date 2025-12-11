"use server";

import { createClient } from "@supabase/supabase-js";

// 서버 액션용 Supabase 클라이언트 (관리자 권한)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function subscribeAlert(formData: FormData) {
    const email = formData.get("email") as string;
    const keyword = formData.get("keyword") as string;

    if (!email || !keyword) {
        return { success: false, message: "이메일과 키워드를 입력해주세요." };
    }

    // 간단한 이메일 검증
    if (!email.includes("@")) {
        return { success: false, message: "올바른 이메일 형식이 아닙니다." };
    }

    try {
        // DB 저장
        const { error } = await supabase
            .from("keyword_alerts")
            .insert({ email, keyword });

        if (error) throw error;

        return { success: true, message: `✅ '${keyword}' 알림이 설정되었습니다!` };
    } catch (error) {
        console.error("Alert Error:", error);
        return { success: false, message: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
    }
}