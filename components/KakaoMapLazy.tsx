'use client';

import dynamic from 'next/dynamic';

const KakaoMap = dynamic(() => import('@/components/KakaoMap'), {
    ssr: false,
    loading: () => (
        <div className="h-80 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
            지도 로딩 중...
        </div>
    ),
});

export default function KakaoMapLazy({ placeName }: { placeName: string }) {
    return <KakaoMap placeName={placeName} />;
}
