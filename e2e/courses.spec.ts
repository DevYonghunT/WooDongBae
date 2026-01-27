import { test, expect } from "@playwright/test";

test.describe("강좌 검색 및 찜하기", () => {
    test("메인 페이지에서 강좌 목록이 표시된다", async ({ page }) => {
        await page.goto("/");

        // 강좌 카드가 최소 1개 이상 있는지
        const courseCards = page.locator('[data-testid="course-card"]');
        await expect(courseCards.first()).toBeVisible({ timeout: 10000 });
    });

    test("로그인하지 않고 찜하기를 누르면 로그인 모달이 뜬다", async ({ page }) => {
        await page.goto("/");

        // 첫 번째 강좌의 찜 버튼 클릭
        const bookmarkButton = page.locator('[data-testid="bookmark-button"]').first();
        await bookmarkButton.click();

        // 로그인 모달이 표시되는지
        await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    });

    test("카카오 로그인 플로우가 동작한다", async ({ page }) => {
        await page.goto("/");

        // 로그인 버튼 클릭
        await page.click("text=로그인");

        // 카카오 로그인 버튼 클릭
        await page.click("text=카카오로 시작하기");

        // 카카오 OAuth 페이지로 리다이렉트 확인
        await expect(page).toHaveURL(/kauth.kakao.com/);
    });
});

test.describe("커뮤니티", () => {
    test("커뮤니티 페이지가 로드된다", async ({ page }) => {
        await page.goto("/community");

        await expect(page.locator("text=우동배 커뮤니티")).toBeVisible();
    });
});
