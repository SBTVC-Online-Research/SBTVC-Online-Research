
    // **Cloudinary Configuration** (เปลี่ยนเป็น Cloud name และ Upload preset ของคุณ)
    const CLOUDINARY_CLOUD_NAME = 'davuwvefc'; // <-- เปลี่ยนตรงนี้เป็น Cloud name ของคุณ
    const CLOUDINARY_IMAGE_UPLOAD_PRESET = 'STVC_preset'; // <-- เปลี่ยนตรงนี้ (ตั้งชื่อใหม่ เช่น research_photo_preset)
    const CLOUDINARY_FILE_UPLOAD_PRESET = 'aekasan'; // <-- เปลี่ยนตรงนี้ (ตั้งชื่อใหม่ เช่น research_file_preset)

    // **Google Apps Script Web App URL** //
    // *** สำคัญมาก: URL ของคุณถูกนำมาใช้ที่นี่แล้ว ***
    const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-QTyfdSXqxmqVNoql7uRkoRZuGCHlZOJA-atzZT4ZEnIiLE_92v6dEm6iR3hBOzkp/exec';

    // ตัวแปรสำหรับ Element HTML ต่างๆ จะถูกประกาศและกำหนดค่าภายใน DOMContentLoaded
    let categoryItems;
    let selectedCategoryInput;
    let authorsContainer;
    let formMessage;
    let imageUploadMessage;
    let fileUploadMessage;

    let coverImageUploadArea;
    let coverImageInputFile;
    let coverImagePreviewContainer;
    let uploadedImageDisplay;
    let imageUrlDisplay;
    let uploadedImageUrlInput;
    let removeCoverImageButton;

    let researchFilesUploadArea;
    let researchFileInput;
    let researchFileListDiv;
    let uploadedResearchFilesUrlInput;
    let pendingFileUploads = 0;

    // --- Helper Functions for UI Messages ---
    function showFormMessage(msg, type) {
        if (formMessage) {
            formMessage.textContent = msg;
            formMessage.className = `message ${type}`;
            formMessage.classList.remove('hidden');
        }
    }
    function hideFormMessage() {
        if (formMessage) {
            formMessage.classList.add('hidden');
            formMessage.textContent = '';
        }
    }

    function showImageUploadMessage(msg, type) {
        if (imageUploadMessage) {
            imageUploadMessage.textContent = msg;
            imageUploadMessage.className = `message ${type}`;
            imageUploadMessage.classList.remove('hidden');
        }
    }
    function hideImageUploadMessage() {
        if (imageUploadMessage) {
            imageUploadMessage.classList.add('hidden');
            imageUploadMessage.textContent = '';
        }
    }

    function showFileUploadMessage(msg, type) {
        if (fileUploadMessage) {
            fileUploadMessage.textContent = msg;
            fileUploadMessage.className = `message ${type}`;
            fileUploadMessage.classList.remove('hidden');
        }
    }
    function hideFileUploadMessage() {
        if (fileUploadMessage) {
            fileUploadMessage.classList.add('hidden');
            fileUploadMessage.textContent = '';
        }
    }

    // --- Authors Management Logic ---
    function createAuthorInput(value = '') {
        const newAuthorDiv = document.createElement('div');
        newAuthorDiv.className = 'author-entry flex items-center gap-4 mb-2';
        newAuthorDiv.innerHTML = `
            <input type="text" name="authors[]" class="flex-1 border rounded-lg px-4 py-2 focus:ring-blue-500 outline-none" placeholder="ชื่อ-นามสกุล" required value="${value}">
            <button type="button" class="remove-author bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition">－</button>
        `;
        return newAuthorDiv;
    }

    function createAddButton() {
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'add-author bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition';
        addButton.textContent = '＋';
        return addButton;
    }
    
    function createRemoveButton() {
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-author bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition';
        removeButton.textContent = '－';
        return removeButton;
    }
    

    // --- Form Validation and Submission Logic ---
    function updateSubmitButtonState() {
        const submitBtn = document.getElementById('submit-btn');
        if (!submitBtn) return; 

        const isImageUploaded = uploadedImageUrlInput && uploadedImageUrlInput.value !== '';
        const areFilesUploaded = uploadedResearchFilesUrlInput && JSON.parse(uploadedResearchFilesUrlInput.value || '[]').length > 0;

        const hasFormError = formMessage && !formMessage.classList.contains('hidden') && formMessage.classList.contains('error');
        const hasImageUploadError = imageUploadMessage && !imageUploadMessage.classList.contains('hidden') && imageUploadMessage.classList.contains('error');
        const hasFileUploadError = fileUploadMessage && !fileUploadMessage.classList.contains('hidden') && fileUploadMessage.classList.contains('error');

        const titleFilled = document.getElementById('title') && document.getElementById('title').value.trim() !== '';
        const categorySelected = selectedCategoryInput && selectedCategoryInput.value.trim() !== '';
        const departmentSelected = document.getElementById('department') && document.getElementById('department').value.trim() !== '';
        
        const yearFilled = document.getElementById('year') && document.getElementById('year').value.trim() !== '';
        const academicYearFilled = document.getElementById('academic-year') && document.getElementById('academic-year').value.trim() !== '';
        const advisorFilled = document.getElementById('advisor') && document.getElementById('advisor').value.trim() !== '';
        const abstractFilled = document.getElementById('abstract') && document.getElementById('abstract').value.trim() !== '';
        
        const authorsInputs = document.querySelectorAll('input[name="authors[]"]');
        let allAuthorsFilled = true;
        if (authorsInputs.length === 0) {
            allAuthorsFilled = false;
        } else {
            authorsInputs.forEach(input => {
                if (input.value.trim() === '') {
                    allAuthorsFilled = false;
                }
            });
        }

        const allFormFieldsValid = titleFilled && categorySelected && departmentSelected  && yearFilled && academicYearFilled && allAuthorsFilled && advisorFilled && abstractFilled;

        submitBtn.disabled = !(
            allFormFieldsValid &&
            isImageUploaded &&
            areFilesUploaded &&
            pendingFileUploads === 0 &&
            !hasFormError && !hasImageUploadError && !hasFileUploadError
        );
    }

    // --- DOMContentLoaded Event Listener ---
    document.addEventListener('DOMContentLoaded', () => {
        // กำหนดค่าตัวแปร Element HTML ทั้งหมดเมื่อ DOM โหลดเสร็จแล้ว
        categoryItems = document.querySelectorAll('.category-item');
        selectedCategoryInput = document.getElementById('selected-category');
        authorsContainer = document.getElementById('authors-container');
        formMessage = document.getElementById('form-message');
        imageUploadMessage = document.getElementById('image-upload-message');
        fileUploadMessage = document.getElementById('file-upload-message');

        coverImageUploadArea = document.getElementById('coverImageUploadArea');
        coverImageInputFile = document.getElementById('coverImageInputFile');
        coverImagePreviewContainer = document.getElementById('cover-image-preview-container');
        uploadedImageDisplay = document.getElementById('uploaded-image-display');
        imageUrlDisplay = document.getElementById('imageUrlDisplay');
        uploadedImageUrlInput = document.getElementById('uploaded-image-url');
        removeCoverImageButton = document.getElementById('remove-cover-image');

        researchFilesUploadArea = document.getElementById('researchFilesUploadArea');
        researchFileInput = document.getElementById('researchFileInput');
        researchFileListDiv = document.getElementById('research-file-list');
        uploadedResearchFilesUrlInput = document.getElementById('uploaded-research-files-url');

        // ตรวจสอบว่า Element ที่จำเป็นสำหรับการอัปโหลดรูปภาพมีอยู่จริง
        if (!coverImageUploadArea || !coverImageInputFile || !coverImagePreviewContainer || !uploadedImageDisplay || !imageUrlDisplay || !uploadedImageUrlInput || !removeCoverImageButton) {
            console.error("Critical HTML elements for cover image upload are missing. Please check your upload.html file for correct IDs.");
            showFormMessage('เกิดข้อผิดพลาด: ไม่พบองค์ประกอบ HTML สำหรับการอัปโหลดรูปภาพปก', 'error');
            return;
        }

        // ตรวจสอบว่า Element ที่จำเป็นสำหรับการอัปโหลดไฟล์งานวิจัยมีอยู่จริง
        if (!researchFilesUploadArea || !researchFileInput || !researchFileListDiv || !uploadedResearchFilesUrlInput) {
            console.error("Critical HTML elements for research file upload are missing. Please check your upload.html file for correct IDs.");
            showFormMessage('เกิดข้อผิดพลาด: ไม่พบองค์ประกอบ HTML สำหรับการอัปโหลดไฟล์งานวิจัย', 'error');
            return;
        }

        // --- Category Selection Logic ---
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                // เรียกใช้ฟังก์ชัน selectCategory ที่คุณกำหนดเอง
                selectCategory(item);
                hideFormMessage();
                updateSubmitButtonState();
            });
        });

        // --- Authors Management Logic ---
        authorsContainer.addEventListener('click', e => {
            if(e.target.classList.contains('add-author')) {
                const currentAuthorEntries = authorsContainer.querySelectorAll('.author-entry').length;
                const newAuthorEntry = createAuthorInput();
                authorsContainer.appendChild(newAuthorEntry);

                if (currentAuthorEntries === 1) {
                    const firstAuthorEntry = authorsContainer.children[0];
                    const addButton = firstAuthorEntry.querySelector('.add-author');
                    if (addButton) {
                        addButton.replaceWith(createRemoveButton());
                    }
                }
                updateSubmitButtonState();
            }
            if(e.target.classList.contains('remove-author')) {
                e.target.closest('.author-entry').remove();
                if (authorsContainer.children.length === 1) {
                    const soleAuthorEntry = authorsContainer.querySelector('.author-entry');
                    const removeButton = soleAuthorEntry.querySelector('.remove-author');
                    if (removeButton) {
                        removeButton.replaceWith(createAddButton());
                    }
                } else if (authorsContainer.children.length === 0) {
                    const initialAuthorInput = createAuthorInput();
                    authorsContainer.appendChild(initialAuthorInput);
                    const removeBtn = initialAuthorInput.querySelector('.remove-author');
                    if (removeBtn) removeBtn.replaceWith(createAddButton());
                }
                updateSubmitButtonState();
            }
        });

        // --- Cover Image Upload Logic ---
        coverImageUploadArea.addEventListener('click', () => coverImageInputFile.click());

        coverImageInputFile.addEventListener('change', async () => {
            const file = coverImageInputFile.files[0];
            if (!file) {
                uploadedImageUrlInput.value = '';
                coverImagePreviewContainer.classList.add('hidden');
                uploadedImageDisplay.src = '';
                imageUrlDisplay.textContent = '';
                hideImageUploadMessage();
                updateSubmitButtonState();
                return;
            }

            const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedImageTypes.includes(file.type)) {
                showImageUploadMessage('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF, WEBP) เท่านั้น', 'error');
                coverImageInputFile.value = '';
                uploadedImageUrlInput.value = '';
                coverImagePreviewContainer.classList.add('hidden');
                uploadedImageDisplay.src = '';
                imageUrlDisplay.textContent = '';
                updateSubmitButtonState();
                return;
            }

            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                showImageUploadMessage('ขนาดรูปภาพต้องไม่เกิน 100MB', 'error');
                coverImageInputFile.value = '';
                coverImagePreviewContainer.classList.add('hidden');
                uploadedImageUrlInput.value = '';
                uploadedImageDisplay.src = '';
                imageUrlDisplay.textContent = '';
                updateSubmitButtonState();
                return;
            }

            showImageUploadMessage('กำลังอัปโหลดรูปภาพปก...', 'info');
            document.getElementById('submit-btn').disabled = true;
            coverImageInputFile.disabled = true;
            uploadedImageUrlInput.value = '';
            coverImagePreviewContainer.classList.add('hidden');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_IMAGE_UPLOAD_PRESET);
            formData.append('resource_type', 'image'); 

            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();

                if (data.secure_url) {
                    uploadedImageDisplay.src = data.secure_url;
                    imageUrlDisplay.textContent = data.secure_url;
                    uploadedImageUrlInput.value = data.secure_url;
                    coverImagePreviewContainer.classList.remove('hidden');
                    showImageUploadMessage('อัปโหลดรูปภาพปกสำเร็จ!', 'success');
                } else {
                    showImageUploadMessage(`อัปโหลดรูปภาพปกไม่สำเร็จ: ${data.error ? data.error.message : 'ไม่ทราบข้อผิดพลาด'}`, 'error');
                    coverImagePreviewContainer.classList.add('hidden');
                }
            } catch (error) {
                console.error('Cloudinary image upload error:', error);
                showImageUploadMessage('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพปก', 'error');
                coverImagePreviewContainer.classList.add('hidden');
            } finally {
                coverImageInputFile.disabled = false;
                updateSubmitButtonState();
            }
        });

        // Drag and Drop for Cover Image
        coverImageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            coverImageUploadArea.style.borderColor = '#3b82f6';
        });
        coverImageUploadArea.addEventListener('dragleave', () => {
            coverImageUploadArea.style.borderColor = '#a1a1aa';
        });
        coverImageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            coverImageUploadArea.style.borderColor = '#a1a1aa';
            const file = e.dataTransfer.files[0];
            if (file) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                coverImageInputFile.files = dataTransfer.files;
                coverImageInputFile.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        removeCoverImageButton.addEventListener('click', () => {
            uploadedImageUrlInput.value = '';
            coverImageInputFile.value = '';
            uploadedImageDisplay.src = '';
            imageUrlDisplay.textContent = '';
            coverImagePreviewContainer.classList.add('hidden');
            hideImageUploadMessage();
            updateSubmitButtonState();
        });

        // --- Research File Upload Logic ---
        researchFilesUploadArea.addEventListener('click', () => researchFileInput.click());

        researchFileInput.addEventListener('change', async () => {
            researchFileListDiv.innerHTML = '';
            uploadedResearchFilesUrlInput.value = '';
            const uploadedFileUrls = [];

            if (researchFileInput.files.length === 0) {
                showFileUploadMessage('กรุณาเลือกไฟล์สำหรับอัปโหลด', 'info');
                updateSubmitButtonState();
                return;
            }

            const allowedFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            for (const file of researchFileInput.files) {
                if (!allowedFileTypes.includes(file.type)) {
                    showFileUploadMessage(`ไฟล์ "${file.name}" ไม่ใช่ PDF หรือ DOCX กรุณาเลือกไฟล์ใหม่`, 'error');
                    researchFileInput.value = '';
                    researchFileListDiv.innerHTML = '';
                    updateSubmitButtonState();
                    return;
                }
                if (file.size > 100 * 1024 * 1024) { // 100MB limit
                    showFileUploadMessage(`ไฟล์ "${file.name}" มีขนาดเกิน 100MB กรุณาเลือกไฟล์ใหม่`, 'error');
                    researchFileInput.value = '';
                    researchFileListDiv.innerHTML = '';
                    updateSubmitButtonState();
                    return;
                }
            }

            pendingFileUploads = researchFileInput.files.length;
            showFileUploadMessage(`กำลังอัปโหลดไฟล์ผลงานวิจัย ${pendingFileUploads} ไฟล์...`, 'info');
            document.getElementById('submit-btn').disabled = true;
            researchFileInput.disabled = true;

            for (const file of researchFileInput.files) {
                const fileDiv = document.createElement('div');
                fileDiv.id = `file-status-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
                fileDiv.textContent = `⏳ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) - กำลังอัปโหลด...`;
                fileDiv.className = 'text-gray-700';
                researchFileListDiv.appendChild(fileDiv);

                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_FILE_UPLOAD_PRESET);
                formData.append('resource_type', 'raw'); 

                try {
                    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await response.json();

                    if (data.secure_url) {
                        uploadedFileUrls.push(data.secure_url);
                        fileDiv.textContent = `✅ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) - อัปโหลดสำเร็จ`;
                        fileDiv.classList.remove('text-gray-700');
                        fileDiv.classList.add('text-green-700');
                    } else {
                        fileDiv.textContent = `❌ ${file.name} - อัปโหลดไม่สำเร็จ: ${data.error ? data.error.message : 'ไม่ทราบข้อผิดพลาด'}`;
                        fileDiv.classList.remove('text-gray-700');
                        fileDiv.classList.add('text-red-700');
                        showFileUploadMessage('มีบางไฟล์อัปโหลดไม่สำเร็จ', 'error');
                    }
                } catch (error) {
                    console.error('Cloudinary file upload error:', error);
                    fileDiv.textContent = `❌ ${file.name} - เกิดข้อผิดพลาดในการอัปโหลดไฟล์`;
                    fileDiv.classList.remove('text-gray-700');
                    fileDiv.classList.add('text-red-700');
                    showFileUploadMessage('เกิดข้อผิดพลาดในการอัปโหลดไฟล์', 'error');
                } finally {
                    pendingFileUploads--;
                    if (pendingFileUploads === 0) {
                        uploadedResearchFilesUrlInput.value = JSON.stringify(uploadedFileUrls);
                        if (uploadedFileUrls.length === researchFileInput.files.length) {
                            showFileUploadMessage(`อัปโหลดไฟล์ผลงานวิจัย ${uploadedFileUrls.length} ไฟล์สำเร็จ!`, 'success');
                        } else if (uploadedFileUrls.length > 0) {
                            showFileUploadMessage(`อัปโหลดไฟล์บางส่วนสำเร็จ (${uploadedFileUrls.length}/${researchFileInput.files.length} ไฟล์)`, 'info');
                        } else {
                            showFileUploadMessage('ไม่มีไฟล์ใดอัปโหลดสำเร็จ', 'error');
                        }
                        researchFileInput.disabled = false;
                        updateSubmitButtonState();
                    }
                }
            }
        });

        // Drag and Drop for Research Files
        researchFilesUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            researchFilesUploadArea.style.borderColor = '#3b82f6';
        });
        researchFilesUploadArea.addEventListener('dragleave', () => {
            researchFilesUploadArea.style.borderColor = '#a1a1aa';
        });
        researchFilesUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            researchFilesUploadArea.style.borderColor = '#a1a1aa';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const dataTransfer = new DataTransfer();
                for (let i = 0; i < files.length; i++) {
                    dataTransfer.items.add(files[i]);
                }
                researchFileInput.files = dataTransfer.files;
                researchFileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Add event listeners to all relevant form inputs to update button state
        document.querySelectorAll('#research-form input:not([type="file"]), #research-form select, #research-form textarea').forEach(input => {
            input.addEventListener('input', updateSubmitButtonState);
            input.addEventListener('change', updateSubmitButtonState);
        });
        authorsContainer.addEventListener('input', updateSubmitButtonState);

        // Cancel button functionality
        document.getElementById('cancel-btn').addEventListener('click', () => {
            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50';
            dialog.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
                    <p class="text-lg font-semibold mb-4">ต้องการยกเลิกและล้างข้อมูลทั้งหมดหรือไม่?</p>
                    <div class="flex justify-center space-x-4">
                        <button id="confirmCancelBtn" class="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition">ยืนยัน</button>
                        <button id="cancelCancelBtn" class="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-400 transition">ยกเลิก</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);

            document.getElementById('confirmCancelBtn').onclick = () => {
                document.body.removeChild(dialog);
                document.getElementById('research-form').reset();
                categoryItems.forEach(i => i.classList.remove('selected'));
                selectedCategoryInput.value = '';

                authorsContainer.innerHTML = '';
                const initialAuthorInput = createAuthorInput();
                authorsContainer.appendChild(initialAuthorInput);
                const removeBtn = initialAuthorInput.querySelector('.remove-author');
                if (removeBtn) removeBtn.replaceWith(createAddButton());

                uploadedImageUrlInput.value = '';
                coverImagePreviewContainer.classList.add('hidden');
                uploadedImageDisplay.src = '';
                imageUrlDisplay.textContent = '';
                coverImageInputFile.value = '';

                uploadedResearchFilesUrlInput.value = '';
                researchFileListDiv.innerHTML = '';
                researchFileInput.value = '';

                hideFormMessage();
                hideImageUploadMessage();
                hideFileUploadMessage();
                pendingFileUploads = 0;
                updateSubmitButtonState();
            };
            document.getElementById('cancelCancelBtn').onclick = () => {
                document.body.removeChild(dialog);
            };
        });

        // Main form submission handler
        document.getElementById('research-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('title') ? document.getElementById('title').value.trim() : '';
            const category = selectedCategoryInput ? selectedCategoryInput.value.trim() : '';
            const department = document.getElementById('department') ? document.getElementById('department').value.trim() : '';
            const field = document.getElementById('field') ? document.getElementById('field').value.trim() : '';
            const year = document.getElementById('year') ? document.getElementById('year').value.trim() : '';
            const academicYear = document.getElementById('academic-year') ? document.getElementById('academic-year').value.trim() : '';
            const advisor = document.getElementById('advisor') ? document.getElementById('advisor').value.trim() : '';
            const abstract = document.getElementById('abstract') ? document.getElementById('abstract').value.trim() : '';

            if (!title || !category || !department || !year || !academicYear || !advisor || !abstract) {
                showFormMessage('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องที่มีเครื่องหมาย *', 'error');
                updateSubmitButtonState();
                return;
            }

            const authorsInputs = document.querySelectorAll('input[name="authors[]"]');
            let allAuthorsFilled = true;
            const authorsList = [];
            authorsInputs.forEach(input => {
                const authorName = input.value.trim();
                if (authorName === '') {
                    allAuthorsFilled = false;
                } else {
                    authorsList.push(authorName);
                }
            });
            if (!allAuthorsFilled || authorsList.length === 0) {
                showFormMessage('กรุณากรอกชื่อผู้จัดทำให้ครบถ้วนอย่างน้อยหนึ่งคน', 'error');
                updateSubmitButtonState();
                return;
            }

            if (!uploadedImageUrlInput || !uploadedImageUrlInput.value) {
                showFormMessage('กรุณาอัปโหลดรูปภาพปกผลงานวิจัย', 'error');
                updateSubmitButtonState();
                return;
            }

            let researchFileUrls = [];
            try {
                researchFileUrls = JSON.parse(uploadedResearchFilesUrlInput.value || '[]');
            } catch (e) {
                showFormMessage('ข้อมูล URL ไฟล์ผลงานวิจัยไม่ถูกต้อง (โปรดลองอัปโหลดไฟล์งานวิจัยอีกครั้ง)', 'error');
                updateSubmitButtonState();
                return;
            }
            if (researchFileUrls.length === 0) {
                showFormMessage('กรุณาอัปโหลดไฟล์ผลงานวิจัย', 'error');
                updateSubmitButtonState();
                return;
            }
            if (pendingFileUploads > 0) {
                showFormMessage('กำลังอัปโหลดไฟล์บางส่วน กรุณารอสักครู่ให้การอัปโหลดไฟล์เสร็จสิ้น', 'info');
                updateSubmitButtonState();
                return;
            }

            showFormMessage('กำลังส่งข้อมูล... กรุณารอสักครู่', 'info');
            document.getElementById('submit-btn').disabled = true;

            let loggedInUser = null;
            try {
                loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
            } catch (e) {
                console.error("Error parsing loggedInUser from localStorage", e);
            }
            const submittedByUsername = loggedInUser && loggedInUser.username ? loggedInUser.username : 'Anonymous';

            const formData = new FormData();
            formData.append('action', 'submitResearch');
            formData.append('id', `res-${Date.now()}-${Math.floor(Math.random() * 1000000)}`);
            formData.append('title', title);
            formData.append('category', category);
            formData.append('department', department);
            
            formData.append('field', field);
            formData.append('year', year);
            formData.append('academicYear', academicYear);
            formData.append('authors', authorsList.join(', '));
            formData.append('advisor', advisor);
            formData.append('abstract', abstract);
            formData.append('coverImageUrl', uploadedImageUrlInput.value);
            formData.append('researchFileUrls', JSON.stringify(researchFileUrls));
            formData.append('timestamp', new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }));
            formData.append('submittedBy', submittedByUsername);
            formData.append('status', 'Pending');

            try {
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (result.status === 'success') {
                    showFormMessage('ส่งข้อมูลผลงานวิจัยสำเร็จแล้ว! ข้อมูลจะถูกตรวจสอบและอนุมัติโดยผู้ดูแลระบบ', 'success');
                    document.getElementById('research-form').reset();
                    categoryItems.forEach(i => i.classList.remove('selected'));
                    selectedCategoryInput.value = '';

                    authorsContainer.innerHTML = '';
                    const initialAuthorInput = createAuthorInput();
                    authorsContainer.appendChild(initialAuthorInput);
                    const removeBtn = initialAuthorInput.querySelector('.remove-author');
                    if (removeBtn) removeBtn.replaceWith(createAddButton());

                    uploadedImageUrlInput.value = '';
                    coverImagePreviewContainer.classList.add('hidden');
                    uploadedImageDisplay.src = '';
                    imageUrlDisplay.textContent = '';
                    coverImageInputFile.value = '';

                    uploadedResearchFilesUrlInput.value = '';
                    researchFileListDiv.innerHTML = '';
                    researchFileInput.value = '';

                    hideImageUploadMessage();
                    hideFileUploadMessage();
                    pendingFileUploads = 0;
                } else {
                    showFormMessage(`เกิดข้อผิดพลาด: ${result.message || 'ไม่สามารถส่งข้อมูลได้'}`, 'error');
                }
            } catch (error) {
                console.error('Error submitting research to Google Apps Script:', error);
                // แก้ไขบรรทัดนี้ให้แสดงข้อความผิดพลาดที่ถูกต้อง
                showFormMessage('เกิดข้อผิดพลาดในการส่งข้อมูล', 'error');
            } finally {
                document.getElementById('submit-btn').disabled = false;
                updateSubmitButtonState();
                setTimeout(() => {
                    hideFormMessage();
                }, 7000);    
            }
        });

        // Initialize state on page load
        if (authorsContainer.children.length === 0) {
            const initialAuthorInput = createAuthorInput();
            authorsContainer.appendChild(initialAuthorInput);
            const removeBtn = initialAuthorInput.querySelector('.remove-author');
            if (removeBtn) removeBtn.replaceWith(createAddButton());
        } else {
            const firstAuthorEntry = authorsContainer.children[0];
            const existingButton = firstAuthorEntry.querySelector('button');
            if (existingButton && existingButton.classList.contains('remove-author')) {
                if (authorsContainer.children.length === 1) {
                    existingButton.replaceWith(createAddButton());
                }
            } else if (existingButton && existingButton.classList.contains('add-author')) {
                if (authorsContainer.children.length > 1) {
                   existingButton.replaceWith(createRemoveButton());
                }
            }
        }
        updateSubmitButtonState();
    });

    // แก้ไขฟังก์ชัน selectCategory เพื่อป้องกันข้อผิดพลาดเมื่อไม่มีคลาสสี
    function selectCategory(selectedEl) {
        const categoryItems = document.querySelectorAll('.category-item');
        const hiddenInput = document.getElementById('selected-category');

        const allColorClasses = [
            'bg-green-200', 'border-green-500', 'text-green-700',
            'bg-red-200', 'border-red-500', 'text-red-700',
            'bg-orange-200', 'border-orange-500', 'text-orange-700',
            'bg-yellow-200', 'border-yellow-500', 'text-yellow-700'
        ];

        categoryItems.forEach(item => {
            allColorClasses.forEach(cls => item.classList.remove(cls));
        });

        const category = selectedEl.getAttribute('data-category');
        let colorClasses = '';

        switch (category) {
            case 'สำรวจ':
                colorClasses = 'bg-green-200 border-green-500 text-green-700';
                break;
            case 'ทฤษฎี':
                colorClasses = 'bg-red-200 border-red-500 text-red-700';
                break;
            case 'ทดลอง':
                colorClasses = 'bg-orange-200 border-orange-500 text-orange-700';
                break;
            case 'ประดิษฐ์':
                colorClasses = 'bg-yellow-200 border-yellow-500 text-yellow-700';
                break;
        }

        // เพิ่มเงื่อนไข if เพื่อป้องกันการเรียกใช้ add() ด้วยค่าว่างเปล่า
        if (colorClasses) {
            selectedEl.classList.add(...colorClasses.split(' '));
        }

        hiddenInput.value = category;
    }

