import CourseExplorer from "@/components/CourseExplorer";
import { getRecommendedCourses } from "@/lib/db-api";
import CourseCard from "@/components/CourseCard";
import { ThumbsUp } from "lucide-react";

import { Metadata } from "next";

export const revalidate = 300; // 5분마다 ISR 재생성 (추천 강좌 갱신)

export const metadata: Metadata = {
  title: "강좌 찾기",
  description: "이번 주말, 가까운 도서관에서 나만의 취미를 찾아보세요. 강좌 모아보기 + 키워드 알림 + 찜 기능으로 편리하게!",
  openGraph: {
    url: "/",
  },
};

export default async function Home() {
  const recommendedCourses = await getRecommendedCourses();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section: 따뜻한 웜톤 그라데이션 */}
      <section className="relative w-full bg-gradient-to-b from-primary-100/40 via-gray-50 to-gray-50 pt-32 pb-20 text-center">

        {/* 장식용 배경 요소 */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-200/20 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-primary-200 px-4 py-1.5 text-sm font-bold text-primary-700 shadow-sm mb-6">
            ✨ 우리 동네 배움터, 우동배
          </span>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl md:text-6xl break-keep tracking-tight">
            이번 주말, <br className="sm:hidden" />
            <span className="text-primary-600">가까운 도서관</span>에서 <br />
            나만의 취미를 찾아보세요
          </h1>
          <p className="mb-10 text-lg text-gray-600 sm:text-xl break-keep font-medium leading-relaxed max-w-2xl mx-auto">
            흩어져 있는 강좌 정보를 한눈에 모아 보여드립니다. <br className="hidden sm:block" />
            지루한 일상에 따뜻한 배움을 더해보세요.
          </p>
        </div>
      </section>

      {/* Course Explorer Section */}
      <section className="-mt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <CourseExplorer />

        {/* Recommended Section */}
        {recommendedCourses.length > 0 && (
          <div className="max-w-7xl mx-auto mt-24">
            <div className="mb-8 flex flex-col items-start gap-1">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ThumbsUp className="w-6 h-6 text-primary-500" />
                놓치면 아쉬운 추천 강좌
              </h2>
              <p className="text-gray-500 font-medium">지금 바로 신청 가능한 인기 강좌입니다.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedCourses.map((course) => (
                <div key={course.id} className="h-full">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}