// Admin Logic

// Initial Data Loading
let categories = [];
let products = [];

// Product Filters & Pagination state
let prodSearchQuery = "";
let prodFilterCategory = "";
let prodFilterPostBy = "";
let prodCurrentPage = 1;
const prodPageSize = 15;
let banners = [];
let deals = [];
let blogs = [];
let travelPackages = [];
let users = [];
let editIndex = -1; // State to track editing
let userEditIndex = -1; // State to track user editing
let dealEditIndex = -1; // State to track deal editing
let broadcasts = [];
let broadcastEditIndex = -1;

function hasPublishPermission(cUser, section) {
    if (!cUser || !cUser.userId) return false;
    if (String(cUser.userId).toLowerCase() === 'admin') return true;
    
    let perms = cUser.permissions;
    let loopCount = 0;
    while (typeof perms === 'string' && loopCount < 3) {
        try { perms = JSON.parse(perms); } catch(e) { break; }
        loopCount++;
    }
    if (perms && typeof perms === 'object' && !Array.isArray(perms)) {
        const sectionRights = perms[section] || [];
        return sectionRights.includes('Publish');
    }
    return false;
}

// DOM Elements
const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
const totalProductsEl = document.getElementById('totalProducts');
const totalCategoriesEl = document.getElementById('totalCategories');
const totalCompaniesEl = document.getElementById('totalCompanies');
const fieldsContainer = document.getElementById('fieldsContainer');
const btnSaveCategory = document.getElementById('btnSaveCategory');
const btnCancelCategory = document.getElementById('btnCancelCategory');

// Banner DOM
let bannerEditIndex = -1;
const bannerForm = document.getElementById('bannerForm');
const bannerList = document.getElementById('bannerList');
const bannerImageInput = document.getElementById('bannerImage');
const bannerPreview = document.getElementById('bannerPreview');

// --- Initialization ---

async function initAdmin() {
    try {
        const [categoriesRes, productsRes, bannersRes, dealsRes, usersRes, blogsRes, travelRes, broadcastsRes] = await Promise.all([
            DataService.getCategories(),
            DataService.getProducts(),
            DataService.getBanners(),
            DataService.getDeals(),
            DataService.getUsers(),
            DataService.getBlogs(),
            DataService.getTravelPackages(),
            DataService.getBroadcasts()
        ]);

        categories = categoriesRes || [];
        products = productsRes || [];
        banners = bannersRes || [];
        deals = dealsRes || [];
        users = usersRes || [];
        blogs = blogsRes || [];
        travelPackages = travelRes || [];
        broadcasts = broadcastsRes || [];

        // Track Login and Active Days for currently logged-in user
        try {
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                const userIndex = users.findIndex(u => String(u.userId || '').toLowerCase() === String(currentUser.userId || '').toLowerCase());
                if (userIndex !== -1) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const liveUser = users[userIndex];
                    
                    liveUser.lastLogin = new Date().toISOString();
                    
                    let daysList = liveUser.activeDaysList || [];
                    if (typeof daysList === 'string') {
                        try { daysList = JSON.parse(daysList); } catch(e) { daysList = []; }
                    }
                    if (!Array.isArray(daysList)) {
                        daysList = [];
                    }
                    if (!daysList.includes(todayStr)) {
                        daysList.push(todayStr);
                    }
                    liveUser.activeDaysList = daysList;
                    liveUser.activeDays = daysList.length;
                    
                    currentUser.lastLogin = liveUser.lastLogin;
                    currentUser.activeDays = liveUser.activeDays;
                    currentUser.activeDaysList = liveUser.activeDaysList;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Call saveUsers asynchronously so it doesn't block the UI rendering
                    DataService.saveUsers(users).catch(err => console.error("Failed to async save users:", err));
                }
            }
        } catch (err) {
            console.error("Error tracking user login metrics:", err);
        }

        updateUI();
        renderBanners();
        renderDeals();
        renderUsers();
        if (typeof renderBlogs === "function") renderBlogs(); else window.renderBlogs();
        renderTravelPackages(); // New function for travel
        renderBroadcasts();
        renderAdminProducts(); // New function for products
        populateCategoryDropdown(); // New function for form
        populateCategoryAssignGrid(); // Populate categories assign grid
        
        enforceUserPermissions(); // Apply user rights to sidebar
        updatePendingApprovalsBadge(); // Update badges
        if (typeof populateAdminHeader === 'function') populateAdminHeader();

        if (typeof updateAdminAlerts === 'function') updateAdminAlerts();

        // Prevent auto-adding dummy field since we want it completely empty at start
        // if (fieldsContainer && fieldsContainer.children.length === 0) {
        //     window.addField();
        // }

        updateBannerPreview();
    } catch (error) {
        console.error("Failed to load admin data:", error);
        // alert("Failed to load data. Please try refreshing."); // Suppressed for local testing without GAS
    }
}

// Handler for background loaded cache data
window.onBackgroundDataLoaded = function(type, data) {
    console.log(`Background data loaded: ${type}`, data);
    if (type === 'users') {
        users = data || [];
        renderUsers();
        populateCategoryDropdown();
        populateCategoryAssignDropdown();
        enforceUserPermissions();
    } else if (type === 'categories') {
        categories = data || [];
        updateUI();
        populateCategoryDropdown();
        populateCategoryAssignGrid();
    } else if (type === 'products') {
        products = data || [];
        renderAdminProducts();
        updateUI();
    } else if (type === 'deals') {
        deals = data || [];
        renderDeals();
    } else if (type === 'travelPackages') {
        travelPackages = data || [];
        renderTravelPackages();
    } else if (type === 'broadcasts') {
        broadcasts = data || [];
        renderBroadcasts();
    } else if (type === 'banners') {
        banners = data || [];
        renderBanners();
    }
};

// --- Categories Functions ---

async function saveCategories() {
    await DataService.saveCategories(categories);
    updateUI();
}

function updateUI() {
    // Update Stats
    if (totalCategoriesEl) totalCategoriesEl.textContent = categories.length;
    if (totalProductsEl) totalProductsEl.textContent = products.length;

    populateCategoryDropdown(); // Keep product dropdowns in sync
    populateCategoryAssignGrid(); // Keep assignment grid in sync

    // Render Categories
    if (categoryList) {
        categoryList.innerHTML = categories.map((cat, index) => {
            const fields = cat.fields || [];
            const fieldBadges = fields.map(f => `<span class="badge">${f.name} <small>(${f.type})</small></span>`).join(' ');
            const isChecked = cat.showOnMainPage !== false ? 'checked' : '';
            return `
            <tr>
                <td>
                    ${cat.name}
                    ${cat.subCategory ? `<br><small style="color: #64748b;">${cat.subCategory}</small>` : ''}
                </td>
                <td><div class="field-badges">${fieldBadges}</div></td>
                <td>
                    <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                        <input type="checkbox" ${isChecked} onchange="toggleCategoryVisibility(${index}, this.checked)" style="width: auto; margin:0;"> Show
                    </label>
                </td>
                <td>
                    <button class="edit-btn" onclick="editCategory(${index})"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" onclick="deleteCategory(${index})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `}).join('');
    }
}

async function deleteCategory(index) {
    if (confirm('Are you sure you want to delete this category?')) {
        categories.splice(index, 1);
        await saveCategories();
    }
}

window.toggleCategoryVisibility = async (index, isVisible) => {
    categories[index].showOnMainPage = isVisible;
    await saveCategories();
};

window.editCategory = (index) => {
    editIndex = index;
    const cat = categories[index];

    // Populate Form
    document.getElementById('catName').value = cat.name;
    const subCatInput = document.getElementById('catSubCategory');
    if (subCatInput) subCatInput.value = cat.subCategory || '';

    // Populate Fields
    fieldsContainer.innerHTML = '';
    const fields = cat.fields || [];
    fields.forEach(field => {
        window.addField(field.name, field.type);
    });

    // Update Button Text
    if (btnSaveCategory) btnSaveCategory.textContent = "Update Category";
    if (btnCancelCategory) btnCancelCategory.style.display = "inline-block";

    // Scroll to form
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
};

window.cancelCategoryEdit = () => {
    editIndex = -1;
    if (categoryForm) categoryForm.reset();
    const subCatInput = document.getElementById('catSubCategory');
    if (subCatInput) subCatInput.value = '';
    if (fieldsContainer) fieldsContainer.innerHTML = '';
    if (btnSaveCategory) btnSaveCategory.textContent = "Add Category";
    if (btnCancelCategory) btnCancelCategory.style.display = "none";
};

// Dynamic Fields Logic
window.addField = (name = '', type = 'text') => {
    const div = document.createElement('div');
    div.className = 'field-row';
    div.innerHTML = `
        <input type="text" placeholder="Field Name" class="field-name" value="${name}" required>
        <select class="field-type">
            <option value="text" ${type === 'text' ? 'selected' : ''}>Text</option>
            <option value="number" ${type === 'number' ? 'selected' : ''}>Number</option>
            <option value="select" ${type === 'select' ? 'selected' : ''}>Dropdown</option>
        </select>
        <button type="button" class="remove-btn" onclick="removeField(this)">-</button>
    `;
    fieldsContainer.appendChild(div);
};

window.removeField = (btn) => {
    btn.parentElement.remove();
};

// Event Listeners: Category
if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('catName').value;
        const subCatInput = document.getElementById('catSubCategory');
        const subCategory = subCatInput ? subCatInput.value : '';

        // Harvest fields
        const fieldRows = document.querySelectorAll('.field-row');
        const fields = Array.from(fieldRows).map(row => ({
            name: row.querySelector('.field-name').value,
            type: row.querySelector('.field-type').value
        })).filter(f => f.name.trim() !== "");

        const cUserStr = localStorage.getItem('currentUser');
        const cUser = cUserStr ? JSON.parse(cUserStr) : {};
        const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

        if (editIndex === -1) {
            // Create
            categories.push({ name, subCategory, fields, showOnMainPage: true, addedBy: userName, date: new Date().toISOString() });
        } else {
            // Update
            categories[editIndex].name = name;
            categories[editIndex].subCategory = subCategory;
            categories[editIndex].fields = fields;
            if (!categories[editIndex].addedBy) {
                categories[editIndex].addedBy = userName;
            }
            if (!categories[editIndex].date) {
                categories[editIndex].date = new Date().toISOString();
            }
            // Kept showOnMainPage as it was
            cancelCategoryEdit();
        }

        await saveCategories();

        if (editIndex === -1) {
            categoryForm.reset();
            fieldsContainer.innerHTML = ''; // Clear fields
        }
    });
}

// --- Banner Functions ---

async function saveBanners() {
    await DataService.saveBanners(banners);
    renderBanners();
    if (typeof updatePendingApprovalsBadge === 'function') updatePendingApprovalsBadge();
}

function renderBanners() {
    if (!bannerList) return;
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

    bannerList.innerHTML = banners.map((banner, index) => {
        let displayType = banner.type;
        let displayLink = banner.link;

        // Unpack if backend dropped the type field
        if (displayLink && typeof displayLink === 'string' && displayLink.includes('|')) {
            const parts = displayLink.split('|');
            if (parts[0] === 'vertical' || parts[0] === 'horizontal') {
                displayType = parts[0];
                displayLink = parts.slice(1).join('|');
            }
        }

        const canEdit = isSuperAdmin || banner.addedBy === userName;
        let actionButtons = '';
        if (canEdit) {
            let approvalBtn = '';
            if (isSuperAdmin) {
                const isDraft = banner.status === 'Draft';
                const color = isDraft ? '#e74c3c' : '#2ecc71';
                const title = isDraft ? 'Approve (Draft)' : 'Approved (Publish)';
                approvalBtn = `<button onclick="toggleApproval('banners', ${index})" style="background: ${color}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;" title="${title}"><i class="fa-solid fa-check-circle"></i></button>`;
            }
            actionButtons = `
                ${approvalBtn}
                <button class="edit-btn" onclick="editBanner(${index})"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="delete-btn" onclick="deleteBanner(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
            `;
        } else {
            actionButtons = `<span style="font-size:12px;color:#888;">View Only</span>`;
        }

        return `
        <div class="banner-item">
            <div style="margin-bottom: 5px;">
                <span class="badge" style="background:#0ea5e9; color:white; border-color:#0ea5e9;">${displayType === 'vertical' ? 'Vertical Banner' : 'Horizontal Banner'}</span>
            </div>
            <img src="${banner.image}" alt="Banner" style="${displayType === 'vertical' ? 'object-fit: contain; max-height: 150px;' : ''}">
            ${displayLink ? `<a href="${displayLink}" target="_blank" class="banner-link"><i class="fa-solid fa-link"></i> ${displayLink}</a>` : ''}
            <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
                ${actionButtons}
            </div>
        </div>
        `;
    }).join('');
}

async function deleteBanner(index) {
    if (confirm('Delete this banner?')) {
        banners.splice(index, 1);
        await saveBanners();
    }
}

window.editBanner = (index) => {
    bannerEditIndex = index;
    const banner = banners[index];

    let displayType = banner.type;
    let displayLink = banner.link;
    if (displayLink && typeof displayLink === 'string' && displayLink.includes('|')) {
        const parts = displayLink.split('|');
        if (parts[0] === 'vertical' || parts[0] === 'horizontal') {
            displayType = parts[0];
            displayLink = parts.slice(1).join('|');
        }
    }

    document.getElementById('bannerImage').value = banner.image || '';
    if (document.getElementById('bannerLink')) document.getElementById('bannerLink').value = displayLink || '';
    if (document.getElementById('bannerType')) document.getElementById('bannerType').value = displayType || 'horizontal';

    const btnSaveBanner = document.getElementById('btnSaveBanner');
    if (btnSaveBanner) btnSaveBanner.textContent = "Update Banner";
    const btnCancelBanner = document.getElementById('btnCancelBanner');
    if (btnCancelBanner) btnCancelBanner.style.display = "inline-block";

    updateBannerPreview();
    document.querySelector('#banners .form-container').scrollIntoView({ behavior: 'smooth' });
};

window.cancelBannerEdit = () => {
    bannerEditIndex = -1;
    if (bannerForm) bannerForm.reset();
    document.getElementById('bannerImage').value = '';
    if (document.getElementById('bannerImageUpload')) document.getElementById('bannerImageUpload').value = '';

    const btnSaveBanner = document.getElementById('btnSaveBanner');
    if (btnSaveBanner) btnSaveBanner.textContent = "Add Banner";
    const btnCancelBanner = document.getElementById('btnCancelBanner');
    if (btnCancelBanner) btnCancelBanner.style.display = "none";

    updateBannerPreview();
};

function updateBannerPreview() {
    if (!bannerImageInput || !bannerPreview) return;
    const url = bannerImageInput.value;
    if (url) {
        bannerPreview.innerHTML = `<img src="${url}" alt="Preview" style="max-width: 100%; border-radius: 10px;">`;
    } else {
        bannerPreview.innerHTML = `<p>Image preview will appear here</p>`;
    }
}

if (bannerImageInput) {
    bannerImageInput.addEventListener('input', updateBannerPreview);
}

const bannerImageUpload = document.getElementById('bannerImageUpload');
if (bannerImageUpload) {
    bannerImageUpload.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            document.getElementById('bannerImage').value = '/images/banner/' + file.name;
            const reader = new FileReader();
            reader.onload = function (e) {
                const bannerPreview = document.getElementById('bannerPreview');
                if (bannerPreview) {
                    bannerPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 10px;">`;
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

if (bannerForm) {
    bannerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const image = document.getElementById('bannerImage').value;
        const rawLink = document.getElementById('bannerLink').value;
        const type = document.getElementById('bannerType') ? document.getElementById('bannerType').value : 'horizontal';

        const img = new Image();

        const fileInput = document.getElementById('bannerImageUpload');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            img.src = URL.createObjectURL(fileInput.files[0]);
        } else {
            img.src = image;
        }

        img.onload = async function () {
            if (type === "horizontal") {
                if (img.width !== 720 || img.height !== 120) {
                    alert("Recommended size: 720x120");
                    return;
                }
            }

            const cUserStr = localStorage.getItem('currentUser');
            const cUser = cUserStr ? JSON.parse(cUserStr) : {};
            const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

            // Workaround: Backend might drop the 'type' field, so we pack it into the 'link' field
            const link = `${type}|${rawLink}`;
            let bannerStatus = document.getElementById('bannerStatus') ? document.getElementById('bannerStatus').value : 'Publish';
            if (!hasPublishPermission(cUser, 'banners')) {
                bannerStatus = 'Draft';
            }

            if (bannerEditIndex === -1) {
                banners.push({ 
                    id: Date.now(),
                    image, 
                    link, 
                    type, 
                    addedBy: userName, 
                    status: bannerStatus,
                    createdDate: new Date().toISOString(),
                    updatedDate: new Date().toISOString()
                });
            } else {
                banners[bannerEditIndex] = { 
                    id: banners[bannerEditIndex].id || Date.now(),
                    image, 
                    link, 
                    type, 
                    addedBy: banners[bannerEditIndex].addedBy || userName, 
                    status: bannerStatus,
                    createdDate: banners[bannerEditIndex].createdDate || new Date().toISOString(),
                    updatedDate: new Date().toISOString()
                };
                cancelBannerEdit();
            }

            await saveBanners();
            if (bannerEditIndex === -1) {
                bannerForm.reset();
                document.getElementById('bannerImage').value = '';
                if (document.getElementById('bannerImageUpload')) document.getElementById('bannerImageUpload').value = '';
            }
            updateBannerPreview();
        };

        img.onerror = function () {
            alert("Invalid image URL");
        };
    });
}

// --- Deals Functions ---
const dealForm = document.getElementById('dealForm');
const dealList = document.getElementById('dealList');
const dealFormTitle = document.getElementById('dealFormTitle');
const btnCancelDeal = document.getElementById('btnCancelDeal');
const btnSaveDeal = document.getElementById('btnSaveDeal');

async function saveDeals() {
    await DataService.saveDeals(deals);
    renderDeals();
    if (typeof updatePendingApprovalsBadge === 'function') updatePendingApprovalsBadge();
}

