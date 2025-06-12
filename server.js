const express = require("express");
const nodemailer = require("nodemailer");
const app = express();

app.use(express.urlencoded({ extended: true }));

// ฟอร์มส่งคำขอลืมรหัสผ่าน
app.post("/send-reset-link", async (req, res) => {
  const userEmail = req.body.email;

  // TODO: ตรวจสอบว่าอีเมลนี้มีอยู่ในฐานข้อมูลหรือไม่
  const resetToken = generateToken(); // สร้างโทเค็นรีเซ็ตรหัส
  const resetLink = `http://yourdomain.com/reset-password?token=${resetToken}`;

  // ส่งอีเมลผ่าน Gmail SMTP
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "youremail@gmail.com",
      pass: "your_app_password", // ใช้ App Password จาก Google
    },
  });

  let mailOptions = {
    from: '"ระบบรีเซ็ตรหัสผ่าน" <youremail@gmail.com>',
    to: userEmail,
    subject: "ลิงก์รีเซ็ตรหัสผ่าน",
    html: `<p>คลิก <a href="${resetLink}">ที่นี่</a> เพื่อรีเซ็ตรหัสผ่าน</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว");
  } catch (error) {
    console.error(error);
    res.status(500).send("เกิดข้อผิดพลาดในการส่งอีเมล");
  }
});

// ฟังก์ชันสร้าง token (สามารถใช้ JWT หรือ UUID)
function generateToken() {
  return Math.random().toString(36).substr(2);
}

app.listen(3000, () => console.log("Server started on port 3000"));
