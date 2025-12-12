import { getCourseById } from "@/lib/db-api";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, User, Users, Clock, Phone, Building2, ChevronLeft, Heart } from "lucide-react";
import ShareButton from "@/components/ShareButton"; // [추가]
import BookmarkButton from "@/components/BookmarkButton"; // [추가]
import KakaoMap from "@/components/KakaoMap"; // [추가]
import { Metadata } from "next"; // [추가]

interface PageProps {
    params: Promise<{ id: string }>;
}

// [추가] 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const course = await getCourseById(id);

    if (!course) {
        return {
            title: "강좌를 찾을 수 없습니다",
        };
    }

    return {
        title: `${course.region} ${course.category} 강좌 - ${course.title} | 우동배`,
        description: `"${course.institution}"에서 진행하는 "${course.category}" 강좌입니다. 수강료: ${course.price}. 우동배에서 자세한 정보를 확인하세요.`,
        openGraph: {
            title: `${course.region} ${course.category} 강좌 - ${course.title} | 우동배`,
            description: `"${course.institution}"에서 진행하는 "${course.category}" 강좌입니다.`,
            images: [
                {
                    url: course.imageUrl,
                    width: 800,
                    height: 600,
                    alt: course.title,
                },
            ],
        },
    };
}

export default async function CourseDetailPage({ params }: PageProps) {
    const { id } = await params;
    const course = await getCourseById(id);

    if (!course) notFound();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.title,
        description: `${course.institution}에서 진행하는 ${course.category} 강좌입니다.`,
        provider: {
            '@type': 'Organization',
            name: course.institution,
            sameAs: course.link
        },
        offers: {
            '@type': 'Offer',
            category: course.price === '무료' ? 'Free' : 'Paid',
            priceCurrency: 'KRW',
            price: course.price.replace(/[^0-9]/g, ''),
            availability: course.status === '접수중' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut'
        },
        hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'OnSite',
            location: course.place,
            startDate: course.courseDate?.split('~')[0]?.trim(),
            endDate: course.courseDate?.split('~')[1]?.trim(),
        }
    };

    if (!course) {
        notFound();
    }

    const isFull = course.capacity > 0 && course.status.includes("마감");

    return (
        <main className="min-h-screen bg-white pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* 1. Hero Section */}
            <section className="bg-stone-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                    {/* Breadcrumb / Back */}
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            href="/"
                            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            목록으로 돌아가기
                        </Link>
                        <div className="flex gap-2">
                            {/* [수정] 기존 button 태그를 BookmarkButton 컴포넌트로 교체 */}
                            <BookmarkButton courseId={Number(course.id)} />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                        {/* Thumbnail */}
                        <div className="relative w-full lg:w-[480px] aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-gray-200 flex-shrink-0">
                            <Image
                                src={course.imageUrl}
                                alt={course.title}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1.5 text-xs font-bold bg-black/60 text-white rounded-lg backdrop-blur-md">
                                    {course.region}
                                </span>
                            </div>
                        </div>

                        {/* Title & Basic Info */}
                        <div className="flex-1 w-full pt-2">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-3 py-1 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-100 rounded-full">
                                    {course.category}
                                </span>
                                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full">
                                    {course.target}
                                </span>
                            </div>

                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
                                {course.title}
                            </h1>

                            <div className="flex items-center gap-3 text-gray-600 font-medium">
                                <a
                                    href={course.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 group hover:border-primary-200 hover:shadow-md cursor-pointer"
                                >
                                    <Building2 className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                    <span className="group-hover:text-primary-700 transition-colors">{course.institution}</span>
                                    <span className="text-xs text-gray-400 group-hover:text-primary-400 transition-colors ml-1">(바로가기 ↗)</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                    {/* 2. Left Content */}
                    <div className="flex-1">
                        {/* 상세 정보 Grid */}
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-500 rounded-full"></span>
                            강좌 상세 정보
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                            <DetailItem icon={Calendar} label="강의 기간" value={course.courseDate} />
                            <DetailItem icon={Clock} label="강의 시간" value={course.time} />
                            <DetailItem icon={Users} label="모집 정원" value={`${course.capacity}명`} />
                            <DetailItem icon={User} label="교육 대상" value={course.target} />
                            <DetailItem icon={MapPin} label="교육 장소" value={course.place} />
                            <DetailItem icon={Calendar} label="접수 기간" value={course.applyDate} />
                        </div>

                        {/* 강좌 소개 (임시 텍스트) */}
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-500 rounded-full"></span>
                            강좌 소개
                        </h2>
                        <div className="prose prose-stone max-w-none text-gray-600 leading-relaxed mb-12 bg-gray-50 p-8 rounded-2xl border border-gray-100">
                            <p>
                                이 강좌는 {course.institution}에서 진행하는 {course.category} 프로그램입니다.<br />
                                {course.target}을(를) 대상으로 하며, {course.place}에서 진행됩니다.<br />
                                자세한 커리큘럼과 준비물은 기관으로 문의해주시기 바랍니다.
                            </p>
                        </div>


                        {/* 위치 정보 (지도 대체 UI) */}
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary-500 rounded-full"></span>
                            오시는 길
                        </h2>
                        <div className="h-80 rounded-2xl overflow-hidden border border-gray-200">
                            <KakaoMap placeName={course.institution} />
                        </div>
                    </div>

                    {/* 3. Right Sidebar (Sticky) */}
                    <div className="w-full lg:w-[360px] flex-shrink-0">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 p-8 overflow-hidden relative">
                                {/* D-Day Badge */}
                                <div className="absolute top-0 right-0 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
                                    {course.dDay}
                                </div>

                                <div className="mb-6">
                                    <p className="text-sm text-gray-500 font-medium mb-1">수강료</p>
                                    <p className="text-3xl font-bold text-primary-600">{course.price}</p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-500 text-sm">접수 상태</span>
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${isFull ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-600"
                                            }`}>
                                            {course.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-500 text-sm">문의 전화</span>
                                        <span className="text-gray-900 font-medium text-sm flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {course.contact || "정보 없음"}
                                        </span>
                                    </div>
                                </div>

                                {isFull ? (
                                    <button
                                        className="w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-none bg-gray-200 text-gray-400 cursor-not-allowed transition-all"
                                        disabled={true}
                                    >
                                        접수 마감
                                    </button>
                                ) : (
                                    <a
                                        href={course.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full"
                                    >
                                        <button
                                            className="w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-200 transition-all transform active:scale-[0.98] bg-primary-600 text-white hover:bg-primary-700 hover:shadow-primary-300"
                                        >
                                            수강 신청하러 가기
                                        </button>
                                    </a>
                                )}

                                <ShareButton course={course} />

                                <p className="text-center text-xs text-gray-400 mt-4">
                                    외부 사이트로 이동하여 신청이 진행됩니다.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{value}</p>
            </div>
        </div>
    );
}
