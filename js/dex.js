// dex.js

// URL ของ Google Apps Script Web App
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyvQHoEuzS17lbKWBEZgMzp3u8Yc34HFG7NmLozO2_v10MEF6M4eMvRmSp06PjybwbK/exec";

// container ที่อยู่ใน index.html
const cardContainer = document.getElementById("featuredResearchContainer");

// ฟังก์ชันโหลดข้อมูลจาก Google Sheet
async function fetchResearchData() {
    try {
        const response = await fetch(SHEET_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "action=getResearchData"
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "ไม่สามารถดึงข้อมูลได้");
        }

        const data = result.data;

        // ล้าง card เดิมก่อน
        cardContainer.innerHTML = "";

        data.forEach(research => {
            // สร้างการ์ด
            const card = document.createElement("div");
            card.className = "bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition p-4";

            // ลิงก์ไป OnlineMMM.html?id=...
            const cardLink = document.createElement("a");
            cardLink.href = `OnlineMMM.html?id=${research.Id}`;
            cardLink.className = "block h-full";

            // เนื้อหาใน card
            cardLink.innerHTML = `
                <img src="${research["Image URL"] || 'https://via.placeholder.com/400'}" 
                     alt="Research Image" 
                     class="w-full h-48 object-cover rounded-lg">
                <div class="mt-4">
                    <h2 class="text-xl font-bold mb-2">${research.Title}</h2>
                    <p class="text-gray-600 text-sm mb-3">
                        ${research.Abstract ? research.Abstract.substring(0, 150) + "..." : "No Abstract"}
                    </p>
                    <span class="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                        ${research.Category || "Uncategorized"}
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

    } catch (error) {
        console.error("Error fetching data:", error);
        cardContainer.innerHTML = `
            <div class="p-6 bg-white rounded-lg shadow text-red-600">
                เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}
            </div>
        `;
    }
}

// เรียกใช้งาน
fetchResearchData();
