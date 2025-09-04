// dex.js

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyvQHoEuzS17lbKWBEZgMzp3u8Yc34HFG7NmLozO2_v10MEF6M4eMvRmSp06PjybwbK/exec";
const LOGIN_API_URL = 'https://script.google.com/macros/s/AKfycby-QTyfdSXqxmqVNoql7uRkoRZuGCHlZOJA-atzZT4ZEnIiLE_92v6dEm6iR3hBOzkp/exec';

const cardContainer = document.getElementById("featuredResearchContainer");
const paginationContainer = document.getElementById("pagination");

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const academicYearSelect = document.getElementById("academic-year");
const searchButton = document.getElementById("searchButton");

let allResearchData = [];
let filteredResearchData = [];
const itemsPerPage = 6;
let currentPage = 1;

/* ===============================
   ระบบล็อกอิน
=============================== */

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.className = 'toast show ' + type;
        toast.textContent = message;
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('opacity-100');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// Login handler
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const studentId = form.studentId.value.trim();

    if (studentId === "") {
        showToast('กรุณากรอกเลขประจำตัวนักศึกษา', 'error');
        return;
    }

    try {
        const response = await fetch(LOGIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'loginByStudentId',
                studentId: studentId
            }).toString()
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            localStorage.setItem('loggedInUser', JSON.stringify(result.user));
            closeModal('loginModal');
            updateLoginUI();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('เกิดข้อผิดพลาดขณะเข้าสู่ระบบ', 'error');
    }
}

// Update UI based on login status
function updateLoginUI() {
    const userProfileSection = document.getElementById('user-profile');
    const authButtonsSection = document.getElementById('auth-buttons');
    const studentidDisplay = document.getElementById('studentid-display');
    const fullnameDisplay = document.getElementById('fullname-display');
    const uploadLinkDesktop = document.getElementById('upload-link-desktop');

    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    if (user && userProfileSection && authButtonsSection) {
        userProfileSection.classList.remove('hidden');
        userProfileSection.classList.add('flex');
        authButtonsSection.classList.add('hidden');

        if (studentidDisplay) studentidDisplay.textContent = user.studentId || 'ไม่ระบุเลขประจำตัว';
        if (fullnameDisplay) fullnameDisplay.textContent = user.fullname || 'ไม่ระบุชื่อ';
        if (uploadLinkDesktop) uploadLinkDesktop.classList.remove('hidden');
    } else if (userProfileSection && authButtonsSection) {
        userProfileSection.classList.add('hidden');
        userProfileSection.classList.remove('flex');
        authButtonsSection.classList.remove('hidden');
        if (uploadLinkDesktop) uploadLinkDesktop.classList.add('hidden');
    }
}

// Logout
function logout() {
    localStorage.removeItem('loggedInUser');
    showToast('ออกจากระบบสำเร็จ', 'info');
    updateLoginUI();
}

// Attach login form listener
function attachLoginFormListener() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

/* ===============================
   ระบบงานวิจัย
=============================== */

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

        renderPage(1);
        renderStats();
        renderPagination();
        
        // **เพิ่มโค้ดนี้เข้ามา**
        populateAcademicYears();

    } catch (error) {
        console.error("Error fetching data:", error);
        cardContainer.innerHTML = `<div class="p-6 bg-white rounded-lg shadow text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</div>`;
    }
}

// **ฟังก์ชันใหม่: สร้างตัวเลือกปีการศึกษาแบบไดนามิก**
function populateAcademicYears() {
    const years = new Set();
    allResearchData.forEach(item => {
        const academicYear = item["Academic Year"] || item.AcademicYear || item.Year;
        if (academicYear) {
            years.add(academicYear.toString());
        }
    });

    // เรียงปีจากมากไปน้อย
    const sortedYears = Array.from(years).sort((a, b) => b - a);

    // ลบตัวเลือกเก่าทั้งหมด ยกเว้นตัวแรก
    while (academicYearSelect.options.length > 1) {
        academicYearSelect.remove(1);
    }

    // เพิ่มตัวเลือกปีใหม่
    sortedYears.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        academicYearSelect.appendChild(option);
    });
}

