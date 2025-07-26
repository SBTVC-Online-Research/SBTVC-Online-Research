let researches = [];
let researchDisplayCounter = 0;

// ตรวจสอบให้แน่ใจว่า URL นี้ถูกต้องและเป็นเวอร์ชันที่ Deploy ล่าสุด (ลงท้ายด้วย /exec)
// URL นี้ควรตรงกับ URL ที่ได้จากการ Deploy Google Apps Script ใหม่
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-QTyfdSXqxmqVNoql7uRkoRZuGCHlZOJA-atzZT4ZEnIiLE_92v6dEm6iR3hBOzkp/exec';
const PENDING_RESEARCH_SHEET_NAME = 'UploadedImagesData'; // ชื่อชีทใน Google Sheet (ใช้ใน Apps Script)

// อ้างอิงถึง Element ต่างๆ ใน HTML
const statusMessageDiv = document.getElementById('status-message');
const researchGrid = document.getElementById('researchGrid');
const noDataMessage = document.getElementById('noDataMessage');
const totalCountSpan = document.getElementById('totalCount');
const pendingCountSpan = document.getElementById('pendingCount');
const approvedCountSpan = document.getElementById('approvedCount');
const rejectedCountSpan = document.getElementById('rejectedCount');
const loadingSpinner = document.getElementById('loading-spinner'); // ต้องมี element นี้ใน HTML

// อ้างอิงปุ่มต่างๆ (ต้องมีใน HTML)
const exportButton = document.getElementById('exportButton');
const clearAllButton = document.getElementById('clearAllButton');
const refreshButton = document.getElementById('refreshButton'); // หากมีปุ่มรีเฟรช

// --- ฟังก์ชันช่วยเหลือสำหรับการแสดงผล UI ---

/**
 * แสดงข้อความสถานะบนหน้าเว็บ
 * @param {HTMLElement} element - Element ที่ต้องการแสดงข้อความ
 * @param {string} msg - ข้อความที่จะแสดง
 * @param {'info'|'success'|'error'} type - ประเภทของข้อความสำหรับกำหนด class
 */
function showMessage(element, msg, type) {
    element.textContent = msg;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
}

/**
 * ซ่อนข้อความสถานะ
 * @param {HTMLElement} element - Element ที่ต้องการซ่อน
 */
function hideMessage(element) {
    element.classList.add('hidden');
    element.textContent = '';
}

/**
 * แสดง/ซ่อน Loading Spinner
 * @param {boolean} show - true เพื่อแสดง, false เพื่อซ่อน
 */
function showLoadingSpinner(show) {
    if (loadingSpinner) { // ตรวจสอบว่า element มีอยู่จริง
        if (show) {
            loadingSpinner.classList.remove('hidden');
        } else {
            loadingSpinner.classList.add('hidden');
        }
    }
}

// --- ฟังก์ชันดึงข้อมูลและอัปเดต UI หลัก ---

/**
 * ดึงข้อมูลงานวิจัยจาก Google Sheet ผ่าน Apps Script
 */
