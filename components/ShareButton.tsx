"use client";

import { Share2 } from "lucide-react";
import { Course } from "@/types/course";
import toast from "react-hot-toast";

export default function ShareButton({ course }: { course: Course }) {
    return (
        <button
            className="flex items-center justify-center gap-2 px-5 py-3 mt-3 w-full bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-100 transition-all duration-200 font-medium group"
            onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("링크가 복사되었습니다! 친구에게 공유해보세요.");
            }}
        >
            <Share2 className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            <span>친구와 공유하기</span>
        </button>
    );
}
