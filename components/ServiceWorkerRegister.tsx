"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        (async () => {
            if (!("serviceWorker" in navigator)) return;

            const existing = await navigator.serviceWorker.getRegistration();
            if (existing) {
                console.log("[sw] already registered:", existing.scope);
            } else {
                try {
                    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
                    console.log("[sw] registered:", reg.scope);
                    if (!navigator.serviceWorker.controller) {
                        console.warn("[sw] not controlling yet. reload may be required.");
                    }
                } catch (e) {
                    console.error("[sw] register failed:", e);
                }
            }
        })();
    }, []);

    return null;
}