async function loadResearchDataFromGoogleSheet() {
    showMessage(statusMessageDiv, 'กำลังดึงข้อมูลจาก Google Sheet...', 'info');
    showLoadingSpinner(true);

    try {
        // ไม่จำเป็นต้องระบุ ?sheet=${PENDING_RESEARCH_SHEET_NAME} ใน doGet ของ Apps Script นี้
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
        
        // ตรวจสอบว่า HTTP response สำเร็จหรือไม่ (status 200-299)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error! Status: ${response.status}, Message: ${errorText.substring(0, 200)}...`);
        }

        const data = await response.json(); // แปลง response เป็น JSON

        // ล้างข้อมูลเก่าและรีเซ็ต UI
        researches = [];
        researchGrid.innerHTML = '';
        researchDisplayCounter = 0;
        noDataMessage.classList.add('hidden'); // ซ่อนข้อความไม่มีข้อมูลไว้ก่อน

        if (data.status === 'success' && Array.isArray(data.data)) {
            if (data.data.length === 0) {
                showMessage(statusMessageDiv, 'ไม่พบข้อมูลงานวิจัยที่รอดำเนินการ', 'info');
                noDataMessage.classList.remove('hidden'); // แสดงข้อความไม่มีข้อมูล
            } else {
                data.data.forEach(item => {
                    // ตรวจสอบว่ามี Id ก่อนเพิ่ม เพื่อป้องกันข้อมูลที่ไม่สมบูรณ์
                    if (item.Id) {
                        addResearchToGrid(item);
                    } else {
                        console.warn('Skipping research item due to missing ID:', item);
                    }
                });
                showMessage(statusMessageDiv, 'โหลดข้อมูลสำเร็จ!', 'success');
            }
        } else {
            // กรณี Apps Script ส่ง status: 'error' หรือรูปแบบข้อมูลไม่ถูกต้อง
            console.error('Data format error from Google Apps Script:', data);
            showMessage(statusMessageDiv, `รูปแบบข้อมูลไม่ถูกต้องจาก Google Apps Script: ${data.message || 'ไม่ทราบสาเหตุ'}`, 'error');
        }
    } catch (error) {
        // ดักจับข้อผิดพลาดระดับเครือข่าย หรือปัญหาในการแปลง JSON
        console.error('Error loading data:', error);
        showMessage(statusMessageDiv, `เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}`, 'error');
    } finally {
        updateStatistics(); // อัปเดตสถิติเสมอไม่ว่าจะเกิดอะไรขึ้น
        showLoadingSpinner(false); // ซ่อน spinner เสมอ
        setTimeout(() => hideMessage(statusMessageDiv), 3000); // ซ่อนข้อความสถานะหลังจาก 3 วินาที
    }
}

/**
 * ส่งออกข้อมูลที่ได้รับการอนุมัติและมีค่า 'pass'
 */
async function exportResults() {
    showMessage(statusMessageDiv, 'กำลังส่งออกข้อมูลที่ได้รับอนุมัติ...', 'info');
    showLoadingSpinner(true);

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'exportApprovedWithPass'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error during export:', response.status, errorText);
            showMessage(statusMessageDiv, `เกิดข้อผิดพลาด HTTP: ${response.status} - ${errorText.substring(0, 100)}...`, 'error');
            return;
        }

        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
            const approvedData = result.data;

            if (approvedData.length === 0) {
                showMessage(statusMessageDiv, 'ไม่พบบันทึกที่ผ่านการอนุมัติพร้อม pass', 'info');
            } else {
                console.log('Exported Data:', approvedData);
                // สร้าง CSV และดาวน์โหลด
                const csv = convertArrayOfObjectsToCSV(approvedData);
                downloadFile(csv, 'approved_research.csv', 'text/csv');
                showMessage(statusMessageDiv, `ส่งออกสำเร็จทั้งหมด ${approvedData.length} รายการ`, 'success');
            }
        } else {
            console.error('Export failed from Google Apps Script:', result);
            showMessage(statusMessageDiv, `การส่งออกล้มเหลว: ${result.message || 'ไม่ทราบสาเหตุ'}`, 'error');
        }
    } catch (error) {
        console.error("Error during export (network or JSON parsing):", error);
        showMessage(statusMessageDiv, 'เกิดข้อผิดพลาดในการเชื่อมต่อหรือประมวลผลข้อมูล', 'error');
    } finally {
        showLoadingSpinner(false);
        setTimeout(() => hideMessage(statusMessageDiv), 4000);
    }
}

/**
 * ฟังก์ชันช่วยในการแปลง Array of Objects เป็น CSV
 * จะใช้ Headers จาก Object แรกเป็นชื่อคอลัมน์
 */