function renderDeals() {
    if (!dealList) return;
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

    dealList.innerHTML = deals.map((deal, index) => {
        const canEdit = isSuperAdmin || deal.addedBy === userName;
        let actionButtons = '';
        if (canEdit) {
            let approvalBtn = '';
            if (isSuperAdmin) {
                const isDraft = deal.status === 'Draft' || deal.dealStatus === 'Draft';
                const color = isDraft ? '#e74c3c' : '#2ecc71';
                const title = isDraft ? 'Approve (Draft)' : 'Approved (Publish)';
                approvalBtn = `<button onclick="toggleApproval('deals', ${index})" style="background: ${color}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;" title="${title}"><i class="fa-solid fa-check-circle"></i></button>`;
            }
            actionButtons = `
                ${approvalBtn}
                <button class="edit-btn" onclick="editDeal(${index})"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteDeal(${index})"><i class="fa-solid fa-trash"></i></button>
            `;
        } else {
            actionButtons = `<span style="font-size:12px;color:#888;">View Only</span>`;
        }

        return `
        <div class="product-row" style="grid-template-columns: 80px 1.2fr 100px 1fr 140px 120px; align-items: center;">
            <img src="${deal.image}" alt="${deal.name}">
            <div>${deal.name}</div>
            <div style="color: var(--primary-color)">Rs. ${deal.price}</div>
            <div><small><i class="fa-solid fa-location-dot"></i> ${deal.location}</small></div>
            <div style="display: flex; gap: 5px; align-items: center; white-space: nowrap;">
                ${actionButtons}
            </div>
            <div style="font-size: 0.85rem; color: #ffffff; font-weight: 600;">${deal.addedBy || 'Admin'}</div>
        </div>
        `;
    }).join('');
}

async function deleteDeal(index) {
    if (confirm('Delete this deal?')) {
        deals.splice(index, 1);
        await saveDeals();
    }
}

window.editDeal = (index) => {
    dealEditIndex = index;
    const deal = deals[index];

    const dCat = document.getElementById('dealCategory');
    if (dCat) {
        dCat.value = deal.category || '';
        dCat.dispatchEvent(new Event('change'));
        const dSub = document.getElementById('dealSubCategory');
        if (dSub) {
            dSub.value = deal.subCategory || '';
        }
    }

    document.getElementById('dealName').value = deal.name || '';
    document.getElementById('dealImage').value = deal.image || '';
    document.getElementById('dealDesc').value = deal.desc || '';
    document.getElementById('dealPrice').value = deal.price || '';
    document.getElementById('dealLocation').value = deal.location || '';
    document.getElementById('dealWhatsapp').value = deal.whatsapp || '';
    document.getElementById('dealVideo').value = deal.video || '';

    if (dealFormTitle) dealFormTitle.textContent = "Edit Deal";
    if (btnSaveDeal) btnSaveDeal.textContent = "Update Deal";
    if (btnCancelDeal) btnCancelDeal.style.display = 'inline-block';

    document.getElementById('deals').querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
};

window.cancelDealEdit = () => {
    dealEditIndex = -1;
    dealForm.reset();
    if (dealFormTitle) dealFormTitle.textContent = "Add New Deal";
    if (btnSaveDeal) btnSaveDeal.textContent = "Add Deal";
    if (btnCancelDeal) btnCancelDeal.style.display = 'none';
};

// ImgBB Upload Logic
const dealImageUpload = document.getElementById('dealImageUpload');
const dealImageInput = document.getElementById('dealImage');
const uploadStatus = document.getElementById('uploadStatus');

// Free temporary API Key for ImgBB. In a real production app this should be secured.
const IMGBB_API_KEY = '328874a9e722a65d5a57e520cf0d549c';

if (dealImageUpload) {
    dealImageUpload.addEventListener('change', async function () {
        const file = this.files[0];
        if (!file) return;

        uploadStatus.style.display = 'inline-block';
        uploadStatus.textContent = 'Uploading...';
        dealImageInput.disabled = true;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                dealImageInput.value = data.data.url;
                uploadStatus.textContent = 'Upload successful!';
                uploadStatus.style.color = '#2ecc71';
            } else {
                throw new Error(data.error.message);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            uploadStatus.textContent = 'Upload failed.';
            uploadStatus.style.color = '#e74c3c';
            alert('Failed to upload image: ' + error.message);
        } finally {
            dealImageInput.disabled = false;
            // Clear input so same file can be selected again
            this.value = '';
            setTimeout(() => { uploadStatus.style.display = 'none'; }, 3000);
        }
    });
}

// Product Image Upload Logic
const prodImageUpload = document.getElementById('prodImageUpload');
const prodImageInput = document.getElementById('prodImage');
const prodUploadStatus = document.getElementById('prodUploadStatus');

if (prodImageUpload) {
    prodImageUpload.addEventListener('change', async function () {
        const file = this.files[0];
        if (!file) return;

        prodUploadStatus.style.display = 'inline-block';
        prodUploadStatus.textContent = 'Uploading...';
        prodImageInput.disabled = true;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                prodImageInput.value = data.data.url;
                prodUploadStatus.textContent = 'Upload successful!';
                prodUploadStatus.style.color = '#2ecc71';
            } else {
                throw new Error(data.error.message);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            prodUploadStatus.textContent = 'Upload failed.';
            prodUploadStatus.style.color = '#e74c3c';
            alert('Failed to upload image: ' + error.message);
        } finally {
            prodImageInput.disabled = false;
            this.value = '';
            setTimeout(() => { prodUploadStatus.style.display = 'none'; }, 3000);
        }
    });
}

if (dealForm) {
    dealForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const existingDeal = dealEditIndex === -1 ? {} : deals[dealEditIndex];
        const cUserStr = localStorage.getItem('currentUser');
        const cUser = cUserStr ? JSON.parse(cUserStr) : {};
        const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

        const newDeal = {
            ...existingDeal,
            id: dealEditIndex === -1 ? Date.now() : existingDeal.id,
            category: document.getElementById('dealCategory') ? document.getElementById('dealCategory').value : (existingDeal.category || ''),
            subCategory: document.getElementById('dealSubCategory') ? document.getElementById('dealSubCategory').value : (existingDeal.subCategory || ''),
            name: document.getElementById('dealName').value,
            image: document.getElementById('dealImage').value,
            desc: document.getElementById('dealDesc').value,
            price: document.getElementById('dealPrice').value,
            location: document.getElementById('dealLocation').value,
            whatsapp: document.getElementById('dealWhatsapp').value,
            video: document.getElementById('dealVideo').value,
            status: document.getElementById('dealStatus').value,
            addedBy: dealEditIndex === -1 ? userName : (existingDeal.addedBy || userName),
            createdDate: dealEditIndex === -1 ? new Date().toISOString() : (existingDeal.createdDate || new Date().toISOString()),
            updatedDate: new Date().toISOString()
        };

        if (!hasPublishPermission(cUser, 'deals')) {
            newDeal.status = 'Draft';
        }

        if (dealEditIndex === -1) {
            deals.push(newDeal);
        } else {
            deals[dealEditIndex] = newDeal;
            cancelDealEdit();
        }

        await saveDeals();
        if (dealEditIndex === -1) dealForm.reset();
        alert('Deal saved successfully!');
    });
}

// --- Users Functions ---
const userForm = document.getElementById('userForm');
const userList = document.getElementById('userList');
const userFormTitle = document.getElementById('userFormTitle');
const btnCancelUser = document.getElementById('btnCancelUser');
const btnSaveUser = document.getElementById('btnSaveUser');

async function saveUsers() {
    // Ensure all users have a permissions property and assignedCategories is synced
    users.forEach(u => {
        let perms = u.permissions;
        let loopCount = 0;
        while (typeof perms === 'string' && loopCount < 3) {
            try { perms = JSON.parse(perms); } catch(e) { break; }
            loopCount++;
        }
        if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
            perms = {};
        }
        
        // Sync assignedCategories from permissions wrapper if present, otherwise set it
        if (perms.assignedCategories) {
            u.assignedCategories = perms.assignedCategories;
        } else if (u.assignedCategories) {
            perms.assignedCategories = u.assignedCategories;
        } else {
            u.assignedCategories = [];
            perms.assignedCategories = [];
        }
        
        // Sync charges into permissions object so it gets saved to Google Sheets
        if (u.charges !== undefined) {
            perms.charges = u.charges;
        } else if (perms.charges !== undefined) {
            u.charges = perms.charges;
        }
        
        u.permissions = perms;
    });
    
    // Safety check to prevent wiping the main admin account if it was missing from local storage
    const hasAdmin = users.some(u => String(u.userId).toLowerCase() === 'admin' && u.role === 'admin');
    if (!hasAdmin) {
        users.unshift({
            id: 'admin_1',
            userId: 'admin',
            password: 'admin123',
            fullName: 'Super Admin',
            role: 'admin',
            status: 'active',
            permissions: {},
            assignedCategories: []
        });
    }

    await DataService.saveUsers(users);
    renderUsers();
}

window.setUserStatus = async function(index, status) {
    if (users[index]) {
        users[index].status = status;
        await saveUsers();
    }
};

function renderUsers() {
    const regularList = document.getElementById('regularUserList');
    const systemList = document.getElementById('systemUserList');
    if (!regularList || !systemList) return;
    
    let regularHtml = '';
    let systemHtml = '';

    users.forEach((u, index) => {
        const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.fullName || 'User') + '&background=e2e8f0&color=475569';
        const isSuperAdmin = String(u.userId).toLowerCase() === 'admin';
        
        // Calculate total postings for this user across all sections
        const userName = u.username || u.fullName || u.userId || 'N/A';
        const uLower = userName.toLowerCase().trim();
        const fullNameLower = String(u.fullName || '').toLowerCase().trim();
        const userIdLower = String(u.userId || '').toLowerCase().trim();

        const userMatches = (item) => {
            const creator = String(item["Post By"] || item.postBy || item.addedBy || '').toLowerCase().trim();
            if (!creator) return false;
            return creator === uLower || creator === fullNameLower || creator === userIdLower;
        };

        const totalPosts = 
            (categories || []).filter(userMatches).length +
            (products || []).filter(userMatches).length +
            (deals || []).filter(userMatches).length +
            (banners || []).filter(userMatches).length +
            (blogs || []).filter(userMatches).length +
            (broadcasts || []).filter(userMatches).length +
            (travelPackages || []).filter(userMatches).length;
        
        if (isSuperAdmin) {
            systemHtml += `
            <tr>
                <td>
                    <img src="${u.pic || fallbackAvatar}" alt="Pic" class="avatar" onerror="this.src='${fallbackAvatar}'" style="border-color:#ef4444;">
                </td>
                <td>
                    <span style="font-weight:800; color:#ef4444;">SUPER ADMIN</span>
                </td>
                <td>
                    <span style="color: #64748b; font-weight: 600;">${u.fullName || 'admin'}</span>
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:4px; align-items: flex-start;">
                        <span style="font-size:12px; color:#475569;">${u.userId || 'admin'}</span>
                        <span style="font-size:10px; color:#94a3b8;">pwd: ${u.password || 'admin123'}</span>
                    </div>
                </td>
                <td>
                    <span class="status-pill active" style="border:none; background:rgba(16,185,129,0.1);">ACTIVE</span>
                </td>
                <td>
                    <span class="badge" style="background:#0ea5e9; color:white; font-weight:bold; cursor:pointer; font-size:11px;" onclick="showUserPerformanceStats('${userName}')">${totalPosts} Posts</span>
                </td>
                <td>
                    <div class="action-buttons-group">
                        <button class="action-btn purple" onclick="alert('Super Admin cannot be edited here.')" title="Edit User"><i class="fa-solid fa-id-card"></i></button>
                        <button class="action-btn blue" onclick="showUserPerformanceStats('${userName}')" title="Stats"><i class="fa-solid fa-chart-simple"></i></button>
                    </div>
                </td>
            </tr>
            `;
        } else {
            regularHtml += `
            <tr>
                <td>
                    <img src="${u.pic || fallbackAvatar}" alt="Pic" class="avatar" onerror="this.src='${fallbackAvatar}'">
                </td>
                <td>
                    <span style="font-weight:600; color:#0f172a;">${u.fullName || u.userName || u.name || u.username || 'N/A'}</span>
                </td>
                <td>
                    <span style="color: #64748b; font-size: 13px;">${u.role === 'company' && u.companyName ? u.companyName : (u.companyName || u.role || 'user').toUpperCase()}</span>
                </td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:4px; align-items: flex-start;">
                        <span style="font-size:12px; color:#475569;">${u.userId || u.id || u.username || 'N/A'}</span>
                        <span style="font-size:10px; color:#94a3b8;">${u.password ? 'pwd: ' + u.password : '****'}</span>
                    </div>
                </td>
                <td>
                    ${(() => {
                        const s = String(u.status || u.Status || 'active').toLowerCase();
                        const isActive = s === 'active' || s === 'approve' || s === 'approved' || s === 'publish';
                        return `<span class="status-pill ${isActive ? 'active' : 'pending'}">
                            ${isActive ? '<i class="fa-solid fa-check-circle"></i> ACTIVE' : '<i class="fa-solid fa-clock"></i> PENDING'}
                        </span>`;
                    })()}
                </td>
                <td>
                    <span class="badge" style="background:#0ea5e9; color:white; font-weight:bold; cursor:pointer; font-size:11px;" onclick="showUserPerformanceStats('${userName}')">${totalPosts} Posts</span>
                </td>
                <td>
                    <div class="action-buttons-group">
                        <button class="action-btn green" onclick="setUserStatus(${index}, 'active')" title="Activate"><i class="fa-solid fa-check"></i></button>
                        <button class="action-btn red" onclick="setUserStatus(${index}, 'hold')" title="Hold"><i class="fa-solid fa-lock"></i></button>
                        <button class="action-btn purple" onclick="editUser(${index})" title="Edit User"><i class="fa-solid fa-id-card"></i></button>
                        <button class="action-btn blue" onclick="showUserPerformanceStats('${userName}')" title="Stats"><i class="fa-solid fa-chart-simple"></i></button>
                        <button class="action-btn yellow" onclick="alert('Password reset coming soon!')" title="Reset Password"><i class="fa-solid fa-key"></i></button>
                        <button class="action-btn red" onclick="deleteUser(${index})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
            `;
        }
    });

    regularList.innerHTML = regularHtml;
    systemList.innerHTML = systemHtml;
    
    if (typeof populatePermissionDropdown === 'function') populatePermissionDropdown();
    if (typeof populateCategoryAssignDropdown === 'function') populateCategoryAssignDropdown();
}


window.toggleCompanyField = function() {
    const role = document.getElementById('userRole').value;
    const companyGroup = document.getElementById('companyNameGroup');
    const companyInput = document.getElementById('companyName');
    
    if (role === 'company') {
        companyGroup.style.opacity = '1';
        companyGroup.style.pointerEvents = 'auto';
        companyInput.disabled = false;
    } else {
        companyGroup.style.opacity = '0.4';
        companyGroup.style.pointerEvents = 'none';
        companyInput.disabled = true;
        companyInput.value = '';
    }
}

if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const existingUser = userEditIndex === -1 ? {} : users[userEditIndex];
        const newUser = {
            ...existingUser,
            id: userEditIndex === -1 ? Date.now() : existingUser.id,
            pic: document.getElementById('userPic').value,
            fullName: document.getElementById('userName').value, // Also save as userName for backward compatibility
            userName: document.getElementById('userName').value, 
            username: document.getElementById('userName').value,
            userId: document.getElementById('userId').value,
            password: document.getElementById('userPassword').value,
            role: document.getElementById('userRole').value,
            companyName: document.getElementById('companyName').value,
            status: document.getElementById('userStatus').value
        };

        if (userEditIndex === -1) {
            users.push(newUser);
        } else {
            users[userEditIndex] = newUser;
            cancelUserEdit();
        }

        await saveUsers();
        if (userEditIndex === -1) {
            userForm.reset();
            toggleCompanyField();
        }
        alert('User saved successfully!');
    });
}

window.editUser = function(index) {
    userEditIndex = index;
    const u = users[index];

    if (userFormTitle) userFormTitle.textContent = "Edit User";
    
    document.getElementById('userPic').value = u.pic || '';
    document.getElementById('userName').value = u.fullName || u.userName || u.name || u.username || '';
    document.getElementById('userId').value = u.userId || u.id || u.username || '';
    document.getElementById('userPassword').value = u.password || '';
    document.getElementById('userRole').value = u.role || 'user';
    document.getElementById('companyName').value = u.companyName || '';
    document.getElementById('userStatus').value = u.status || 'active';
    
    toggleCompanyField();
    
    if (btnCancelUser) btnCancelUser.style.display = 'inline-block';
    if (btnSaveUser) btnSaveUser.textContent = 'Update User';
    window.scrollTo({ top: userForm.offsetTop - 100, behavior: 'smooth' });
}

window.cancelUserEdit = function() {
    userEditIndex = -1;
    if (userForm) userForm.reset();
    toggleCompanyField();
    if (userFormTitle) userFormTitle.textContent = "Add New User";
    if (btnCancelUser) btnCancelUser.style.display = 'none';
    if (btnSaveUser) btnSaveUser.textContent = 'Save User';
}

async function deleteUser(index) {
    if (confirm('Delete this user?')) {
        users.splice(index, 1);
        await saveUsers();
    }
}


// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(sec => { sec.classList.remove('active'); sec.style.display = 'none'; });
    const activeSec = document.getElementById(sectionId); if (activeSec) { activeSec.classList.add('active'); activeSec.style.display = 'block'; }

    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    try { if (typeof event !== 'undefined' && event && event.currentTarget) { event.currentTarget.classList.add('active'); } } catch (e) { }

    // Performance analytics integration hook
    if (sectionId === 'performance') {
        if (typeof compilePerformanceMetrics === 'function') {
            if (!performanceTargetUser) {
                const defaultBtn = document.querySelector('.perf-filter-btn:nth-child(2)'); // This Week
                if (typeof setPerformanceFilter === 'function') {
                    setPerformanceFilter('week', defaultBtn);
                } else {
                    compilePerformanceMetrics();
                }
            } else {
                compilePerformanceMetrics();
            }
        }
    }
}

function logout() {
    window.location.href = '../index.html';
}

// Init
// Init
// Init
window.addEventListener('load', initAdmin);

// --- Product Functions ---
let productEditIndex = -1;

