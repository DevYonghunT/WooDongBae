import { useState, useEffect } from 'react';
import { Course } from '@/types/course';

export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState<Course[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // 초기 로드
    useEffect(() => {
        const stored = localStorage.getItem('woodongbae_bookmarks');
        if (stored) {
            setBookmarks(JSON.parse(stored));
        }
        setIsLoaded(true);
    }, []);

    // 찜하기 토글 함수
    const toggleBookmark = (course: Course) => {
        let newBookmarks;
        const exists = bookmarks.some(b => b.id === course.id);

        if (exists) {
            newBookmarks = bookmarks.filter(b => b.id !== course.id);
        } else {
            newBookmarks = [...bookmarks, course];
        }

        setBookmarks(newBookmarks);
        localStorage.setItem('woodongbae_bookmarks', JSON.stringify(newBookmarks));
    };

    // 특정 강좌가 찜 상태인지 확인
    const isBookmarked = (id: string | number) => {
        return bookmarks.some(b => b.id === id);
    };

    return { bookmarks, toggleBookmark, isBookmarked, isLoaded };
}
