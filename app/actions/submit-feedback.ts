"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function submitFeedback(formData: FormData) {
    const type = formData.get("type") as string;
    const content = formData.get("content") as string;
    const email = formData.get("email") as string;

    if (!type || !content) {
        return { success: false, message: "내용을 입력해주세요." };
    }

    try {
        const { error } = await supabase.from("feedbacks").insert({
            type,
            content,
            email: email || null,
        });

        if (error) throw error;

        return { success: true, message: "소중한 의견 감사합니다!" };
    } catch (error) {
        console.error("Feedback Error:", error);
        return { success: false, message: "전송 중 오류가 발생했습니다." };
    }
}