function populateCategoryDropdown() {
    const uniqueCategories = [...new Set(categories.map(c => c.name))];
    const cUserStr = localStorage.getItem('currentUser');
    let allowedCategories = uniqueCategories;
    if (cUserStr) {
        const currentUser = JSON.parse(cUserStr);
        const isSuperAdmin = String(currentUser.userId || '').toLowerCase() === 'admin';
        if (!isSuperAdmin) {
            // Find fresh live user in the users list
            const cUid = String(currentUser.userId || '').trim().toLowerCase();
            const cUname = String(currentUser.username || '').trim().toLowerCase();
            const liveUser = users.find(u => {
                const uId = String(u.userId || u.id || '').trim().toLowerCase();
                const uEmail = String(u.email || '').trim().toLowerCase();
                const uName = String(u.username || u.userName || '').trim().toLowerCase();
                return (uId && uId === cUid) || 
                       (uEmail && uEmail === cUid) || 
                       (uName && uName === cUname) ||
                       (uName && uName === cUid);
            });
            
            // Helper to get assigned categories from permissions or assignedCategories
            const getAssigned = (usr) => {
                if (!usr) return [];
                let perms = usr.permissions;
                let loopCount = 0;
                while (typeof perms === 'string' && loopCount < 3) {
                    try { perms = JSON.parse(perms); } catch(e) { break; }
                    loopCount++;
                }
                if (perms && typeof perms === 'object' && !Array.isArray(perms) && perms.assignedCategories) {
                    return perms.assignedCategories;
                }
                return usr.assignedCategories || [];
            };

            let assigned = (liveUser && getAssigned(liveUser).length > 0)
                ? getAssigned(liveUser)
                : getAssigned(currentUser);

            let loopCount = 0;
            while (typeof assigned === 'string' && loopCount < 3) {
                try {
                    assigned = JSON.parse(assigned);
                } catch(e) {
                    if (assigned.includes(',')) {
                        assigned = assigned.split(',').map(s => s.trim());
                    } else if (assigned) {
                        assigned = [assigned];
                    } else {
                        assigned = [];
                    }
                    break;
                }
                loopCount++;
            }

            if (assigned && Array.isArray(assigned) && assigned.length > 0) {
                const assignedLower = assigned.map(a => String(a).trim().toLowerCase());
                allowedCategories = uniqueCategories.filter(name => 
                    assignedLower.includes(String(name).trim().toLowerCase())
                );
            } else {
                allowedCategories = []; // Restricted users with no assigned categories see nothing
            }
        }
    }

    const prodCategorySelect = document.getElementById('prodCategory');
    if (prodCategorySelect) {
        const currentSelection = prodCategorySelect.value;

        prodCategorySelect.innerHTML = '<option value="">Select Category</option>' +
            allowedCategories.map(name => `<option value="${name}">${name}</option>`).join('');

        if (allowedCategories.includes(currentSelection)) {
            prodCategorySelect.value = currentSelection;
        } else if (currentSelection) {
            // Keep the selected category even if not in the allowed list, to prevent breaking edit mode
            prodCategorySelect.innerHTML += `<option value="${currentSelection}">${currentSelection}</option>`;
            prodCategorySelect.value = currentSelection;
        } else {
            prodCategorySelect.value = '';
        }

        // Add listener
        prodCategorySelect.onchange = () => {
            const selectedCat = prodCategorySelect.value;
            const prodSubCategorySelect = document.getElementById('prodSubCategory');
            if (prodSubCategorySelect) {
                // Filter sub-categories for this category name
                const relevantCats = categories.filter(c => c.name === selectedCat);
                let subCats = [];
                relevantCats.forEach(cat => {
                    if (cat.subCategory) {
                        subCats.push(...cat.subCategory.split(',').map(s => s.trim()).filter(s => s));
                    }
                });
                const uniqueSubCats = [...new Set(subCats)];

                prodSubCategorySelect.innerHTML = '<option value="">Select Sub Category</option>' +
                    uniqueSubCats.map(sub => `<option value="${sub}">${sub}</option>`).join('');
            }
        };

        // Trigger manually to initialize or restore sub-category state
        prodCategorySelect.onchange();
    }

    const dealCategorySelect = document.getElementById('dealCategory');
    if (dealCategorySelect && typeof allowedCategories !== 'undefined') {
        const currentSelectionDeal = dealCategorySelect.value;
        dealCategorySelect.innerHTML = '<option value="">Select Category</option>' +
            allowedCategories.map(name => `<option value="${name}">${name}</option>`).join('');

        if (allowedCategories.includes(currentSelectionDeal)) {
            dealCategorySelect.value = currentSelectionDeal;
        } else if (currentSelectionDeal) {
            dealCategorySelect.innerHTML += `<option value="${currentSelectionDeal}">${currentSelectionDeal}</option>`;
            dealCategorySelect.value = currentSelectionDeal;
        } else {
            dealCategorySelect.value = '';
        }

        dealCategorySelect.onchange = () => {
            const selectedCat = dealCategorySelect.value;
            const dealSubCategorySelect = document.getElementById('dealSubCategory');
            if (dealSubCategorySelect) {
                const relevantCats = categories.filter(c => c.name === selectedCat);
                let subCats = [];
                relevantCats.forEach(cat => {
                    if (cat.subCategory) {
                        subCats.push(...cat.subCategory.split(',').map(s => s.trim()).filter(s => s));
                    }
                });
                const uniqueSubCats = [...new Set(subCats)];

                dealSubCategorySelect.innerHTML = '<option value="">Select Sub Category</option>' +
                    uniqueSubCats.map(sub => `<option value="${sub}">${sub}</option>`).join('');
            }
        };

        dealCategorySelect.onchange();
    }
}

