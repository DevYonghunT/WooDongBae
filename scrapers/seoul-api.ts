
export async function fetchSeoulCourses() {
    const API_KEY = process.env.SEOUL_API_KEY;
    if (!API_KEY) {
        console.warn("⚠️ SEOUL_API_KEY가 없습니다. 서울시 강좌 스크래핑을 건너뜁니다.");
        return [];
    }

    // 1~1000개 요청 (필요시 페이지네이션 추가 가능)
    const url = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/ListPublicReservationEducation/1/1000/`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.ListPublicReservationEducation || !data.ListPublicReservationEducation.row) {
            console.error("❌ 서울시 API 응답 형식이 올바르지 않거나 데이터가 없습니다.");
            return [];
        }

        console.log(`📡 서울시 데이터 ${data.ListPublicReservationEducation.row.length}건 수신 완료`);

        const courses = data.ListPublicReservationEducation.row.map((item: any) => ({
            title: item.SVCNM,
            // institution: 보통 구청이나 센터명이 들어감. AREANM은 '강남구' 같은 지역명.
            // PLACENM이 구체적인 장소이므로 이를 institution이나 place로 사용
            institution: item.PLACENM || item.AREANM,
            category: item.MINCLASSNM, // 소분류명 (예: 스포츠, 문화교양)
            // target: 서비스대상 (SVCURL에서 상세를 봐야 알 수 있는 경우가 많지만 API에 USETGTINFO가 있으면 사용)
            target: item.USETGTINFO || "누구나",
            status: item.SVCSTATNM, // 접수중, 접수종료 등
            image_url: item.IMGURL,

            // 날짜 포맷팅 (YYYY-MM-DD HH:MM:SS.0 -> YYYY-MM-DD)
            course_date: `${item.SVCOPNBGNDT?.substring(0, 10)}~${item.SVCOPNENDDT?.substring(0, 10)}`,
            apply_date: `${item.RCPTBGNDT?.substring(0, 10)}~${item.RCPTENDDT?.substring(0, 10)}`,

            time: `${item.V_MIN}분 ~ ${item.V_MAX}분`, // API마다 다름, 여기선 예시
            price: item.PAYATNM, // 유료/무료

            region: item.AREANM, // 지역명 (구 단위)
            place: item.PLACENM, // 장소

            link: item.SVCURL,
            // d_day, capacity, contact 등은 API 필드 확인 필요. 일단 빈값 또는 가능한 매핑
            capacity: "상세참조",
            contact: item.TELNO,

            raw_data: item
        }));

        return courses;
    } catch (error) {
        console.error("🔥 서울시 API 호출 실패:", error);
        return [];
    }
}
