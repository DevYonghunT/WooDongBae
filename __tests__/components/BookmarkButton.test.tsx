import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookmarkButton from "@/components/BookmarkButton";

// Supabase 클라이언트 모킹
jest.mock("@/utils/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: "test-user-id" } },
            }),
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockResolvedValue({ error: null }),
            delete: jest.fn().mockReturnThis(),
        })),
    }),
}));

// 로그인 모달 모킹
jest.mock("@/store/useLoginModal", () => ({
    useLoginModal: () => ({
        openModal: jest.fn(),
    }),
}));

// react-hot-toast 모킹
jest.mock("react-hot-toast", () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe("BookmarkButton", () => {
    it("찜하기 버튼이 렌더링된다", () => {
        render(<BookmarkButton courseId={123} />);
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
    });

    it("초기 상태가 찜되지 않은 상태로 렌더링된다", () => {
        render(<BookmarkButton courseId={123} />);
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("aria-pressed", "false");
        expect(button).toHaveAttribute("aria-label", "강좌 찜하기");
    });

    it("initialIsBookmarked가 true일 때 찜된 상태로 렌더링된다", () => {
        render(<BookmarkButton courseId={123} initialIsBookmarked={true} />);
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("aria-pressed", "true");
        expect(button).toHaveAttribute("aria-label", "찜 해제하기");
    });

    it("클릭 시 찜 상태가 토글된다", async () => {
        render(<BookmarkButton courseId={123} />);
        const button = screen.getByRole("button");

        fireEvent.click(button);

        await waitFor(() => {
            expect(button.querySelector(".fill-current")).toBeInTheDocument();
        });
    });
});
