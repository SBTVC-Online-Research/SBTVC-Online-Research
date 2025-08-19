// IMPORTANT: Replace with your deployed Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-QTyfdSXqxmqVNoql7uRkoRZuGCHlZOJA-atzZT4ZEnIiLE_92v6dEm6iR3hBOzkp/exec';

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

// Handle Login Form Submission
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const studentId = form.studentId.value.trim();

    if (studentId === "") {
        showToast('กรุณากรอกเลขประจำตัวนักศึกษา', 'error');
        return;
    }

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
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
            checkLoginStatus();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('เกิดข้อผิดพลาดขณะเข้าสู่ระบบ', 'error');
    }
}

// Update UI based on login status
function checkLoginStatus() {
    const userProfileSection = document.getElementById('user-profile');
    const authButtonsSection = document.getElementById('auth-buttons');
    const studentidDisplay = document.getElementById('studentid-display');
    const fullnameDisplay = document.getElementById('fullname-display');
    const mobileUserMenu = document.getElementById('mobile-user-menu');
    const uploadLinkDesktop = document.getElementById('upload-link-desktop');
    const uploadLinkMobile = document.getElementById('upload-link-mobile');

    const user = JSON.parse(localStorage.getItem('loggedInUser'));

    if (user && userProfileSection && authButtonsSection) {
        userProfileSection.classList.remove('hidden');
        userProfileSection.classList.add('flex');
        authButtonsSection.classList.add('hidden');

        if (studentidDisplay) studentidDisplay.textContent = user.studentId || 'ไม่ระบุเลขประจำตัว';
        if (fullnameDisplay) fullnameDisplay.textContent = user.fullname || 'ไม่ระบุชื่อ';
        if (mobileUserMenu) mobileUserMenu.classList.remove('hidden');
        if (uploadLinkDesktop) uploadLinkDesktop.classList.remove('hidden');
        if (uploadLinkMobile) uploadLinkMobile.classList.remove('hidden');
        return user;
    } else if (userProfileSection && authButtonsSection) {
        userProfileSection.classList.add('hidden');
        userProfileSection.classList.remove('flex');
        authButtonsSection.classList.remove('hidden');
        if (uploadLinkDesktop) uploadLinkDesktop.classList.add('hidden');
        if (uploadLinkMobile) uploadLinkMobile.classList.add('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.add('hidden');
        return null;
    }
    return null;
}

// Logout Function
function logout() {
    localStorage.removeItem('loggedInUser');
    showToast('ออกจากระบบสำเร็จ', 'info');
    checkLoginStatus();
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
    window.location.reload();
}

// Attach event listeners for auth forms and menu
function attachAuthFormListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const menuButton = document.getElementById('menuButton');
    const menuButtonLoggedIn = document.getElementById('menuButtonLoggedIn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuButton) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    if (menuButtonLoggedIn) {
        menuButtonLoggedIn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });
    });

    // Toggle dropdown active class when dropdown button is clicked
    const dropdownButtons = document.querySelectorAll('.dropdown > button');
    dropdownButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            this.closest('.dropdown').classList.toggle('active');
        });
    });

    // Close modal when clicking outside (on the overlay)
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// โค้ดสำหรับดึงข้อมูลและสร้างการ์ดงานวิจัย
//-----------------------------------------------------

let researchData = [];

async function fetchAndDisplayResearch() {
    const container = document.getElementById('featuredResearchContainer');
    const noResultMessage = document.getElementById('noFeaturedResearchMessage');
    if (!container || !noResultMessage) {
        console.error("Error: featuredResearchContainer or noFeaturedResearchMessage not found in the DOM.");
        return;
    }
    container.innerHTML = '';
    noResultMessage.classList.add('hidden');

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'getResearchData'
            }).toString()
        });
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            researchData = result.data;
            setupCategoryButtons(researchData); // เพิ่มการสร้างปุ่มหมวดหมู่
            displayResearchCards(researchData); // แสดงข้อมูลทั้งหมดในตอนแรก
        } else {
            noResultMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error fetching research data:', error);
        showToast('เกิดข้อผิดพลาดในการดึงข้อมูลงานวิจัย', 'error');
    }
}

