// database.js
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyvQHoEuzS17lbKWBEZgMzp3u8Yc34HFG7NmLozO2_v10MEF6M4eMvRmSp06PjybwbK/exec";

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const academicYearSelect = document.getElementById("academic-year");
const searchButton = document.getElementById("searchButton");
const researchTableBody = document.getElementById("researchTableBody");

let allResearchData = [];
let filteredResearchData = [];

// แปลงค่าให้เป็นสตริงอย่างปลอดภัย
function safeString(value) {
    return value == null ? "" : String(value).trim();
}

// ดึงข้อมูลจาก Google Sheet
async function fetchResearchData() {
    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "action=getResearchData"
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.message || "ไม่สามารถดึงข้อมูลได้");

        allResearchData = result.data.map(item => ({
            Title: safeString(item.Title),
            Authors: safeString(item.Authors || item.Author),
            Category: safeString(item.Category),
            AcademicYear: safeString(item["Academic Year"] || item.Year),
            Field: safeString(item.Field),
            ResearchFileURL: safeString(item["Research File URLs"])
        }));

        filteredResearchData = [...allResearchData];
        renderDatabaseTable(filteredResearchData);

    } catch (error) {
        console.error("Error fetching data:", error);
        researchTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-red-600 p-4">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</td></tr>`;
    }
}

// ฟังก์ชันค้นหา
function filterResearch() {
    const searchText = safeString(searchInput.value).toLowerCase();
    const selectedCategory = safeString(categorySelect.value);
    const selectedYear = safeString(academicYearSelect.value);

    filteredResearchData = allResearchData.filter(item => {
        const matchesText =
            item.Title.toLowerCase().includes(searchText) ||
            item.Authors.toLowerCase().includes(searchText) ||
            item.Field.toLowerCase().includes(searchText);

        const matchesCategory = selectedCategory ? item.Category === selectedCategory : true;
        const matchesYear = selectedYear ? item.AcademicYear === selectedYear : true;

        return matchesText && matchesCategory && matchesYear;
    });
}

// แสดงตาราง
function renderDatabaseTable(data) {
    researchTableBody.innerHTML = "";

    if (!data.length) {
        researchTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-gray-500">ไม่พบข้อมูล</td></tr>`;
        return;
    }

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2 text-center">${index + 1}</td>
            <td class="px-4 py-2">${item.Title || "ไม่มีชื่อเรื่อง"}</td>
            <td class="px-4 py-2">${item.Authors || "ไม่ระบุผู้แต่ง"}</td>
            <td class="px-4 py-2">${item.Category || "ไม่ระบุหมวดหมู่"}</td>
            <td class="px-4 py-2">${item.AcademicYear || "ไม่ระบุปีการศึกษา"}</td>
            <td class="px-4 py-2">
                ${item.ResearchFileURL ? `<a href="${item.ResearchFileURL}" target="_blank" class="text-blue-600 hover:underline">ดาวน์โหลดไฟล์</a>` : "ไม่มีไฟล์"}
            </td>
        `;
        researchTableBody.appendChild(row);
    });
}

// Event listener
function doFilter() {
    filterResearch();
    renderDatabaseTable(filteredResearchData);
}

// รอ DOM พร้อม
document.addEventListener('DOMContentLoaded', () => {
    fetchResearchData();
    searchButton.addEventListener("click", doFilter);
    searchInput.addEventListener("input", doFilter);
    categorySelect.addEventListener("change", doFilter);
    academicYearSelect.addEventListener("change", doFilter);
});
