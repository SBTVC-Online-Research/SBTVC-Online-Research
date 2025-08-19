 <script>
        // IMPORTANT: Replace with your deployed Google Apps Script Web App URL
        const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-QTyfdSXqxmqVNoql7uRkoRZuGCHlZOJA-atzZT4ZEnIiLE_92v6dEm6iR3hBOzkp/exec';

        // Toast Notification
        function showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            toast.className = 'toast show ' + type;
            toast.textContent = message;
            setTimeout(() => {
                toast.className = toast.className.replace('show', '');
            }, 3000);
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

        // ตัวแปรสำหรับเก็บข้อมูลงานวิจัยที่โหลดมา
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
                    displayResearchCards(researchData);
                } else {
                    noResultMessage.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error fetching research data:', error);
                showToast('เกิดข้อผิดพลาดในการดึงข้อมูลงานวิจัย', 'error');
            }
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

    // ใช้ชื่อคอลัมน์จากชีตของคุณโดยตรงเพื่อกำหนด data attributes
    cardDiv.setAttribute('data-title', research['Title'] || '');
    cardDiv.setAttribute('data-category', research['Category'] || '');
    cardDiv.setAttribute('data-year', research['Academic Year'] || '');
    cardDiv.setAttribute('data-level', research['Level'] || '');

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
            <p class="text-gray-600 mb-4">${research['Abstract'] || 'ไม่มีคำอธิบาย'}</p>
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">${(research['Authors'] && research['Authors'].charAt(0)) || '?'}</div>
                    <span class="ml-2 text-gray-700">${research['Authors'] || 'ไม่ระบุผู้จัดทำ'}</span>
                </div>
            </div>
        </div>
    `;
    return cardDiv;
}

        // โค้ดที่แก้ไขแล้วสำหรับปุ่มค้นหา
        document.getElementById("searchButton").addEventListener("click", function () {
            const searchInput = document.getElementById("searchInput").value.toLowerCase();
            const category = document.getElementById("categorySelect").value;
            const year = document.getElementById("academic-year").value;
            const level = document.getElementById("levelSelect").value;
        
            const filteredResearch = researchData.filter(card => {
                const matchesSearch =
                    searchInput === "" ||
                    (card.title && card.title.toLowerCase().includes(searchInput)) ||
                    (card.author && card.author.toLowerCase().includes(searchInput)) ||
                    (card.description && card.description.toLowerCase().includes(searchInput));
        
                const matchesCategory = category === "" || card.category === category;
                const matchesYear = year === "" || card.year === year;
                const matchesLevel = level === "" || card.level === level;
        
                return matchesSearch && matchesCategory && matchesYear && matchesLevel;
            });
        
            displayResearchCards(filteredResearch);
        });

        // Initial load
        document.addEventListener('DOMContentLoaded', () => {
            checkLoginStatus();
            attachAuthFormListeners();
            fetchAndDisplayResearch();
        });
    </script>

