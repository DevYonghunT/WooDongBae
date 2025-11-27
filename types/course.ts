export interface Course {
    id: number;
    title: string;
    category: string;
    target: string;
    status: '접수중' | '마감임박' | '마감';
    imageUrl: string;
    dDay: string;
}
