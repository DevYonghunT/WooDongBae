"use client";

import { useState, useEffect, useCallback } from 'react';
import { Course } from '@/types/course';

const STORAGE_KEY = 'woodongbae_bookmarks';
const EVENT_NAME = 'woodongbae-bookmark-change'; // 변경 신호 이름

export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState<Course[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. 저장소에서 데이터 불러오기
    const loadBookmarks = useCallback(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setBookmarks(JSON.parse(stored));
            } catch (e) {
                console.error("찜 목록 파싱 실패", e);
                setBookmarks([]);
            }
        } else {
            setBookmarks([]);
        }
        setIsLoaded(true);
    }, []);

    // 2. 초기 로드 및 변경 감지 리스너 등록
    useEffect(() => {
        loadBookmarks();

        // 누군가 찜 목록을 바꾸면 실행될 함수
        const handleStorageChange = () => {
            loadBookmarks();
        };

        // 같은 탭 내에서 변경 신호 감지
        window.addEventListener(EVENT_NAME, handleStorageChange);
        // 다른 탭/창에서 변경 신호 감지
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener(EVENT_NAME, handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [loadBookmarks]);

    // 3. 찜하기 토글 (핵심 수정 부분)
    const toggleBookmark = (course: Course) => {
        // [중요] 상태(state)가 아닌 localStorage에서 직접 최신 데이터를 가져옴
        // 이렇게 해야 다른 버튼이 저장한 내용을 덮어쓰지 않음
        const currentStored = localStorage.getItem(STORAGE_KEY);
        let currentBookmarks: Course[] = currentStored ? JSON.parse(currentStored) : [];

        const exists = currentBookmarks.some(b => b.id === course.id);
        let newBookmarks;

        if (exists) {
            // 이미 있으면 제거
            newBookmarks = currentBookmarks.filter(b => b.id !== course.id);
        } else {
            // 없으면 추가
            newBookmarks = [...currentBookmarks, course];
        }

        // 저장
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));

        // [중요] "데이터가 바뀌었다"고 모든 컴포넌트에 방송(Dispatch Event)
        window.dispatchEvent(new Event(EVENT_NAME));
    };

    // 현재 강좌가 찜 상태인지 확인
    const isBookmarked = (id: string | number) => {
        return bookmarks.some(b => b.id === id);
    };

    return { bookmarks, toggleBookmark, isBookmarked, isLoaded };
}