// Function to render dynamic form fields
function renderDynamicAdminFields() {
    const container = document.getElementById('dynamicProductFields');
    if (!container) return;

    const category = document.getElementById('prodCategory').value;
    const subCategory = document.getElementById('prodSubCategory').value;

    if (category === 'Vehicles' || category === 'Vehicle') {
        container.innerHTML = `
            <div class="form-row">
                <div class="input-group">
                    <label>Vehicle Title / Name</label>
                    <input type="text" id="prodName" class="dynamic-admin-field" placeholder="e.g., Honda Civic 2022" required>
                </div>
                <div class="input-group">
                    <label>Brand</label>
                    <select id="prodBrand" class="dynamic-admin-field" required>
                        <option value="">Select Brand</option>
                        <option value="Toyota">Toyota</option>
                        <option value="Honda">Honda</option>
                        <option value="Suzuki">Suzuki</option>
                        <option value="KIA">KIA</option>
                        <option value="Hyundai">Hyundai</option>
                        <option value="Daihatsu">Daihatsu</option>
                        <option value="Nissan">Nissan</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Model</label>
                    <select id="prodModel" class="dynamic-admin-field" required>
                        <option value="">Select Model</option>
                        <option value="Civic">Civic</option>
                        <option value="Corolla">Corolla</option>
                        <option value="City">City</option>
                        <option value="Alto">Alto</option>
                        <option value="Cultus">Cultus</option>
                        <option value="Sportage">Sportage</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Condition</label>
                    <select id="prodCondition" class="dynamic-admin-field" required>
                        <option value="">Select Condition</option>
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>KM's Driven</label>
                    <input type="number" id="prodKMs" class="dynamic-admin-field" placeholder="e.g. 50000" required>
                </div>
                <div class="input-group">
                    <label>Year</label>
                    <select id="prodYear" class="dynamic-admin-field" required>
                        <option value="">Select Year</option>
                        ${Array.from({ length: 26 }, (_, i) => 2025 - i).map(y => '<option value="' + y + '">' + y + '</option>').join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Fuel</label>
                    <select id="prodFuel" class="dynamic-admin-field" required>
                        <option value="">Select Fuel</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Electric">Electric</option>
                        <option value="CNG">CNG</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Transmission</label>
                    <select id="prodTransmission" class="dynamic-admin-field" required>
                        <option value="">Select</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Body Type</label>
                    <select id="prodBodyType" class="dynamic-admin-field" required>
                        <option value="">Select Body Type</option>
                        <option value="Sedan">Sedan</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="SUV">SUV</option>
                        <option value="Crossover">Crossover</option>
                        <option value="Van">Van</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Registration City</label>
                    <select id="prodRegCity" class="dynamic-admin-field" required>
                        <option value="">Select Reg City</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Unregistered">Unregistered</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Car Documents</label>
                    <select id="prodDocs" class="dynamic-admin-field" required>
                        <option value="">Select Documents</option>
                        <option value="Original">Original</option>
                        <option value="Duplicate">Duplicate</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Assembly</label>
                    <select id="prodAssembly" class="dynamic-admin-field" required>
                        <option value="">Select Assembly</option>
                        <option value="Local">Local</option>
                        <option value="Imported">Imported</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Price (Rs.)</label>
                    <input type="number" id="prodPrice" class="dynamic-admin-field" placeholder="e.g., 5000000" required>
                </div>
                <div class="input-group">
                    <label>City</label>
                    <select id="prodCity" class="dynamic-admin-field" required>
                        <option value="">Select City</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Peshawar">Peshawar</option>
                    </select>
                </div>
            </div>
            
            <div class="input-group" style="margin-bottom:15px;">
                <label>Features (Select Multiple)</label>
                <div style="display:flex; gap:15px; flex-wrap:wrap;">
                    <label><input type="checkbox" class="feature-cb" value="Airbags"> Airbags</label>
                    <label><input type="checkbox" class="feature-cb" value="Air Conditioning"> Air Conditioning</label>
                    <label><input type="checkbox" class="feature-cb" value="Power Windows"> Power Windows</label>
                    <label><input type="checkbox" class="feature-cb" value="Power Steering"> Power Steering</label>
                    <label><input type="checkbox" class="feature-cb" value="ABS"> ABS</label>
                    <label><input type="checkbox" class="feature-cb" value="Navigation"> Navigation</label>
                    <label><input type="checkbox" class="feature-cb" value="Alloy Rims"> Alloy Rims</label>
                </div>
            </div>
            
            <div class="input-group">
                <label>Mechanical Details (Select Multiple)</label>
                <div style="display:flex; gap:15px; flex-wrap:wrap;">
                    <label><input type="checkbox" class="mech-cb" value="Engine Repaired"> Engine Repaired</label>
                    <label><input type="checkbox" class="mech-cb" value="Suspension Work"> Suspension Work Required</label>
                    <label><input type="checkbox" class="mech-cb" value="Accidented"> Accidented</label>
                </div>
            </div>
        `;
    } else if (category === 'Computer' && (!subCategory || subCategory === '')) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #64748b; font-style: italic;">
                Please select a Sub Category (e.g. Laptops) to view the product form.
            </div>
        `;
    } else if (category === 'Computer' && subCategory === 'Laptop Charger') {
        container.innerHTML = `
            <div class="form-row">
                <div class="input-group">
                    <label>Brand</label>
                    <select id="prodBrand" class="dynamic-admin-field" required>
                        <option value="">Select Brand</option>
                        <option value="Dell">Dell</option>
                        <option value="HP">HP</option>
                        <option value="Lenovo">Lenovo</option>
                        <option value="Asus">Asus</option>
                        <option value="Acer">Acer</option>
                        <option value="Apple">Apple</option>
                        <option value="MSI">MSI</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Toshiba">Toshiba</option>
                        <option value="Sony">Sony</option>
                        <option value="Fujitsu">Fujitsu</option>
                        <option value="Panasonic">Panasonic</option>
                        <option value="Microsoft">Microsoft</option>
                        <option value="Surface">Surface</option>
                        <option value="Huawei">Huawei</option>
                        <option value="LG">LG</option>
                        <option value="Razer">Razer</option>
                        <option value="Alienware">Alienware</option>
                        <option value="Gigabyte">Gigabyte</option>
                        <option value="Chuwi">Chuwi</option>
                        <option value="Avita">Avita</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Product Name</label>
                    <input type="text" id="prodName" class="dynamic-admin-field" placeholder="e.g., Dell Laptop Charger 65W" required>
                </div>
                <div class="input-group">
                    <label>Compatible Brand</label>
                    <input type="text" id="prodCompatibleBrand" class="dynamic-admin-field" placeholder="e.g., Dell" required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group" style="flex: 2;">
                    <label>Compatible Models</label>
                    <input type="text" id="prodCompatibleModels" class="dynamic-admin-field" placeholder="e.g., Latitude 5400, Inspiron 15, Vostro 3400" required>
                </div>
                <div class="input-group">
                    <label>Wattage</label>
                    <input type="text" id="prodWattage" class="dynamic-admin-field" placeholder="e.g., 45W / 65W / 90W / 130W" required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Voltage</label>
                    <input type="text" id="prodVoltage" class="dynamic-admin-field" placeholder="e.g., 19.5V" required>
                </div>
                <div class="input-group">
                    <label>Amperage</label>
                    <input type="text" id="prodAmperage" class="dynamic-admin-field" placeholder="e.g., 3.34A" required>
                </div>
                <div class="input-group">
                    <label>Connector Type</label>
                    <select id="prodConnectorType" class="dynamic-admin-field" required>
                        <option value="">Select Connector Type</option>
                        <option value="Small Pin">Small Pin</option>
                        <option value="Big Pin">Big Pin</option>
                        <option value="USB-C">USB-C</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Connector Size</label>
                    <input type="text" id="prodConnectorSize" class="dynamic-admin-field" placeholder="e.g., 4.5mm × 3.0mm" required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Original / OEM / Compatible</label>
                    <select id="prodOriginalOEM" class="dynamic-admin-field" required>
                        <option value="">Select Type</option>
                        <option value="Original">Original</option>
                        <option value="OEM">OEM</option>
                        <option value="Compatible">Compatible</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Condition</label>
                    <select id="prodCondition" class="dynamic-admin-field" required>
                        <option value="">Select Condition</option>
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Warranty</label>
                    <select id="prodWarranty" class="dynamic-admin-field" required>
                        <option value="">Select Warranty</option>
                        <option value="7 Days">7 Days</option>
                        <option value="30 Days">30 Days</option>
                        <option value="No Warranty">No Warranty</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Power Cable Included</label>
                    <select id="prodPowerCable" class="dynamic-admin-field" required>
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Fast Charging Support</label>
                    <select id="prodFastCharging" class="dynamic-admin-field" required>
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Availability</label>
                    <select id="prodAvailability" class="dynamic-admin-field" required>
                        <option value="">Select Availability</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Price</label>
                    <input type="number" id="prodPrice" class="dynamic-admin-field" placeholder="Price" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="width: 100%; margin-bottom: 8px;">
                    <label>Product Description</label>
                    <textarea id="productDetail" class="dynamic-admin-field admin-input" rows="3" placeholder="Write product description..." style="width: 100%; resize: vertical; min-height: 80px;" required></textarea>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Seller</label>
                    <select id="prodSeller" class="dynamic-admin-field" required onchange="window.toggleLaptopShopField()">
                        <option value="">Select Seller Type</option>
                        <option value="Owner">Owner</option>
                        <option value="Retailer">Retailer</option>
                        <option value="Wholesaler">Wholesaler</option>
                    </select>
                </div>
                <div class="input-group" id="laptopCompanyGroup" style="opacity: 0.4; pointer-events: none;">
                    <label>Shop / Office / Company Name</label>
                    <input type="text" id="prodCompanyName" class="dynamic-admin-field" placeholder="Shop / Office / Company Name" disabled>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Address</label>
                    <input type="text" id="prodAddress" class="dynamic-admin-field" placeholder="Address" required>
                </div>
                <div class="input-group">
                    <label>Area / Block No.</label>
                    <input type="text" id="prodArea" class="dynamic-admin-field" placeholder="Area / Block No." required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>City</label>
                    <select id="prodCity" class="dynamic-admin-field" required>
                        <option value="">Select City</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Multan">Multan</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Phone No.</label>
                    <input type="text" id="prodPhone" class="dynamic-admin-field" placeholder="Phone No." required>
                </div>
                <div class="input-group">
                    <label>Whatsapp No.</label>
                    <input type="text" id="prodWhatsapp" class="dynamic-admin-field" placeholder="Whatsapp No." required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group" style="flex: 2;">
                    <label>Website address (if available)</label>
                    <input type="url" id="prodWebsite" class="dynamic-admin-field" placeholder="https://...">
                </div>
                <div class="input-group" style="flex: 1;">
                    <label>Status</label>
                    <select id="prodStatus" class="dynamic-admin-field" required>
                        <option value="Publish">Publish</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
            </div>
        `;
        setTimeout(() => { window.toggleLaptopShopField(); }, 0);
    } else if (category === 'Computer' && (subCategory === 'Laptops' || subCategory === 'ChromeBook' || subCategory === 'Chromebook' || subCategory === 'Chromebooks')) {
        const isChromebook = (subCategory === 'ChromeBook' || subCategory === 'Chromebook' || subCategory === 'Chromebooks');
        const typeSelectHtml = isChromebook ? `
                    <select id="prodType" class="dynamic-admin-field" required>
                        <option value="Chromebook">Chromebook</option>
                    </select>
        ` : `
                    <select id="prodType" class="dynamic-admin-field" required>
                        <option value="">Select Type</option>
                        <option value="Other Laptops">Other Laptops</option>
                        <option value="MacBooks">MacBooks</option>
                        <option value="Ultrabooks">Ultrabooks</option>
                        <option value="Chrome">Chrome</option>
                    </select>
        `;
        const osSelectHtml = isChromebook ? `
                    <select id="prodOS" class="dynamic-admin-field" required>
                        <option value="">Select OS</option>
                        <option value="Windows">Windows</option>
                        <option value="Chrome OS">Chrome OS</option>
                    </select>
        ` : `
                    <select id="prodOS" class="dynamic-admin-field" required>
                        <option value="">Select OS</option>
                        <option value="Windows">Windows</option>
                        <option value="MAC">MAC</option>
                        <option value="Chrome OS">Chrome OS</option>
                        <option value="Linux">Linux</option>
                        <option value="DOS">DOS</option>
                        <option value="Others">Others</option>
                    </select>
        `;
        const brandSelectHtml = isChromebook ? `
                    <select id="prodBrand" class="dynamic-admin-field" required>
                        <option value="">Select Brand</option>
                        <option value="CTL">CTL</option>
                        <option value="Atom">Atom</option>
                        <option value="Dell">Dell</option>
                        <option value="Hp">Hp</option>
                        <option value="Lenovo">Lenovo</option>
                        <option value="ASUS">ASUS</option>
                        <option value="Acer">Acer</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Toshiba">Toshiba</option>
                    </select>
        ` : `
                    <select id="prodBrand" class="dynamic-admin-field" required>
                        <option value="">Select Brand</option>
                        <option value="Dell">Dell</option>
                        <option value="Hp">Hp</option>
                        <option value="Lenovo">Lenovo</option>
                        <option value="Apple">Apple</option>
                        <option value="ASUS">ASUS</option>
                        <option value="Acer">Acer</option>
                        <option value="Toshiba">Toshiba</option>
                        <option value="Samsung">Samsung</option>
                        <option value="MSI">MSI</option>
                        <option value="Razer">Razer</option>
                        <option value="Infinix">Infinix</option>
                    </select>
        `;
        const hddTypeSelectHtml = isChromebook ? `
                    <select id="prodHDDType" class="dynamic-admin-field" required>
                        <option value="">Select Storage Type</option>
                        <option value="SSD">SSD</option>
                        <option value="HDD">HDD</option>
                        <option value="SSD + HDD">SSD + HDD</option>
                        <option value="DDR4">DDR4</option>
                    </select>
        ` : `
                    <select id="prodHDDType" class="dynamic-admin-field" required>
                        <option value="">Select Storage Type</option>
                        <option value="SSD">SSD</option>
                        <option value="HDD">HDD</option>
                        <option value="SSD + HDD">SSD + HDD</option>
                    </select>
        `;
        container.innerHTML = `
            <div class="form-row">
                <div class="input-group">
                    <label>Type</label>
                    ${typeSelectHtml}
                </div>
                <div class="input-group">
                    <label>Brand</label>
                    ${brandSelectHtml}
                </div>
                <div class="input-group">
                    <label>Model</label>
                    <input type="text" id="prodModel" class="dynamic-admin-field" placeholder="Model" required>
                </div>
                <div class="input-group">
                    <label>Generation</label>
                    <input type="text" id="prodGeneration" class="dynamic-admin-field" placeholder="e.g., 10th Gen" required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Ram</label>
                    <input type="text" id="prodRam" class="dynamic-admin-field" placeholder="e.g., 8 GB" required>
                </div>
                <div class="input-group">
                    <label>HDD</label>
                    <input type="text" id="prodHDD" class="dynamic-admin-field" placeholder="e.g., 256 GB" required>
                </div>
                <div class="input-group">
                    <label>HDD type</label>
                    ${hddTypeSelectHtml}
                </div>
                <div class="input-group">
                    <label>Screen Size</label>
                    <input type="text" id="prodScreenSize" class="dynamic-admin-field" placeholder="e.g., 14 inches" required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Condition</label>
                    <select id="prodCondition" class="dynamic-admin-field" required>
                        <option value="">Select Condition</option>
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Operating System</label>
                    ${osSelectHtml}
                </div>
                <div class="input-group">
                    <label>Price</label>
                    <input type="number" id="prodPrice" class="dynamic-admin-field" placeholder="Price" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="width: 100%; margin-bottom: 8px;">
                    <label>Product Details</label>
                    <textarea id="prodDetails" class="dynamic-admin-field admin-input" rows="3" placeholder="Write product details..." style="width: 100%; resize: vertical; min-height: 80px;" required></textarea>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Seller</label>
                    <select id="prodSeller" class="dynamic-admin-field" required onchange="window.toggleLaptopShopField()">
                        <option value="">Select Seller Type</option>
                        <option value="Owner">Owner</option>
                        <option value="Retailer">Retailer</option>
                        <option value="Wholesaler">Wholesaler</option>
                    </select>
                </div>
                <div class="input-group" id="laptopCompanyGroup" style="opacity: 0.4; pointer-events: none;">
                    <label>Shop / Office / Company Name</label>
                    <input type="text" id="prodCompanyName" class="dynamic-admin-field" placeholder="Shop / Office / Company Name" disabled>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Address</label>
                    <input type="text" id="prodAddress" class="dynamic-admin-field" placeholder="Address" required>
                </div>
                <div class="input-group">
                    <label>Area / Block No.</label>
                    <input type="text" id="prodArea" class="dynamic-admin-field" placeholder="Area / Block No." required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>City</label>
                    <select id="prodCity" class="dynamic-admin-field" required>
                        <option value="">Select City</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Multan">Multan</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Phone No.</label>
                    <input type="text" id="prodPhone" class="dynamic-admin-field" placeholder="Phone No." required>
                </div>
                <div class="input-group">
                    <label>Whatsapp No.</label>
                    <input type="text" id="prodWhatsapp" class="dynamic-admin-field" placeholder="Whatsapp No." required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group" style="flex: 2;">
                    <label>Website address (if available)</label>
                    <input type="url" id="prodWebsite" class="dynamic-admin-field" placeholder="https://...">
                </div>
                <div class="input-group" style="flex: 1;">
                    <label>Status</label>
                    <select id="prodStatus" class="dynamic-admin-field" required>
                        <option value="Publish">Publish</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
            </div>
        `;
        // Set initial state for Shop/Company name element
        setTimeout(() => { window.toggleLaptopShopField(); }, 0);
    } else if (category === 'Mobiles' && subCategory === 'Mobile Phones') {
        container.innerHTML = `
            <div class="form-row">
                <div class="input-group">
                    <label>Mobile Name / Title</label>
                    <input type="text" id="prodName" class="dynamic-admin-field" placeholder="e.g., iPhone 13 Pro" required>
                </div>
                <div class="input-group">
                    <label>Brand</label>
                    <select id="prodBrand" class="dynamic-admin-field" required>
                        <option value="">Select Brand</option>
                        <option value="Apple">Apple</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Xiaomi">Xiaomi</option>
                        <option value="Oppo">Oppo</option>
                        <option value="Vivo">Vivo</option>
                        <option value="Realme">Realme</option>
                        <option value="Infinix">Infinix</option>
                        <option value="Tecno">Tecno</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Operating System (OS)</label>
                    <select id="prodOs" class="dynamic-admin-field" required>
                        <option value="">Select OS</option>
                        <option value="Android">Android</option>
                        <option value="iOS">iOS</option>
                        <option value="HarmonyOS">HarmonyOS</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Specification</label>
                    <select id="prodSpecification" class="dynamic-admin-field" required>
                        <option value="">Select Specification</option>
                        <option value="4GB/64GB">4GB / 64GB</option>
                        <option value="4GB/128GB">4GB / 128GB</option>
                        <option value="6GB/128GB">6GB / 128GB</option>
                        <option value="8GB/128GB">8GB / 128GB</option>
                        <option value="8GB/256GB">8GB / 256GB</option>
                        <option value="12GB/256GB">12GB / 256GB</option>
                        <option value="12GB/512GB">12GB / 512GB</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Screen Size (inches)</label>
                    <input type="number" step="0.1" id="prodScreenSize" class="dynamic-admin-field" placeholder="e.g., 6.7" required>
                </div>
                <div class="input-group">
                    <label>Battery Backup (mAh)</label>
                    <input type="number" id="prodBatteryBackup" class="dynamic-admin-field" placeholder="e.g., 5000" required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Warranty</label>
                    <select id="prodWarranty" class="dynamic-admin-field" required>
                        <option value="">Select Warranty</option>
                        <option value="None">None</option>
                        <option value="1 Month">1 Month</option>
                        <option value="6 Months">6 Months</option>
                        <option value="1 Year">1 Year</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Make / Year</label>
                    <input type="text" id="prodMake" class="dynamic-admin-field" placeholder="e.g., 2023" required>
                </div>
            </div>
            <div class="form-row">
                <div class="input-group">
                    <label>Location / City</label>
                    <input type="text" id="prodLocation" class="dynamic-admin-field" placeholder="e.g., Lahore" required>
                </div>
                <div class="input-group">
                    <label>Price (Rs.)</label>
                    <input type="number" id="prodPrice" class="dynamic-admin-field" placeholder="e.g., 150000" required>
                </div>
            </div>
        `;
    } else {
        // Default to Food / Other fields
        container.innerHTML = `
            <div class="form-row">
                <div class="input-group">
                    <label>Product Name</label>
                    <input type="text" id="prodName" class="dynamic-admin-field" placeholder="Product Name" required>
                </div>
                <div class="input-group">
                    <label>Product Variety</label>
                    <input type="text" id="prodVariety" class="dynamic-admin-field" placeholder="e.g., Spicy, Large">
                </div>
            </div>

            <div class="form-row">
                <div class="input-group">
                    <label>Qty / Weight</label>
                    <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
                        <select id="prodQty" class="dynamic-admin-field" required style="flex: 1; margin-bottom: 0;">
                            <option value=""></option>
                            <option value="Extra Large">Extra Large</option>
                            <option value="Large">Large</option>
                            <option value="Medium">Medium</option>
                            <option value="Small">Small</option>
                            <option value="Full">Full</option>
                            <option value="Half">Half</option>
                            <option value="Qtr">Qtr</option>
                            <option value="Double Surving">Double Surving</option>
                            <option value="Single Surving">Single Surving</option>
                            <option value="2 Kg">2 Kg</option>
                            <option value="1 Kg">1 Kg</option>
                            <option value="Half Kg">Half Kg</option>
                            <option value="Fulll Plate">Fulll Plate</option>
                            <option value="Half Plate">Half Plate</option>
                            <option value="12">12</option>
                            <option value="11">11</option>
                            <option value="10">10</option>
                            <option value="9">9</option>
                            <option value="8">8</option>
                            <option value="7">7</option>
                            <option value="6">6</option>
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                        </select>
                        <select id="prodGram" class="dynamic-admin-field" style="flex: 1; margin-bottom: 0;">
                            <option value="">Select Gram</option>
                            <option value="50 gram">50 gram</option>
                            <option value="100 gram">100 gram</option>
                            <option value="250 gram">250 gram</option>
                            <option value="350 gram">350 gram</option>
                            <option value="500 gram">500 gram</option>
                            <option value="700 gram">700 gram</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Price (Rs.)</label>
                    <input type="number" id="prodPrice" class="dynamic-admin-field" placeholder="e.g., 1500" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group" style="width: 100%; margin-bottom: 8px;">
                   <label>Product Detail</label>
                   <textarea
                      id="productDetail"
                      class="dynamic-admin-field admin-input"
                      rows="3"
                      placeholder="Write product details..."
                      style="width: 100%; resize: vertical; min-height: 80px;"
                   ></textarea>
                </div>
            </div>
            
            <div class="form-row">
                <div class="input-group">
                    <label>Video Link (Optional)</label>
                    <input type="url" id="prodVideoLink" class="dynamic-admin-field" placeholder="https://youtube.com/..." />
                </div>
                <div class="input-group">
                    <label>Brand</label>
                    <input type="text" id="prodBrand" class="dynamic-admin-field" placeholder="Brand Name">
                </div>
            </div>

            <div class="form-row">
                <div class="input-group">
                    <label>Contact No</label>
                    <input type="text" id="prodContact" class="dynamic-admin-field" placeholder="0300-1234567">
                </div>
                <div class="input-group">
                    <label>Whatsapp No</label>
                    <input type="text" id="prodWhatsapp" class="dynamic-admin-field" placeholder="0300-1234567">
                </div>
                <div class="input-group">
                    <label>Delivery No</label>
                    <input type="text" id="prodDelivery" class="dynamic-admin-field" placeholder="0300-1234567">
                </div>
            </div>

            <div class="input-group">
                <label>Address</label>
                <input type="text" id="prodAddress" class="dynamic-admin-field" placeholder="Full Address">
            </div>

                <div class="form-row">
                <div class="input-group">
                    <label>Area / Block No.</label>
                    <input type="text" id="prodBlockNo" class="dynamic-admin-field" placeholder="e.g. Block A">
                </div>
                <div class="input-group">
                    <label>City</label>
                    <input type="text" id="prodCity" class="dynamic-admin-field" placeholder="e.g. Lahore">
                </div>
            </div>
        `;
    }
    const staticStatus = document.getElementById('staticStatusContainer');
    if (staticStatus) {
        if (category === 'Computer') {
            staticStatus.style.display = 'none';
        } else {
            staticStatus.style.display = 'block';
        }
    }
}

window.toggleLaptopShopField = function() {
    const seller = document.getElementById('prodSeller')?.value;
    const shopField = document.getElementById('prodCompanyName');
    const shopGroup = document.getElementById('laptopCompanyGroup');
    if (shopField && shopGroup) {
        if (seller === 'Retailer' || seller === 'Wholesaler') {
            shopField.disabled = false;
            shopField.required = true;
            shopGroup.style.opacity = '1';
            shopGroup.style.pointerEvents = 'auto';
        } else {
            shopField.disabled = true;
            shopField.required = false;
            shopField.value = '';
            shopGroup.style.opacity = '0.4';
            shopGroup.style.pointerEvents = 'none';
        }
    }
};

// Add event listeners to redraw when category or subcategory changes
document.addEventListener('DOMContentLoaded', () => {
    const pCat = document.getElementById('prodCategory');
    const pSub = document.getElementById('prodSubCategory');
    if (pCat) pCat.addEventListener('change', renderDynamicAdminFields);
    if (pSub) pSub.addEventListener('change', renderDynamicAdminFields);

    // Filter controls event listeners
    const searchInput = document.getElementById('prodSearchInput');
    const filterCat = document.getElementById('prodFilterCategory');
    const filterPost = document.getElementById('prodFilterPostBy');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            prodSearchQuery = e.target.value.toLowerCase().trim();
            prodCurrentPage = 1;
            renderAdminProducts();
        });
    }
    if (filterCat) {
        filterCat.addEventListener('change', (e) => {
            prodFilterCategory = e.target.value;
            prodCurrentPage = 1;
            renderAdminProducts();
        });
    }
    if (filterPost) {
        filterPost.addEventListener('change', (e) => {
            prodFilterPostBy = e.target.value;
            prodCurrentPage = 1;
            renderAdminProducts();
        });
    }
});

const adminProductForm = document.getElementById('adminProductForm');

if (adminProductForm) {
    adminProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Find the full category object based on selection
        // We need the original category object to link correct compatibility if needed, 
        // but user schema seems flat for now regarding product -> category link.
        // using the values from dropdowns.

        const category = document.getElementById('prodCategory').value;
        const subCategory = document.getElementById('prodSubCategory').value;

        const cUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

        let newProduct = {
            id: productEditIndex === -1 ? Date.now() : products[productEditIndex].id,
            category: category,
            subCategory: subCategory,
            image: document.getElementById('prodImage').value || (productEditIndex !== -1 ? products[productEditIndex].image : 'https://via.placeholder.com/150'),
            addedBy: productEditIndex === -1 ? userName : (products[productEditIndex].addedBy || userName),
            createdDate: productEditIndex === -1 ? new Date().toISOString() : (products[productEditIndex].createdDate || new Date().toISOString()),
            updatedDate: new Date().toISOString()
        };

        // Extract native dynamic field values
        document.querySelectorAll('.dynamic-admin-field').forEach(field => {
            // Remove 'prod' prefix if present for cleaner keys, or just map IDs
            let key = field.id.replace('prod', '');
            key = key.charAt(0).toLowerCase() + key.slice(1);
            newProduct[key] = field.value;
        });

        if (category === 'Computer' && (subCategory === 'Laptops' || subCategory === 'ChromeBook' || subCategory === 'Chromebook' || subCategory === 'Chromebooks')) {
            newProduct.name = ((newProduct.brand || '') + ' ' + (newProduct.model || '')).trim();
            if (!newProduct.name) {
                newProduct.name = (subCategory === 'ChromeBook' || subCategory === 'Chromebook' || subCategory === 'Chromebooks') ? 'Chromebook' : 'Laptop';
            }
        } else if (!newProduct.name && document.getElementById('prodName')) {
            newProduct.name = document.getElementById('prodName').value;
        }
        if (!newProduct.price && document.getElementById('prodPrice')) {
            newProduct.price = document.getElementById('prodPrice').value;
        }

        if (document.getElementById('productDetail')) {
            newProduct.details = document.getElementById('productDetail').value;
        }
        if (document.getElementById('prodVideoLink')) {
            newProduct.videoLink = document.getElementById('prodVideoLink').value;
        }
        if (document.getElementById('prodStatus')) {
            newProduct.status = document.getElementById('prodStatus').value;
        }

        // Force Draft if not Super Admin and doesn't have Publish permission
        if (!hasPublishPermission(cUser, 'products')) {
            newProduct.status = 'Draft';
        }

        // Handle Checkboxes if Vehicle
        if (category === 'Vehicles' || category === 'Vehicle') {
            const features = Array.from(document.querySelectorAll('.feature-cb:checked')).map(cb => cb.value);
            const mechanical = Array.from(document.querySelectorAll('.mech-cb:checked')).map(cb => cb.value);
            newProduct.features = features.join(', ');
            newProduct.mechanicalDetails = mechanical.join(', ');
        }

        try {
            if (productEditIndex === -1) {
                products.push(newProduct);
            } else {
                products[productEditIndex] = newProduct;
                cancelProductEdit();
            }
            await DataService.saveProducts(products);

            if (productEditIndex === -1) {
                alert('Product Added Successfully!');
            } else {
                alert('Product Updated Successfully!');
            }

            adminProductForm.reset();
            renderDynamicAdminFields();
            renderAdminProducts();
            updateUI(); // Update stats
            if (typeof updatePendingApprovalsBadge === 'function') updatePendingApprovalsBadge();
        } catch (error) {
            alert('Failed to save product. Check internet connection or Google Script logs.');
            console.error('Save product error:', error);
            if (productEditIndex === -1) products.pop(); // Remove the failed product locally
        }
    });
}


function populateProductFilterOptions() {
    const catSelect = document.getElementById('prodFilterCategory');
    const postSelect = document.getElementById('prodFilterPostBy');
    
    if (catSelect) {
        const uniqueCats = [...new Set(products.map(p => p.category).filter(Boolean))];
        const currentVal = catSelect.value;
        catSelect.innerHTML = '<option value="">All Categories</option>' + 
            uniqueCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        catSelect.value = uniqueCats.includes(currentVal) ? currentVal : '';
    }
    if (postSelect) {
        const uniquePosts = [...new Set(products.map(p => p.addedBy || 'Admin').filter(Boolean))];
        const currentVal = postSelect.value;
        postSelect.innerHTML = '<option value="">All Authors</option>' + 
            uniquePosts.map(post => `<option value="${post}">${post}</option>`).join('');
        postSelect.value = uniquePosts.includes(currentVal) ? currentVal : '';
    }
}

window.resetProductFilters = function() {
    prodSearchQuery = "";
    prodFilterCategory = "";
    prodFilterPostBy = "";
    prodCurrentPage = 1;
    
    const searchInput = document.getElementById('prodSearchInput');
    const catSelect = document.getElementById('prodFilterCategory');
    const postSelect = document.getElementById('prodFilterPostBy');
    
    if (searchInput) searchInput.value = "";
    if (catSelect) catSelect.value = "";
    if (postSelect) postSelect.value = "";
    
    renderAdminProducts();
};

function renderAdminProducts() {
    const adminProductList = document.getElementById('adminProductList');
    const paginationContainer = document.getElementById('adminProductPagination');
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

    // Update dynamic options in dropdowns first
    populateProductFilterOptions();

    if (adminProductList) {
        // Map products to keep their original index
        const mappedProducts = products.map((prod, index) => ({ prod, index }));

        // Apply filters
        const filteredProducts = mappedProducts.filter(item => {
            const { prod } = item;
            
            // Search filter
            if (prodSearchQuery) {
                const nameMatch = String(prod.name || '').toLowerCase().includes(prodSearchQuery);
                const brandMatch = String(prod.brand || '').toLowerCase().includes(prodSearchQuery);
                const varietyMatch = String(prod.variety || '').toLowerCase().includes(prodSearchQuery);
                const catMatch = String(prod.category || '').toLowerCase().includes(prodSearchQuery);
                const subCatMatch = String(prod.subCategory || '').toLowerCase().includes(prodSearchQuery);
                if (!nameMatch && !brandMatch && !varietyMatch && !catMatch && !subCatMatch) {
                    return false;
                }
            }

            // Category filter
            if (prodFilterCategory && prod.category !== prodFilterCategory) {
                return false;
            }

            // Post By (Author) filter
            if (prodFilterPostBy) {
                const author = prod.addedBy || 'Admin';
                if (author !== prodFilterPostBy) {
                    return false;
                }
            }

            return true;
        });

        // Pagination calculation
        const totalItems = filteredProducts.length;
        const totalPages = Math.ceil(totalItems / prodPageSize) || 1;
        if (prodCurrentPage > totalPages) {
            prodCurrentPage = totalPages;
        }

        const startIndex = (prodCurrentPage - 1) * prodPageSize;
        const endIndex = startIndex + prodPageSize;
        const pageItems = filteredProducts.slice(startIndex, endIndex);

        // Render page products
        if (pageItems.length === 0) {
            adminProductList.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b; font-weight: 600;">
                    <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #cbd5e1;"></i>
                    No matching products found.
                </div>
            `;
        } else {
            adminProductList.innerHTML = pageItems.map(item => {
                const { prod, index } = item;
                let details = prod.variety || '';
                if (prod.category === 'Vehicles' || prod.category === 'Vehicle') {
                    details = `${prod.year || ''} Model | ${prod.kMs || prod.kms || 0} km`;
                } else if (prod.category === 'Mobiles') {
                    details = `${prod.specification || ''} | ${prod.batteryBackup ? prod.batteryBackup + 'mAh' : ''}`;
                } else if ((prod.category === 'Computer' || prod.category === 'Computers') && (prod.subCategory === 'Laptops' || prod.subCategory === 'ChromeBook' || prod.subCategory === 'Chromebook' || prod.subCategory === 'Chromebooks')) {
                    details = `${prod.brand || ''} ${prod.model || ''} (${prod.generation || ''}) | ${prod.ram || ''} RAM | ${prod.hdd || ''} ${prod.hddType || ''} | OS: ${prod.os || ''} | ${prod.condition || ''}`;
                } else if ((prod.category === 'Computer' || prod.category === 'Computers') && prod.subCategory === 'Laptop Charger') {
                    details = `${prod.brand || ''} | Compatible: ${prod.compatibleBrand || ''} | Wattage: ${prod.wattage || ''} | Voltage: ${prod.voltage || ''} | Connector: ${prod.connectorType || ''} (${prod.connectorSize || ''}) | ${prod.condition || ''}`;
                } else {
                    const parts = [];
                    if (prod.qty) parts.push(prod.qty);
                    if (prod.gram) parts.push(prod.gram);
                    if (parts.length > 0) {
                        details += (details ? ' | ' : '') + parts.join(' - ');
                    }
                }

                const isPublished = prod.status === 'Publish' || prod.prodStatus === 'Publish';
                const canEdit = isSuperAdmin || (prod.addedBy === userName && !isPublished);
                let actionButtons = '';
                if (canEdit) {
                    let approvalBtn = '';
                    if (isSuperAdmin) {
                        const isDraft = prod.status === 'Draft' || prod.prodStatus === 'Draft';
                        const color = isDraft ? '#e74c3c' : '#2ecc71';
                        const title = isDraft ? 'Approve (Draft)' : 'Approved (Publish)';
                        approvalBtn = `<button onclick="toggleApproval('products', ${index})" style="background: ${color}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;" title="${title}"><i class="fa-solid fa-check-circle"></i></button>`;
                    }
                    actionButtons = `
                       ${approvalBtn}
                       <button class="edit-btn" onclick="editProduct(${index})"><i class="fa-solid fa-pen"></i></button>
                       <button class="delete-btn" onclick="deleteProduct(${index})"><i class="fa-solid fa-trash"></i></button>
                    `;
                } else {
                    actionButtons = `<span style="font-size:12px;color:#888;">${isPublished ? 'Published (Locked)' : 'View Only'}</span>`;
                }

                return `
                <div class="product-row">
                    <img src="${prod.image}" alt="${prod.name}">
                    <div>${prod.name}<br><small>${details}</small></div>
                    <div>${prod.category} <br> <small>${prod.subCategory}</small></div>
                    <div style="color: var(--primary-color)">Rs. ${prod.price}</div>
                    <div style="display: flex; gap: 5px; align-items: center; white-space: nowrap;">
                        ${actionButtons}
                    </div>
                    <div style="font-size: 0.85rem; color: #ffffff; font-weight: 600;">${prod.addedBy || 'Admin'}</div>
                </div>
                `;
            }).join('');
        }

        // Render Pagination Controls
        if (paginationContainer) {
            if (totalItems <= prodPageSize) {
                paginationContainer.style.display = 'none';
            } else {
                paginationContainer.style.display = 'flex';
                const showFrom = totalItems === 0 ? 0 : startIndex + 1;
                const showTo = Math.min(endIndex, totalItems);
                
                let pagesHtml = '';
                // Prev Button
                pagesHtml += `<button onclick="changeProdPage(${prodCurrentPage - 1})" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" ${prodCurrentPage === 1 ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}><i class="fa-solid fa-chevron-left"></i> Prev</button>`;
                
                // Page numbers
                pagesHtml += `<span style="font-weight: 600; color: #334155; font-size: 0.8rem; margin: 0 10px;">Page ${prodCurrentPage} of ${totalPages}</span>`;
                
                // Next Button
                pagesHtml += `<button onclick="changeProdPage(${prodCurrentPage + 1})" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" ${prodCurrentPage === totalPages ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>Next <i class="fa-solid fa-chevron-right"></i></button>`;

                paginationContainer.innerHTML = `
                    <div style="color: #475569; font-weight: 500; font-size: 0.8rem;">
                        Showing ${showFrom} - ${showTo} of ${totalItems} products
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        ${pagesHtml}
                    </div>
                `;
            }
        }
    }
}

