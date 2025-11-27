import { Search } from "lucide-react";
import CourseExplorer from "@/components/CourseExplorer";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full bg-white pt-20 pb-16 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl md:text-6xl break-keep tracking-tight">
            이번 주말, <br className="sm:hidden" />
            <span className="text-orange-500">우리 동네 도서관</span>에서 <br />
            뭐 배울까?
          </h1>
          <p className="mb-12 text-xl text-gray-600 sm:text-2xl break-keep font-medium">
            나를 위한 취미부터 자기개발까지, <br className="sm:hidden" />
            우동배에서 당신의 배움을 찾아보세요.
          </p>

          {/* Course Explorer (Search & Filter & Grid) */}
          <CourseExplorer />
        </div>
      </section>
    </div>
  );
}
