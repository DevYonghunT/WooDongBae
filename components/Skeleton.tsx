import { useId } from "react";

export function CourseSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
    );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
    const baseId = useId();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CourseSkeleton key={`${baseId}-skeleton-${i}`} />
            ))}
        </div>
    );
}
