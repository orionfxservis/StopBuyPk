// Admin Logic

// Initial Data Loading
let categories = [];
let products = [];
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

        updateUI();
        renderBanners();
        renderDeals();
        renderUsers();
        if (typeof renderBlogs === "function") renderBlogs(); else window.renderBlogs();
        renderTravelPackages(); // New function for travel
        renderBroadcasts();
        renderAdminProducts(); // New function for products
        populateCategoryDropdown(); // New function for form

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

    // Render Categories
    if (categoryList) {
        categoryList.innerHTML = categories.map((cat, index) => {
            const fields = cat.fields || [];
            const fieldBadges = fields.map(f => `<span class="badge">${f.name} <small>(${f.type})</small></span>`).join(' ');
            const isChecked = cat.showOnMainPage !== false ? 'checked' : '';
            return `
            <tr>
                <td>${cat.name}</td>
                
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


        // Harvest fields
        const fieldRows = document.querySelectorAll('.field-row');
        const fields = Array.from(fieldRows).map(row => ({
            name: row.querySelector('.field-name').value,
            type: row.querySelector('.field-type').value
        })).filter(f => f.name.trim() !== "");

        if (editIndex === -1) {
            // Create
            categories.push({ name, fields, showOnMainPage: true });
        } else {
            // Update
            categories[editIndex].name = name;
            categories[editIndex].fields = fields;
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
}

function renderBanners() {
    if (!bannerList) return;
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

        return `
        <div class="banner-item">
            <div style="margin-bottom: 5px;">
                <span class="badge" style="background:#0ea5e9; color:white; border-color:#0ea5e9;">${displayType === 'vertical' ? 'Vertical Banner' : 'Horizontal Banner'}</span>
            </div>
            <img src="${banner.image}" alt="Banner" style="${displayType === 'vertical' ? 'object-fit: contain; max-height: 150px;' : ''}">
            ${displayLink ? `<a href="${displayLink}" target="_blank" class="banner-link"><i class="fa-solid fa-link"></i> ${displayLink}</a>` : ''}
            <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
                <button class="edit-btn" onclick="editBanner(${index})"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="delete-btn" onclick="deleteBanner(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
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

            // Workaround: Backend might drop the 'type' field, so we pack it into the 'link' field
            const link = `${type}|${rawLink}`;

            if (bannerEditIndex === -1) {
                banners.push({ image, link, type });
            } else {
                banners[bannerEditIndex] = { image, link, type };
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
}

function renderDeals() {
    if (!dealList) return;
    dealList.innerHTML = deals.map((deal, index) => `
        <div class="product-row" style="grid-template-columns: 80px 2fr 1fr 100px;">
            <img src="${deal.image}" alt="${deal.name}" style="width: 100%; height: 60px; object-fit: cover; border-radius: 8px;">
            <div>
                <strong>${deal.name}</strong><br>
                <small style="color: #aaa;">${deal.desc}</small>
            </div>
            <div>
                <span style="color: var(--primary-color); font-weight:bold;">${deal.price}</span><br>
                <small><i class="fa-solid fa-location-dot"></i> ${deal.location}</small>
            </div>
            <div>
                <button class="edit-btn" onclick="editDeal(${index})"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteDeal(${index})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
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

        const newDeal = {
            id: dealEditIndex === -1 ? Date.now() : deals[dealEditIndex].id,
            name: document.getElementById('dealName').value,
            image: document.getElementById('dealImage').value,
            desc: document.getElementById('dealDesc').value,
            price: document.getElementById('dealPrice').value,
            location: document.getElementById('dealLocation').value,
            whatsapp: document.getElementById('dealWhatsapp').value,
            video: document.getElementById('dealVideo').value
        };

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
    await DataService.saveUsers(users);
    renderUsers();
}

function renderUsers() {
    if (!userList) return;
    userList.innerHTML = users.map((u, index) => {
        const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.fullName || 'User') + '&background=e2e8f0&color=475569';
        return `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${u.pic || fallbackAvatar}" alt="Pic" class="avatar" onerror="this.src='${fallbackAvatar}'">
                    <div>
                        <span class="line-1">${u.fullName || 'N/A'}</span>
                        ${u.role === 'company' && u.companyName ? `<span class="line-2">${u.companyName}</span>` : ''}
                    </div>
                </div>
            </td>
            <td>
                <span class="line-1">${u.userId || 'N/A'}</span>
                <span class="line-2">pwd: **********</span>
            </td>
            <td>
                <span class="line-1 badge" style="background:#f1f5f9; color:#475569; margin-bottom:4px;">${u.role.toUpperCase()}</span><br>
                <span class="line-2 badge" style="background:${u.status === 'active' ? '#dcfce7' : '#fef08a'}; color:${u.status === 'active' ? '#166534' : '#854d0e'};">${u.status}</span>
            </td>
            <td>
                <button class="edit-btn" onclick="editUser(${index})"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteUser(${index})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
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
        
        const newUser = {
            id: userEditIndex === -1 ? Date.now() : users[userEditIndex].id,
            pic: document.getElementById('userPic').value,
            fullName: document.getElementById('userName').value, // 'userName' input maps to fullName
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
    document.getElementById('userName').value = u.fullName || u.username || '';
    document.getElementById('userId').value = u.userId || '';
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
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    try { if (typeof event !== 'undefined' && event && event.currentTarget) { event.currentTarget.classList.add('active'); } } catch (e) { }
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
    const prodCategorySelect = document.getElementById('prodCategory');
    if (prodCategorySelect) {
        const uniqueCategories = [...new Set(categories.map(c => c.name))];
        const currentSelection = prodCategorySelect.value;

        prodCategorySelect.innerHTML = '<option value="">Select Category</option>' +
            uniqueCategories.map(name => `<option value="${name}">${name}</option>`).join('');

        if (uniqueCategories.includes(currentSelection)) {
            prodCategorySelect.value = currentSelection;
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
                    <label>Qty</label>
                    <select id="prodQty" class="dynamic-admin-field" required>
                        <option value="Nos">Nos</option>
                        <option value="Qtr">Qtr</option>
                        <option value="Half">Half</option>
                        <option value="Full">Full</option>
                        <option value="Half Kg">Half Kg</option>
                        <option value="1 Kg">1 Kg</option>
                        <option value="2 Kg">2 Kg</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Price (Rs.)</label>
                    <input type="number" id="prodPrice" class="dynamic-admin-field" placeholder="e.g., 1500" required>
                </div>
            </div>

            <div class="form-row">
                <div class="input-group">
                    <label>Brand</label>
                    <input type="text" id="prodBrand" class="dynamic-admin-field" placeholder="Brand Name">
                </div>
                <div class="input-group">
                    <label>Contact No</label>
                    <input type="text" id="prodContact" class="dynamic-admin-field" placeholder="0300-1234567">
                </div>
            </div>

            <div class="form-row">
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
        `;
    }
}

// Add event listeners to redraw when category or subcategory changes
document.addEventListener('DOMContentLoaded', () => {
    const pCat = document.getElementById('prodCategory');
    const pSub = document.getElementById('prodSubCategory');
    if (pCat) pCat.addEventListener('change', renderDynamicAdminFields);
    if (pSub) pSub.addEventListener('change', renderDynamicAdminFields);
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

        let newProduct = {
            id: productEditIndex === -1 ? Date.now() : products[productEditIndex].id,
            category: category,
            subCategory: subCategory,
            image: document.getElementById('prodImage').value || (productEditIndex !== -1 ? products[productEditIndex].image : 'https://via.placeholder.com/150'),
            addedBy: productEditIndex === -1 ? 'Admin' : (products[productEditIndex].addedBy || 'Admin')
        };

        // Extract native dynamic field values
        document.querySelectorAll('.dynamic-admin-field').forEach(field => {
            // Remove 'prod' prefix if present for cleaner keys, or just map IDs
            let key = field.id.replace('prod', '');
            key = key.charAt(0).toLowerCase() + key.slice(1);
            newProduct[key] = field.value;
        });

        // Ensure name is set for generic layout consistency
        if (!newProduct.name && document.getElementById('prodName')) {
            newProduct.name = document.getElementById('prodName').value;
        }
        if (!newProduct.price && document.getElementById('prodPrice')) {
            newProduct.price = document.getElementById('prodPrice').value;
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
        } catch (error) {
            alert('Failed to save product. Check internet connection or Google Script logs.');
            console.error('Save product error:', error);
            if (productEditIndex === -1) products.pop(); // Remove the failed product locally
        }
    });
}

function renderAdminProducts() {
    const adminProductList = document.getElementById('adminProductList');
    if (adminProductList) {
        adminProductList.innerHTML = products.map((prod, index) => {
            let details = prod.variety || '';
            if (prod.category === 'Vehicles' || prod.category === 'Vehicle') {
                details = `${prod.year || ''} Model | ${prod.kMs || prod.kms || 0} km`;
            } else if (prod.category === 'Mobiles') {
                details = `${prod.specification || ''} | ${prod.batteryBackup ? prod.batteryBackup + 'mAh' : ''}`;
            }

            return `
            <div class="product-row">
                <img src="${prod.image}" alt="${prod.name}">
                <div>${prod.name}<br><small>${details}</small></div>
                <div>${prod.category} <br> <small>${prod.subCategory}</small></div>
                <div style="color: var(--primary-color)">Rs. ${prod.price}</div>
                <div>
                   <button class="edit-btn" onclick="editProduct(${index})"><i class="fa-solid fa-pen"></i></button>
                   <button class="delete-btn" onclick="deleteProduct(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            `;
        }).join('');
    }
}

window.deleteProduct = async (index) => {
    if (confirm('Delete this product?')) {
        products.splice(index, 1);
        await DataService.saveProducts(products);
        renderAdminProducts();
        updateUI();
    }
};

window.editProduct = (index) => {
    productEditIndex = index;
    const prod = products[index];

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
}

function renderTravelPackages() {
    if (!travelList) return;
    travelList.innerHTML = travelPackages.map((pkg, index) => {
        let displayStatus = pkg.status || 'Publish';
        let displayType = pkg.listingType || 'Basic';
        let isFeatured = displayType === 'Featured';

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
                <button class="edit-btn" onclick="editTravel(${index})" style="padding: 5px; margin-bottom: 2px;"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteTravel(${index})" style="padding: 5px;"><i class="fa-solid fa-trash"></i></button>
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
            status: document.getElementById('travelStatus').value
        };

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
}

function renderBroadcasts() {
    if (broadcastList) {
        broadcastList.innerHTML = broadcasts.map((b, index) => `
            <div class="grid-table-row" style="grid-template-columns: 1fr 2fr 100px 100px 100px; display: grid; gap: 10px; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color);">
                <div><span class="badge" style="background:#3498db; color:white;">${b.target === 'all' ? 'All Users' : b.targetUser || 'Specific'}</span></div>
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.message}</div>
                <div>${b.date || new Date().toISOString().split('T')[0]}</div>
                <div><span class="badge" style="background:${b.status === 'active' ? '#2ecc71' : '#e74c3c'}; color:white;">${b.status}</span></div>
                <div>
                    <button class="edit-btn" onclick="editBroadcast(${index})"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" onclick="deleteBroadcast(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
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

        const newBroadcast = {
            id: broadcastEditIndex === -1 ? Date.now() : broadcasts[broadcastEditIndex].id,
            message: document.getElementById('broadcastMessage').value,
            target: document.getElementById('broadcastAudience').value,
            targetUser: document.getElementById('broadcastSpecificUser') ? document.getElementById('broadcastSpecificUser').value : '',
            status: document.getElementById('broadcastStatus').value,
            date: new Date().toISOString().split('T')[0]
        };

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


// --- Travel Package Functions ---
let travelEditIndex = -1;
const travelForm = document.getElementById('travelForm');
const travelList = document.getElementById('travelList');
const travelFormTitle = document.getElementById('travelFormTitle');
const btnCancelTravel = document.getElementById('btnCancelTravel');
const btnSaveTravel = document.getElementById('btnSaveTravel');

async function saveTravelData() {
    await DataService.saveTravelPackages(travelPackages);
    renderTravelPackages();
}

function renderTravelPackages() {
    if (!travelList) return;
    travelList.innerHTML = travelPackages.map((pkg, index) => {
        return `
        <div class="grid-table-row" style="grid-template-columns: 80px 2fr 1fr 1fr 1fr 1fr 80px; display: grid; gap: 10px; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color);">
            <div><img src="${pkg.image}" style="width:100%; height:60px; object-fit:cover; border-radius:8px;"></div>
            <div>
                <strong>${pkg.title}</strong><br>
                <small style="color:var(--primary-color);">${pkg.company}</small>
            </div>
            <div>${pkg.category}</div>
            <div>${pkg.duration} Days</div>
            <div>Rs. ${pkg.price} <small>(${pkg.priceType})</small></div>
            <div>
                <span class="badge" style="background:${pkg.status === 'Publish' ? '#2ecc71' : '#f39c12'}; color:white;">${pkg.status}</span><br>
                <span class="badge" style="background:${pkg.listingType === 'Featured' ? '#9b59b6' : '#95a5a6'}; color:white; margin-top:2px;">${pkg.listingType}</span>
            </div>
            <div>
                <button class="edit-btn" onclick="editTravel(${index})"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteTravel(${index})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        `;
    }).join('');
}

async function deleteTravel(index) {
    if (confirm('Delete this Travel Package?')) {
        travelPackages.splice(index, 1);
        await saveTravelData();
    }
}

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
    
    // Checkboxes for transport
    const transportOptions = pkg.transport ? pkg.transport.split(', ') : [];
    document.querySelectorAll('input[name="transportOption"]').forEach(cb => {
        cb.checked = transportOptions.includes(cb.value);
    });

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

    document.getElementById('travel').scrollIntoView({ behavior: 'smooth' });
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

        const transportChecked = Array.from(document.querySelectorAll('input[name="transportOption"]:checked')).map(cb => cb.value).join(', ');

        const newPkg = {
            id: travelEditIndex === -1 ? Date.now() : travelPackages[travelEditIndex].id,
            title: document.getElementById('travelTitle').value,
            category: document.getElementById('travelCategory').value,
            departure: document.getElementById('travelDeparture').value,
            destination: document.getElementById('travelDestination').value,
            duration: document.getElementById('travelDuration').value,
            price: document.getElementById('travelPrice').value,
            priceType: document.getElementById('travelPriceType').value,
            transport: transportChecked,
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
            status: document.getElementById('travelStatus').value
        };

        if (travelEditIndex === -1) {
            travelPackages.push(newPkg);
        } else {
            travelPackages[travelEditIndex] = newPkg;
            cancelTravelEdit();
        }

        await saveTravelData();
        if (travelEditIndex === -1) {
            travelForm.reset();
        }
        alert('Travel Package saved successfully!');
    });
}

// --- Fallback Stub Functions ---
    window.renderBlogs = function () { console.log('renderBlogs not implemented yet'); };
}
if (typeof renderAds !== 'function') {
    window.renderAds = function () { console.log('renderAds not implemented yet'); };
}
if (typeof renderDailyPrices !== 'function') {
    window.renderDailyPrices = function () { console.log('renderDailyPrices not implemented yet'); };
}
