import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보처리방침 | 우동배",
    description: "우동배 개인정보처리방침",
};

export default function PrivacyPage() {
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
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">
                        개인정보처리방침
                    </h1>
                    <p className="text-sm text-stone-400 mb-8">최종 수정일: 2026년 1월 27일</p>

                    <div className="prose prose-stone max-w-none">
                        <section className="mb-8">
                            <p className="text-stone-600 leading-relaxed">
                                우동배(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」,
                                「정보통신망 이용촉진 및 정보보호 등에 관한 법률」을 준수하고 있습니다. 회사는
                                개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로
                                이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                1. 수집하는 개인정보의 항목
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                회사는 회원가입, 서비스 제공 등을 위해 아래와 같은 개인정보를 수집하고 있습니다:
                            </p>

                            <div className="ml-4 mb-4">
                                <h3 className="text-lg font-semibold text-stone-700 mb-2">
                                    [필수 정보]
                                </h3>
                                <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                    <li>이메일 주소</li>
                                    <li>소셜 로그인 시: 프로필 정보 (이름, 프로필 이미지)</li>
                                </ul>
                            </div>

                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-stone-700 mb-2">
                                    [선택 정보]
                                </h3>
                                <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                    <li>닉네임</li>
                                    <li>프로필 이미지</li>
                                    <li>자기소개</li>
                                </ul>
                            </div>

                            <p className="text-stone-600 leading-relaxed mt-4">
                                서비스 이용 과정에서 자동으로 생성되어 수집될 수 있는 정보:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2 ml-4 mt-2">
                                <li>IP 주소, 쿠키, 방문 일시, 서비스 이용 기록</li>
                                <li>기기 정보</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                2. 개인정보의 수집 및 이용 목적
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                <li>회원 가입 및 관리</li>
                                <li>본인 확인 및 개인 식별</li>
                                <li>서비스 제공 및 개선</li>
                                <li>강좌 정보 알림 발송</li>
                                <li>커뮤니티 기능 제공</li>
                                <li>서비스 이용 통계 및 분석</li>
                                <li>고객 문의 응대</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                3. 개인정보의 보유 및 이용 기간
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                회사는 이용자의 개인정보를 회원 가입일로부터 서비스를 제공하는 기간 동안에 한하여
                                보유 및 이용합니다. 회원 탈퇴 시 수집된 개인정보는 지체 없이 파기됩니다.
                            </p>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                <li>
                                    회원 탈퇴 정보: 서비스 부정이용 방지를 위해 30일간 보관 후 파기
                                </li>
                                <li>
                                    관련 법령에 의한 정보 보유:
                                    <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                                        <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                                        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                                        <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                                        <li>로그 기록: 3개월</li>
                                    </ul>
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                4. 개인정보의 제3자 제공
                            </h2>
                            <p className="text-stone-600 leading-relaxed">
                                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의
                                경우에는 예외로 합니다:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2 mt-3">
                                <li>이용자가 사전에 동의한 경우</li>
                                <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                5. 개인정보 처리의 위탁
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                회사는 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                <li>
                                    <strong>Supabase Inc.</strong>
                                    <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                                        <li>위탁업무: 데이터베이스 관리 및 인증 서비스</li>
                                        <li>보유 및 이용기간: 회원 탈퇴 시 또는 위탁 계약 종료 시까지</li>
                                    </ul>
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                6. 이용자 및 법정대리인의 권리와 행사 방법
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
                            </p>
                            <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                <li>개인정보 열람 요구</li>
                                <li>오류 정정 요구</li>
                                <li>삭제 요구</li>
                                <li>처리 정지 요구</li>
                            </ul>
                            <p className="text-stone-600 leading-relaxed mt-3">
                                위 권리 행사는 마이페이지를 통해 직접 하실 수 있으며, 서면, 전화, 이메일 등을
                                통하여 하실 수 있습니다.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                7. 개인정보의 파기 절차 및 방법
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체
                                없이 파기합니다.
                            </p>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-stone-700 mb-2">파기절차</h3>
                                <p className="text-stone-600 leading-relaxed mb-3">
                                    이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로
                                    옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간
                                    저장된 후 파기됩니다.
                                </p>

                                <h3 className="text-lg font-semibold text-stone-700 mb-2">파기방법</h3>
                                <ul className="list-disc list-inside text-stone-600 leading-relaxed space-y-2">
                                    <li>전자적 파일: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
                                    <li>종이 문서: 분쇄하거나 소각</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                8. 개인정보 보호책임자
                            </h2>
                            <p className="text-stone-600 leading-relaxed mb-3">
                                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한
                                이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를
                                지정하고 있습니다:
                            </p>
                            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                                <p className="text-stone-700">
                                    <strong>개인정보 보호책임자</strong>
                                </p>
                                <p className="text-stone-600 mt-2">이메일: privacy@woodongbae.xyz</p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-stone-800 mb-4">
                                9. 개인정보처리방침의 변경
                            </h2>
                            <p className="text-stone-600 leading-relaxed">
                                이 개인정보처리방침은 2026년 1월 27일부터 적용되며, 법령 및 방침에 따른
                                변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을
                                통하여 고지할 것입니다.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-stone-200">
                            <p className="text-sm text-stone-400">
                                본 개인정보처리방침은 2026년 1월 27일부터 적용됩니다.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
