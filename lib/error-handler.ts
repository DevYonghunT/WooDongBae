import * as Sentry from "@sentry/nextjs";

export function reportError(error: Error, context?: Record<string, unknown>) {
    console.error("Error:", error);

    if (process.env.NODE_ENV === "production") {
        Sentry.captureException(error, {
            extra: context,
        });
    }
}
