"use server";

import { createClient } from "@/utils/supabase/server";

export async function subscribeAlert(formData: FormData) {
    const supabase = await createClient(); // 서버 컴포넌트용 클라이언트 (쿠키 자동 처리)

    // 1. 로그인 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "로그인이 필요한 서비스입니다." };
    }

    const keyword = formData.get("keyword") as string;

    if (!keyword) {
        return { success: false, message: "키워드를 입력해주세요." };
    }

    try {
        // 2. keywords 테이블에 저장 (user_id 기반)
        const { error } = await supabase
            .from("keywords")
            .insert({
                user_id: user.id,
                word: keyword
            });

        if (error) throw error;

        return { success: true, message: `✅ '${keyword}' 알림이 설정되었습니다!` };
    } catch (error) {
        console.error("Alert Error:", error);
        return { success: false, message: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
    }
}