// ฟังก์ชันสำหรับสร้างปุ่มหมวดหมู่
function setupCategoryButtons(data) {
    const container = document.getElementById('categoryButtons');
    if (!container) return;
    container.innerHTML = '';

    const categories = [...new Set(data.map(item => item['Category'] || 'ไม่ระบุ'))];
    
    // สร้างปุ่ม 'ทั้งหมด'
    const allBtn = document.createElement('button');
    allBtn.textContent = 'ทั้งหมด';
    allBtn.className = 'px-4 py-2 mr-2 text-sm font-semibold rounded-md border border-gray-300 hover:bg-gray-100';
    allBtn.addEventListener('click', () => displayResearchCards(researchData));
    container.appendChild(allBtn);

    // สร้างปุ่มสำหรับแต่ละหมวดหมู่
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.className = 'px-4 py-2 mr-2 text-sm font-semibold rounded-md border border-gray-300 hover:bg-gray-100';
        button.addEventListener('click', () => {
            const filteredData = researchData.filter(item => (item['Category'] || 'ไม่ระบุ') === category);
            displayResearchCards(filteredData);
        });
        container.appendChild(button);
    });
}

function displayResearchCards(researchArray) {
    const container = document.getElementById('featuredResearchContainer');
    const noResultMessage = document.getElementById('noFeaturedResearchMessage');
    container.innerHTML = '';
    
    if (researchArray.length > 0) {
        researchArray.forEach(research => {
            const card = createResearchCard(research);
            container.appendChild(card);
        });
        noResultMessage.classList.add('hidden');
    } else {
        noResultMessage.classList.remove('hidden');
    }
}

function createResearchCard(research) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'research-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition';

    // ตัดทอนบทคัดย่อ
    const abstractText = research['Abstract'] || 'ไม่มีคำอธิบาย';
    const truncatedAbstract = abstractText.length > 100 ? abstractText.substring(0, 100) + '...' : abstractText;

    cardDiv.innerHTML = `
        <a href="${research['Research File URLs'] || '#'}">
            <div class="h-40 overflow-hidden">
                <img src="${research['Image URL'] || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="ภาพประกอบ" class="w-full h-full object-cover transition hover:opacity-90" />
            </div>
        </a>
        <div class="p-6">
            <div class="flex justify-between mb-2">
                <span class="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">${research['Category'] || 'ไม่ระบุ'}</span>
                <span class="text-gray-500 text-sm">${research['Academic Year'] || 'ไม่ระบุ'}</span>
            </div>
            <h3 class="text-lg font-semibold mb-2">${research['Title'] || 'ไม่มีชื่อเรื่อง'}</h3>
            <p class="text-gray-600 mb-4">${truncatedAbstract}</p>
            <button class="read-more-btn px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600 transition" 
                    data-title="${research['Title']}" 
                    data-abstract="${abstractText}"
                    onclick="openFullAbstractModal(this)">อ่านต่อ</button>
            <div class="flex justify-between items-center mt-4">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">${(research['Authors'] && research['Authors'].charAt(0)) || '?'}</div>
                    <span class="ml-2 text-gray-700">${research['Authors'] || 'ไม่ระบุผู้จัดทำ'}</span>
                </div>
            </div>
        </div>
    `;
    return cardDiv;
}

// ฟังก์ชันสำหรับเปิด Modal แสดงบทคัดย่อฉบับเต็ม
function openFullAbstractModal(button) {
    const title = button.getAttribute('data-title');
    const abstract = button.getAttribute('data-abstract');

    const modalTitle = document.getElementById('fullAbstractModalTitle');
    const modalContent = document.getElementById('fullAbstractModalContent');

    if (modalTitle && modalContent) {
        modalTitle.textContent = title;
        modalContent.textContent = abstract;
        openModal('fullAbstractModal');
    }
}

// แก้ไขโค้ดสำหรับปุ่มค้นหาให้ใช้ชื่อ key ที่ถูกต้อง
document.getElementById("searchButton").addEventListener("click", function () {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categorySelect").value;
    const year = document.getElementById("academic-year").value;
    const level = document.getElementById("levelSelect").value;

    const filteredResearch = researchData.filter(card => {
        const matchesSearch =
            searchInput === "" ||
            (card['Title'] && card['Title'].toLowerCase().includes(searchInput)) ||
            (card['Authors'] && card['Authors'].toLowerCase().includes(searchInput)) ||
            (card['Abstract'] && card['Abstract'].toLowerCase().includes(searchInput));

        const matchesCategory = category === "" || (card['Category'] || '') === category;
        const matchesYear = year === "" || (card['Academic Year'] || '') === year;
        const matchesLevel = level === "" || (card['Level'] || '') === level;

        return matchesSearch && matchesCategory && matchesYear && matchesLevel;
    });

    displayResearchCards(filteredResearch);
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    attachAuthFormListeners();
    fetchAndDisplayResearch(); // โหลดข้อมูลและสร้างการแสดงผลทั้งหมด
});
