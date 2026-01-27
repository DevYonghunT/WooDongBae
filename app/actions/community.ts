"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { hash, compare } from "bcryptjs";

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
        // bcrypt로 비밀번호 해싱 (saltRounds: 10)
        const hashedPassword = await hash(password, 10);

        const { error } = await supabase.from("posts").insert({
            nickname,
            password: hashedPassword,
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

// 게시글 삭제 시 비밀번호 확인
export async function deletePost(postId: string, inputPassword: string) {
    // 1. DB에서 게시글 조회
    const { data: post } = await supabase
        .from("posts")
        .select("password")
        .eq("id", postId)
        .single();

    if (!post) return { success: false, message: "게시글을 찾을 수 없습니다." };

    // 2. 비밀번호 검증 (bcrypt compare)
    const isValid = await compare(inputPassword, post.password);
    if (!isValid) return { success: false, message: "비밀번호가 일치하지 않습니다." };

    // 3. 삭제
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
        console.error("Delete Post Error:", error);
        return { success: false, message: "삭제 중 오류가 발생했습니다." };
    }

    revalidatePath("/community");
    return { success: true, message: "게시글이 삭제되었습니다." };
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