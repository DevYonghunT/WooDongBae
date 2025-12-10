"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 쓰기 권한을 위해 Service Role Key 사용
);

// 게시글 작성
export async function createPost(formData: FormData) {
    const nickname = formData.get("nickname") as string;
    const password = formData.get("password") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const tag = formData.get("tag") as string;

    if (!nickname || !password || !title || !content) {
        return { success: false, message: "모든 항목을 입력해주세요." };
    }

    try {
        const { error } = await supabase.from("posts").insert({
            nickname,
            password, // 실서비스에선 해시 암호화 권장 (MVP라 원문 저장)
            title,
            content,
            tag
        });

        if (error) throw error;

        revalidatePath("/community"); // 페이지 갱신
        return { success: true, message: "게시글이 등록되었습니다." };
    } catch (error) {
        console.error("Post Error:", error);
        return { success: false, message: "등록 중 오류가 발생했습니다." };
    }
}

// 데이터 조회 (공지 + 게시글)
export async function getCommunityData() {
    // 공지사항 (최신순)
    const { data: notices } = await supabase
        .from("notices")
        .select("*")
        .order("is_pinned", { ascending: false }) // 중요 공지 우선
        .order("created_at", { ascending: false });

    // 일반 게시글 (최신순)
    const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100); // 100개만 가져오기

    return { notices: notices || [], posts: posts || [] };
}