'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

function LoadingBarInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        NProgress.done();
    }, [pathname, searchParams]);

    useEffect(() => {
        const handleStart = () => NProgress.start();

        window.addEventListener('beforeunload', handleStart);

        return () => {
            window.removeEventListener('beforeunload', handleStart);
        };
    }, []);

    return null;
}

export function GlobalLoadingBar() {
    return (
        <Suspense fallback={null}>
            <LoadingBarInner />
        </Suspense>
    );
}