// Page change handler
window.changeProdPage = function(page) {
    prodCurrentPage = page;
    renderAdminProducts();
    const productListEl = document.querySelector('.grid-table-header');
    if (productListEl) {
        productListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.deleteProduct = async (index) => {
    const prod = products[index];
    const cUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    const isPublished = prod.status === 'Publish' || prod.prodStatus === 'Publish';

    if (!isSuperAdmin && (prod.addedBy !== userName || isPublished)) {
        alert("You are not authorized to delete this product once it is published.");
        return;
    }

    if (confirm('Delete this product?')) {
        products.splice(index, 1);
        await DataService.saveProducts(products);
        renderAdminProducts();
        updateUI();
        if (typeof updatePendingApprovalsBadge === 'function') updatePendingApprovalsBadge();
    }
};

window.editProduct = (index) => {
    const prod = products[index];
    const cUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    const isPublished = prod.status === 'Publish' || prod.prodStatus === 'Publish';

    if (!isSuperAdmin && (prod.addedBy !== userName || isPublished)) {
        alert("You are not authorized to edit this product once it is published.");
        return;
    }

    productEditIndex = index;
    const pCat = document.getElementById('prodCategory');
    const pSub = document.getElementById('prodSubCategory');

    pCat.value = prod.category;
    // Trigger change to populate subcategories
    pCat.dispatchEvent(new Event('change'));

    setTimeout(() => {
        pSub.value = prod.subCategory;
        // Trigger change to populate dynamic fields
        pSub.dispatchEvent(new Event('change'));

        setTimeout(() => {
            document.getElementById('prodImage').value = prod.image || '';

            // Fill dynamic fields
            document.querySelectorAll('.dynamic-admin-field').forEach(field => {
                let key = field.id.replace('prod', '');
                key = key.charAt(0).toLowerCase() + key.slice(1);

                if (prod[key] !== undefined) {
                    field.value = prod[key];
                }
            });

            if (prod.category === 'Computer' && (prod.subCategory === 'Laptops' || prod.subCategory === 'ChromeBook' || prod.subCategory === 'Chromebook' || prod.subCategory === 'Chromebooks' || prod.subCategory === 'Laptop Charger')) {
                window.toggleLaptopShopField();
            }

            if (document.getElementById('productDetail')) {
                document.getElementById('productDetail').value = prod.details || prod.description || '';
            }
            if (document.getElementById('prodVideoLink')) {
                document.getElementById('prodVideoLink').value = prod.videoLink || '';
            }

            // Handle checkboxes for vehicles if needed
            if (prod.category === 'Vehicles' || prod.category === 'Vehicle') {
                if (prod.features) {
                    const featureArray = prod.features.split(',').map(s => s.trim());
                    document.querySelectorAll('.feature-cb').forEach(cb => {
                        cb.checked = featureArray.includes(cb.value);
                    });
                }
                if (prod.mechanicalDetails) {
                    const mechArray = prod.mechanicalDetails.split(',').map(s => s.trim());
                    document.querySelectorAll('.mech-cb').forEach(cb => {
                        cb.checked = mechArray.includes(cb.value);
                    });
                }
            }

            // Update UI buttons
            const submitBtn = document.querySelector('#adminProductForm button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Update Product';

            let cancelBtn = document.getElementById('btnCancelProduct');
            if (!cancelBtn) {
                cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.id = 'btnCancelProduct';
                cancelBtn.className = 'btn btn-secondary';
                cancelBtn.style.marginTop = '10px';
                cancelBtn.style.marginLeft = '10px';
                cancelBtn.textContent = 'Cancel Edit';
                cancelBtn.onclick = cancelProductEdit;
                submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
            }
            cancelBtn.style.display = 'inline-block';
            document.getElementById('products').querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }, 50);
};

window.cancelProductEdit = () => {
    productEditIndex = -1;
    const form = document.getElementById('adminProductForm');
    if (form) form.reset();

    const pCat = document.getElementById('prodCategory');
    if (pCat) {
        pCat.value = "";
        pCat.dispatchEvent(new Event('change'));
    }

    const submitBtn = document.querySelector('#adminProductForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Add Product';

    const cancelBtn = document.getElementById('btnCancelProduct');
    if (cancelBtn) cancelBtn.style.display = 'none';
    // --- Dashboard Logic ---
};

// --- Travel Packages Functions ---
let travelEditIndex = -1;
const travelForm = document.getElementById('travelForm');
const travelList = document.getElementById('travelList');
const travelFormTitle = document.getElementById('travelFormTitle');
const btnCancelTravel = document.getElementById('btnCancelTravel');
const btnSaveTravel = document.getElementById('btnSaveTravel');

async function saveTravelPackages() {
    await DataService.saveTravelPackages(travelPackages);
    renderTravelPackages();
    if (typeof updatePendingApprovalsBadge === 'function') updatePendingApprovalsBadge();
}

function renderTravelPackages() {
    if (!travelList) return;
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

    travelList.innerHTML = travelPackages.map((pkg, index) => {
        let displayStatus = pkg.status || 'Publish';
        let displayType = pkg.listingType || 'Basic';
        let isFeatured = displayType === 'Featured';

        const canEdit = isSuperAdmin || pkg.addedBy === userName || (!pkg.addedBy && isSuperAdmin);
        let actionButtons = '';
        if (canEdit) {
            let approvalBtn = '';
            if (isSuperAdmin) {
                const isDraft = pkg.status === 'Draft';
                const color = isDraft ? '#e74c3c' : '#2ecc71';
                const title = isDraft ? 'Approve (Draft)' : 'Approved (Publish)';
                approvalBtn = `<button onclick="toggleApproval('travel', ${index})" style="background: ${color}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px; margin-bottom: 2px;" title="${title}"><i class="fa-solid fa-check-circle"></i></button>`;
            }
            actionButtons = `
                ${approvalBtn}
                <button class="edit-btn" onclick="editTravel(${index})" style="padding: 5px; margin-bottom: 2px;"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteTravel(${index})" style="padding: 5px;"><i class="fa-solid fa-trash"></i></button>
            `;
        } else {
            actionButtons = `<span style="font-size:12px;color:#888;">View Only</span>`;
        }

        return `
        <div class="product-row" style="grid-template-columns: 80px 2fr 1fr 1fr 1fr 1fr 80px; align-items: center;">
            <img src="${pkg.image || 'https://via.placeholder.com/150'}" alt="${pkg.title}" style="width: 100%; height: 60px; object-fit: cover; border-radius: 8px;">
            <div>
                <strong>${pkg.company || 'Unknown'}</strong><br>
                <small style="color: #aaa;">${pkg.title}</small>
            </div>
            <div>
                <span class="badge" style="background:#0ea5e9; color:white; padding: 2px 6px; font-size: 0.7rem;">${pkg.category}</span>
            </div>
            <div>${pkg.duration} Days</div>
            <div>
                <span style="color: var(--primary-color); font-weight:bold;">Rs. ${pkg.price}</span><br>
                <small>${pkg.priceType || 'Per Person'}</small>
            </div>
            <div>
                <span class="badge" style="background:${isFeatured ? '#f59e0b' : '#64748b'}; color:white; padding: 2px 6px; font-size: 0.7rem; margin-bottom: 2px; display:inline-block;">${displayType}</span>
                <span class="badge" style="background:${displayStatus === 'Publish' ? '#10b981' : '#f43f5e'}; color:white; padding: 2px 6px; font-size: 0.7rem; display:inline-block;">${displayStatus}</span>
            </div>
            <div>
                ${actionButtons}
            </div>
        </div>
        `;
    }).join('');
}

window.deleteTravel = async (index) => {
    if (confirm('Delete this travel package?')) {
        travelPackages.splice(index, 1);
        await saveTravelPackages();
    }
};

window.editTravel = (index) => {
    travelEditIndex = index;
    const pkg = travelPackages[index];

    document.getElementById('travelTitle').value = pkg.title || '';
    document.getElementById('travelCategory').value = pkg.category || '';
    document.getElementById('travelDeparture').value = pkg.departure || '';
    document.getElementById('travelDestination').value = pkg.destination || '';
    document.getElementById('travelDuration').value = pkg.duration || '';
    document.getElementById('travelPrice').value = pkg.price || '';
    document.getElementById('travelPriceType').value = pkg.priceType || 'Per Person';

    // Transport checkboxes
    document.querySelectorAll('input[name="transportOption"]').forEach(cb => cb.checked = false);
    if (pkg.transport) {
        const tArray = pkg.transport.split(',').map(s => s.trim());
        document.querySelectorAll('input[name="transportOption"]').forEach(cb => {
            if (tArray.includes(cb.value)) cb.checked = true;
        });
    }

    document.getElementById('travelHotel').value = pkg.hotel || 'None';
    document.getElementById('travelMeals').value = pkg.meals || 'No';
    document.getElementById('travelGuide').value = pkg.guide || 'No';
    document.getElementById('travelZiyarat').value = pkg.ziyarat || '';
    document.getElementById('travelImage').value = pkg.image || '';
    document.getElementById('travelBrochure').value = pkg.brochure || '';
    document.getElementById('travelDetails').value = pkg.details || '';
    document.getElementById('travelCompany').value = pkg.company || '';
    document.getElementById('travelContact').value = pkg.contact || '';
    document.getElementById('travelWhatsapp').value = pkg.whatsapp || '';
    document.getElementById('travelEmail').value = pkg.email || '';
    document.getElementById('travelListingType').value = pkg.listingType || 'Basic';
    document.getElementById('travelVerified').value = pkg.verified || 'No';
    document.getElementById('travelStatus').value = pkg.status || 'Publish';

    if (travelFormTitle) travelFormTitle.textContent = "Edit Travel Package";
    if (btnSaveTravel) btnSaveTravel.textContent = "Update Package";
    if (btnCancelTravel) btnCancelTravel.style.display = 'inline-block';

    document.getElementById('travel').querySelector('.travel-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelTravelEdit = () => {
    travelEditIndex = -1;
    if (travelForm) travelForm.reset();
    if (travelFormTitle) travelFormTitle.textContent = "Add Travel Package";
    if (btnSaveTravel) btnSaveTravel.textContent = "Submit Package";
    if (btnCancelTravel) btnCancelTravel.style.display = 'none';
};

if (travelForm) {
    travelForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const transportOptions = Array.from(document.querySelectorAll('input[name="transportOption"]:checked')).map(cb => cb.value);

        const cUserStr = localStorage.getItem('currentUser');
        const cUser = cUserStr ? JSON.parse(cUserStr) : {};
        const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

        const newPkg = {
            id: travelEditIndex === -1 ? Date.now() : travelPackages[travelEditIndex].id,
            title: document.getElementById('travelTitle').value,
            category: document.getElementById('travelCategory').value,
            departure: document.getElementById('travelDeparture').value,
            destination: document.getElementById('travelDestination').value,
            duration: document.getElementById('travelDuration').value,
            price: document.getElementById('travelPrice').value,
            priceType: document.getElementById('travelPriceType').value,
            transport: transportOptions.join(', '),
            hotel: document.getElementById('travelHotel').value,
            meals: document.getElementById('travelMeals').value,
            guide: document.getElementById('travelGuide').value,
            ziyarat: document.getElementById('travelZiyarat').value,
            image: document.getElementById('travelImage').value,
            brochure: document.getElementById('travelBrochure').value,
            details: document.getElementById('travelDetails').value,
            company: document.getElementById('travelCompany').value,
            contact: document.getElementById('travelContact').value,
            whatsapp: document.getElementById('travelWhatsapp').value,
            email: document.getElementById('travelEmail').value,
            listingType: document.getElementById('travelListingType').value,
            verified: document.getElementById('travelVerified').value,
            status: document.getElementById('travelStatus').value,
            addedBy: travelEditIndex === -1 ? userName : (travelPackages[travelEditIndex].addedBy || userName)
        };

        if (!hasPublishPermission(cUser, 'travel')) {
            newPkg.status = 'Draft';
        }

        if (travelEditIndex === -1) {
            travelPackages.push(newPkg);
        } else {
            travelPackages[travelEditIndex] = newPkg;
            cancelTravelEdit();
        }

        await saveTravelPackages();
        if (travelEditIndex === -1) travelForm.reset();
        alert('Travel Package saved successfully!');
    });
}

function initDashboard() {
    // Quick Actions Redirects
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            if (target) window.location.href = target;
        });
    });

    // --- Chart.js Initializations ---
    // Sales Chart
    const ctxSales = document.getElementById('pharaSalesChart');
    if (ctxSales) {
        new Chart(ctxSales, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Total Sale',
                    data: [12000, 19000, 15000, 22000, 18000, 25000],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } } } }
        });
    }

    // Credit Chart
    const ctxCredit = document.getElementById('pharaCreditChart');
    if (ctxCredit) {
        new Chart(ctxCredit, {
            type: 'bar',
            data: {
                labels: ['Shop A', 'Shop B', 'Shop C', 'Cust Y'],
                datasets: [{
                    label: 'Pending Credit',
                    data: [5000, 10000, 2000, 8000],
                    backgroundColor: '#0ea5e9',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { display: false } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } } } }
        });
    }

    // Inventory Chart
    const ctxInventory = document.getElementById('pharaInventoryChart');
    if (ctxInventory) {
        new Chart(ctxInventory, {
            type: 'doughnut',
            data: {
                labels: ['Electronics', 'Vehicles', 'Food', 'Clothing'],
                datasets: [{
                    data: [35, 20, 30, 15],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#e2e8f0', padding: 20 } } }, cutout: '70%' }
        });
    }
}

window.addEventListener('load', initDashboard);

// Food category override logic
document.addEventListener('DOMContentLoaded', () => {
    const catNameInput = document.getElementById('catName');
    if (catNameInput) {
        catNameInput.addEventListener('input', (e) => {
            const subCatInput = document.getElementById('subCatName');
            if (subCatInput) {
                if (e.target.value.trim().toLowerCase() === 'food') {
                    subCatInput.required = false;
                    subCatInput.disabled = true;
                    subCatInput.value = '';
                    subCatInput.placeholder = 'Not required for Food';
                    subCatInput.style.opacity = '0.5';
                } else {
                    subCatInput.required = true;
                    subCatInput.disabled = false;
                    subCatInput.placeholder = 'e.g., Mobile Phones';
                    subCatInput.style.opacity = '1';
                }
            }
        });
    }
});

// Global Click Sound Logic
document.addEventListener('DOMContentLoaded', () => {
    const clickSound = document.getElementById('clickSound');
    if (clickSound) {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('button, .menu li, .quick-action, .stat-link, a, input[type="submit"]');
            if (target) {
                clickSound.currentTime = 0; // Reset sound to start
                clickSound.play().catch(err => console.log('Audio play error (user interaction needed first):', err));
            }
        });
    }
});


