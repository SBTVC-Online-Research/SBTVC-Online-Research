    // ** โปรดเปลี่ยน YOUR_SCRIPT_URL เป็น URL ที่ Deploy แล้วของคุณ **
    const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyvQHoEuzS17lbKWBEZgMzp3u8Yc34HFG7NmLozO2_v10MEF6M4eMvRmSp06PjybwbK/exec";

    // ฟังก์ชันสำหรับดึงข้อมูลงานวิจัยที่รออนุมัติ
    async function fetchPendingResearch() {
    const loadingEl = document.getElementById("loading");
    const container = document.getElementById("pendingContainer");
    container.innerHTML = "";
    loadingEl.style.display = 'block';

    try {
        const formData = new FormData();
        formData.append("action", "getPendingResearchData");

        const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        body: formData
        });
        const data = await res.json();

        loadingEl.style.display = 'none';

// โค้ดที่แก้ไขในไฟล์ approve.js
// ... (ส่วนหัวโค้ดเหมือนเดิม) ...

    if (data.success && data.data.length > 0) {
        data.data.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "research-card bg-white p-6 rounded-xl shadow-md flex flex-col justify-between transition-transform transform hover:scale-105";

            const timestamp = item.Timestamp ? new Date(item.Timestamp).toLocaleString('th-TH') : 'ไม่ระบุ';
            
            const coverImageHTML = item['Image URL']
              ? `<div class="w-full mb-4 overflow-hidden rounded-lg aspect-video bg-gray-200">
                   <img src="${item['Image URL']}" alt="รูปภาพปกงานวิจัย" class="w-full h-full object-cover">
                 </div>`
              : `<div class="w-full h-48 flex items-center justify-center bg-gray-200 text-gray-500 rounded-lg mb-4 aspect-video">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-4.243-4.243a2 2 0 00-.07-2.828L5.5 10.5" />
                   </svg>
                 </div>`;

            card.innerHTML = `
            <div>
                ${coverImageHTML}
                <h3 class="text-xl font-bold mb-2 text-orange-600">${item.Title || 'ไม่ระบุชื่อเรื่อง'}</h3>
                <p class="text-gray-700 mb-1"><strong class="font-semibold">ผู้ส่ง:</strong> ${item.Username || 'ไม่ระบุ'}</p>
                <p class="text-gray-700 mb-1"><strong class="font-semibold">ผู้เขียน:</strong> ${item.Authors || 'ไม่ระบุ'}</p>
                <p class="text-gray-700 mb-1"><strong class="font-semibold">ภาควิชา:</strong> ${item.Department || 'ไม่ระบุ'}</p>
                <p class="text-gray-700 mb-1"><strong class="font-semibold">ปีการศึกษา:</strong> ${item['Academic Year'] || 'ไม่ระบุ'}</p>
                <p class="text-gray-500 text-sm mb-4">ส่งเมื่อ: ${timestamp}</p>
                <div class="mt-2 text-gray-600">
                    <p class="font-semibold">บทคัดย่อ:</p>
                    <p class="text-sm text-ellipsis-3">${item.Abstract || 'ไม่มีบทคัดย่อ'}</p>
                </div>
            </div>
            <div class="flex gap-3 mt-4 justify-end">
                <a href="${item['Research File URLs']}" target="_blank" class="bg-orange-500 text-white text-sm px-4 py-2 rounded hover:bg-orange-600 transition-colors duration-200">ดูเอกสาร</a>
                <button onclick="approveResearch(${index + 2})" class="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition-colors duration-200">อนุมัติ</button>
                <button onclick="rejectResearch(${index + 2})" class="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200">ปฏิเสธ</button>
            </div>
            `;
            container.appendChild(card);
        });
    } else {
    // ... (ส่วนท้ายโค้ดเหมือนเดิม) ...
        container.innerHTML = `<p class="text-center text-gray-500">ไม่มีงานวิจัยรออนุมัติ</p>`;
        }
    } catch (err) {
        console.error("Error fetching pending research:", err);
        loadingEl.style.display = 'none';
        container.innerHTML = `<p class="text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>`;
    }
    }
    // ฟังก์ชันสำหรับอนุมัติงานวิจัย
    async function approveResearch(rowId) {
    if (!confirm("คุณแน่ใจที่จะอนุมัติงานวิจัยนี้ใช่หรือไม่?")) return;

    const formData = new FormData();
    formData.append("action", "approveResearch");
    formData.append("rowId", rowId);

    try {
        const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        body: formData
        });
        const data = await res.json();
        
        if (data.success) {
        alert("อนุมัติงานวิจัยสำเร็จ!");
        fetchPendingResearch();
        } else {
        alert("เกิดข้อผิดพลาด: " + data.message);
        }
    } catch (err) {
        console.error("Error approving research:", err);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
    }

    // ฟังก์ชันสำหรับปฏิเสธงานวิจัย
    async function rejectResearch(rowId) {
    if (!confirm("คุณแน่ใจที่จะปฏิเสธงานวิจัยนี้ใช่หรือไม่?")) return;

    const formData = new FormData();
    formData.append("action", "rejectResearch");
    formData.append("rowId", rowId);

    try {
        const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        body: formData
        });
        const data = await res.json();

        if (data.success) {
        alert("ปฏิเสธงานวิจัยสำเร็จ!");
        fetchPendingResearch();
        } else {
        alert("เกิดข้อผิดพลาด: " + data.message);
        }
    } catch (err) {
        console.error("Error rejecting research:", err);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
    }

    // เริ่มต้นดึงข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
    document.addEventListener("DOMContentLoaded", fetchPendingResearch);
