'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface KakaoMapProps {
    placeName: string;
}

declare global {
    interface Window {
        kakao: any;
    }
}

export default function KakaoMap({ placeName }: KakaoMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);

    const initMap = () => {
        // [핵심] 안전장치: kakao 객체가 없으면 절대 실행하지 않음
        if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
            return;
        }

        // kakao.maps.load: 스크립트 로딩이 완료된 후 실행되도록 보장
        window.kakao.maps.load(() => {
            const container = mapRef.current;
            if (!container) return;

            const options = {
                center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // 기본 위치 (서울)
                level: 3,
            };

            const map = new window.kakao.maps.Map(container, options);
            const ps = new window.kakao.maps.services.Places();

            // [디버깅] 검색어 확인 로그
            console.log("📍 지도 검색 요청:", placeName);

            // 장소 검색
            ps.keywordSearch(placeName, (data: any, status: any) => {
                // [디버깅] 검색 결과 상태 확인
                console.log(`📍 [${placeName}] 검색 결과 상태:`, status);

                if (status === window.kakao.maps.services.Status.OK) {
                    const coords = new window.kakao.maps.LatLng(data[0].y, data[0].x);

                    // 지도 중심 이동 및 마커 표시
                    map.setCenter(coords);
                    new window.kakao.maps.Marker({
                        map: map,
                        position: coords,
                    });
                } else {
                    console.warn("❌ 지도 검색 실패 (결과 없음)");
                }
            });
        });
    };

    // [중요] 페이지 이동 시 이미 스크립트가 로드되어 있는 경우를 대비
    useEffect(() => {
        if (window.kakao && window.kakao.maps) {
            initMap();
        }
    }, [placeName]);

    return (
        <>
            {/* 카카오 지도 SDK 로드 */}
            <Script
                src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`}
                strategy="afterInteractive"
                onReady={initMap} // 스크립트 로드 완료 시 실행
            />

            {/* 지도가 표시될 영역 */}
            <div
                ref={mapRef}
                className="w-full h-80 rounded-2xl bg-gray-100 border border-gray-200"
            >
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    지도를 불러오는 중입니다...
                </div>
            </div>
        </>
    );
}