function convertArrayOfObjectsToCSV(data) {
    if (data.length === 0) return '';

    // ตรวจสอบให้แน่ใจว่า headers ตรงกับ HEADER_PENDING_SHEET ใน Apps Script
    // เพื่อให้ลำดับและชื่อคอลัมน์ถูกต้อง
    const headers = [
      'Timestamp', 'Username', 'Image URL', 'Status', 'Id', 'Title', 'Category',
      'Department', 'Field', 'Year', 'Academic Year', 'Authors', 'Advisor',
      'Abstract', 'Research File URLs', 'passe'
    ];
    
    const csvRows = [];

    // Add headers
    csvRows.push(headers.map(header => {
        // จัดการ header ที่มี comma หรือ quote
        const stringVal = String(header);
        if (stringVal.includes(',') || stringVal.includes('"')) {
            return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
    }).join(','));

    // Add rows
    for (const row of data) {
        const values = headers.map(header => {
            let val = row[header];
            // จัดการ Research File URLs ที่อาจเป็น Array ของ URL
            if (header === 'Research File URLs' && Array.isArray(val)) {
                val = JSON.stringify(val); // แปลงกลับเป็น JSON string เพื่อเก็บใน CSV
            }
            const stringVal = (val === null || val === undefined) ? '' : String(val);
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
                // Escape quotes and wrap in double quotes
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * ฟังก์ชันช่วยในการดาวน์โหลดไฟล์
 * @param {string} content - เนื้อหาของไฟล์
 * @param {string} filename - ชื่อไฟล์
 * @param {string} contentType - ชนิดของ Content (เช่น 'text/csv', 'application/json')
 */
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * อัปเดตสถิติการนับงานวิจัยในแต่ละสถานะ
 */
function updateStatistics() {
    const total = researches.length;
    // นับ Pending รวมถึงรายการที่ Status เป็นค่าว่างด้วย
    const pending = researches.filter(r => r.Status === 'Pending' || r.Status === '').length;
    const approved = researches.filter(r => r.Status === 'Approved').length;
    const rejected = researches.filter(r => r.Status === 'Rejected').length;

    totalCountSpan.textContent = total;
    pendingCountSpan.textContent = pending;
    approvedCountSpan.textContent = approved;
    rejectedCountSpan.textContent = rejected;

    // แสดง/ซ่อนข้อความ "ไม่พบข้อมูล"
    if (total === 0) {
        noDataMessage.classList.remove('hidden');
    } else {
        noDataMessage.classList.add('hidden');
    }
}

/**
 * อัปเดตสถานะของงานวิจัยใน Google Sheet และ UI
 * @param {string} id - ID ของงานวิจัย
 * @param {string} newStatus - สถานะใหม่ ('Approved', 'Pending', 'Rejected')
 */
async function updateResearchStatus(id, newStatus) {
    const cardElement = document.getElementById(`card-${id}`);
    if (!cardElement) return;

    showMessage(statusMessageDiv, `กำลังอัปเดตสถานะ ID: ${id} เป็น ${newStatus}...`, 'info');
    showLoadingSpinner(true);

    // เก็บสถานะเดิมไว้เผื่อกรณีเกิดข้อผิดพลาด
    const currentResearch = researches.find(r => String(r.Id) === String(id));
    const oldStatus = currentResearch ? currentResearch.Status : null;

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'updateStatus',
                id: id,
                status: newStatus
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error updating status:', response.status, errorText);
            showMessage(statusMessageDiv, `ข้อผิดพลาด HTTP ในการอัปเดตสถานะ: ${response.status} - ${errorText.substring(0, 100)}...`, 'error');
            // ถ้าเกิดข้อผิดพลาด HTTP ให้คืนค่า radio button เดิม
            if (oldStatus) {
                const radio = cardElement.querySelector(`input[name="status-${id}"][value="${oldStatus}"]`);
                if (radio) radio.checked = true;
            }
            return;
        }

        const result = await response.json();

        if (result.status === 'success') {
            // อัปเดตสถานะในอาร์เรย์ researches
            const researchIndex = researches.findIndex(r => String(r.Id) === String(id));
            if (researchIndex !== -1) {
                researches[researchIndex].Status = newStatus;
                // หากมีการส่งค่า 'passe' กลับมา (เช่น 'pass') ให้อัปเดตด้วย (ไม่จำเป็นต้องมีใน Front-end แต่ถ้า Apps Script ส่งมาก็รับไว้)
                if (result.passeStatus) {
                    researches[researchIndex].passe = result.passeStatus;
                }
            }

            // อัปเดต UI ของการ์ด
            cardElement.classList.remove('status-approved', 'status-pending', 'status-rejected');
            cardElement.querySelector('.font-semibold').textContent = newStatus; // อัปเดตข้อความสถานะในการ์ด

            if (newStatus === 'Approved') {
                cardElement.classList.add('status-approved');
            } else if (newStatus === 'Pending') {
                cardElement.classList.add('status-pending');
            } else if (newStatus === 'Rejected') {
                cardElement.classList.add('status-rejected');
            }
            showMessage(statusMessageDiv, result.message, 'success');
        } else {
            console.error('Failed to update status from Apps Script:', result.message);
            showMessage(statusMessageDiv, `อัปเดตสถานะล้มเหลว: ${result.message}`, 'error');
            // คืนค่า radio button เดิมถ้าอัปเดตไม่สำเร็จ
            if (oldStatus) {
                const radio = cardElement.querySelector(`input[name="status-${id}"][value="${oldStatus}"]`);
                if (radio) radio.checked = true;
            }
        }
    } catch (error) {
        console.error('Error updating status (network or JSON parsing):', error);
        showMessage(statusMessageDiv, 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัปเดตสถานะ', 'error');
        // คืนค่า radio button เดิมถ้าอัปเดตไม่สำเร็จ
        if (oldStatus) {
            const radio = cardElement.querySelector(`input[name="status-${id}"][value="${oldStatus}"]`);
            if (radio) radio.checked = true;
        }
    } finally {
        updateStatistics(); // อัปเดตสถิติหลังจากเปลี่ยนสถานะ
        showLoadingSpinner(false);
        setTimeout(() => hideMessage(statusMessageDiv), 3000);
    }
}

/**
 * ลบงานวิจัยออกจาก Google Sheet และ UI
 * @param {string} id - ID ของงานวิจัยที่ต้องการลบ
 */
async function deleteResearch(id) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่ต้องการลบงานวิจัย ID: ${id} นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
        return;
    }

    showMessage(statusMessageDiv, `กำลังลบงานวิจัย ID: ${id}...`, 'info');
    showLoadingSpinner(true);

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete',
                id: id
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error deleting research:', response.status, errorText);
            showMessage(statusMessageDiv, `ข้อผิดพลาด HTTP ในการลบ: ${response.status} - ${errorText.substring(0, 100)}...`, 'error');
            return;
        }

        const result = await response.json();

        if (result.status === 'success') {
            // ลบการ์ดออกจาก DOM
            const cardElement = document.getElementById(`card-${id}`);
            if (cardElement) {
                cardElement.remove();
            }
            // ลบข้อมูลออกจากอาร์เรย์ researches
            researches = researches.filter(r => String(r.Id) !== String(id));
            showMessage(statusMessageDiv, result.message, 'success');
        } else {
            console.error('Failed to delete research from Apps Script:', result.message);
            showMessage(statusMessageDiv, `ลบงานวิจัยล้มเหลว: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting research (network or JSON parsing):', error);
        showMessage(statusMessageDiv, 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบงานวิจัย', 'error');
    } finally {
        updateStatistics(); // อัปเดตสถิติหลังจากลบ
        showLoadingSpinner(false);
        setTimeout(() => hideMessage(statusMessageDiv), 3000);
    }
}

/**
 * ล้างการแสดงผลงานวิจัยทั้งหมดบนหน้าเว็บ (ไม่ได้ลบข้อมูลใน Sheet)
 */
function clearAllDisplayedResearch() {
    researchGrid.innerHTML = '';
    researches = [];
    researchDisplayCounter = 0;
    updateStatistics();
    showMessage(statusMessageDiv, 'ล้างข้อมูลที่แสดงทั้งหมดแล้ว (ข้อมูลใน Sheet ยังคงอยู่)', 'info');
    setTimeout(() => hideMessage(statusMessageDiv), 3000);
}

/**
 * เพิ่มงานวิจัยลงใน Grid แสดงผล
 * @param {Object} researchData - ข้อมูลงานวิจัย
 */
function addResearchToGrid(researchData) {
    // ป้องกันการเพิ่มซ้ำซ้อน
    if (!researchData.Id || researches.some(r => String(r.Id) === String(researchData.Id))) {
        return;
    }

    researches.push(researchData);
    researchDisplayCounter++;
    const card = createResearchCard(researchData, researchDisplayCounter);
    researchGrid.appendChild(card);
}

/**
 * สร้าง HTML Card สำหรับงานวิจัยแต่ละรายการ
 * @param {Object} researchData - ข้อมูลงานวิจัย
 * @param {number} displayId - ลำดับการแสดงผลในการ์ด
 * @returns {HTMLElement} - Element ของ Card งานวิจัย
 */
function createResearchCard(researchData, displayId) {
    const card = document.createElement('div');
    card.className = 'research-card bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200';
    card.id = `card-${researchData.Id}`;

    // กำหนดสถานะ checked สำหรับ radio button
    let approvedChecked = researchData.Status === 'Approved' ? 'checked' : '';
    let pendingChecked = (researchData.Status === 'Pending' || !researchData.Status) ? 'checked' : '';
    let rejectedChecked = researchData.Status === 'Rejected' ? 'checked' : '';
    
    // เพิ่ม class ตามสถานะ
    if (researchData.Status === 'Approved') card.classList.add('status-approved');
    else if (researchData.Status === 'Pending' || !researchData.Status) card.classList.add('status-pending');
    else if (researchData.Status === 'Rejected') card.classList.add('status-rejected');

    // จัดการ Image URL (รับได้ทั้ง ImageUrl และ Image URL)
    let imageUrl = (researchData.ImageUrl || researchData['Image URL'] || '').trim();
    if (!imageUrl) {
        imageUrl = 'https://placehold.co/400x300/F3F4F6/9CA3AF?text=No+Image'; // รูปภาพสำรอง
    }

    // จัดการ Research File URLs (แปลงจาก JSON String หรือ Array)
    let researchFileLinksHtml = '';
    if (researchData['Research File URLs']) {
        try {
            let fileUrls = researchData['Research File URLs'];
            if (typeof fileUrls === 'string') {
                try {
                    fileUrls = JSON.parse(fileUrls);
                } catch (e) {
                    fileUrls = [fileUrls]; // ถ้าไม่ใช่ JSON string ก็ถือว่าเป็น URL เดี่ยวๆ
                }
            }
            if (Array.isArray(fileUrls) && fileUrls.length > 0) {
                researchFileLinksHtml = '<div class="mt-2 text-sm text-gray-600">';
                fileUrls.forEach((url, index) => {
                    researchFileLinksHtml += `<a href="${url}" target="_blank" class="block text-blue-600 hover:underline">ไฟล์งานวิจัย #${index + 1}</a>`;
                });
                researchFileLinksHtml += '</div>';
            }
        } catch (e) {
            console.error("Error parsing Research File URLs:", researchData['Research File URLs'], e);
            researchFileLinksHtml = `<div class="mt-2 text-sm text-red-600">URL ไฟล์งานวิจัยไม่ถูกต้อง</div>`;
        }
    }

    card.innerHTML = `
        <div class="relative">
            <img
                src="${imageUrl}"
                alt="Research Cover ${researchData.Title || researchData.Id}"
                class="w-full h-64 object-cover"
                onerror="this.onerror=null; this.src='https://placehold.co/400x300/F3F4F6/9CA3AF?text=Image+Error';"
            >
            <div class="absolute top-3 right-3 bg-white rounded-full px-2 py-1 text-sm font-medium text-gray-600">#${displayId}</div>
            <div class="absolute bottom-3 left-3 bg-white rounded-lg px-3 py-1 text-xs font-semibold text-gray-700 shadow-md">ID: ${researchData.Id}</div>
        </div>
        <div class="p-4">
            <h3 class="text-lg font-bold text-gray-800 mb-2 truncate" title="${researchData.Title || 'ไม่ระบุชื่อเรื่อง'}">${researchData.Title || 'ไม่ระบุชื่อเรื่อง'}</h3>
            <div class="text-sm space-y-1">
                <p><span class="card-detail-label">ผู้ใช้:</span> <span class="card-detail-value">${researchData.Username || 'ไม่ระบุ'}</span></p>
                <p><span class="card-detail-label">หมวดหมู่:</span> <span class="card-detail-value">${researchData.Category || 'ไม่ระบุ'}</span></p>
                <p><span class="card-detail-label">ปีที่ตีพิมพ์:</span> <span class="card-detail-value">${researchData.Year || 'ไม่ระบุ'}</span></p>
                <p><span class="card-detail-label">ผู้แต่ง:</span> <span class="card-detail-value">${researchData.Authors || 'ไม่ระบุ'}</span></p>
                <p><span class="card-detail-label">บทคัดย่อ:</span> <span class="card-detail-value truncate" title="${researchData.Abstract || 'ไม่ระบุ'}">${researchData.Abstract || 'ไม่ระบุ'}</span></p>
                <p><span class="card-detail-label">สถานะปัจจุบัน:</span> <span class="font-semibold">${researchData.Status || 'Pending'}</span></p>
            </div>
            ${researchFileLinksHtml}
            
            <div class="mt-4 flex justify-around space-x-2">
                <label class="flex items-center cursor-pointer group">
                    <input type="radio" name="status-${researchData.Id}" value="Approved" class="checkbox-approved w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500" onchange="updateResearchStatus('${researchData.Id}', 'Approved')" ${approvedChecked}>
                    <span class="ml-2 text-green-700 font-medium group-hover:text-green-800">✓ อนุมัติ</span>
                </label>
                <label class="flex items-center cursor-pointer group">
                    <input type="radio" name="status-${researchData.Id}" value="Rejected" class="checkbox-rejected w-5 h-5 text-red-600 border-2 border-gray-300 rounded focus:ring-red-500" onchange="updateResearchStatus('${researchData.Id}', 'Rejected')" ${rejectedChecked}>
                    <span class="ml-2 text-red-700 font-medium group-hover:text-red-800">✗ ไม่อนุมัติ</span>
                </label>
                <label class="flex items-center cursor-pointer group">
                    <input type="radio" name="status-${researchData.Id}" value="Pending" class="checkbox-pending w-5 h-5 text-amber-600 border-2 border-gray-300 rounded focus:ring-amber-500" onchange="updateResearchStatus('${researchData.Id}', 'Pending')" ${pendingChecked}>
                    <span class="ml-2 text-amber-700 font-medium group-hover:text-amber-800">รอ</span>
                </label>
            </div>
            <div class="mt-4 text-center">
                <label class="inline-flex items-center">
                    <input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600 selected-checkbox" data-id="${researchData.Id}">
                    <span class="ml-2 text-gray-700">เลือกเพื่อส่งออก</span>
                </label>
            </div>
            <button onclick="deleteResearch('${researchData.Id}')" class="w-full mt-3 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors duration-200">
                ลบงานวิจัยนี้
            </button>
        </div>
    `;
    return card;
}

// --- Event Listener เมื่อ DOM โหลดเสร็จสิ้น ---
window.addEventListener('DOMContentLoaded', () => {
    loadResearchDataFromGoogleSheet();

    // ผูก Event Listener สำหรับปุ่มต่างๆ
    if (exportButton) {
        exportButton.addEventListener('click', exportResults);
    }
    if (clearAllButton) {
        clearAllButton.addEventListener('click', clearAllDisplayedResearch);
    }
    if (refreshButton) { // หากมีปุ่มรีเฟรช
        refreshButton.addEventListener('click', loadResearchDataFromGoogleSheet);
    }
});
