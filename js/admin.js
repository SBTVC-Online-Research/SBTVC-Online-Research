// admin.js

// 1. เริ่ม EmailJS ด้วย User ID ของคุณ
emailjs.init('8wx8bWgo4qP1YT_Nt');

// 2. ตั้งค่าประเภทการติดต่อจากปุ่มด่วน
function setContactType(type) {
    const select = document.getElementById('contactType');
    select.value = type;
    document.getElementById('contactForm').scrollIntoView({ behavior: 'smooth' });
}

// 3. รีเซ็ตฟอร์ม
function resetForm() {
    document.getElementById('contactForm').reset();
}

// 4. ปิด modalฤ
function closeModal() {
    document.getElementById('successModal').classList.add('hidden');
}

// 5. ฟังก์ชันส่งอีเมล
function sendEmail(form) {
    emailjs.sendForm('service_nk3ynbc', 'template_5fbfzne', form)
        .then(function() {
            // แสดง modal ส่งสำเร็จ
            document.getElementById('successModal').classList.remove('hidden');
            // รีเซ็ตฟอร์มหลัง 2 วินาที
            setTimeout(resetForm, 2000);
        }, function(error) {
            alert('เกิดข้อผิดพลาด: ' + JSON.stringify(error));
        });
}

// 6. เพิ่ม event listener ให้ฟอร์ม
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault(); // ป้องกันหน้ารีเฟรช
    sendEmail(this); // เรียกฟังก์ชันส่งอีเมล
});
