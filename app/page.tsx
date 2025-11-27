import { Search } from "lucide-react";
import CourseExplorer from "@/components/CourseExplorer";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4 pt-24 pb-12 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-black leading-tight text-text sm:text-5xl md:text-6xl break-keep">
            이번 주말, <br className="sm:hidden" />
            <span className="text-primary">우리 동네 도서관</span>에서 <br />
            뭐 배울까?
          </h1>
          <p className="mb-10 text-lg text-gray-600 sm:text-xl break-keep">
            나를 위한 취미부터 자기개발까지, <br className="sm:hidden" />
            우동배에서 당신의 배움을 찾아보세요.
          </p>

          {/* Course Explorer (Search & Filter & Grid) */}
          <CourseExplorer />
        </div>

        {/* Decorative Elements */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/20 blur-3xl"></div>
      </section>
    </div>
  );
}
