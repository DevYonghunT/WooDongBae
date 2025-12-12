import { create } from 'zustand';

interface LoginModalStore {
    isOpen: boolean;
    message: string | null; // null 허용
    openModal: (message?: string) => void;
    closeModal: () => void;
}

export const useLoginModal = create<LoginModalStore>((set) => ({
    isOpen: false,
    message: null, // 초기값 null
    // 👇 [수정] 메시지가 없으면 그냥 null로 둡니다. (기본값 삭제)
    openModal: (message) => set({ isOpen: true, message: message || null }),
    closeModal: () => set({ isOpen: false, message: null }),
}));