// --- Broadcast Functions ---
const broadcastForm = document.getElementById('broadcastForm');
const broadcastList = document.getElementById('broadcastList');
const broadcastFormTitle = document.getElementById('broadcastFormTitle');
const btnCancelBroadcast = document.getElementById('btnCancelBroadcast');
const btnSaveBroadcast = document.getElementById('btnSaveBroadcast');
const broadcastSpecificUser = document.getElementById('broadcastSpecificUser');
const broadcastTextTicker = document.getElementById('broadcastText');

async function saveBroadcasts() {
    await DataService.saveBroadcasts(broadcasts);
    renderBroadcasts();
    if (typeof updatePendingApprovalsBadge === 'function') updatePendingApprovalsBadge();
}

function renderBroadcasts() {
    if (broadcastList) {
        const cUserStr = localStorage.getItem('currentUser');
        const cUser = cUserStr ? JSON.parse(cUserStr) : {};
        const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
        const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

        broadcastList.innerHTML = broadcasts.map((b, index) => {
            const canEdit = isSuperAdmin || b["Post By"] || b.postBy === userName || (!b["Post By"] || b.postBy && isSuperAdmin);
            let actionButtons = '';
            if (canEdit) {
                let approvalBtn = '';
                if (isSuperAdmin) {
                    const isDraft = b.status === 'Draft';
                    const color = isDraft ? '#e74c3c' : '#2ecc71';
                    const title = isDraft ? 'Approve (Draft)' : 'Approved (Publish)';
                    approvalBtn = `<button onclick="toggleApproval('broadcasts', ${index})" style="background: ${color}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;" title="${title}"><i class="fa-solid fa-check-circle"></i></button>`;
                }
                actionButtons = `
                    ${approvalBtn}
                    <button class="edit-btn" onclick="editBroadcast(${index})"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" onclick="deleteBroadcast(${index})"><i class="fa-solid fa-trash"></i></button>
                `;
            } else {
                actionButtons = `<span style="font-size:12px;color:#888;">View Only</span>`;
            }

            return `
            <div class="grid-table-row" style="grid-template-columns: 1fr 2fr 100px 100px 100px; display: grid; gap: 10px; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color);">
                <div><span class="badge" style="background:#3498db; color:white;">${b.target === 'all' ? 'All Users' : b.targetUser || 'Specific'}</span></div>
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.message}</div>
                <div>${b.date || new Date().toISOString().split('T')[0]}</div>
                <div><span class="badge" style="background:${b.status === 'active' ? '#2ecc71' : '#e74c3c'}; color:white;">${b.status}</span></div>
                <div>
                    ${actionButtons}
                </div>
            </div>
            `;
        }).join('');
    }

    // Update Admin Ticker
    if (broadcastTextTicker) {
        const activeBroadcasts = broadcasts.filter(b => b.status === 'active' && (!b.target || b.target === 'all'));
        if (activeBroadcasts.length > 0) {
            broadcastTextTicker.innerHTML = activeBroadcasts.map(b => "🔥 " + b.message).join('  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  ');
        } else {
            broadcastTextTicker.innerHTML = '🔥 Welcome to Qeemat Point Admin!  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  🔥 System Running Smoothly';
        }
    }
}

async function deleteBroadcast(index) {
    if (confirm('Delete this broadcast?')) {
        broadcasts.splice(index, 1);
        await saveBroadcasts();
    }
}

window.editBroadcast = (index) => {
    broadcastEditIndex = index;
    const b = broadcasts[index];

    document.getElementById('broadcastMessage').value = b.message || '';
    document.getElementById('broadcastAudience').value = b.target || 'all';
    document.getElementById('broadcastStatus').value = b.status || 'active';

    toggleSpecificUserField();
    if (b.target === 'specific' && broadcastSpecificUser) {
        broadcastSpecificUser.value = b.targetUser || '';
    }

    if (broadcastFormTitle) broadcastFormTitle.textContent = "Edit Broadcast";
    if (btnSaveBroadcast) btnSaveBroadcast.textContent = "Update Broadcast";
    if (btnCancelBroadcast) btnCancelBroadcast.style.display = 'inline-block';

    document.getElementById('broadcasts').scrollIntoView({ behavior: 'smooth' });
};

window.cancelBroadcastEdit = () => {
    broadcastEditIndex = -1;
    if (broadcastForm) broadcastForm.reset();
    toggleSpecificUserField();

    if (broadcastFormTitle) broadcastFormTitle.textContent = "Create New Broadcast";
    if (btnSaveBroadcast) btnSaveBroadcast.textContent = "Save Broadcast";
    if (btnCancelBroadcast) btnCancelBroadcast.style.display = 'none';
};

window.toggleSpecificUserField = () => {
    const audience = document.getElementById('broadcastAudience').value;
    if (broadcastSpecificUser) {
        if (audience === 'specific') {
            broadcastSpecificUser.style.display = 'inline-block';
            // Populate users if empty
            if (broadcastSpecificUser.options.length <= 1) {
                broadcastSpecificUser.innerHTML = '<option value="">-- Choose User --</option>' +
                    users.map(u => `<option value="${u.username}">${u.username} (${u.role})</option>`).join('');
            }
        } else {
            broadcastSpecificUser.style.display = 'none';
            broadcastSpecificUser.value = '';
        }
    }
};

if (broadcastForm) {
    broadcastForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cUserStr = localStorage.getItem('currentUser');
        const cUser = cUserStr ? JSON.parse(cUserStr) : {};
        const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

        const newBroadcast = {
            id: broadcastEditIndex === -1 ? Date.now() : broadcasts[broadcastEditIndex].id,
            message: document.getElementById('broadcastMessage').value,
            target: document.getElementById('broadcastAudience').value,
            targetUser: document.getElementById('broadcastSpecificUser') ? document.getElementById('broadcastSpecificUser').value : '',
            status: document.getElementById('broadcastStatus').value,
            date: new Date().toISOString().split('T')[0],
            addedBy: broadcastEditIndex === -1 ? userName : (broadcasts[broadcastEditIndex].addedBy || userName)
        };

        if (!hasPublishPermission(cUser, 'broadcasts')) {
            newBroadcast.status = 'Draft';
        }

        if (broadcastEditIndex === -1) {
            broadcasts.push(newBroadcast);
        } else {
            broadcasts[broadcastEditIndex] = newBroadcast;
            cancelBroadcastEdit();
        }

        await saveBroadcasts();
        if (broadcastEditIndex === -1) {
            broadcastForm.reset();
            toggleSpecificUserField();
        }
        alert('Broadcast saved successfully!');
    });
}


// --- Fallback Stub Functions ---
if (typeof renderBlogs !== 'function') {
    window.renderBlogs = function () { console.log('renderBlogs not implemented yet'); };
}
if (typeof renderAds !== 'function') {
    window.renderAds = function () { console.log('renderAds not implemented yet'); };
}
if (typeof renderDailyPrices !== 'function') {
    window.renderDailyPrices = function () { console.log('renderDailyPrices not implemented yet'); };
}

// ==========================================
// USER RIGHTS MANAGEMENT
// ==========================================
window.populatePermissionDropdown = function() {
    const select = document.getElementById('rightsUserSelect');
    if (!select) return;
    
    const currentSelection = select.value;
    select.innerHTML = '<option value="">Select a user...</option>';
    
    users.forEach(u => {
        const option = document.createElement('option');
        option.value = u.userId;
        option.textContent = `${u.fullName || u.userId} (${u.role})`;
        select.appendChild(option);
    });
    
    if (currentSelection && users.some(u => u.userId === currentSelection)) {
        select.value = currentSelection;
    }
};

window.onUserSelectChange = function() {
    const userSelect = document.getElementById('rightsUserSelect');
    const sectionCheckboxes = document.querySelectorAll('.section-checkbox');
    const chargesInput = document.getElementById('rightsUserCharges');
    
    // Reset sections
    sectionCheckboxes.forEach(cb => cb.checked = false);

    if (!userSelect || !userSelect.value) {
        if (chargesInput) chargesInput.value = '';
        loadUserPermissions();
        return;
    }
    
    const user = users.find(u => u.userId === userSelect.value);
    if (!user) {
        if (chargesInput) chargesInput.value = '';
        loadUserPermissions();
        return;
    }

    // Normalize permissions string/object safely first
    let perms = user.permissions;
    if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch(e) { perms = {}; }
    }
    if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
        perms = {};
    }
    user.permissions = perms;

    // Sync charges from permissions if available
    if (perms.charges !== undefined) {
        user.charges = perms.charges;
    }
    if (chargesInput) {
        chargesInput.value = user.charges !== undefined ? user.charges : '';
    }

    if (user.role === 'admin' && String(user.userId).toLowerCase() === 'admin') {
        sectionCheckboxes.forEach(cb => cb.checked = true);
    } else {
        // user.permissions is like { "dashboard": ["Draft", "Publish"], "deals": ["Draft"] }
        Object.keys(perms).forEach(sectionKey => {
            if (perms[sectionKey] && perms[sectionKey].length > 0) {
                const cb = document.querySelector(`.section-checkbox[value="${sectionKey}"]`);
                if (cb) cb.checked = true;
            }
        });
    }

    loadUserPermissions();
};

window.loadUserPermissions = function() {
    const userSelect = document.getElementById('rightsUserSelect');
    const sectionCheckboxes = document.querySelectorAll('.section-checkbox');
    const permCheckboxes = document.querySelectorAll('.perm-checkbox');
    
    permCheckboxes.forEach(cb => cb.checked = false);
    
    if (!userSelect || !userSelect.value) return;
    
    // Check which sections are selected
    const selectedSections = Array.from(sectionCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    
    const user = users.find(u => u.userId === userSelect.value);
    if (!user) return;
    
    // Normalize permissions string/object safely
    let perms = user.permissions;
    if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch(e) { perms = {}; }
    }
    if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
        perms = {};
    }
    user.permissions = perms;
    
    if (user.role === 'admin' && user.userId === 'admin') {
        permCheckboxes.forEach(cb => cb.checked = true);
    } else {
        if (selectedSections.length > 0) {
            const firstSectionPerms = perms[selectedSections[0]] || [];
            
            // To be accurate, we'll just show the rights of the first checked section to populate the UI.
            firstSectionPerms.forEach(action => {
                const cb = document.querySelector(`.perm-checkbox[value="${action}"]`);
                if (cb) cb.checked = true;
            });
        }
    }
};

const rightsForm = document.getElementById('rightsForm');
if (rightsForm) {
    rightsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userSelect = document.getElementById('rightsUserSelect');
        const sectionCheckboxes = document.querySelectorAll('.section-checkbox');
        
        const selectedSections = Array.from(sectionCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        if (!userSelect || !userSelect.value) {
            alert('Please select a user first.');
            return;
        }
        if (selectedSections.length === 0) {
            alert('Please select at least one section.');
            return;
        }
        
        const userIndex = users.findIndex(u => u.userId === userSelect.value);
        if (userIndex === -1) return;
        
        const permCheckboxes = document.querySelectorAll('.perm-checkbox');
        const selectedActions = [];
        permCheckboxes.forEach(cb => {
            if (cb.checked) selectedActions.push(cb.value);
        });
        
        let currentPerms = users[userIndex].permissions;
        // Normalize if it was previously an array or undefined
        if (!currentPerms || Array.isArray(currentPerms) || typeof currentPerms !== 'object') {
            currentPerms = {};
        }
        
        // Apply rights to all selected sections
        selectedSections.forEach(sec => {
            currentPerms[sec] = selectedActions;
        });
        
        users[userIndex].permissions = currentPerms;
        
        // Save charges rate
        const chargesInput = document.getElementById('rightsUserCharges');
        if (chargesInput) {
            users[userIndex].charges = parseFloat(chargesInput.value) || 0;
        }
        
        await saveUsers();
        alert('User rights updated successfully!');
    });
}

// ==========================================
// USER CATEGORIES ASSIGNMENT
// ==========================================
window.populateCategoryAssignDropdown = function() {
    const select = document.getElementById('categoryAssignUserSelect');
    if (!select) return;
    
    const currentSelection = select.value;
    select.innerHTML = '<option value="">Select a user...</option>';
    
    users.forEach(u => {
        const isSuperAdmin = String(u.userId).toLowerCase() === 'admin';
        if (!isSuperAdmin) {
            const option = document.createElement('option');
            option.value = u.userId;
            option.textContent = `${u.fullName || u.userId} (${u.role})`;
            select.appendChild(option);
        }
    });
    
    if (currentSelection && users.some(u => u.userId === currentSelection)) {
        select.value = currentSelection;
    }
};

window.populateCategoryAssignGrid = function() {
    const grid = document.getElementById('categoriesAssignGrid');
    if (!grid) return;
    
    const uniqueCategories = [...new Set(categories.map(c => c.name))];
    
    grid.innerHTML = uniqueCategories.map(catName => {
        return `
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" value="${catName}" class="cat-assign-checkbox"> ${catName}
            </label>
        `;
    }).join('');
};

window.onCategoryAssignUserChange = function() {
    const userSelect = document.getElementById('categoryAssignUserSelect');
    const checkboxes = document.querySelectorAll('.cat-assign-checkbox');
    
    checkboxes.forEach(cb => cb.checked = false);
    
    if (!userSelect || !userSelect.value) return;
    
    const user = users.find(u => u.userId === userSelect.value);
    if (!user) return;
    
    let assigned = (user.permissions && user.permissions.assignedCategories)
        ? user.permissions.assignedCategories
        : (user.assignedCategories || []);

    let loopCount = 0;
    while (typeof assigned === 'string' && loopCount < 3) {
        try {
            assigned = JSON.parse(assigned);
        } catch(e) {
            if (assigned.includes(',')) {
                assigned = assigned.split(',').map(s => s.trim());
            } else if (assigned) {
                assigned = [assigned];
            } else {
                assigned = [];
            }
            break;
        }
        loopCount++;
    }
    if (!Array.isArray(assigned)) {
        assigned = [];
    }
    
    checkboxes.forEach(cb => {
        if (assigned.includes(cb.value)) {
            cb.checked = true;
        }
    });
};

const categoryAssignForm = document.getElementById('categoryAssignForm');
if (categoryAssignForm) {
    categoryAssignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userSelect = document.getElementById('categoryAssignUserSelect');
        if (!userSelect || !userSelect.value) {
            alert('Please select a user first.');
            return;
        }
        
        const userIndex = users.findIndex(u => u.userId === userSelect.value);
        if (userIndex === -1) return;
        
        const checkboxes = document.querySelectorAll('.cat-assign-checkbox');
        const selectedCategories = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        // Ensure permissions object exists and is parsed
        let perms = users[userIndex].permissions;
        let loopCount = 0;
        while (typeof perms === 'string' && loopCount < 3) {
            try { perms = JSON.parse(perms); } catch(e) { break; }
            loopCount++;
        }
        if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
            perms = {};
        }
        
        perms.assignedCategories = selectedCategories;
        users[userIndex].permissions = perms;
        users[userIndex].assignedCategories = selectedCategories;
        
        await saveUsers();
        alert('Category assignment updated successfully!');
    });
}

window.enforceUserPermissions = function() {
    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) return;
        
        let currentUser = JSON.parse(currentUserStr);
        if (String(currentUser.userId || currentUser.username || '').toLowerCase() === 'admin') return; // Super admin exception
        
        // ALWAYS use the freshest data from the fetched 'users' array if available
        const cUid = String(currentUser.userId || '').trim().toLowerCase();
        const cUname = String(currentUser.username || '').trim().toLowerCase();
        const liveUser = users.find(u => {
            const uId = String(u.userId || u.id || '').trim().toLowerCase();
            const uEmail = String(u.email || '').trim().toLowerCase();
            const uName = String(u.username || u.userName || '').trim().toLowerCase();
            return (uId && uId === cUid) || 
                   (uEmail && uEmail === cUid) || 
                   (uName && uName === cUname) ||
                   (uName && uName === cUid);
        });
        if (liveUser) {
            currentUser.role = liveUser.role || currentUser.role;
            currentUser.permissions = liveUser.permissions !== undefined ? liveUser.permissions : currentUser.permissions;
            currentUser.assignedCategories = liveUser.assignedCategories !== undefined ? liveUser.assignedCategories : currentUser.assignedCategories;
            // Update localStorage just to keep it somewhat in sync
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        // Apply permissions to ALL non-super-admin users (admin, company, user)
        let perms = currentUser.permissions;
        
        // Aggressively parse stringified JSON (handles double-stringification)
        let loopCount = 0;
        while (typeof perms === 'string' && loopCount < 3) {
            try { 
                perms = JSON.parse(perms); 
            } catch(e) { 
                break; 
            }
            loopCount++;
        }
        
        if (!perms || Array.isArray(perms) || typeof perms !== 'object') {
            perms = {}; // Legacy or no perms
        }
        
        console.log("Enforcing permissions for user:", currentUser.userId, "Parsed Perms:", perms);
        
        const menuItems = document.querySelectorAll('.menu li[onclick^="showSection"]');
        
        menuItems.forEach(li => {
            const sectionMatch = li.getAttribute('onclick').match(/showSection\('([^']+)'\)/);
            if (sectionMatch && sectionMatch[1]) {
                const sectionId = sectionMatch[1];
                // Always show dashboard
                if (sectionId !== 'dashboard') {
                    // Force hide 'Manage Users' for anyone except Super Admin
                    if (sectionId === 'users' && String(currentUser.userId || '').toLowerCase() !== 'admin') {
                        li.style.display = 'none';
                    } else {
                        const sectionRights = perms[sectionId] || [];
                        if (sectionRights.length === 0) {
                            li.style.display = 'none';
                        } else {
                            // Ensure it's visible if it has rights (in case it was hidden)
                            li.style.display = '';
                        }
                        
                        // Enforce Publish/Draft rights
                        if (!sectionRights.includes('Publish')) {
                            restrictPublishForSection(sectionId);
                        }
                    }
                }
            }
        });
    } catch(e) {
        console.error("Error enforcing permissions", e);
    }
};

