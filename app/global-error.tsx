"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>오류가 발생했습니다</h2>
                    <p style={{ color: "#666" }}>예상치 못한 오류가 발생했습니다. 다시 시도해주세요.</p>
                    <button
                        onClick={reset}
                        style={{ padding: "12px 24px", backgroundColor: "#f97316", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}
                    >
                        다시 시도
                    </button>
                </div>
            </body>
        </html>
    );
}
