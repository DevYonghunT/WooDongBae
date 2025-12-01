import { getCourseById } from "@/lib/db-api";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, User, Users, Clock, Phone, Building2, ChevronLeft, Share2, Heart } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
    const { id } = await params;
    const course = await getCourseById(id);

    if (!course) {
        notFound();
    }

    const isFull = course.capacity > 0 && course.status.includes("마감");

    return (
        <main className="min-h-screen bg-white pb-20">
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
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-rose-500 hover:bg-white rounded-full transition-all">
                                <Heart className="w-5 h-5" />
                            </button>
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
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                    <Building2 className="w-5 h-5 text-gray-400" />
                                    <span>{course.institution}</span>
                                </div>
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
                        <div className="bg-stone-100 rounded-2xl h-64 flex flex-col items-center justify-center text-gray-400 border border-stone-200">
                            <MapPin className="w-10 h-10 mb-2 opacity-50" />
                            <p className="font-medium text-gray-500">{course.place}</p>
                            <p className="text-sm mt-1">{course.institution}</p>
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

                                <button
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-200 transition-all transform active:scale-[0.98] ${isFull
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                            : "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-primary-300"
                                        }`}
                                    disabled={isFull}
                                >
                                    {isFull ? "접수 마감" : "수강 신청하러 가기"}
                                </button>

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
