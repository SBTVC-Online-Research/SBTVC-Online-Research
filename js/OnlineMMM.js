  //OnlineMMM.js

  const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyvQHoEuzS17lbKWBEZgMzp3u8Yc34HFG7NmLozO2_v10MEF6M4eMvRmSp06PjybwbK/exec";

  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function createDownloadLink(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.target = "_blank";
    a.download = "";
    a.className = "file-link";
    
    // เลือกไอคอนตามชนิดไฟล์
    let iconClass = 'fa-file';
    if(url.endsWith('.pdf')) iconClass = 'fa-file-pdf';
    else if(url.endsWith('.doc') || url.endsWith('.docx')) iconClass = 'fa-file-word';
    else if(url.endsWith('.xls') || url.endsWith('.xlsx')) iconClass = 'fa-file-excel';
    
    a.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${name}`;
    return a;
  }


  function renderResearch(research) {
    if (!research) {
      document.getElementById("content").textContent = "ไม่พบข้อมูล";
      return;
    }

    // รูปหน้าปกใหญ่
    const coverDiv = document.getElementById("cover-image");
    coverDiv.innerHTML = "";
    if (research["Image URL"] && research["Image URL"].trim() !== "") {
      const img = document.createElement("img");
      img.src = research["Image URL"];
      img.alt = research.Title || "Cover Image";
      img.style.width = "100%";
      img.style.borderRadius = "12px";
      img.style.objectFit = "cover";
      coverDiv.appendChild(img);
    } else {
      coverDiv.textContent = "ไม่มีรูปหน้าปก";
    }

    // ข้อมูลอื่นๆ
    document.getElementById("title-h1").textContent = research.Title || "-";
    document.getElementById("category-badge").textContent = research.Category || "-";
    document.getElementById("year-span").textContent = `${research.Year || "-"} (${research["Academic Year"] || "-"})`;
    document.getElementById("department-field").textContent = `${research.Department || "-"} | ${research.Field || "-"}`;
    document.getElementById("authors-name").textContent = research.Authors || "-";
    document.getElementById("advisor-span").textContent = research.Advisor || "-";
    document.getElementById("abstract-div").textContent = research.Abstract || "ไม่มีบทคัดย่อ";

    // ไฟล์งานวิจัย
    const filesDiv = document.getElementById("research-files");
    filesDiv.innerHTML = "";
    if (research["Research File URLs"]) {
      const urls = research["Research File URLs"].split(",").map(u => u.trim());
      urls.forEach((url, i) => {
        const fileName = url.split('/').pop(); // ใช้ชื่อไฟล์จริง
        const link = createDownloadLink(url, fileName);
        filesDiv.appendChild(link);
      });
    } else {
      filesDiv.textContent = "ไม่มีไฟล์แนบ";
    }
  }


  async function fetchResearch() {
    const id = getQueryParam("id");
    const body = new URLSearchParams();
    body.append("action", "getResearchData");
    if (id) body.append("id", id);

    try {
      const res = await fetch(SHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
      const result = await res.json();
      console.log(result);

      if (result.success && result.data.length > 0) {
        renderResearch(result.data[0]);
      } else {
        document.getElementById("content").textContent = "ไม่พบข้อมูล";
      }
    } catch (err) {
      console.error(err);
      document.getElementById("content").textContent = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
    }
  }

  window.addEventListener("DOMContentLoaded", fetchResearch);