window.restrictPublishForSection = function(sectionId) {
    const sectionEl = document.getElementById(sectionId);
    if (!sectionEl) return;
    
    const statusSelects = sectionEl.querySelectorAll('select');
    statusSelects.forEach(select => {
        let hasPublish = false;
        Array.from(select.options).forEach(opt => {
            if (opt.value.toLowerCase() === 'publish') {
                opt.style.display = 'none';
                opt.disabled = true;
                hasPublish = true;
            }
        });
        
        if (hasPublish) {
            select.value = 'Draft';
            select.addEventListener('change', (e) => {
                if (e.target.value.toLowerCase() === 'publish') {
                    e.target.value = 'Draft';
                }
            });
        }
    });
};

window.toggleApproval = async function(type, index) {
    let arr = [];
    let saveFunc = null;
    let renderFunc = null;

    if (type === 'deals') {
        arr = deals; saveFunc = DataService.saveDeals; renderFunc = renderDeals;
    } else if (type === 'products') {
        arr = products; saveFunc = DataService.saveProducts; renderFunc = renderAdminProducts;
    } else if (type === 'travel') {
        arr = travelPackages; saveFunc = DataService.saveTravelPackages; renderFunc = renderTravelPackages;
    } else if (type === 'broadcasts') {
        arr = broadcasts; saveFunc = DataService.saveBroadcasts; renderFunc = renderBroadcasts;
    } else if (type === 'blogs') {
        arr = blogs; saveFunc = DataService.saveBlogs; renderFunc = renderBlogs;
    } else if (type === 'banners') {
        arr = banners; saveFunc = DataService.saveBanners; renderFunc = renderBanners;
    }
    
    if (!arr || !arr[index]) return;
    const item = arr[index];
    const isDraft = item.status === 'Draft' || item.dealStatus === 'Draft' || item.prodStatus === 'Draft';
    
    const newStatus = isDraft ? 'Publish' : 'Draft';
    if (item.status !== undefined) item.status = newStatus;
    if (item.dealStatus !== undefined) item.dealStatus = newStatus;
    if (item.prodStatus !== undefined) item.prodStatus = newStatus;
    
    if (saveFunc) await saveFunc(arr);
    if (renderFunc) renderFunc();
    if (typeof updatePendingApprovalsBadge === 'function') updatePendingApprovalsBadge();
};

window.updatePendingApprovalsBadge = function() {
    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) return;
        const currentUser = JSON.parse(currentUserStr);
        const isSuperAdmin = String(currentUser.userId || '').toLowerCase() === 'admin';
        
        if (!isSuperAdmin) {
            // For regular users, we can just show them how many of THEIR posts are pending
            const userName = currentUser.fullName || currentUser.username || currentUser.userId || 'Admin';
            let userPendingCount = 0;
            let userNotifsHtml = '';
            
            const checkUserPending = (arr, name) => {
                const count = arr.filter(item => item.addedBy === userName && (item.status === 'Draft' || item.prodStatus === 'Draft')).length;
                if (count > 0) {
                    userPendingCount += count;
                    userNotifsHtml += `<div style="padding: 10px 15px; border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: white;"><i class="fa-solid fa-clock" style="color: #f39c12; margin-right: 8px;"></i> You have ${count} pending ${name} waiting for approval.</div>`;
                }
            };

            checkUserPending(products, 'Products');
            checkUserPending(deals, 'Deals');
            checkUserPending(travelPackages, 'Travel Packages');
            checkUserPending(banners, 'Banners');
            checkUserPending(broadcasts, 'Broadcasts');

            const topBadge = document.getElementById('topNotificationBadge');
            const notifList = document.getElementById('notificationList');
            if (topBadge) {
                topBadge.style.display = userPendingCount > 0 ? 'inline-block' : 'none';
                topBadge.textContent = userPendingCount;
            }
            if (notifList) {
                notifList.innerHTML = userPendingCount > 0 ? userNotifsHtml : `<div style="padding: 15px; text-align: center; color: #cbd5e1; font-size: 0.9rem;">No new notifications</div>`;
            }

            ['products', 'deals', 'banners', 'blogs', 'broadcasts', 'travel'].forEach(sec => {
                const badge = document.getElementById(sec + 'PendingBadge');
                if (badge) badge.style.display = 'none';
            });
            return;
        }
        
        const counts = {
            products: products.filter(p => p.status === 'Draft' || p.prodStatus === 'Draft').length,
            deals: deals.filter(d => d.status === 'Draft' || d.dealStatus === 'Draft').length,
            banners: banners.filter(b => b.status === 'Draft').length,
            blogs: blogs.filter(b => b.status === 'Draft').length,
            broadcasts: broadcasts.filter(b => b.status === 'Draft').length,
            travel: travelPackages.filter(p => p.status === 'Draft').length
        };
        
        let totalAdminPending = 0;
        let adminNotifsHtml = '';

        Object.keys(counts).forEach(sec => {
            const badge = document.getElementById(sec + 'PendingBadge');
            const count = counts[sec];
            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-block';
                    totalAdminPending += count;
                    adminNotifsHtml += `<div style="padding: 10px 15px; border-bottom: 1px solid var(--border-color); font-size: 0.85rem; cursor: pointer; color: white;" onclick="showSection('${sec}')"><i class="fa-solid fa-exclamation-circle" style="color: #e74c3c; margin-right: 8px;"></i> ${count} pending ${sec} require approval.</div>`;
                } else {
                    badge.style.display = 'none';
                }
            }
        });

        const topBadge = document.getElementById('topNotificationBadge');
        const notifList = document.getElementById('notificationList');
        if (topBadge) {
            topBadge.style.display = totalAdminPending > 0 ? 'inline-block' : 'none';
            topBadge.textContent = totalAdminPending;
        }
        if (notifList) {
            notifList.innerHTML = totalAdminPending > 0 ? adminNotifsHtml : `<div style="padding: 15px; text-align: center; color: #cbd5e1; font-size: 0.9rem;">No new notifications</div>`;
        }
    } catch(e) {
        console.error("Error updating badges", e);
    }
};

window.populateAdminHeader = function() {
    const cUserStr = localStorage.getItem('currentUser');
    if (!cUserStr) return;
    const cUser = JSON.parse(cUserStr);
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    let roleDisplay = cUser.role || 'Admin';
    if (String(cUser.userId || '').toLowerCase() === 'admin') roleDisplay = 'Super Admin';

    const headerName = document.getElementById('headerUserName');
    const headerRole = document.getElementById('headerUserRole');
    const headerPic = document.getElementById('headerUserPic');

    if (headerName) headerName.textContent = userName;
    if (headerRole) headerRole.textContent = roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1);
    if (headerPic) {
        if (cUser.profilePic) {
            headerPic.src = cUser.profilePic;
        } else {
            // Default image with UI-Avatars
            headerPic.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=random';
        }
    }
};

// ---------------------------------------------------------
// LIVE RATES MANAGEMENT
// ---------------------------------------------------------
const liveRatesForm = document.getElementById("liveRatesForm");
if (liveRatesForm) {
    // Populate form with existing data if available
    try {
        const savedRates = localStorage.getItem("stopbuyLiveRates");
        if (savedRates) {
            const parsedRates = JSON.parse(savedRates);
            if (parsedRates.petrol) document.getElementById("adminPetrolPrice").value = parsedRates.petrol;
            if (parsedRates.diesel) document.getElementById("adminDieselPrice").value = parsedRates.diesel;
            if (parsedRates.gold) document.getElementById("adminGoldPrice").value = parsedRates.gold;
            if (parsedRates.updated) document.getElementById("ratesUpdatedTime").value = parsedRates.updated;
        }
    } catch(e) {}

    liveRatesForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const currentTime = new Date().toLocaleString();
        
        const previousRatesStr = localStorage.getItem("stopbuyLiveRates");
        const previousRates = previousRatesStr ? JSON.parse(previousRatesStr) : {};

        const newPetrol = document.getElementById("adminPetrolPrice").value;
        const newDiesel = document.getElementById("adminDieselPrice").value;
        const newGold = document.getElementById("adminGoldPrice").value;

        const ratesData = {
            petrol: newPetrol,
            petrolOld: previousRates.petrol || newPetrol,
            diesel: newDiesel,
            dieselOld: previousRates.diesel || newDiesel,
            gold: newGold,
            goldOld: previousRates.gold || newGold,
            updated: currentTime
        };

        const submitBtn = liveRatesForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

        await DataService.saveLiveRates(ratesData);
        
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Update Rates';
        
        const timeField = document.getElementById("ratesUpdatedTime");
        if (timeField) timeField.value = currentTime;

        alert("Rates Updated Successfully & Synced to Google Sheets!");
    });
}

// Auto show current time on load if not set
const timeField = document.getElementById("ratesUpdatedTime");
if (timeField && !timeField.value) {
   timeField.value = new Date().toLocaleString();
}

// ==========================================
// USER PERFORMANCE & ANALYTICS LOGIC
// ==========================================
let performanceFilter = 'week';
let perfCharts = {};
let performanceTargetUser = null; // For filtering by specific user from Manage Users page



window.showPage = function(pageId) {
    window.showSection(pageId);
    const targetLi = Array.from(document.querySelectorAll('.menu li')).find(li => 
        li.getAttribute('onclick') && li.getAttribute('onclick').includes(pageId)
    );
    if (targetLi) {
        document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
        targetLi.classList.add('active');
    }
};

// Redirect user stats button to performance tab
window.showUserPerformanceStats = function(username) {
    performanceTargetUser = username;
    window.showPage('performance');
};



window.setPerformanceFilter = function(filterType, btn) {
    performanceFilter = filterType;
    performanceTargetUser = null; // reset specific user filter

    // Toggle custom date range selector
    const customContainer = document.getElementById('customDateRangeContainer');
    if (customContainer) {
        if (filterType === 'custom') {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
        }
    }

    // Toggle active class on filter buttons
    document.querySelectorAll('.perf-filter-btn').forEach(b => {
        b.classList.remove('bg-slate-700', 'text-white');
        b.classList.add('text-slate-300');
    });
    
    let targetBtn = btn;
    if (!targetBtn) {
        targetBtn = Array.from(document.querySelectorAll('.perf-filter-btn')).find(b => 
            b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${filterType}'`)
        );
    }
    if (targetBtn) {
        targetBtn.classList.add('bg-slate-700', 'text-white');
        targetBtn.classList.remove('text-slate-300');
    }

    // Sync dropdown select
    const filterSelect = document.getElementById('activityTableFilterSelect');
    if (filterSelect) {
        filterSelect.value = filterType;
    }

    compilePerformanceMetrics();
};

window.applyCustomDateFilter = function() {
    const start = document.getElementById('perfStartDate').value;
    const end = document.getElementById('perfEndDate').value;
    if (!start || !end) {
        alert("Please select both start and end dates.");
        return;
    }
    compilePerformanceMetrics();
};

function parseItemDate(item) {
    if (!item) return new Date(0);
    if (item.createdDate) {
        const d = new Date(item.createdDate);
        if (!isNaN(d.getTime())) return d;
    }
    if (item.id && !isNaN(item.id) && Number(item.id) > 1000000000) {
        return new Date(Number(item.id));
    }
    if (item.date) {
        const dateStr = String(item.date).trim();
        // Handle DD/MM/YYYY or DD-MM-YYYY formats
        const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // 0-indexed month
            const year = parseInt(match[3], 10);
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) return d;
        }
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
    }
    return new Date(0);
}

function isDateInFilterRange(date, filterType, customStart, customEnd) {
    const dTime = date.getTime();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (filterType === 'today') {
        return dTime >= startOfToday;
    } else if (filterType === 'week') {
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        return dTime >= sevenDaysAgo;
    } else if (filterType === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return dTime >= startOfMonth;
    } else if (filterType === '3months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        threeMonthsAgo.setHours(0,0,0,0);
        return dTime >= threeMonthsAgo.getTime();
    } else if (filterType === 'custom') {
        if (!customStart || !customEnd) return true;
        const sTime = new Date(customStart).setHours(0,0,0,0);
        const eTime = new Date(customEnd).setHours(23,59,59,999);
        return dTime >= sTime && dTime <= eTime;
    }
    return true;
}

