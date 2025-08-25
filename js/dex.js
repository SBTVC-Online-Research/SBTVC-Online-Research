    // dex.js

    const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyvQHoEuzS17lbKWBEZgMzp3u8Yc34HFG7NmLozO2_v10MEF6M4eMvRmSp06PjybwbK/exec";

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
            renderPagination();

        } catch (error) {
            console.error("Error fetching data:", error);
            cardContainer.innerHTML = `<div class="p-6 bg-white rounded-lg shadow text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</div>`;
        }
    }

    // ฟังก์ชันค้นหา / กรองข้อมูล
    function filterResearch() {
        const searchText = searchInput.value.toLowerCase();
        const selectedCategory = categorySelect.value;
        const selectedYear = academicYearSelect.value;

        filteredResearchData = allResearchData.filter(item => {
            const matchesText = 
                item.Title?.toLowerCase().includes(searchText) ||
                item.Author?.toLowerCase().includes(searchText) ||
                item.Keywords?.toLowerCase().includes(searchText);

            const matchesCategory = selectedCategory ? item.Category === selectedCategory : true;
            const matchesYear = selectedYear ? item.AcademicYear === selectedYear : true;

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

            cardLink.innerHTML = `
                <div class="image-container">
                    <img src="${research["Image URL"] || 'https://via.placeholder.com/400'}" alt="Research Image">
                </div>
                <div class="research-card-content">
                    <h3 class="text-xl font-bold mb-2">${research.Title}</h3>
                    <p class="text-gray-600 text-sm mb-3">
                        ${research.Abstract ? research.Abstract.substring(0, 150) + "..." : "ไม่มีบทคัดย่อ"}
                    </p>
                    <span class="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                        ${research.Category || "ไม่ระบุหมวดหมู่"}
                    </span>
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

    // Event listener สำหรับปุ่มค้นหา
    searchButton.addEventListener("click", filterResearch);

    // โหลดข้อมูลเริ่มต้น
    fetchResearchData();
