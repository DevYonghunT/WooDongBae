import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "커뮤니티",
    description: "우리 동네 강좌 정보도 나누고, 자유롭게 이야기해요. 공지사항과 자유게시판을 통해 정보를 공유하세요.",
    openGraph: {
        title: "커뮤니티 | 우동배",
        description: "우리 동네 강좌 정보도 나누고, 자유롭게 이야기해요.",
        url: "/community",
    },
};

export default function CommunityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
