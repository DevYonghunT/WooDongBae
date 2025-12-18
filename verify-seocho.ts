
import { normalizeRegionAndInstitution } from './utils/normalization';

const testCases = [
    { region: "서울특별시", institution: "서울특별시서초구반포도서관" },
    { region: "서울특별시", institution: "서초구반포도서관" },
    { region: "서울특별시", institution: "반포도서관" }, // This one is expected to fail to extract district if it's not present
    { region: "서울특별시", institution: "서울특별시 양재도서관" }, // Should check if this fails
    { region: "서울특별시", institution: "서울특별시서초구양재도서관" }
];

console.log("=== Normalization Logic Verification ===");
testCases.forEach(tc => {
    const result = normalizeRegionAndInstitution(tc.region, tc.institution);
    console.log(`Input: [${tc.region}, ${tc.institution}] => Output: Region=[${result.region}], Institution=[${result.institution}]`);
});
