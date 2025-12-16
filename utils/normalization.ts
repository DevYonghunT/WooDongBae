// Region / institution normalization utilities shared between app code and tooling.

const SEOUL_DISTRICTS = new Set([
    "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
    "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
    "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
]);

// 기관명 정제
export function refineInstitutionName(rawName: string): string {
    const name = (rawName ?? "").trim();
    if (name.includes("성동광진")) return "성동광진교육지원청";
    if (name === "학생체육관") return "서울특별시교육청학생체육관";
    if (name === "구리시꿈꾸는공작소") return "구리시인창도서관";
    return name;
}

// 서울특별시 + 구 패턴을 구 단위로 정규화
export function normalizeRegionAndInstitution(rawRegion: string, rawInstitution: string, rawPlace?: string) {
    const trim = (v?: string) => (v ?? "").trim();
    const regionSource = trim(rawRegion);
    const institutionSource = trim(rawInstitution);
    const placeSource = trim(rawPlace);

    const candidates = [regionSource, placeSource, institutionSource].filter(Boolean) as string[];

    for (const candidate of candidates) {
        const noSpace = candidate.replace(/\s+/g, "");

        // 1. 서울 접두어 제거 (먼저 제거해서 greedy match 방지)
        // "서울특별시서초구..." -> "서초구..."
        const cleanName = noSpace.replace(/^(서울특별시|서울시|서울)/, "");

        // 2. 구 단위 추출 (이제 맨 앞에 구가 와야 함)
        const match = cleanName.match(/^([가-힣]+구)(.*)$/);

        if (match) {
            const district = match[1];
            const restRaw = match[2] || "";

            if (SEOUL_DISTRICTS.has(district)) {
                let institution = institutionSource;

                // 기관명이 "서울특별시서초구반포도서관" 처럼 전체를 포함하고 있었다면,
                // 남은 뒷부분("반포도서관")을 기관명으로 사용
                if (!institution || institution === regionSource || institution === candidate) {
                    institution = restRaw.trim() || institutionSource || placeSource;
                }

                return {
                    region: district,
                    institution: refineInstitutionName(institution || "기관 미정"),
                };
            }
        }
    }
    return {
        region: regionSource || "서울특별시",
        institution: refineInstitutionName(institutionSource || placeSource || "기관 미정"),
    };
}