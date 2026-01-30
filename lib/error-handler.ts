import * as Sentry from "@sentry/nextjs";

export function reportError(error: Error, context?: Record<string, unknown>) {
    // 개발 환경에서만 콘솔에 출력
    if (process.env.NODE_ENV !== "production") {
        console.error("Error:", error);
    }

    // 프로덕션에서는 Sentry로 전송
    if (process.env.NODE_ENV === "production") {
        Sentry.captureException(error, {
            extra: context,
        });
    }
}