// ฟังก์ชันค้นหา / กรองข้อมูล
function filterResearch() {
    const searchText = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;
    const selectedYear = academicYearSelect.value;

    filteredResearchData = allResearchData.filter(item => {
        // ดึงปีการศึกษาให้แน่ใจว่ามีค่า
        const academicYear = item["Academic Year"] || item.AcademicYear || item.Year || "";

        const matchesText =
            item.Title?.toLowerCase().includes(searchText) ||
            item.Author?.toLowerCase().includes(searchText) ||
            item.Keywords?.toLowerCase().includes(searchText);

        const matchesCategory = selectedCategory ? item.Category === selectedCategory : true;
        const matchesYear = selectedYear ? academicYear.toString() === selectedYear.toString() : true;

        return matchesText && matchesCategory && matchesYear;
    });

    renderPage(1);
    renderPagination();
}

// แสดงหน้า
function renderPage(page) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredResearchData.slice(start, end);

    cardContainer.innerHTML = "";

    if (pageData.length === 0) {
        cardContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">ไม่พบงานวิจัย</p>`;
        return;
    }

    pageData.forEach(research => {
        const card = document.createElement("div");
        card.className = "research-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition p-4";

        const cardLink = document.createElement("a");
        cardLink.href = `OnlineMMM.html?id=${research.Id}`;
        cardLink.className = "block h-full";

        // ดึงปีการศึกษา (ลองรองรับหลาย key เผื่อโครงสร้าง sheet ไม่เหมือนกัน)
        const academicYear = research["Academic Year"] || research.AcademicYear || research.Year || "ไม่ระบุปีการศึกษา";

        cardLink.innerHTML = `
            <div class="image-container">
                <img src="${research["Image URL"] || 'https://via.placeholder.com/400'}" alt="Research Image">
            </div>
            <div class="research-card-content">
                <h3 class="text-xl font-bold mb-2">${research.Title || "ไม่มีชื่อเรื่อง"}</h3>
                <p class="text-gray-600 text-sm mb-3">
                    ${research.Abstract ? research.Abstract.substring(0, 150) + "..." : "ไม่มีบทคัดย่อ"}
                </p>
                <div class="flex justify-between items-center">
                    <span class="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                        ${research.Category || "ไม่ระบุหมวดหมู่"}
                    </span>
                    <span class="text-gray-500 text-sm">
                        ปี ${academicYear}
                    </span>
                </div>
                <div class="mt-3">
                    <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                        อ่านต่อ →
                    </button>
                </div>
            </div>
        `;

        card.appendChild(cardLink);
        cardContainer.appendChild(card);
    });
}

// สร้างปุ่ม Pagination
function renderPagination() {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(filteredResearchData.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = `
            px-4 py-2 rounded-md border border-gray-300 
            ${i === currentPage ? "bg-orange-primary text-white" : "bg-white text-gray-700 hover:bg-gray-200"}
            transition
        `;
        btn.addEventListener("click", () => renderPage(i));
        paginationContainer.appendChild(btn);
    }
}

// ฟังก์ชันแสดงสถิติผลงานวิจัย
function renderStats() {
    const statsContainer = document.getElementById("statsContainer");
    if (!statsContainer) return;

    // นับรวมทั้งหมด
    const total = allResearchData.length;

    // นับตามหมวดหมู่
    const categories = {};
    allResearchData.forEach(item => {
        const cat = item.Category || "ไม่ระบุหมวดหมู่";
        categories[cat] = (categories[cat] || 0) + 1;
    });

    // เคลียร์เก่า
    statsContainer.innerHTML = "";

    // การ์ด: รวมทั้งหมด
    const totalCard = document.createElement("div");
    totalCard.className = "bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-xl shadow-lg p-6 text-center";
    totalCard.innerHTML = `
        <h3 class="text-lg font-semibold">ผลงานทั้งหมด</h3>
        <p class="text-3xl font-bold mt-2">${total} เรื่อง</p>
    `;
    statsContainer.appendChild(totalCard);

    // การ์ด: ตามหมวดหมู่
    Object.keys(categories).forEach(cat => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition";
        card.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-700">${cat}</h3>
            <p class="text-2xl font-bold text-blue-600 mt-2">${categories[cat]} เรื่อง</p>
        `;
        statsContainer.appendChild(card);
    });
}

/* ===============================
   Initial load
=============================== */
document.addEventListener('DOMContentLoaded', () => {
    updateLoginUI();
    attachLoginFormListener();
    fetchResearchData();
    
    // **ย้ายบรรทัดนี้เข้ามาในบล็อก**
    searchButton.addEventListener("click", filterResearch);
});
