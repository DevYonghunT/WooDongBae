import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "이용약관 | 우동배",
    description: "우동배 서비스 이용약관",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* 뒤로가기 */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">홈으로 돌아가기</span>
                </Link>

                {/* 본문 */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">이용약관</h1>
                    <p className="text-sm text-stone-400 mb-8">최종 수정일: 2026년 1월 27일</p>

                    <div className="prose prose-stone max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">제1조 (목적)</h2>
                            <p className="text-stone-600 leading-relaxed">
                                본 약관은 우동배(이하 "회사")가 제공하는 우동배 서비스(이하 "서비스")의 이용과
                                관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을
                                목적으로 합니다.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">제2조 (정의)</h2>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                <li>
                                    "서비스"란 회사가 제공하는 지역 도서관 강좌 정보 제공 및 알림 서비스를
                                    의미합니다.
                                </li>
                                <li>
                                    "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및
                                    비회원을 말합니다.
                                </li>
                                <li>
                                    "회원"이란 회사와 서비스 이용계약을 체결하고 아이디와 비밀번호를 발급받은
                                    자를 말합니다.
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                제3조 (약관의 게시 및 개정)
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                ① 회사는 본 약관의 내용을 이용자가 쉽게 확인할 수 있도록 서비스 초기 화면 또는
                                연결화면을 통해 게시합니다.
                            </p>
                            <p className="text-stone-600 leading-relaxed">
                                ② 회사는 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.
                                개정된 약관은 적용일자 7일 전부터 공지하며, 중요한 변경사항의 경우 30일 전부터
                                공지합니다.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">제4조 (서비스의 제공)</h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                회사는 다음과 같은 서비스를 제공합니다:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                <li>지역 도서관 강좌 정보 수집 및 제공</li>
                                <li>강좌 검색 및 필터링 기능</li>
                                <li>관심 강좌 찜하기 기능</li>
                                <li>키워드 기반 강좌 알림 기능</li>
                                <li>커뮤니티 기능</li>
                                <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 제공하는 서비스</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                제5조 (서비스 이용계약의 성립)
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                ① 이용계약은 이용자가 본 약관에 동의하고 회사가 정한 절차에 따라 회원가입
                                신청을 하며, 회사가 이를 승낙함으로써 성립합니다.
                            </p>
                            <p className="text-stone-600 leading-relaxed">
                                ② 회사는 다음 각 호에 해당하는 경우 승낙을 거부하거나 유보할 수 있습니다:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2 mt-2">
                                <li>실명이 아니거나 타인의 명의를 도용한 경우</li>
                                <li>허위 정보를 기재한 경우</li>
                                <li>사회의 안녕과 질서 또는 미풍양속을 저해할 목적으로 신청한 경우</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                제6조 (이용자의 의무)
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                이용자는 다음 행위를 하여서는 안 됩니다:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                <li>신청 또는 변경 시 허위 내용 등록</li>
                                <li>타인의 정보 도용</li>
                                <li>회사가 게시한 정보의 변경</li>
                                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 송신 또는 게시</li>
                                <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보 공개</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                제7조 (개인정보보호)
                            </h2>
                            <p className="text-stone-600 leading-relaxed">
                                회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해
                                노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의
                                개인정보처리방침이 적용됩니다.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                제8조 (계약 해지 및 이용 제한)
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                ① 이용자는 언제든지 회사에게 해지 의사를 통지함으로써 이용계약을 해지할 수
                                있습니다.
                            </p>
                            <p className="text-stone-600 leading-relaxed">
                                ② 회사는 이용자가 본 약관의 의무를 위반한 경우 사전 통보 후 계약을 해지하거나
                                기간을 정하여 서비스 이용을 제한할 수 있습니다.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                제9조 (면책 조항)
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                ① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는
                                경우에는 서비스 제공에 관한 책임이 면제됩니다.
                            </p>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                ② 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지
                                않습니다.
                            </p>
                            <p className="text-stone-600 leading-relaxed">
                                ③ 회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 상실한 것에
                                대하여 책임을 지지 않으며, 서비스를 통하여 얻은 자료로 인한 손해에 관하여
                                책임을 지지 않습니다.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">제10조 (준거법 및 재판관할)</h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                ① 회사와 이용자 간에 제기된 소송은 대한민국 법을 준거법으로 합니다.
                            </p>
                            <p className="text-stone-600 leading-relaxed">
                                ② 회사와 이용자 간에 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에
                                제기합니다.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-stone-200">
                            <p className="text-sm text-stone-400">
                                본 약관은 2026년 1월 27일부터 적용됩니다.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
