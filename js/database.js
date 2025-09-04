const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyvQHoEuzS17lbKWBEZgMzp3u8Yc34HFG7NmLozO2_v10MEF6M4eMvRmSp06PjybwbK/exec";

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const academicYearSelect = document.getElementById("academic-year");
const searchButton = document.getElementById("searchButton");
const researchTableBody = document.getElementById("researchTableBody");

let allResearchData = [];
let filteredResearchData = [];

// โหลดข้อมูลจาก Google Sheet
async function fetchResearchData() {
    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "action=getResearchData"
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.message || "ไม่สามารถดึงข้อมูลได้");

        allResearchData = result.data;
        filteredResearchData = [...allResearchData];
        renderDatabaseTable(filteredResearchData);

    } catch (error) {
        console.error("Error fetching data:", error);
        researchTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-600 p-4">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</td></tr>`;
    }
}

// กรองข้อมูล
function filterResearch() {
    const searchText = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;
    const selectedYear = academicYearSelect.value;

    filteredResearchData = allResearchData.filter(item => {
        const academicYear = item["Academic Year"] || item.AcademicYear || item.Year || "";
        const matchesText = item.Title?.toLowerCase().includes(searchText) ||
                            item.Author?.toLowerCase().includes(searchText) ||
                            item.Keywords?.toLowerCase().includes(searchText);
        const matchesCategory = selectedCategory ? item.Category === selectedCategory : true;
        const matchesYear = selectedYear ? academicYear.toString() === selectedYear.toString() : true;

        return matchesText && matchesCategory && matchesYear;
    });
}

// แสดงข้อมูลตาราง
function renderDatabaseTable(data) {
    const tbody = document.getElementById('researchTableBody');
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">ไม่พบข้อมูล</td></tr>`;
        return;
    }

    data.forEach(item => {
        const academicYear = item["Academic Year"] || item.AcademicYear || item.Year || "ไม่ระบุปีการศึกษา";
        const fileURL = item["Research File URLs"] || ""; // ใช้คอลัมน์ Research File URLs

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2">${item.Title || "ไม่มีชื่อเรื่อง"}</td>
            <td class="px-4 py-2">${item.Authors || item.Author || "ไม่ระบุผู้แต่ง"}</td>
            <td class="px-4 py-2">${item.Category || "ไม่ระบุหมวดหมู่"}</td>
            <td class="px-4 py-2">${academicYear}</td>
            <td class="px-4 py-2">
                ${fileURL 
                    ? `<a href="${fileURL}" target="_blank" class="text-blue-600 hover:underline">ดาวน์โหลดไฟล์</a>` 
                    : "ไม่มีไฟล์"} 
            </td>
        `;
        tbody.appendChild(row);
    });
}


// Event listener สำหรับค้นหา
searchButton.addEventListener("click", () => {
    filterResearch();
    renderDatabaseTable(filteredResearchData);
});

// โหลดข้อมูลเริ่มต้นเมื่อหน้าโหลด
document.addEventListener('DOMContentLoaded', fetchResearchData);
