import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "찜 목록",
    description: "찜한 강좌를 다시 확인해보세요.",
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: "찜 목록 | 우동배",
        url: "/bookmarks",
    },
};

export default function BookmarksLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