window.compilePerformanceMetrics = function() {
    // Inputs
    const customStart = document.getElementById('perfStartDate') ? document.getElementById('perfStartDate').value : '';
    const customEnd = document.getElementById('perfEndDate') ? document.getElementById('perfEndDate').value : '';

    // Collect all posts
    const allCategories = categories || [];
    const allProducts = products || [];
    const allDeals = deals || [];
    const allAds = []; // Ad placement logic is coming soon
    const allBanners = banners || [];
    const allBlogs = blogs || [];
    const allBroadcasts = broadcasts || [];
    const allTravel = travelPackages || [];

    // User Label
    const userLabel = document.getElementById('perfTargetUserLabel');
    if (userLabel) {
        if (performanceTargetUser) {
            userLabel.textContent = `User: ${performanceTargetUser}`;
            userLabel.classList.remove('hidden');
        } else {
            userLabel.classList.add('hidden');
        }
    }

    // Get list of all users from user table or user entries
    let userList = users.map(u => ({
        userId: u.userId || u.id || 'N/A',
        username: u.username || u.fullName || u.userId || 'N/A',
        fullName: u.fullName || u.username || u.userId || 'N/A',
        role: u.role || 'user',
        activeDays: u.activeDays || 0,
        lastLogin: u.lastLogin || ''
    }));

    let displayUsers = [...userList];
    if (performanceTargetUser) {
        const targetLower = performanceTargetUser.toLowerCase().trim();
        displayUsers = displayUsers.filter(u => 
            u.username.toLowerCase().trim() === targetLower ||
            u.fullName.toLowerCase().trim() === targetLower ||
            u.userId.toLowerCase().trim() === targetLower
        );
    }

    // Helper to check item author
    const userMatches = (item, user) => {
        const creator = String(item["Post By"] || item.postBy || item.addedBy || '').toLowerCase().trim();
        if (!creator) return false;
        return creator === user.fullName.toLowerCase().trim() || 
               creator === user.username.toLowerCase().trim() || 
               creator === (user.userId || '').toLowerCase().trim();
    };

    // Filter items based on active range
    const filteredCategories = allCategories.filter(item => isDateInFilterRange(parseItemDate(item), performanceFilter, customStart, customEnd));
    const filteredProducts = allProducts.filter(item => isDateInFilterRange(parseItemDate(item), performanceFilter, customStart, customEnd));
    const filteredDeals = allDeals.filter(item => isDateInFilterRange(parseItemDate(item), performanceFilter, customStart, customEnd));
    const filteredAds = allAds.filter(item => isDateInFilterRange(parseItemDate(item), performanceFilter, customStart, customEnd));
    const filteredBanners = allBanners.filter(item => isDateInFilterRange(parseItemDate(item), performanceFilter, customStart, customEnd));
    const filteredBlogs = allBlogs.filter(item => isDateInFilterRange(parseItemDate(item), performanceFilter, customStart, customEnd));
    const filteredBroadcasts = allBroadcasts.filter(item => isDateInFilterRange(parseItemDate(item), performanceFilter, customStart, customEnd));
    const filteredTravel = allTravel.filter(item => isDateInFilterRange(parseItemDate(item), performanceFilter, customStart, customEnd));

    // Prepare lists for charts. If specific user is active, charts show only their breakdown.
    let chartCategories = filteredCategories;
    let chartProducts = filteredProducts;
    let chartDeals = filteredDeals;
    let chartAds = filteredAds;
    let chartBanners = filteredBanners;
    let chartBlogs = filteredBlogs;
    let chartBroadcasts = filteredBroadcasts;
    let chartTravel = filteredTravel;

    if (performanceTargetUser) {
        const targetUserObj = userList.find(u => u.username.toLowerCase() === performanceTargetUser.toLowerCase() || u.fullName.toLowerCase() === performanceTargetUser.toLowerCase() || u.userId.toLowerCase() === performanceTargetUser.toLowerCase()) || {
            username: performanceTargetUser,
            fullName: performanceTargetUser,
            userId: performanceTargetUser
        };
        chartCategories = filteredCategories.filter(item => userMatches(item, targetUserObj));
        chartProducts = filteredProducts.filter(item => userMatches(item, targetUserObj));
        chartDeals = filteredDeals.filter(item => userMatches(item, targetUserObj));
        chartAds = filteredAds.filter(item => userMatches(item, targetUserObj));
        chartBanners = filteredBanners.filter(item => userMatches(item, targetUserObj));
        chartBlogs = filteredBlogs.filter(item => userMatches(item, targetUserObj));
        chartBroadcasts = filteredBroadcasts.filter(item => userMatches(item, targetUserObj));
        chartTravel = filteredTravel.filter(item => userMatches(item, targetUserObj));
    }

    // Compile stats
    let totalCategoriesCount = filteredCategories.length;
    let totalProductsCount = filteredProducts.length;
    let totalDealsCount = filteredDeals.length;
    let totalAdsCount = filteredAds.length;
    let totalBannersCount = filteredBanners.length;
    let totalBlogsCount = filteredBlogs.length;
    let totalBroadcastsCount = filteredBroadcasts.length;
    let totalTravelCount = filteredTravel.length;

    // Map stats per user (always show all users in the table and overall stats)
    const userStats = userList.map(user => {
        const uCategories = filteredCategories.filter(item => userMatches(item, user)).length;
        const uProducts = filteredProducts.filter(item => userMatches(item, user)).length;
        const uDeals = filteredDeals.filter(item => userMatches(item, user)).length;
        const uAds = filteredAds.filter(item => userMatches(item, user)).length;
        const uBanners = filteredBanners.filter(item => userMatches(item, user)).length;
        const uBlogs = filteredBlogs.filter(item => userMatches(item, user)).length;
        const uBroadcasts = filteredBroadcasts.filter(item => userMatches(item, user)).length;
        const uTravel = filteredTravel.filter(item => userMatches(item, user)).length;
        
        return {
            ...user,
            categories: uCategories,
            products: uProducts,
            deals: uDeals,
            ads: uAds,
            banners: uBanners,
            blogs: uBlogs,
            broadcasts: uBroadcasts,
            travel: uTravel,
            total: uCategories + uProducts + uDeals + uAds + uBanners + uBlogs + uBroadcasts + uTravel
        };
    });

    // Update top UI Stat fields (fallback or keep in sync if they exist)
    if (document.getElementById('perfStatProducts')) document.getElementById('perfStatProducts').textContent = totalProductsCount;
    if (document.getElementById('perfStatDeals')) document.getElementById('perfStatDeals').textContent = totalDealsCount;
    if (document.getElementById('perfStatBlogs')) document.getElementById('perfStatBlogs').textContent = totalBlogsCount;
    if (document.getElementById('perfStatBanners')) document.getElementById('perfStatBanners').textContent = totalBannersCount;
    if (document.getElementById('perfStatTravel')) document.getElementById('perfStatTravel').textContent = totalTravelCount;
    if (document.getElementById('perfStatTotal')) {
        document.getElementById('perfStatTotal').textContent = 
            totalCategoriesCount + totalProductsCount + totalDealsCount + totalAdsCount + totalBannersCount + totalBlogsCount + totalBroadcastsCount + totalTravelCount;
    }

    // Render User Activity Summary Table
    const summaryBody = document.getElementById('perfActivitySummaryBody');
    if (summaryBody) {
        if (userStats.length === 0) {
            summaryBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-slate-400">No user performance record found.</td></tr>`;
        } else {
            summaryBody.innerHTML = userStats.map(stat => `
                <tr class="hover:bg-slate-800/20 transition-all duration-150">
                    <td class="py-3 px-4 font-semibold text-white"><span class="cursor-pointer hover:underline text-sky-400 inline-flex items-center gap-1.5" onclick="openUserPostingInvoice('${stat.userId}')">${stat.fullName} <i class="fa-solid fa-file-invoice text-xs opacity-75"></i></span> <span class="text-xs text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded ml-2">${stat.role.toUpperCase()}</span></td>
                    <td class="text-center py-3 px-4 text-violet-400 font-bold">${stat.categories}</td>
                    <td class="text-center py-3 px-4 text-sky-400 font-bold">${stat.products}</td>
                    <td class="text-center py-3 px-4 text-amber-500 font-bold">${stat.deals}</td>
                    <td class="text-center py-3 px-4 text-indigo-400 font-bold">${stat.ads}</td>
                    <td class="text-center py-3 px-4 text-rose-400 font-bold">${stat.banners}</td>
                    <td class="text-center py-3 px-4 text-emerald-400 font-bold">${stat.blogs}</td>
                    <td class="text-center py-3 px-4 text-orange-400 font-bold">${stat.broadcasts}</td>
                    <td class="text-center py-3 px-4 text-fuchsia-400 font-bold">${stat.travel}</td>
                    <td class="text-center py-3 px-4 text-white font-extrabold">${stat.total}</td>
                </tr>
            `).join('');
        }
    }

    // Render Weekly Breakdown Table (Calculated from start of this week)
    const weeklyStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - new Date().getDay());
    const weeklyBody = document.getElementById('perfWeeklyBody');
    if (weeklyBody) {
        const weeklyUserStats = displayUsers.map(user => {
            const wCategories = allCategories.filter(p => userMatches(p, user) && parseItemDate(p) >= weeklyStart).length;
            const wProducts = allProducts.filter(p => userMatches(p, user) && parseItemDate(p) >= weeklyStart).length;
            const wDeals = allDeals.filter(d => userMatches(d, user) && parseItemDate(d) >= weeklyStart).length;
            const wAds = allAds.filter(d => userMatches(d, user) && parseItemDate(d) >= weeklyStart).length;
            const wBanners = allBanners.filter(b => userMatches(b, user) && parseItemDate(b) >= weeklyStart).length;
            const wBlogs = allBlogs.filter(b => userMatches(b, user) && parseItemDate(b) >= weeklyStart).length;
            const wBroadcasts = allBroadcasts.filter(b => userMatches(b, user) && parseItemDate(b) >= weeklyStart).length;
            const wTravel = allTravel.filter(b => userMatches(b, user) && parseItemDate(b) >= weeklyStart).length;
            
            return {
                ...user,
                totalThisWeek: wCategories + wProducts + wDeals + wAds + wBanners + wBlogs + wBroadcasts + wTravel
            };
        });

        weeklyBody.innerHTML = weeklyUserStats.map(stat => {
            const lastLoginText = stat.lastLogin ? new Date(stat.lastLogin).toLocaleString() : 'Never';
            return `
                <tr class="hover:bg-slate-800/20 transition-all duration-150">
                    <td class="py-3 px-4 text-white font-semibold">${stat.fullName}</td>
                    <td class="text-center py-3 px-4 text-emerald-400 font-extrabold">${stat.totalThisWeek} Posts</td>
                    <td class="text-center py-3 px-4 text-amber-400 font-semibold">${stat.activeDays} Days</td>
                    <td class="text-right py-3 px-4 text-slate-400 text-xs">${lastLoginText}</td>
                </tr>
            `;
        }).join('');
    }

    // Render Monthly Breakdown Table (Calculated from start of this month)
    const monthlyStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyBody = document.getElementById('perfMonthlyBody');
    if (monthlyBody) {
        const monthlyUserStats = displayUsers.map(user => {
            const mCategories = allCategories.filter(p => userMatches(p, user) && parseItemDate(p) >= monthlyStart).length;
            const mProducts = allProducts.filter(p => userMatches(p, user) && parseItemDate(p) >= monthlyStart).length;
            const mDeals = allDeals.filter(d => userMatches(d, user) && parseItemDate(d) >= monthlyStart).length;
            const mAds = allAds.filter(d => userMatches(d, user) && parseItemDate(d) >= monthlyStart).length;
            const mBanners = allBanners.filter(b => userMatches(b, user) && parseItemDate(b) >= monthlyStart).length;
            const mBlogs = allBlogs.filter(b => userMatches(b, user) && parseItemDate(b) >= monthlyStart).length;
            const mBroadcasts = allBroadcasts.filter(b => userMatches(b, user) && parseItemDate(b) >= monthlyStart).length;
            const mTravel = allTravel.filter(b => userMatches(b, user) && parseItemDate(b) >= monthlyStart).length;
            
            return {
                ...user,
                totalThisMonth: mCategories + mProducts + mDeals + mAds + mBanners + mBlogs + mBroadcasts + mTravel
            };
        });

        monthlyBody.innerHTML = monthlyUserStats.map(stat => {
            const lastLoginText = stat.lastLogin ? new Date(stat.lastLogin).toLocaleString() : 'Never';
            return `
                <tr class="hover:bg-slate-800/20 transition-all duration-150">
                    <td class="py-3 px-4 text-white font-semibold">${stat.fullName}</td>
                    <td class="text-center py-3 px-4 text-sky-400 font-extrabold">${stat.totalThisMonth} Posts</td>
                    <td class="text-center py-3 px-4 text-amber-400 font-semibold">${stat.activeDays} Days</td>
                    <td class="text-right py-3 px-4 text-slate-400 text-xs">${lastLoginText}</td>
                </tr>
            `;
        }).join('');
    }

    // Render Charts using compiled stats
    renderPerformanceCharts(userStats, chartCategories, chartProducts, chartDeals, chartAds, chartBanners, chartBlogs, chartBroadcasts, chartTravel);
};

function getWeekDaysData(filteredItems) {
    const daysData = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    filteredItems.forEach(item => {
        const d = parseItemDate(item);
        daysData[d.getDay()]++;
    });
    // Shift so Mon is first: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const sun = daysData.shift();
    daysData.push(sun);
    return daysData;
}

window.renderPerformanceCharts = function(userStats, filteredCategories, filteredProducts, filteredDeals, filteredAds, filteredBanners, filteredBlogs, filteredBroadcasts, filteredTravel) {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded. Skipping rendering of performance charts.");
        return;
    }

    // 1. Weekly User Activity grouped daily count
    try {
        const weeklyCtx = document.getElementById('weeklyActivityChart');
        if (weeklyCtx) {
            if (perfCharts.weekly) perfCharts.weekly.destroy();
            
            const catWeek = getWeekDaysData(filteredCategories);
            const prodWeek = getWeekDaysData(filteredProducts);
            const dealWeek = getWeekDaysData(filteredDeals);
            const adWeek = getWeekDaysData(filteredAds);
            const bannerWeek = getWeekDaysData(filteredBanners);
            const blogWeek = getWeekDaysData(filteredBlogs);
            const broadcastWeek = getWeekDaysData(filteredBroadcasts);
            const travelWeek = getWeekDaysData(filteredTravel);

            perfCharts.weekly = new Chart(weeklyCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        { label: 'Categories', data: catWeek, backgroundColor: '#8b5cf6' },
                        { label: 'Products', data: prodWeek, backgroundColor: '#3b82f6' },
                        { label: 'Deals', data: dealWeek, backgroundColor: '#f59e0b' },
                        { label: 'Place Ads', data: adWeek, backgroundColor: '#6366f1' },
                        { label: 'Banners', data: bannerWeek, backgroundColor: '#f43f5e' },
                        { label: 'Blogs', data: blogWeek, backgroundColor: '#10b981' },
                        { label: 'Broadcast', data: broadcastWeek, backgroundColor: '#f97316' },
                        { label: 'Travel', data: travelWeek, backgroundColor: '#d946ef' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: '#cbd5e1' }, grid: { display: false } },
                        y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    plugins: { legend: { labels: { color: '#cbd5e1' } } }
                }
            });
        }
    } catch (e) {
        console.error("Error rendering weeklyActivityChart:", e);
    }

    // 2. Monthly User Activity weekly group breakdown
    try {
        const monthlyCtx = document.getElementById('monthlyActivityChart');
        if (monthlyCtx) {
            if (perfCharts.monthly) perfCharts.monthly.destroy();

            // Split month into 4 weeks
            const weeksData = [0, 0, 0, 0]; // Week 1, 2, 3, 4
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

            const allFiltered = [...filteredProducts, ...filteredDeals, ...filteredBlogs, ...filteredBanners];
            allFiltered.forEach(item => {
                const date = parseItemDate(item);
                if (date.getTime() >= startOfMonth) {
                    const day = date.getDate();
                    if (day <= 7) weeksData[0]++;
                    else if (day <= 14) weeksData[1]++;
                    else if (day <= 21) weeksData[2]++;
                    else weeksData[3]++;
                }
            });

            perfCharts.monthly = new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Total Posts',
                        data: weeksData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: '#cbd5e1' }, grid: { display: false } },
                        y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    plugins: { legend: { labels: { color: '#cbd5e1' } } }
                }
            });
        }
    } catch (e) {
        console.error("Error rendering monthlyActivityChart:", e);
    }

    // 3. Top 5 Performers Bar Chart
    try {
        const topCtx = document.getElementById('topPerformersChart');
        if (topCtx) {
            if (perfCharts.topPerformers) perfCharts.topPerformers.destroy();

            // Sort and slice top 5
            const sortedPerformers = [...userStats].sort((a, b) => b.total - a.total).slice(0, 5);
            const labels = sortedPerformers.map(p => p.fullName);
            const totals = sortedPerformers.map(p => p.total);

            perfCharts.topPerformers = new Chart(topCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Activity Count',
                        data: totals,
                        backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#cbd5e1' }, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    } catch (e) {
        console.error("Error rendering topPerformersChart:", e);
    }

    // 4. User-wise Pie Chart
    try {
        const pieCtx = document.getElementById('userPieChart');
        if (pieCtx) {
            if (perfCharts.pie) perfCharts.pie.destroy();

            const activeUsers = userStats.filter(p => p.total > 0);
            const hasActivity = activeUsers.length > 0;
            const labels = hasActivity ? activeUsers.map(p => p.fullName) : userStats.map(p => p.fullName);
            const totals = hasActivity ? activeUsers.map(p => p.total) : userStats.map(p => 0);

            perfCharts.pie = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: labels.length > 0 ? labels : ['No Users'],
                    datasets: [{
                        data: totals.length > 0 ? totals : [0],
                        backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: '#cbd5e1' }
                        }
                    }
                }
            });
        }
    } catch (e) {
        console.error("Error rendering userPieChart:", e);
    }
};

// --- USER POSTING DETAILS INVOICE MODAL LOGIC ---
let currentInvoiceUser = null;

window.openUserPostingInvoice = function(username) {
    currentInvoiceUser = username;
    const modal = document.getElementById('userInvoiceModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    
    // Set default select to This Month
    const filterSelect = document.getElementById('invoiceFilterSelect');
    if (filterSelect) {
        filterSelect.value = 'month';
        document.getElementById('invoiceCustomDateRange').classList.add('hidden');
    }
    
    document.getElementById('invoiceGenerationDate').textContent = new Date().toLocaleString();
    
    recalculateInvoice();
};

window.closeUserInvoiceModal = function() {
    const modal = document.getElementById('userInvoiceModal');
    if (modal) modal.classList.add('hidden');
};

window.onInvoiceFilterChange = function() {
    const val = document.getElementById('invoiceFilterSelect').value;
    const customContainer = document.getElementById('invoiceCustomDateRange');
    if (val === 'custom') {
        customContainer.classList.remove('hidden');
    } else {
        customContainer.classList.add('hidden');
        recalculateInvoice();
    }
};

window.onInvoiceCustomDateChange = function() {
    recalculateInvoice();
};

window.recalculateInvoice = function() {
    if (!currentInvoiceUser) return;
    
    // Construct userList from global users array so it is in scope
    const userList = users.map(u => ({
        ...u,
        userId: u.userId || u.id || 'N/A',
        username: u.username || u.fullName || u.userId || 'N/A',
        fullName: u.fullName || u.username || u.userId || 'N/A',
        role: u.role || 'user',
        activeDays: u.activeDays || 0,
        lastLogin: u.lastLogin || ''
    }));

    // Find the user object
    const user = userList.find(u => String(u.userId).toLowerCase() === currentInvoiceUser.toLowerCase()) || {
        username: currentInvoiceUser,
        fullName: currentInvoiceUser,
        role: 'user',
        userId: currentInvoiceUser,
        permissions: {},
        charges: 0
    };
    
    document.getElementById('invoiceUserFullName').textContent = `User: ${user.fullName}`;
    document.getElementById('invoiceUserName').textContent = user.username;
    document.getElementById('invoiceUserRole').textContent = user.role.toUpperCase();
    
    // Normalize permissions string/object safely
    let perms = user.permissions;
    if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch(e) { perms = {}; }
    }
    if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
        perms = {};
    }
    user.permissions = perms;

    // Sync charges from permissions
    const userRate = perms.charges !== undefined ? parseFloat(perms.charges) : (user.charges !== undefined ? parseFloat(user.charges) : 0);
    const rateEl = document.getElementById('invoiceUserRatePerPost');
    if (rateEl) rateEl.textContent = `Rs. ${userRate}`;
    const rateFooterEl = document.getElementById('invoiceRatePerPostFooter');
    if (rateFooterEl) rateFooterEl.textContent = userRate;
    
    // Get invoice filter settings
    const filterType = document.getElementById('invoiceFilterSelect').value;
    const customStart = document.getElementById('invoiceStartDate').value;
    const customEnd = document.getElementById('invoiceEndDate').value;
    
    // Get all items in selected range matching this user
    const userMatches = (item) => {
        const creator = String(item["Post By"] || item.postBy || item.addedBy || '').toLowerCase().trim();
        if (!creator) return false;
        return creator === user.fullName.toLowerCase().trim() || 
               creator === user.username.toLowerCase().trim() || 
               creator === (user.userId || '').toLowerCase().trim();
    };
    
    const filterByDate = (items) => {
        return items.filter(item => isDateInFilterRange(parseItemDate(item), filterType, customStart, customEnd));
    };
    
    const userCategories = filterByDate(categories || []).filter(userMatches);
    const userProducts = filterByDate(products || []).filter(userMatches);
    const userDeals = filterByDate(deals || []).filter(userMatches);
    const userAds = filterByDate([]).filter(userMatches); // Placeholder for Ads
    const userBanners = filterByDate(banners || []).filter(userMatches);
    const userBlogs = filterByDate(blogs || []).filter(userMatches);
    const userBroadcasts = filterByDate(broadcasts || []).filter(userMatches);
    const userTravel = filterByDate(travelPackages || []).filter(userMatches);
    
    const getNamesList = (items) => {
        if (items.length === 0) return `<span class="text-slate-500 italic">No posts</span>`;
        return items.map(item => {
            const name = item.name || item.title || item.subCategory || item.id || 'Unnamed';
            const date = parseItemDate(item);
            const dateStr = date.getTime() > 0 ? date.toLocaleDateString() : 'N/A';
            return `<span class="inline-block bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700/50 mr-1.5 mb-1.5">${name} (${dateStr})</span>`;
        }).join('');
    };
    
    const sections = [
        { name: 'Categories', count: userCategories.length, details: getNamesList(userCategories) },
        { name: 'Products', count: userProducts.length, details: getNamesList(userProducts) },
        { name: 'Deals', count: userDeals.length, details: getNamesList(userDeals) },
        { name: 'Place Ads', count: userAds.length, details: getNamesList(userAds) },
        { name: 'Banners', count: userBanners.length, details: getNamesList(userBanners) },
        { name: 'Blogs', count: userBlogs.length, details: getNamesList(userBlogs) },
        { name: 'Broadcast', count: userBroadcasts.length, details: getNamesList(userBroadcasts) },
        { name: 'Travel', count: userTravel.length, details: getNamesList(userTravel) }
    ];
    
    let total = 0;
    const body = document.getElementById('invoiceTableBody');
    body.innerHTML = sections.map(sec => {
        total += sec.count;
        return `
            <tr>
                <td class="py-3 px-4 font-semibold text-white">${sec.name}</td>
                <td class="py-3 px-4 text-center font-bold text-sky-400">${sec.count}</td>
                <td class="py-3 px-4 text-xs">${sec.details}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('invoiceTotalCount').textContent = total;
    const paymentEl = document.getElementById('invoiceTotalPayment');
    if (paymentEl) paymentEl.textContent = `Rs. ${(total * userRate).toFixed(2)}`;
};

window.printUserInvoice = function() {
    window.print();
};

