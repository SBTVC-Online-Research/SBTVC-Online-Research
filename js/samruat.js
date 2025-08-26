// IMPORTANT: Replace with your deployed Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-QTyfdSXqxmqVNoql7uRkoRZuGCHlZOJA-atzZT4ZEnIiLE_92v6dEm6iR3hBOzkp/exec';

let allResearch = [];

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

// Function to open the full abstract modal
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

// Function to create a single research card
function createResearchCard(research) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'research-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer';

    // ลิงก์ไปยังหน้า OnlineMMM.html โดยใช้ Id ของงานวิจัย
    const link = document.createElement('a');
    link.href = `OnlineMMM.html?id=${research.Id}`;
    link.className = 'block';

    const abstractText = research['Abstract'] || 'ไม่มีคำอธิบาย';
    const truncatedAbstract = abstractText.length > 100 ? abstractText.substring(0, 100) + '...' : abstractText;

    link.innerHTML = `
        <div class="h-40 overflow-hidden">
            <img src="${research['Image URL'] || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="ภาพประกอบ" class="w-full h-full object-cover transition hover:opacity-90" />
        </div>
        <div class="p-6">
            <div class="flex justify-between mb-2">
                <span class="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">${research['Category'] || 'ไม่ระบุ'}</span>
                <span class="text-gray-500 text-sm">${research['Academic Year'] || 'ไม่ระบุ'}</span>
            </div>
            <h3 class="text-lg font-semibold mb-2">${research['Title'] || 'ไม่มีชื่อเรื่อง'}</h3>
            <p class="text-gray-600 mb-4">${truncatedAbstract}</p>
        </div>
    `;

    cardDiv.appendChild(link);
    return cardDiv;
}

// Function to render research cards based on a filtered list
function renderResearchCards(researchList) {
    const container = document.getElementById('gridView');
    const noResultMessage = document.getElementById('noResultMessage');
    const resultCount = document.getElementById('resultCount');

    if (!container || !noResultMessage || !resultCount) {
        console.error("Error: gridView, noResultMessage or resultCount not found.");
        return;
    }

    container.innerHTML = '';
    
    if (researchList.length > 0) {
        researchList.forEach(research => {
            const card = createResearchCard(research);
            container.appendChild(card);
        });
        noResultMessage.classList.add('hidden');
        resultCount.textContent = `พบ ${researchList.length} รายการ`;
    } else {
        noResultMessage.classList.remove('hidden');
        resultCount.textContent = `ไม่พบ 0 รายการ`;
    }
}

// Function to fetch and display research for a specific category
async function fetchAndDisplayCategoryResearch() {
    const category = document.body.getAttribute('data-category');
    if (!category) {
        console.error('Data category not found on the body element.');
        return;
    }

    const container = document.getElementById('gridView');
    if (!container) {
        console.error("Error: gridView not found.");
        return;
    }

    container.innerHTML = '<p class="text-center col-span-full text-gray-500">กำลังโหลด...</p>';
    
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'getResearchData',
                category: category
            }).toString()
        });
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            allResearch = result.data;
            renderResearchCards(allResearch);
        } else {
            allResearch = [];
            renderResearchCards([]);
        }
    } catch (error) {
        console.error('Error fetching research data:', error);
        allResearch = [];
        renderResearchCards([]);
    }
}

// Function to filter research
function filterResearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const level = document.getElementById('levelFilter').value;
    const academicYear = document.getElementById('academicYearFilter').value;
    const department = document.getElementById('departmentFilter').value;

    const filteredResearch = allResearch.filter(research => {
        // FIX: Use capitalized keys for filtering and ensure robust comparison
        const matchesSearch = searchTerm === '' || 
                             (research['Title'] && String(research['Title']).toLowerCase().includes(searchTerm)) ||
                             (research['Abstract'] && String(research['Abstract']).toLowerCase().includes(searchTerm)) ||
                             (research['Authors'] && String(research['Authors']).toLowerCase().includes(searchTerm));
        const matchesLevel = level === '' || (research['Level'] && String(research['Level']).trim().toLowerCase().includes(String(level).trim().toLowerCase()));
        const matchesAcademicYear = academicYear === '' || (research['Academic Year'] && String(research['Academic Year']).trim() === String(academicYear).trim());
        const matchesDepartment = department === '' || (research['Department'] && String(research['Department']).trim() === String(department).trim());

        return matchesSearch && matchesLevel && matchesAcademicYear && matchesDepartment;
    });

    renderResearchCards(filteredResearch);
}

// Initial load and event listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayCategoryResearch();
    
    document.getElementById('searchButton').addEventListener('click', filterResearch);
    document.getElementById('searchInput').addEventListener('input', filterResearch);
    document.getElementById('levelFilter').addEventListener('change', filterResearch);
    document.getElementById('academicYearFilter').addEventListener('change', filterResearch);
    document.getElementById('departmentFilter').addEventListener('change', filterResearch);
    
    // Set up modal close functionality
    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });
});
