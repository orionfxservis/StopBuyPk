// Admin Logic

// Initial Data Loading
let categories = [];
let products = [];

// Product Filters & Pagination state
let prodSearchQuery = "";
let prodFilterCategory = "";
let prodFilterPostBy = "";
let prodCurrentPage = 1;
const prodPageSize = 25;
let sellerCurrentPage = 1;
const sellerPageSize = 25;
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
let sellers = [];
let sellerEditIndex = -1;

function hasPublishPermission(cUser, section) {
    if (!cUser || !cUser.userId) return false;
    if (String(cUser.userId).toLowerCase() === 'admin') return true;

    let perms = cUser.permissions;
    let loopCount = 0;
    while (typeof perms === 'string' && loopCount < 3) {
        try { perms = JSON.parse(perms); } catch (e) { break; }
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
        const [categoriesRes, productsRes, bannersRes, dealsRes, usersRes, blogsRes, travelRes, broadcastsRes, sellersRes] = await Promise.all([
            DataService.getCategories(),
            DataService.getProducts(),
            DataService.getBanners(),
            DataService.getDeals(),
            DataService.getUsers(),
            DataService.getBlogs(),
            DataService.getTravelPackages(),
            DataService.getBroadcasts(),
            DataService.getSellers()
        ]);

        categories = categoriesRes || [];
        products = productsRes || [];
        banners = bannersRes || [];
        deals = dealsRes || [];
        users = usersRes || [];
        blogs = blogsRes || [];
        travelPackages = travelRes || [];
        broadcasts = broadcastsRes || [];
        sellers = sellersRes || [];

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
                        try { daysList = JSON.parse(daysList); } catch (e) { daysList = []; }
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
        renderSellers();
        if (typeof populateSellersDatalist === 'function') populateSellersDatalist();
        generateSellerId();
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
        if (typeof window.initAddressDropdowns === 'function') {
            window.initAddressDropdowns();
        }
    } catch (error) {
        console.error("Failed to load admin data:", error);
        alert("Failed to load admin data from database: " + error.message);
    }
}

// Handler for background loaded cache data
window.onBackgroundDataLoaded = function (type, data) {
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
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

    // Update Stats
    if (typeof totalCategoriesEl !== 'undefined' && totalCategoriesEl) totalCategoriesEl.textContent = categories.length;
    const totalProdEl = document.getElementById('totalProducts');
    if (totalProdEl) totalProdEl.textContent = (products || []).length;
    const totalSellerEl = document.getElementById('totalSellers');
    if (totalSellerEl) totalSellerEl.textContent = (sellers || []).length;
    const totalCompEl = document.getElementById('totalCompanies');
    if (totalCompEl) totalCompEl.textContent = (sellers || []).length;
    const totalUserEl = document.getElementById('totalUsers');
    if (totalUserEl) totalUserEl.textContent = (users || []).length;

    populateCategoryDropdown(); // Keep product dropdowns in sync
    populateCategoryAssignGrid(); // Keep assignment grid in sync

    // Render Categories
    if (categoryList) {
        const mappedCategories = categories.map((cat, index) => ({ cat, index }));
        const filteredCategories = isSuperAdmin ? mappedCategories : mappedCategories.filter(x => x.cat.addedBy === userName);

        categoryList.innerHTML = filteredCategories.map(item => {
            const { cat, index } = item;
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
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && categories[index] && categories[index].addedBy !== userName) {
        alert("You are not authorized to delete this category.");
        return;
    }
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
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && categories[index] && categories[index].addedBy !== userName) {
        alert("You are not authorized to edit this category.");
        return;
    }
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

    const mappedBanners = banners.map((banner, index) => ({ banner, index }));
    const filteredBanners = isSuperAdmin ? mappedBanners : mappedBanners.filter(x => x.banner.addedBy === userName);

    bannerList.innerHTML = filteredBanners.map(item => {
        const { banner, index } = item;
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
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && banners[index] && banners[index].addedBy !== userName) {
        alert("You are not authorized to delete this banner.");
        return;
    }
    if (confirm('Delete this banner?')) {
        banners.splice(index, 1);
        await saveBanners();
    }
}

window.editBanner = (index) => {
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && banners[index] && banners[index].addedBy !== userName) {
        alert("You are not authorized to edit this banner.");
        return;
    }
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
            if (String(cUser.userId).toLowerCase() !== 'admin') {
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

let dealSearchQuery = "";
let dealFilterCategory = "";
let dealFilterSubCategory = "";
let dealFilterPostBy = "";

function populateDealFilterOptions() {
    const catSelect = document.getElementById('dealFilterCategory');
    const subSelect = document.getElementById('dealFilterSubCategory');
    const postSelect = document.getElementById('dealFilterPostBy');
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';

    if (catSelect) {
        const uniqueCats = [...new Set(deals.map(d => d.category).filter(Boolean))];
        const currentVal = catSelect.value;
        catSelect.innerHTML = '<option value="">All Categories</option>' +
            uniqueCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        catSelect.value = uniqueCats.includes(currentVal) ? currentVal : '';
    }
    if (subSelect) {
        const uniqueSubs = [...new Set(deals.map(d => d.subCategory).filter(Boolean))];
        const currentVal = subSelect.value;
        subSelect.innerHTML = '<option value="">All Sub Categories</option>' +
            uniqueSubs.map(sub => `<option value="${sub}">${sub}</option>`).join('');
        subSelect.value = uniqueSubs.includes(currentVal) ? currentVal : '';
    }
    if (postSelect) {
        if (!isSuperAdmin) {
            postSelect.style.display = 'none';
        } else {
            postSelect.style.display = '';
            const uniquePosts = [...new Set(deals.map(d => d.addedBy || 'Admin').filter(Boolean))];
            const currentVal = postSelect.value;
            postSelect.innerHTML = '<option value="">All Authors</option>' +
                uniquePosts.map(post => `<option value="${post}">${post}</option>`).join('');
            postSelect.value = uniquePosts.includes(currentVal) ? currentVal : '';
        }
    }
}

window.resetDealFilters = function () {
    dealSearchQuery = "";
    dealFilterCategory = "";
    dealFilterSubCategory = "";
    dealFilterPostBy = "";

    const searchInput = document.getElementById('dealSearchInput');
    const catSelect = document.getElementById('dealFilterCategory');
    const subSelect = document.getElementById('dealFilterSubCategory');
    const postSelect = document.getElementById('dealFilterPostBy');

    if (searchInput) searchInput.value = "";
    if (catSelect) catSelect.value = "";
    if (subSelect) subSelect.value = "";
    if (postSelect) postSelect.value = "";

    renderDeals();
};

function renderDeals() {
    if (!dealList) return;
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';

    // Update dynamic options in dropdowns first
    populateDealFilterOptions();

    // Map deals to keep their original index
    const mappedDeals = deals.map((deal, index) => ({ deal, index }));

    // Apply filters
    const filteredDeals = mappedDeals.filter(item => {
        const { deal } = item;

        // Only show own deals if not super admin
        if (!isSuperAdmin && deal.addedBy !== userName) {
            return false;
        }

        // Search filter
        if (dealSearchQuery) {
            const nameMatch = String(deal.name || '').toLowerCase().includes(dealSearchQuery);
            const brandMatch = String(deal.brand || '').toLowerCase().includes(dealSearchQuery);
            const descMatch = String(deal.desc || '').toLowerCase().includes(dealSearchQuery);
            const catMatch = String(deal.category || '').toLowerCase().includes(dealSearchQuery);
            const subCatMatch = String(deal.subCategory || '').toLowerCase().includes(dealSearchQuery);
            if (!nameMatch && !brandMatch && !descMatch && !catMatch && !subCatMatch) {
                return false;
            }
        }

        // Category filter
        if (dealFilterCategory && deal.category !== dealFilterCategory) {
            return false;
        }

        // Subcategory filter
        if (dealFilterSubCategory && deal.subCategory !== dealFilterSubCategory) {
            return false;
        }

        // Author filter
        if (dealFilterPostBy && (deal.addedBy || 'Admin') !== dealFilterPostBy) {
            return false;
        }

        return true;
    });

    dealList.innerHTML = filteredDeals.map(item => {
        const { deal, index } = item;
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
        <div class="product-row" style="grid-template-columns: 80px 1.2fr 1.2fr 2fr 1.2fr 150px 1.2fr; align-items: center; gap: 10px;">
            <img src="${deal.image}" alt="${deal.name}">
            <div>${deal.category || '-'}</div>
            <div>${deal.subCategory || '-'}</div>
            <div>${deal.name || '-'}</div>
            <div style="color: var(--primary-color)">Rs. ${deal.price || '-'}</div>
            <div style="display: flex; gap: 5px; align-items: center; white-space: nowrap;">
                ${actionButtons}
            </div>
            <div style="font-size: 0.85rem; color: #ffffff; font-weight: 600;">${deal.addedBy || 'Admin'}</div>
        </div>
        `;
    }).join('');
}

async function deleteDeal(index) {
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && deals[index] && deals[index].addedBy !== userName) {
        alert("You are not authorized to delete this deal.");
        return;
    }
    if (confirm('Delete this deal?')) {
        deals.splice(index, 1);
        await saveDeals();
    }
}

window.editDeal = (index) => {
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && deals[index] && deals[index].addedBy !== userName) {
        alert("You are not authorized to edit this deal.");
        return;
    }
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

    // Populate new fields safely
    if (document.getElementById('dealProductDetail')) document.getElementById('dealProductDetail').value = deal.productDetail || '';
    if (document.getElementById('dealBrand')) document.getElementById('dealBrand').value = deal.brand || '';
    if (document.getElementById('dealContactNo')) document.getElementById('dealContactNo').value = deal.contactNo || '';
    if (document.getElementById('dealDeliveryNo')) document.getElementById('dealDeliveryNo').value = deal.deliveryNo || '';
    if (document.getElementById('dealAddress')) document.getElementById('dealAddress').value = deal.address || '';
    if (document.getElementById('dealArea')) {
        document.getElementById('dealArea').value = deal.area || '';
        document.getElementById('dealArea').dispatchEvent(new Event('change'));
    }
    if (document.getElementById('dealBlockNo')) document.getElementById('dealBlockNo').value = deal.blockNo || '';

    if (dealFormTitle) dealFormTitle.textContent = "Edit Deal";
    if (btnSaveDeal) btnSaveDeal.textContent = "Update Deal";
    if (btnCancelDeal) btnCancelDeal.style.display = 'inline-block';

    document.getElementById('deals').querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
};

window.cancelDealEdit = () => {
    dealEditIndex = -1;
    dealForm.reset();

    // Clear new inputs explicitly just in case
    if (document.getElementById('dealProductDetail')) document.getElementById('dealProductDetail').value = '';
    if (document.getElementById('dealBrand')) document.getElementById('dealBrand').value = '';
    if (document.getElementById('dealContactNo')) document.getElementById('dealContactNo').value = '';
    if (document.getElementById('dealDeliveryNo')) document.getElementById('dealDeliveryNo').value = '';
    if (document.getElementById('dealAddress')) document.getElementById('dealAddress').value = '';
    if (document.getElementById('dealArea')) {
        document.getElementById('dealArea').value = '';
        document.getElementById('dealArea').dispatchEvent(new Event('change'));
    }
    if (document.getElementById('dealBlockNo')) document.getElementById('dealBlockNo').value = '';

    if (dealFormTitle) dealFormTitle.textContent = "Add New Deal";
    if (btnSaveDeal) btnSaveDeal.textContent = "Add Deal";
    if (btnCancelDeal) btnCancelDeal.style.display = 'none';
};

// ImgBB Upload Logic
const dealImageUpload = document.getElementById('dealImageUpload');
const dealImageInput = document.getElementById('dealImage');
const uploadStatus = document.getElementById('uploadStatus');

// Free temporary API Key for ImgBB. In a real production app this should be secured.
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

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
            let msg = error.message;
            if (msg === 'Failed to fetch') {
                console.warn('ImgBB network error, falling back to Base64');
                try {
                    const b64 = await fileToBase64(file);
                    dealImageInput.value = b64;
                    uploadStatus.textContent = 'Saved locally (Base64)';
                    uploadStatus.style.color = '#f39c12';
                    return;
                } catch(e) {
                    msg = "Network error and Base64 fallback failed.";
                }
            }
            uploadStatus.textContent = 'Upload failed.';
            uploadStatus.style.color = '#e74c3c';
            alert('Failed to upload image: ' + msg);
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
            let msg = error.message;
            if (msg === 'Failed to fetch') {
                console.warn('ImgBB network error, falling back to Base64');
                try {
                    const b64 = await fileToBase64(file);
                    prodImageInput.value = b64;
                    prodUploadStatus.textContent = 'Saved locally (Base64)';
                    prodUploadStatus.style.color = '#f39c12';
                    return;
                } catch(e) {
                    msg = "Network error and Base64 fallback failed.";
                }
            }
            prodUploadStatus.textContent = 'Upload failed.';
            prodUploadStatus.style.color = '#e74c3c';
            alert('Failed to upload image: ' + msg);
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
            // Gather new fields
            productDetail: document.getElementById('dealProductDetail') ? document.getElementById('dealProductDetail').value : (existingDeal.productDetail || ''),
            brand: document.getElementById('dealBrand') ? document.getElementById('dealBrand').value : (existingDeal.brand || ''),
            contactNo: document.getElementById('dealContactNo') ? document.getElementById('dealContactNo').value : (existingDeal.contactNo || ''),
            deliveryNo: document.getElementById('dealDeliveryNo') ? document.getElementById('dealDeliveryNo').value : (existingDeal.deliveryNo || ''),
            address: document.getElementById('dealAddress') ? document.getElementById('dealAddress').value : (existingDeal.address || ''),
            area: document.getElementById('dealArea') ? document.getElementById('dealArea').value : (existingDeal.area || ''),
            blockNo: document.getElementById('dealBlockNo') ? document.getElementById('dealBlockNo').value : (existingDeal.blockNo || ''),
            areaBlock: (document.getElementById('dealArea') && document.getElementById('dealBlockNo'))
                ? (document.getElementById('dealArea').value && document.getElementById('dealBlockNo').value
                    ? `${document.getElementById('dealArea').value} - ${document.getElementById('dealBlockNo').value}`
                    : (document.getElementById('dealArea').value || document.getElementById('dealBlockNo').value || ''))
                : (existingDeal.areaBlock || ''),
            addedBy: dealEditIndex === -1 ? userName : (existingDeal.addedBy || userName),
            createdDate: dealEditIndex === -1 ? new Date().toISOString() : (existingDeal.createdDate || new Date().toISOString()),
            updatedDate: new Date().toISOString()
        };

        if (String(cUser.userId).toLowerCase() !== 'admin') {
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
            try { perms = JSON.parse(perms); } catch (e) { break; }
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

window.setUserStatus = async function (index, status) {
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


window.toggleCompanyField = function () {
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
            phone: document.getElementById('userPhone').value,
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

window.editUser = function (index) {
    userEditIndex = index;
    const u = users[index];

    if (userFormTitle) userFormTitle.textContent = "Edit User";

    document.getElementById('userPic').value = u.pic || '';
    document.getElementById('userName').value = u.fullName || u.userName || u.name || u.username || '';
    document.getElementById('userPhone').value = u.phone || '';
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

window.cancelUserEdit = function () {
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
                    try { perms = JSON.parse(perms); } catch (e) { break; }
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
                } catch (e) {
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
                let uniqueSubCats = [];
                if (selectedCat === 'Food Stuffs' || selectedCat === 'Food') {
                    let subCats = ['Fast Food', 'Desi Cuisine', 'Bar BQ', 'Chinese', 'Sea Food', 'Dessert'];
                    const relevantCats = categories.filter(c => c.name === selectedCat);
                    relevantCats.forEach(cat => {
                        if (cat.subCategory) {
                            subCats.push(...cat.subCategory.split(',').map(s => s.trim()).filter(s => s));
                        }
                    });
                    uniqueSubCats = [...new Set(subCats)].filter(s => s !== 'Platter' && s !== 'Deals');
                } else {
                    // Filter sub-categories for this category name
                    const relevantCats = categories.filter(c => c.name === selectedCat);
                    let subCats = [];
                    relevantCats.forEach(cat => {
                        if (cat.subCategory) {
                            subCats.push(...cat.subCategory.split(',').map(s => s.trim()).filter(s => s));
                        }
                    });
                    uniqueSubCats = [...new Set(subCats)];
                }

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
                let uniqueSubCats = [];
                if (selectedCat === 'Food Stuffs' || selectedCat === 'Food') {
                    uniqueSubCats = ['Platter', 'Deals'];
                } else {
                    const relevantCats = categories.filter(c => c.name === selectedCat);
                    let subCats = [];
                    relevantCats.forEach(cat => {
                        if (cat.subCategory) {
                            subCats.push(...cat.subCategory.split(',').map(s => s.trim()).filter(s => s));
                        }
                    });
                    uniqueSubCats = [...new Set(subCats)];
                }

                dealSubCategorySelect.innerHTML = '<option value="">Select Sub Category</option>' +
                    uniqueSubCats.map(sub => `<option value="${sub}">${sub}</option>`).join('');
            }
        };

        dealCategorySelect.onchange();
    }
}

window.updateBlockOptionsGlobal = function (areaVal, blockNoSelect) {
    if (!blockNoSelect) return;
    const currentBlockVal = blockNoSelect.value;
    let optionsHtml = '<option value="">Select Sub Area / Block / Sector</option>';

    if (areaVal === 'Metroville') {
        ['Metroville 1st', 'Metroville 2nd', 'Metroville 3rd', 'Metroville 4th'].forEach(sub => {
            optionsHtml += `<option value="${sub}">${sub}</option>`;
        });
    } else if (areaVal === 'Korangi') {
        for (let i = 1; i <= 6; i++) {
            optionsHtml += `<option value="Korangi No.${i}">Korangi No.${i}</option>`;
            if (i <= 5) {
                optionsHtml += `<option value="Korangi No.${i}½">Korangi No.${i}½</option>`;
            }
        }
        for (let i = 31; i <= 36; i++) {
            optionsHtml += `<option value="Sector ${i}">Sector ${i}</option>`;
            optionsHtml += `<option value="Sector ${i}-A">Sector ${i}-A</option>`;
            optionsHtml += `<option value="Sector ${i}-B">Sector ${i}-B</option>`;
            optionsHtml += `<option value="Sector ${i}-C">Sector ${i}-C</option>`;
            optionsHtml += `<option value="Sector ${i}-D">Sector ${i}-D</option>`;
        }
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(letter => {
            optionsHtml += `<option value="Bhittai Colony - Sector ${letter}">Bhittai Colony - Sector ${letter}</option>`;
        });
    } else if (areaVal === 'Korangi Industrial Area') {
        const sectors = [
            'Sector 6-A', 'Sector 6-B', 'Sector 6-C', 'Sector 6-D', 'Sector 6-E', 'Sector 6-F', 'Sector 6-G', 'Sector 6-H', 'Sector 6-I',
            'Sector 7-A', 'Sector 7-B',
            'Sector 19',
            'Sector 21',
            'Sector 22',
            'Sector 23',
            'Sector 24',
            'Sector 25',
            'Sector 26',
            'Sector 27',
            'Sector 28',
            'Sector 30',
            'Sector 33-B', 'Sector 33-C', 'Sector 33-D', 'Sector 33-E', 'Sector 33-F', 'Sector 33-G',
            'Sector 38 (Korangi Creek Industrial Park)'
        ];
        sectors.forEach(sec => {
            optionsHtml += `<option value="${sec}">${sec}</option>`;
        });
    } else if (areaVal === 'Gulshan-e-Iqbal') {
        for (let i = 1; i <= 19; i++) {
            optionsHtml += `<option value="Block ${i}">Block ${i}</option>`;
            if (i === 13) {
                ['A', 'B', 'C', 'D', 'E', 'F'].forEach(letter => {
                    optionsHtml += `<option value="Block 13-${letter}">Block 13-${letter}</option>`;
                });
            }
        }
    } else if (areaVal === 'Gulistan-e-Johar') {
        for (let i = 1; i <= 22; i++) {
            optionsHtml += `<option value="Block ${i}">Block ${i}</option>`;
        }
    } else if (areaVal === 'North Nazimabad') {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
        letters.forEach(l => {
            optionsHtml += `<option value="Block ${l}">Block ${l}</option>`;
        });
    } else if (areaVal === 'Federal B Area') {
        const fbBlocks = [
            { num: 1, name: 'Sharifabad' },
            { num: 2, name: 'Sharifabad' },
            { num: 3, name: 'Hussainabad' },
            { num: 4, name: 'Tayyababad' },
            { num: 5, name: 'Tahiraabad' },
            { num: 6, name: 'Tayyababad' },
            { num: 7, name: 'Azizabad' },
            { num: 8, name: 'Azizabad' },
            { num: 9, name: 'Dastagir' },
            { num: 10, name: 'Dastagir' },
            { num: 11, name: 'Sharifabad' },
            { num: 12, name: 'Sharifabad' },
            { num: 13, name: 'Gulberg Town' },
            { num: 14, name: 'Naseerabad' },
            { num: 15, name: 'Naseerabad' },
            { num: 16, name: 'Water Pump' },
            { num: 17, name: 'Samanabad' },
            { num: 18, name: 'Samanabad' },
            { num: 19, name: 'Al-Noor Society' },
            { num: 20, name: 'Ancholi' },
            { num: 21, name: 'Industrial Area' }
        ];
        fbBlocks.forEach(b => {
            optionsHtml += `<option value="Block ${b.num} (${b.name})">Block ${b.num} (${b.name})</option>`;
        });
    } else if (areaVal === 'Clifton') {
        for (let i = 1; i <= 9; i++) {
            optionsHtml += `<option value="Block ${i}">Block ${i}</option>`;
        }
    } else if (areaVal === 'Defence') {
        for (let i = 1; i <= 8; i++) {
            optionsHtml += `<option value="Phase ${i}">Phase ${i}</option>`;
        }
    } else if (areaVal === 'PECHS') {
        for (let i = 1; i <= 6; i++) {
            optionsHtml += `<option value="Block ${i}">Block ${i}</option>`;
        }
    } else if (areaVal === 'Liaquatabad') {
        const liaquatabadBlocks = [
            'Liaquatabad No. 1', 'Liaquatabad No. 2', 'Liaquatabad No. 3', 'Liaquatabad No. 4', 'Liaquatabad No. 5',
            'Liaquatabad No. 6', 'Liaquatabad No. 7', 'Liaquatabad No. 8', 'Liaquatabad No. 9', 'Liaquatabad No. 10',
            'Block 1', 'Block 2', 'Block 3', 'Block 4', 'Block 5', 'Block 6', 'Block 7',
            'C Area', 'Super Market', 'Dak Khana', 'Sharifabad', 'Bandhani Colony',
            'Qasimabad', 'Gharibabad', 'Mujahid Colony', 'Commercial Area', 'Gulbahar',
            'Teen Hatti', 'Usmania Colony', 'Moosa Colony'
        ];
        liaquatabadBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Shah Faisal') {
        const shahFaisalBlocks = [
            'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5',
            'Drigh Colony', 'Rafa-e-Aam Society', 'Golden Town', 'Natha Khan Goth',
            'Malir Halt', 'Airport Colony', 'Model Colony (Extension)', 'Shah Faisal Green Town'
        ];
        shahFaisalBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Landhi') {
        const landhiBlocks = [
            'Sector A', 'Sector B', 'Sector C', 'Sector D', 'Sector E', 'Sector F', 'Sector G', 'Sector H'
        ];
        landhiBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Mehran Town') {
        const mehranTownBlocks = [
            'Sector A', 'Sector B', 'Sector C', 'Sector D', 'Sector E', 'Sector F', 'Sector G', 'Sector H'
        ];
        mehranTownBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Saddar') {
        const saddarBlocks = [
            'Saddar Main', 'Preedy Quarters', 'Civil Lines', 'Aram Bagh',
            'Garden East', 'Garden West', 'Pakistan Chowk', 'Regal Chowk',
            'Empress Market', 'Boulton Market', 'M.A. Jinnah Road', 'Burns Road',
            'Jodia Bazaar', 'Kharadar', 'Mithadar', 'Napier Quarter',
            'Ranchore Line', 'Light House', 'Zainab Market', 'Abdullah Haroon Road',
            'Frere Town', 'Cantt Station Area', 'PIDC', 'Native Jetty',
            'Tower', 'I.I. Chundrigar Road'
        ];
        saddarBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Bahadurabad') {
        const bahadurabadBlocks = [
            'Bahadurabad Main',
            'Bahadur Yar Jang Road',
            'Alamgir Road',
            'Khalid Bin Waleed Road',
            'Tariq Road',
            'Shaheed-e-Millat Road',
            'Allama Iqbal Road',
            'Dhoraji Colony',
            'PECHS Block 2',
            'PECHS Block 3',
            'PECHS Block 6'
        ];
        bahadurabadBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Burns Road') {
        const burnsRoadBlocks = [
            'Burns Road Main',
            'Food Street',
            'Jama Cloth Market',
            'Aram Bagh',
            'Kakri Ground',
            'Soldier Bazaar No. 1',
            'Soldier Bazaar No. 2',
            'Soldier Bazaar No. 3',
            'Garden East',
            'M.A. Jinnah Road Side',
            'Nishtar Road Side',
            'Preedy Street',
            'Pakistan Chowk Side'
        ];
        burnsRoadBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Malir') {
        const malirBlocks = [
            'Malir 15', 'Malir City', 'Malir Colony', 'Kala Board', 'Model Colony',
            'Model Colony Extension', 'Saudabad', 'Khokhrapar', 'Jafar-e-Tayyar', 'Gharibabad',
            'Khuldabad', 'Dawood Goth', 'Dawood Chowrangi', 'Sharafi Goth', 'Future Colony',
            'Bhittaiabad', 'Bakhtawar Goth', 'Quaidabad', 'Malir Halt', 'Malir Cantt',
            'Falcon Complex', 'Askari V', 'Askari VI', '100 Quarters', 'Moinabad',
            'Jamia Millia Road'
        ];
        malirBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Nazimabad') {
        const nazimabadBlocks = [
            'Block 1', 'Block 2', 'Block 3', 'Block 4', 'Block 5',
            'Block 5-A', 'Block 5-B', 'Block 5-C', 'Block 5-D', 'Block 5-E',
            'Block 6 (Commercial)', 'Block 7 (Commercial)'
        ];
        nazimabadBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    } else if (areaVal === 'Orangi' || areaVal === 'Orangi Town') {
        const orangiBlocks = [
            'Sector 1', 'Sector 1-A', 'Sector 1-B', 'Sector 1-C', 'Sector 1-D', 'Sector 1-E',
            'Sector 2', 'Sector 3',
            'Sector 4', 'Sector 4-A', 'Sector 4-B', 'Sector 4-C', 'Sector 4-D', 'Sector 4-E', 'Sector 4-F',
            'Sector 5', 'Sector 6',
            'Sector 7', 'Sector 7-A', 'Sector 7-B', 'Sector 7-C', 'Sector 7-D',
            'Sector 8', 'Sector 9', 'Sector 10',
            'Sector 11', 'Sector 11½',
            'Sector 12', 'Sector 12-L',
            'Sector 13', 'Sector 13-A', 'Sector 13-B', 'Sector 13-C', 'Sector 13-D', 'Sector 13-E', 'Sector 13-F', 'Sector 13-G', 'Sector 13-H',
            'Sector 14', 'Sector 14-A', 'Sector 14-B', 'Sector 14-C',
            'Sector 15', 'Sector 16'
        ];
        orangiBlocks.forEach(b => {
            optionsHtml += `<option value="${b}">${b}</option>`;
        });
    }
    blockNoSelect.innerHTML = optionsHtml;
    const hasOption = Array.from(blockNoSelect.options).some(opt => opt.value === currentBlockVal);
    if (hasOption) {
        blockNoSelect.value = currentBlockVal;
    } else {
        blockNoSelect.value = '';
    }
};

window.initAddressDropdowns = function () {
    const dealAreaSelect = document.getElementById('dealArea');
    const dealBlockNoSelect = document.getElementById('dealBlockNo');
    if (dealAreaSelect && dealBlockNoSelect) {
        const updateDealBlocks = () => {
            window.updateBlockOptionsGlobal(dealAreaSelect.value, dealBlockNoSelect);
        };
        dealAreaSelect.removeEventListener('change', updateDealBlocks);
        dealAreaSelect.addEventListener('change', updateDealBlocks);
        updateDealBlocks();
    }

    const sellerAreaSelect = document.getElementById('sellerArea');
    const sellerBlockNoSelect = document.getElementById('sellerBlockNo');
    if (sellerAreaSelect && sellerBlockNoSelect) {
        const updateSellerBlocks = () => {
            window.updateBlockOptionsGlobal(sellerAreaSelect.value, sellerBlockNoSelect);
        };
        sellerAreaSelect.removeEventListener('change', updateSellerBlocks);
        sellerAreaSelect.addEventListener('change', updateSellerBlocks);
        updateSellerBlocks();
    }
};

const cleanSellerNameStr = (str) => {
    if (!str) return "";
    return str.replace(/[\s\u00A0]+/g, ' ').trim().toLowerCase();
};

window.autofillSellerDetailsForProducts = function (businessName) {
    if (!businessName) return;
    if (typeof sellers === 'undefined') return;
    console.log("Autofill products matching for brand:", businessName, "Sellers array:", sellers);
    const cleanedSearchName = cleanSellerNameStr(businessName);
    const matchedSeller = sellers.find(s => s.businessName && cleanSellerNameStr(s.businessName) === cleanedSearchName);
    console.log("Matched seller for products:", matchedSeller);
    if (matchedSeller) {
        const contactField = document.getElementById('prodContact');
        const whatsappField = document.getElementById('prodWhatsapp');
        const deliveryField = document.getElementById('prodDelivery');
        const addressField = document.getElementById('prodAddress');
        const areaField = document.getElementById('prodArea');
        const blockField = document.getElementById('prodBlockNo');
        const cityField = document.getElementById('prodCity');

        if (contactField) contactField.value = matchedSeller.mobileNumber || '';
        if (whatsappField) whatsappField.value = matchedSeller.whatsappNumber || '';
        if (deliveryField) deliveryField.value = matchedSeller.branchPhone || matchedSeller.mobileNumber || '';
        if (addressField) addressField.value = matchedSeller.address || '';

        if (areaField) {
            areaField.value = matchedSeller.area || '';
            areaField.dispatchEvent(new Event('change'));
        }
        if (blockField) {
            blockField.value = matchedSeller.blockNo || '';
        }
        if (cityField) {
            cityField.value = matchedSeller.city || '';
        }
    }
};

window.autofillSellerDetailsForDeals = function (businessName) {
    if (!businessName) return;
    if (typeof sellers === 'undefined') return;
    console.log("Autofill deals matching for brand:", businessName, "Sellers array:", sellers);
    const cleanedSearchName = cleanSellerNameStr(businessName);
    const matchedSeller = sellers.find(s => s.businessName && cleanSellerNameStr(s.businessName) === cleanedSearchName);
    console.log("Matched seller for deals:", matchedSeller);
    if (matchedSeller) {
        const contactField = document.getElementById('dealContactNo');
        const whatsappField = document.getElementById('dealWhatsapp');
        const deliveryField = document.getElementById('dealDeliveryNo');
        const addressField = document.getElementById('dealAddress');
        const areaField = document.getElementById('dealArea');
        const blockField = document.getElementById('dealBlockNo');
        const cityField = document.getElementById('dealLocation');

        if (contactField) contactField.value = matchedSeller.mobileNumber || '';
        if (whatsappField) whatsappField.value = matchedSeller.whatsappNumber || '';
        if (deliveryField) deliveryField.value = matchedSeller.branchPhone || matchedSeller.mobileNumber || '';
        if (addressField) addressField.value = matchedSeller.address || '';

        if (areaField) {
            areaField.value = matchedSeller.area || '';
            areaField.dispatchEvent(new Event('change'));
        }
        if (blockField) {
            blockField.value = matchedSeller.blockNo || '';
        }
        if (cityField) {
            cityField.value = matchedSeller.city || '';
        }
    }
};

// Function to render dynamic form fields
function renderDynamicAdminFields() {
    const container = document.getElementById('dynamicProductFields');
    if (!container) return;

    const category = document.getElementById('prodCategory').value;
    const subCategory = document.getElementById('prodSubCategory').value;

    const addressAreaBlockCityHtml = `
            <div class="input-group">
                <label>Address</label>
                <input type="text" id="prodAddress" class="dynamic-admin-field" placeholder="Full Address" required>
            </div>

            <div class="form-row">
                <div class="input-group">
                    <label>Area</label>
                    <select id="prodArea" class="dynamic-admin-field" required>
                        <option value="">Select Area</option>
                        <option value="Metroville">Metroville</option>
                        <option value="Bahadurabad">Bahadurabad</option>
                        <option value="Burns Road">Burns Road</option>
                        <option value="Clifton">Clifton</option>
                        <option value="Defence">Defence</option>
                        <option value="Federal B Area">Federal B Area</option>
                        <option value="Gulshan-e-Iqbal">Gulshan-e-Iqbal</option>
                        <option value="Gulistan-e-Johar">Gulistan-e-Johar</option>
                        <option value="Korangi">Korangi</option>
                        <option value="Korangi Industrial Area">Korangi Industrial Area</option>
                        <option value="Landhi">Landhi</option>
                        <option value="Mehran Town">Mehran Town</option>
                        <option value="Liaquatabad">Liaquatabad</option>
                        <option value="Malir">Malir</option>
                        <option value="North Nazimabad">North Nazimabad</option>
                        <option value="Nazimabad">Nazimabad</option>
                        <option value="Orangi">Orangi</option>
                        <option value="PECHS">PECHS</option>
                        <option value="Saddar">Saddar</option>
                        <option value="Shah Faisal">Shah Faisal</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Sub Area / Block / Sector</label>
                    <select id="prodBlockNo" class="dynamic-admin-field" required>
                        <option value="">Select Sub Area / Block / Sector</option>
                    </select>
                </div>
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
            </div>
    `;

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
                <div class="input-group" id="prodNameContainer">
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
            <h4 class="form-section-title" style="margin-top:20px; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; font-weight:bold; color:var(--primary-color);">Seller's / Shop's Area</h4>
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
                    <input type="text" id="prodCompanyName" class="dynamic-admin-field" placeholder="Shop / Office / Company Name" list="sellersDatalist" disabled>
                </div>
            </div>
            ${addressAreaBlockCityHtml}
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
        setTimeout(() => {
            window.toggleLaptopShopField();
            const brandSelect = document.getElementById('prodBrand');
            if (brandSelect) {
                const handleBrandChange = () => {
                    const brand = brandSelect.value;
                    const nameContainer = document.getElementById('prodNameContainer');
                    if (!nameContainer) return;

                    const brandNames = {
                        'Dell': [
                            'Dell 45W Laptop Charger',
                            'Dell 65W Laptop Charger',
                            'Dell 90W Laptop Charger',
                            'Dell 130W Laptop Charger',
                            'Dell USB-C 65W Charger',
                            'Dell Latitude Laptop Charger',
                            'Dell Inspiron Laptop Charger',
                            'Dell Vostro Laptop Charger',
                            'Dell Precision Laptop Charger'
                        ],
                        'HP': [
                            'HP 45W Laptop Charger',
                            'HP 65W Laptop Charger',
                            'HP 90W Laptop Charger',
                            'HP Blue Pin Charger',
                            'HP Smart Pin Charger',
                            'HP EliteBook Charger',
                            'HP ProBook Charger',
                            'HP Pavilion Charger',
                            'HP Chromebook Charger'
                        ],
                        'Lenovo': [
                            'Lenovo 45W Laptop Charger',
                            'Lenovo 65W Laptop Charger',
                            'Lenovo 90W Laptop Charger',
                            'Lenovo USB-C Charger',
                            'Lenovo ThinkPad Charger',
                            'Lenovo IdeaPad Charger',
                            'Lenovo Yoga Charger'
                        ],
                        'Asus': [
                            'Asus 45W Laptop Charger',
                            'Asus 65W Laptop Charger',
                            'Asus 90W Laptop Charger',
                            'Asus VivoBook Charger',
                            'Asus ZenBook Charger',
                            'Asus TUF Gaming Charger',
                            'Asus ROG Charger'
                        ],
                        'Acer': [
                            'Acer 45W Laptop Charger',
                            'Acer 65W Laptop Charger',
                            'Acer Aspire Charger',
                            'Acer Nitro Charger',
                            'Acer Predator Charger'
                        ]
                    };

                    if (brandNames[brand]) {
                        nameContainer.innerHTML = `
                            <label>Product Name</label>
                            <select id="prodName" class="dynamic-admin-field" required>
                                <option value="">Select Product Name</option>
                                ${brandNames[brand].map(name => `<option value="${name}">${name}</option>`).join('')}
                            </select>
                        `;
                    } else {
                        nameContainer.innerHTML = `
                            <label>Product Name</label>
                            <input type="text" id="prodName" class="dynamic-admin-field" placeholder="e.g., Dell Laptop Charger 65W" required>
                        `;
                    }
                };
                brandSelect.addEventListener('change', handleBrandChange);
            }
        }, 0);
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
            <h4 class="form-section-title" style="margin-top:20px; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; font-weight:bold; color:var(--primary-color);">Seller's / Shop's Area</h4>
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
                    <input type="text" id="prodCompanyName" class="dynamic-admin-field" placeholder="Shop / Office / Company Name" list="sellersDatalist" disabled>
                </div>
            </div>
            ${addressAreaBlockCityHtml}
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
            <h4 class="form-section-title" style="margin-top:20px; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; font-weight:bold; color:var(--primary-color);">Seller's / Shop's Area</h4>
            ${addressAreaBlockCityHtml}
            <div class="form-row">
                <div class="input-group">
                    <label>Price (Rs.)</label>
                    <input type="number" id="prodPrice" class="dynamic-admin-field" placeholder="e.g., 150000" required>
                </div>
            </div>
        `;
    } else {
        const isFood = (category === 'Food' || category === 'Foods' || category === 'Fast Food' || category === 'Desi Cuisine' || category === 'Chinese');
        const prodNameHtml = isFood ? `
                    <select id="prodName" class="dynamic-admin-field" required>
                        <option value="">Select Product Name</option>
                        <optgroup label="🍔 Fast Food">
                            <option value="Burgers">Burgers</option>
                            <option value="Sandwiches & Wraps">Sandwiches & Wraps</option>
                            <option value="Pizza">Pizza</option>
                            <option value="Pasta">Pasta</option>
                            <option value="Fries & Snacks">Fries & Snacks</option>
                            <option value="Broast">Broast</option>
                        </optgroup>
                        <optgroup label="🌮 Rolls">
                            <option value="Rolls">Rolls</option>
                        </optgroup>
                        <optgroup label="🍛 Desi Cuisine">
                            <option value="Rice">Rice</option>
                            <option value="Karahi">Karahi</option>
                            <option value="Handi">Handi</option>
                            <option value="Curry">Curry</option>
                            <option value="BBQ">BBQ</option>
                            <option value="Bread">Bread</option>
                        </optgroup>
                        <optgroup label="🥡 Chinese">
                            <option value="Rice">Rice</option>
                            <option value="Noodles">Noodles</option>
                            <option value="Main Course">Main Course</option>
                            <option value="Soup">Soup</option>
                            <option value="Appetizers">Appetizers</option>
                        </optgroup>
                        <optgroup label="🌊 Seafood">
                            <option value="Seafood">Seafood</option>
                        </optgroup>
                        <optgroup label="🍰 Desserts">
                            <option value="Desserts">Desserts</option>
                        </optgroup>
                        <optgroup label="🥤 Beverages">
                            <option value="Beverages">Beverages</option>
                        </optgroup>
                        <optgroup label="🕌 Arabic Cuisine">
                            <option value="Mandi">🍛Mandi</option>
                        </optgroup>
                    </select>
        ` : `
                    <input type="text" id="prodName" class="dynamic-admin-field" placeholder="Product Name" required>
        `;

        container.innerHTML = `
            <div class="form-row">
                <div class="input-group">
                    <label>Product Name</label>
                    ${prodNameHtml}
                </div>
                <div class="input-group">
                    <label>Product Variety</label>
                    <input type="text" id="prodVariety" class="dynamic-admin-field" placeholder="e.g., Spicy, Large">
                </div>
                <div class="input-group">
                    <label>Standard Product Type</label>
                    <select id="prodStandardProductType" class="dynamic-admin-field">
                        <option value="">Select Standard Product Type</option>
                        <option value="Zinger Burger">Zinger Burger</option>
                        <option value="Chicken Burger">Chicken Burger</option>
                        <option value="Beef Burger">Beef Burger</option>
                        <option value="Shami Kabab Burger">Shami Kabab Burger</option>
                        <option value="Chicken Tikka Burger">Chicken Tikka Burger</option>
                        <option value="Fish Burger">Fish Burger</option>
                        <option value="Fries">Fries</option>
                        <option value="Pizza Medium">Pizza Medium</option>
                        <option value="Pizza Large">Pizza Large</option>
                        <option value="Pizza Small">Pizza Small</option>
                        <option value="Alfredo Pasta">Alfredo Pasta</option>
                        <option value="Chicken Alfredo">Chicken Alfredo</option>
                        <option value="White Sauce Pasta">White Sauce Pasta</option>
                        <option value="Creamy Pasta">Creamy Pasta</option>
                        <option value="Fettuccine Alfredo">Fettuccine Alfredo</option>
                        <option value="Penne Alfredo">Penne Alfredo</option>
                        <option value="Macaroni Pasta">Macaroni Pasta</option>
                        <option value="Chicken Penne">Chicken Penne</option>
                        <option value="Red Sauce Pasta">Red Sauce Pasta</option>
                        <option value="Arrabbiata Pasta">Arrabbiata Pasta</option>
                        <option value="Spaghetti Bolognese">Spaghetti Bolognese</option>
                        <option value="Spaghetti">Spaghetti</option>
                        <option value="Lasagna">Lasagna</option>
                        <option value="Cheesy Pasta">Cheesy Pasta</option>
                        <option value="Mexican Pasta">Mexican Pasta</option>
                        <option value="Tikka Pasta">Tikka Pasta</option>
                        <option value="BBQ Pasta">BBQ Pasta</option>
                        <option value="Special Pasta">Special Pasta</option>
                        <option value="Shawarma">Shawarma</option>
                        <option value="Sandwich Shawarma">Sandwich Shawarma</option>
                        <option value="Quarter Broast Leg">Quarter Broast Leg</option>
                        <option value="Quarter Broast Chest">Quarter Broast Chest</option>
                        <option value="Half Broast">Half Broast</option>
                        <option value="1 Piece Broast">1 Piece Broast</option>
                        <option value="2 Piece Broast">2 Piece Broast</option>
                        <option value="3 Piece Broast">3 Piece Broast</option>
                        <option value="4 Piece Broast">4 Piece Broast</option>
                        <option value="5 Piece Broast">5 Piece Broast</option>
                        <option value="8 Piece Broast">8 Piece Broast</option>
                        <option value="10 Piece Broast">10 Piece Broast</option>
                        <option value="12 Piece Broast">12 Piece Broast</option>
                        <option value="16 Piece Broast">16 Piece Broast</option>
                        <option value="Whole Chicken Broast">Whole Chicken Broast</option>
                        <option value="Half Chicken Broast">Half Chicken Broast</option>
                        <option value="Broast with Fries">Broast with Fries</option>
                        <option value="Broast with Drink">Broast with Drink</option>
                        <option value="Broast Meal">Broast Meal</option>
                        <option value="Family Broast Deal">Family Broast Deal</option>
                        <option value="Chicken Broast Bucket">Chicken Broast Bucket</option>
                        <option value="Spicy Broast">Spicy Broast</option>
                        <option value="Crispy Broast">Crispy Broast</option>
                        <option value="Chicken Chili">Chicken Chili</option>
                        <option value="Chicken Shashlik">Chicken Shashlik</option>
                        <option value="Fried Rice">Fried Rice</option>
                        <option value="Chicken Jalfrezi">Chicken Jalfrezi</option>
                        <option value="Chicken Manchurian">Chicken Manchurian</option>
                        <option value="Chicken Biryani">Chicken Biryani</option>
                        <option value="Beef Biryani">Beef Biryani</option>
                        <option value="Karahi">Karahi</option>
                        <option value="Chicken Roll">Chicken Roll</option>
                        <option value="Beef Roll">Beef Roll</option>
                        <option value="Malai Boti Roll">Malai Boti Roll</option>
                        <option value="Behari Roll">Behari Roll</option>
                        <option value="Chicken Tikka Roll">Chicken Tikka Roll</option>
                        <option value="Seekh Kabab Roll">Seekh Kabab Roll</option>
                        <option value="Reshmi Roll">Reshmi Roll</option>
                        <option value="Mayo Garlic Roll">Mayo Garlic Roll</option>
                        <option value="Cheese Roll">Cheese Roll</option>
                        <option value="Zinger Roll">Zinger Roll</option>
                        <option value="Chapli Kabab Roll">Chapli Kabab Roll</option>
                    </select>
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
            
            <h4 class="form-section-title" style="margin-top:20px; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; font-weight:bold; color:var(--primary-color);">Seller's / Shop's Area</h4>
            <div class="form-row">
                <div class="input-group">
                    <label>Video Link (Optional)</label>
                    <input type="url" id="prodVideoLink" class="dynamic-admin-field" placeholder="https://youtube.com/..." />
                </div>
                <div class="input-group">
                    <label>Shop / Brand Name</label>
                    <input type="text" id="prodBrand" class="dynamic-admin-field" placeholder="Shop / Brand Name" list="sellerNamesDatalist">
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

            ${addressAreaBlockCityHtml}
        `;

        if (isFood) {
            const prodNameSelect = document.getElementById('prodName');
            const prodSubCategorySelect = document.getElementById('prodSubCategory');
            const standardTypeSelect = document.getElementById('prodStandardProductType');

            if (prodNameSelect && standardTypeSelect) {
                const updateStandardTypes = () => {
                    const subCatVal = prodSubCategorySelect ? prodSubCategorySelect.value : '';
                    const nameVal = prodNameSelect.value;
                    const currentVal = standardTypeSelect.value;
                    // Check if selected subcategory is Fast Food or Desi Cuisine (allowing for emoji or no emoji)
                    const isFastFood = subCatVal.includes('Fast Food');
                    const isDesi = subCatVal.includes('Desi Cuisine');
                    const isArabic = subCatVal.includes('Arabic Cuisine');
                    const isChinese = subCatVal.includes('Chinese');

                    if (nameVal === 'Rolls' || nameVal === '🌮 Rolls') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Roll">Chicken Roll</option>
                            <option value="Beef Roll">Beef Roll</option>
                            <option value="Malai Boti Roll">Malai Boti Roll</option>
                            <option value="Behari Roll">Behari Roll</option>
                            <option value="Chicken Tikka Roll">Chicken Tikka Roll</option>
                            <option value="Seekh Kabab Roll">Seekh Kabab Roll</option>
                            <option value="Reshmi Roll">Reshmi Roll</option>
                            <option value="Mayo Garlic Roll">Mayo Garlic Roll</option>
                            <option value="Cheese Roll">Cheese Roll</option>
                            <option value="Zinger Roll">Zinger Roll</option>
                            <option value="Chapli Kabab Roll">Chapli Kabab Roll</option>
                        `;
                    } else if (isArabic && nameVal === 'Mandi') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Mandi">Chicken Mandi</option>
                            <option value="Mutton Mandi">Mutton Mandi</option>
                            <option value="Beef Mandi">Beef Mandi</option>
                            <option value="Family Mandi">Family Mandi</option>
                            <option value="Mixed Mandi">Mixed Mandi</option>
                        `;
                    } else if (isFastFood && nameVal === 'Burgers') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Beef Burger">Beef Burger</option>
                            <option value="Cheese Burger">Cheese Burger</option>
                            <option value="Chicken Burger">Chicken Burger</option>
                            <option value="Crispy Chicken Burger">Crispy Chicken Burger</option>
                            <option value="Double Patty Burger">Double Patty Burger</option>
                            <option value="Grilled Chicken Burger">Grilled Chicken Burger</option>
                            <option value="Jalapeno Burger">Jalapeno Burger</option>
                            <option value="Mighty Burger">Mighty Burger</option>
                            <option value="Tower Burger">Tower Burger</option>
                            <option value="Zinger Burger">Zinger Burger</option>
                        `;
                    } else if (isFastFood && nameVal === 'Sandwiches & Wraps') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Sandwich">Chicken Sandwich</option>
                            <option value="Club Sandwich">Club Sandwich</option>
                            <option value="Grilled Sandwich">Grilled Sandwich</option>
                            <option value="BBQ Sandwich">BBQ Sandwich</option>
                            <option value="Chicken Shawarma">Chicken Shawarma</option>
                            <option value="Beef Shawarma">Beef Shawarma</option>
                            <option value="Chicken Wrap">Chicken Wrap</option>
                            <option value="Zinger Wrap">Zinger Wrap</option>
                            <option value="Chicken Roll">Chicken Roll</option>
                            <option value="Paratha Roll">Paratha Roll</option>
                        `;
                    } else if (isFastFood && nameVal === 'Pizza') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Tikka Pizza">Chicken Tikka Pizza</option>
                            <option value="Fajita Pizza">Fajita Pizza</option>
                            <option value="Pepperoni Pizza">Pepperoni Pizza</option>
                            <option value="Malai Boti Pizza">Malai Boti Pizza</option>
                            <option value="Cheese Pizza">Cheese Pizza</option>
                            <option value="Veggie Pizza">Veggie Pizza</option>
                            <option value="Supreme Pizza">Supreme Pizza</option>
                            <option value="BBQ Pizza">BBQ Pizza</option>
                        `;
                    } else if (isFastFood && nameVal === 'Pasta') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Alfredo Pasta">Alfredo Pasta</option>
                            <option value="Chicken Alfredo">Chicken Alfredo</option>
                            <option value="White Sauce Pasta">White Sauce Pasta</option>
                            <option value="Creamy Pasta">Creamy Pasta</option>
                            <option value="Fettuccine Alfredo">Fettuccine Alfredo</option>
                            <option value="Penne Alfredo">Penne Alfredo</option>
                            <option value="Macaroni Pasta">Macaroni Pasta</option>
                            <option value="Chicken Penne">Chicken Penne</option>
                            <option value="Red Sauce Pasta">Red Sauce Pasta</option>
                            <option value="Arrabbiata Pasta">Arrabbiata Pasta</option>
                            <option value="Spaghetti Bolognese">Spaghetti Bolognese</option>
                            <option value="Spaghetti">Spaghetti</option>
                            <option value="Lasagna">Lasagna</option>
                            <option value="Cheesy Pasta">Cheesy Pasta</option>
                            <option value="Mexican Pasta">Mexican Pasta</option>
                            <option value="Tikka Pasta">Tikka Pasta</option>
                            <option value="BBQ Pasta">BBQ Pasta</option>
                            <option value="Special Pasta">Special Pasta</option>
                        `;
                    } else if (isFastFood && nameVal === 'Fries & Snacks') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="French Fries">French Fries</option>
                            <option value="Loaded Fries">Loaded Fries</option>
                            <option value="Masala Fries">Masala Fries</option>
                            <option value="Curly Fries">Curly Fries</option>
                            <option value="Chicken Nuggets">Chicken Nuggets</option>
                            <option value="Chicken Wings">Chicken Wings</option>
                            <option value="Chicken Strips">Chicken Strips</option>
                            <option value="Garlic Bread">Garlic Bread</option>
                        `;
                    } else if (isFastFood && nameVal === 'Broast') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="1 Piece Broast">1 Piece Broast</option>
                            <option value="2 Piece Broast">2 Piece Broast</option>
                            <option value="3 Piece Broast">3 Piece Broast</option>
                            <option value="4 Piece Broast">4 Piece Broast</option>
                            <option value="5 Piece Broast">5 Piece Broast</option>
                            <option value="8 Piece Broast">8 Piece Broast</option>
                            <option value="10 Piece Broast">10 Piece Broast</option>
                            <option value="12 Piece Broast">12 Piece Broast</option>
                            <option value="16 Piece Broast">16 Piece Broast</option>
                            <option value="Whole Chicken Broast">Whole Chicken Broast</option>
                            <option value="Half Chicken Broast">Half Chicken Broast</option>
                            <option value="Broast with Fries">Broast with Fries</option>
                            <option value="Broast with Drink">Broast with Drink</option>
                            <option value="Broast Meal">Broast Meal</option>
                            <option value="Family Broast Deal">Family Broast Deal</option>
                            <option value="Chicken Broast Bucket">Chicken Broast Bucket</option>
                            <option value="Spicy Broast">Spicy Broast</option>
                            <option value="Crispy Broast">Crispy Broast</option>
                        `;
                    } else if (isDesi && nameVal === 'Rice') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Biryani">Chicken Biryani</option>
                            <option value="Beef Biryani">Beef Biryani</option>
                            <option value="Mutton Biryani">Mutton Biryani</option>
                            <option value="Sindhi Biryani">Sindhi Biryani</option>
                            <option value="Chicken Pulao">Chicken Pulao</option>
                            <option value="Beef Pulao">Beef Pulao</option>
                            <option value="Mutton Pulao">Mutton Pulao</option>
                        `;
                    } else if (isDesi && nameVal === 'Karahi') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Karahi">Chicken Karahi</option>
                            <option value="Mutton Karahi">Mutton Karahi</option>
                            <option value="Beef Karahi">Beef Karahi</option>
                            <option value="White Karahi">White Karahi</option>
                        `;
                    } else if (isDesi && nameVal === 'Handi') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Handi">Chicken Handi</option>
                            <option value="Mutton Handi">Mutton Handi</option>
                            <option value="Malai Handi">Malai Handi</option>
                        `;
                    } else if (isDesi && nameVal === 'Curry') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Curry">Chicken Curry</option>
                            <option value="Beef Curry">Beef Curry</option>
                            <option value="Mutton Curry">Mutton Curry</option>
                            <option value="Aloo Gosht">Aloo Gosht</option>
                            <option value="Nihari">Nihari</option>
                            <option value="Paya">Paya</option>
                            <option value="Haleem">Haleem</option>
                        `;
                    } else if (isDesi && nameVal === 'BBQ') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Tikka">Chicken Tikka</option>
                            <option value="Chicken Boti">Chicken Boti</option>
                            <option value="Malai Boti">Malai Boti</option>
                            <option value="Behari Boti">Behari Boti</option>
                            <option value="Seekh Kabab">Seekh Kabab</option>
                            <option value="Chapli Kabab">Chapli Kabab</option>
                            <option value="Shami Kabab">Shami Kabab</option>
                            <option value="Reshmi Kabab">Reshmi Kabab</option>
                            <option value="Chicken Malai Tikka">Chicken Malai Tikka</option>
                        `;
                    } else if (isDesi && nameVal === 'Bread') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Naan">Naan</option>
                            <option value="Roghni Naan">Roghni Naan</option>
                            <option value="Garlic Naan">Garlic Naan</option>
                            <option value="Tandoori Roti">Tandoori Roti</option>
                            <option value="Paratha">Paratha</option>
                        `;
                    } else if (isChinese && nameVal === 'Rice') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Fried Rice">Chicken Fried Rice</option>
                            <option value="Egg Fried Rice">Egg Fried Rice</option>
                            <option value="Vegetable Fried Rice">Vegetable Fried Rice</option>
                            <option value="Special Fried Rice">Special Fried Rice</option>
                        `;
                    } else if (isChinese && nameVal === 'Noodles') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Chow Mein">Chicken Chow Mein</option>
                            <option value="Vegetable Chow Mein">Vegetable Chow Mein</option>
                            <option value="Chicken Hakka Noodles">Chicken Hakka Noodles</option>
                            <option value="Singapore Noodles">Singapore Noodles</option>
                        `;
                    } else if (isChinese && nameVal === 'Main Course') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Chicken Manchurian">Chicken Manchurian</option>
                            <option value="Chicken Shashlik">Chicken Shashlik</option>
                            <option value="Chicken Chili Dry">Chicken Chili Dry</option>
                            <option value="Chicken Chili Gravy">Chicken Chili Gravy</option>
                            <option value="Kung Pao Chicken">Kung Pao Chicken</option>
                            <option value="Sweet & Sour Chicken">Sweet & Sour Chicken</option>
                        `;
                    } else if (isChinese && nameVal === 'Soup') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Hot & Sour Soup">Hot & Sour Soup</option>
                            <option value="Chicken Corn Soup">Chicken Corn Soup</option>
                            <option value="Vegetable Soup">Vegetable Soup</option>
                        `;
                    } else if (isChinese && nameVal === 'Appetizers') {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Spring Rolls">Spring Rolls</option>
                            <option value="Chicken Spring Rolls">Chicken Spring Rolls</option>
                            <option value="Dynamite Chicken">Dynamite Chicken</option>
                            <option value="Chicken Tempura">Chicken Tempura</option>
                        `;
                    } else {
                        standardTypeSelect.innerHTML = `
                            <option value="">Select Standard Product Type</option>
                            <option value="Zinger Burger">Zinger Burger</option>
                            <option value="Chicken Burger">Chicken Burger</option>
                            <option value="Beef Burger">Beef Burger</option>
                            <option value="Shami Kabab Burger">Shami Kabab Burger</option>
                            <option value="Chicken Tikka Burger">Chicken Tikka Burger</option>
                            <option value="Fish Burger">Fish Burger</option>
                            <option value="Fries">Fries</option>
                            <option value="Pizza Medium">Pizza Medium</option>
                            <option value="Pizza Large">Pizza Large</option>
                            <option value="Pizza Small">Pizza Small</option>
                            <option value="Alfredo Pasta">Alfredo Pasta</option>
                            <option value="Chicken Alfredo">Chicken Alfredo</option>
                            <option value="White Sauce Pasta">White Sauce Pasta</option>
                            <option value="Creamy Pasta">Creamy Pasta</option>
                            <option value="Fettuccine Alfredo">Fettuccine Alfredo</option>
                            <option value="Penne Alfredo">Penne Alfredo</option>
                            <option value="Macaroni Pasta">Macaroni Pasta</option>
                            <option value="Chicken Penne">Chicken Penne</option>
                            <option value="Red Sauce Pasta">Red Sauce Pasta</option>
                            <option value="Arrabbiata Pasta">Arrabbiata Pasta</option>
                            <option value="Spaghetti Bolognese">Spaghetti Bolognese</option>
                            <option value="Spaghetti">Spaghetti</option>
                            <option value="Lasagna">Lasagna</option>
                            <option value="Cheesy Pasta">Cheesy Pasta</option>
                            <option value="Mexican Pasta">Mexican Pasta</option>
                            <option value="Tikka Pasta">Tikka Pasta</option>
                            <option value="BBQ Pasta">BBQ Pasta</option>
                            <option value="Special Pasta">Special Pasta</option>
                            <option value="Shawarma">Shawarma</option>
                            <option value="Sandwich Shawarma">Sandwich Shawarma</option>
                            <option value="Quarter Broast Leg">Quarter Broast Leg</option>
                            <option value="Quarter Broast Chest">Quarter Broast Chest</option>
                            <option value="Half Broast">Half Broast</option>
                            <option value="1 Piece Broast">1 Piece Broast</option>
                            <option value="2 Piece Broast">2 Piece Broast</option>
                            <option value="3 Piece Broast">3 Piece Broast</option>
                            <option value="4 Piece Broast">4 Piece Broast</option>
                            <option value="5 Piece Broast">5 Piece Broast</option>
                            <option value="8 Piece Broast">8 Piece Broast</option>
                            <option value="10 Piece Broast">10 Piece Broast</option>
                            <option value="12 Piece Broast">12 Piece Broast</option>
                            <option value="16 Piece Broast">16 Piece Broast</option>
                            <option value="Whole Chicken Broast">Whole Chicken Broast</option>
                            <option value="Half Chicken Broast">Half Chicken Broast</option>
                            <option value="Broast with Fries">Broast with Fries</option>
                            <option value="Broast with Drink">Broast with Drink</option>
                            <option value="Broast Meal">Broast Meal</option>
                            <option value="Family Broast Deal">Family Broast Deal</option>
                            <option value="Chicken Broast Bucket">Chicken Broast Bucket</option>
                            <option value="Spicy Broast">Spicy Broast</option>
                            <option value="Crispy Broast">Crispy Broast</option>
                            <option value="Chicken Chili">Chicken Chili</option>
                            <option value="Chicken Shashlik">Chicken Shashlik</option>
                            <option value="Fried Rice">Fried Rice</option>
                            <option value="Chicken Jalfrezi">Chicken Jalfrezi</option>
                            <option value="Chicken Manchurian">Chicken Manchurian</option>
                            <option value="Chicken Biryani">Chicken Biryani</option>
                            <option value="Beef Biryani">Beef Biryani</option>
                            <option value="Karahi">Karahi</option>
                        `;
                    }
                    // Restore previous value if it is still valid in the new options list
                    const hasOption = Array.from(standardTypeSelect.options).some(opt => opt.value === currentVal);
                    if (hasOption) {
                        standardTypeSelect.value = currentVal;
                    } else {
                        standardTypeSelect.value = '';
                    }
                };

                prodNameSelect.addEventListener('change', updateStandardTypes);
                updateStandardTypes();
            }
        }
    }

    const dynamicContainer = document.getElementById('dynamicProductFields');
    const prodAreaSelect = dynamicContainer ? dynamicContainer.querySelector('#prodArea') : null;
    const prodBlockNoSelect = dynamicContainer ? dynamicContainer.querySelector('#prodBlockNo') : null;
    if (prodAreaSelect && prodBlockNoSelect) {
        const updateBlocks = () => {
            window.updateBlockOptionsGlobal(prodAreaSelect.value, prodBlockNoSelect);
        };
        prodAreaSelect.addEventListener('change', updateBlocks);
        updateBlocks();
    }
    const staticStatus = document.getElementById('staticStatusContainer');
    if (staticStatus) {
        if (category === 'Computer') {
            staticStatus.style.display = 'none';
        } else {
            staticStatus.style.display = 'block';
        }
    }

    // Re-enforce permissions on dynamic fields
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (String(currentUser.userId || '').toLowerCase() !== 'admin') {
            restrictPublishForSection('products');
        }
    }

}

window.toggleLaptopShopField = function () {
    const container = document.getElementById('dynamicProductFields');
    const seller = container ? container.querySelector('#prodSeller')?.value : '';
    const shopField = container ? container.querySelector('#prodCompanyName') : null;
    const shopGroup = container ? container.querySelector('#laptopCompanyGroup') : null;
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
const pCat = document.getElementById('prodCategory');
const pSub = document.getElementById('prodSubCategory');
if (pCat) pCat.addEventListener('change', renderDynamicAdminFields);
if (pSub) pSub.addEventListener('change', renderDynamicAdminFields);

if (typeof window.initAddressDropdowns === 'function') {
    window.initAddressDropdowns();
}

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

// Deal filter controls event listeners
const dealSearchInput = document.getElementById('dealSearchInput');
const dealFilterCat = document.getElementById('dealFilterCategory');
const dealFilterSub = document.getElementById('dealFilterSubCategory');
const dealFilterPost = document.getElementById('dealFilterPostBy');

if (dealSearchInput) {
    dealSearchInput.addEventListener('input', (e) => {
        dealSearchQuery = e.target.value.toLowerCase().trim();
        renderDeals();
    });
}
if (dealFilterCat) {
    dealFilterCat.addEventListener('change', (e) => {
        dealFilterCategory = e.target.value;
        renderDeals();
    });
}
if (dealFilterSub) {
    dealFilterSub.addEventListener('change', (e) => {
        dealFilterSubCategory = e.target.value;
        renderDeals();
    });
}
if (dealFilterPost) {
    dealFilterPost.addEventListener('change', (e) => {
        dealFilterPostBy = e.target.value;
        renderDeals();
    });
}

// Global event delegation for autofilling seller details (handles typing, blur, and selecting from datalist)
const handleAutofillEvent = (e) => {
    if (!e.target) return;
    if (e.target.id === 'dealBrand') {
        window.autofillSellerDetailsForDeals(e.target.value);
    } else if (e.target.id === 'prodBrand') {
        window.autofillSellerDetailsForProducts(e.target.value);
    }
};
document.addEventListener('input', handleAutofillEvent);
document.addEventListener('change', handleAutofillEvent);
document.addEventListener('blur', handleAutofillEvent, true);

const adminProductForm = document.getElementById('adminProductForm');

window.populateProductSellerDropdown = function () {
    const select = document.getElementById('prodSellerId');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">No Seller (Standalone)</option>';
    sellers.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = `${s.ownerName} (${s.shopName || s.brandName || 'Unnamed Shop'}) - ${s.area || ''}`;
        select.appendChild(option);
    });
    if (currentVal) select.value = currentVal;
};

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
            sellerId: document.getElementById('prodSellerId') ? document.getElementById('prodSellerId').value : '',
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
        const statusEl = document.querySelector('#dynamicProductFields #prodStatus') || document.getElementById('prodStatus');
        if (statusEl) {
            newProduct.status = statusEl.value;
        }

        // Force Draft if not Super Admin
        if (String(cUser.userId).toLowerCase() !== 'admin') {
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
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';

    if (catSelect) {
        const uniqueCats = [...new Set(products.map(p => p.category).filter(Boolean))];
        const currentVal = catSelect.value;
        catSelect.innerHTML = '<option value="">All Categories</option>' +
            uniqueCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        catSelect.value = uniqueCats.includes(currentVal) ? currentVal : '';
    }
    if (postSelect) {
        if (!isSuperAdmin) {
            postSelect.style.display = 'none';
        } else {
            postSelect.style.display = '';
            const uniquePosts = [...new Set(products.map(p => p.addedBy || 'Admin').filter(Boolean))];
            const currentVal = postSelect.value;
            postSelect.innerHTML = '<option value="">All Authors</option>' +
                uniquePosts.map(post => `<option value="${post}">${post}</option>`).join('');
            postSelect.value = uniquePosts.includes(currentVal) ? currentVal : '';
        }
    }
}

window.resetProductFilters = function () {
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

            // Only show own products if not super admin
            if (!isSuperAdmin && prod.addedBy !== userName) {
                return false;
            }

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

        const totalProdEl = document.getElementById('totalProducts');
        if (totalProdEl) totalProdEl.textContent = (products || []).length;

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
window.changeProdPage = function (page) {
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
    const pSellerId = document.getElementById('prodSellerId');

    pCat.value = prod.category;
    // Trigger change to populate subcategories
    pCat.dispatchEvent(new Event('change'));

    window.populateProductSellerDropdown();
    if (pSellerId) {
        pSellerId.value = prod.sellerId || '';
    }

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

            const areaSelect = document.getElementById('prodArea');
            if (areaSelect) {
                areaSelect.dispatchEvent(new Event('change'));
                const blockSelect = document.getElementById('prodBlockNo');
                if (blockSelect && prod.blockNo !== undefined) {
                    blockSelect.value = prod.blockNo;
                }
            }

            if (prod.category === 'Computer' && (prod.subCategory === 'Laptops' || prod.subCategory === 'ChromeBook' || prod.subCategory === 'Chromebook' || prod.subCategory === 'Chromebooks' || prod.subCategory === 'Laptop Charger')) {
                window.toggleLaptopShopField();
            }
            if (prod.category === 'Computer' && prod.subCategory === 'Laptop Charger') {
                const brandSelect = document.getElementById('prodBrand');
                if (brandSelect) {
                    brandSelect.dispatchEvent(new Event('change'));
                    const nameField = document.getElementById('prodName');
                    if (nameField && prod.name) {
                        nameField.value = prod.name;
                    }
                }
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

    const pSellerId = document.getElementById('prodSellerId');
    if (pSellerId) {
        pSellerId.value = "";
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

    const mappedTravel = travelPackages.map((pkg, index) => ({ pkg, index }));
    const filteredTravel = isSuperAdmin ? mappedTravel : mappedTravel.filter(x => x.pkg.addedBy === userName);

    travelList.innerHTML = filteredTravel.map(item => {
        const { pkg, index } = item;
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
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && travelPackages[index] && travelPackages[index].addedBy !== userName) {
        alert("You are not authorized to delete this travel package.");
        return;
    }
    if (confirm('Delete this travel package?')) {
        travelPackages.splice(index, 1);
        await saveTravelPackages();
    }
};

window.editTravel = (index) => {
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && travelPackages[index] && travelPackages[index].addedBy !== userName) {
        alert("You are not authorized to edit this travel package.");
        return;
    }
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

        if (String(cUser.userId).toLowerCase() !== 'admin') {
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

        const mappedBroadcasts = broadcasts.map((b, index) => ({ b, index }));
        const filteredBroadcasts = isSuperAdmin ? mappedBroadcasts : mappedBroadcasts.filter(x => x.b.addedBy === userName);

        broadcastList.innerHTML = filteredBroadcasts.map(item => {
            const { b, index } = item;
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
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && broadcasts[index] && broadcasts[index].addedBy !== userName) {
        alert("You are not authorized to delete this broadcast.");
        return;
    }
    if (confirm('Delete this broadcast?')) {
        broadcasts.splice(index, 1);
        await saveBroadcasts();
    }
}

window.editBroadcast = (index) => {
    const cUserStr = localStorage.getItem('currentUser');
    const cUser = cUserStr ? JSON.parse(cUserStr) : {};
    const isSuperAdmin = String(cUser.userId || '').toLowerCase() === 'admin';
    const userName = cUser.fullName || cUser.username || cUser.userId || 'Admin';
    if (!isSuperAdmin && broadcasts[index] && broadcasts[index].addedBy !== userName) {
        alert("You are not authorized to edit this broadcast.");
        return;
    }
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

        if (String(cUser.userId).toLowerCase() !== 'admin') {
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
window.populatePermissionDropdown = function () {
    const select = document.getElementById('rightsUserSelect');
    if (!select) return;

    const currentSelection = select.value;
    select.innerHTML = '<option value="">Select a user...</option>';

    users.forEach(u => {
        const option = document.createElement('option');
        const uId = String(u.userId || u.id || u.username || '');
        if (!uId) return;
        option.value = uId;
        option.textContent = `${u.fullName || u.userName || uId} (${u.role || 'user'})`;
        select.appendChild(option);
    });

    if (currentSelection && users.some(u => String(u.userId || u.id || u.username || '') === String(currentSelection))) {
        select.value = currentSelection;
    }
};

window.onUserSelectChange = function () {
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

    const user = users.find(u => String(u.userId || u.id || u.username || '') === String(userSelect.value || ''));
    if (!user) {
        if (chargesInput) chargesInput.value = '';
        loadUserPermissions();
        return;
    }

    // Normalize permissions string/object safely first
    let perms = user.permissions;
    if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
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

    if (user.role === 'admin' && String(user.userId || user.id || '').toLowerCase() === 'admin') {
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

window.loadUserPermissions = function () {
    const userSelect = document.getElementById('rightsUserSelect');
    const sectionCheckboxes = document.querySelectorAll('.section-checkbox');
    const permCheckboxes = document.querySelectorAll('.perm-checkbox');

    permCheckboxes.forEach(cb => cb.checked = false);

    if (!userSelect || !userSelect.value) return;

    // Check which sections are selected
    const selectedSections = Array.from(sectionCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

    const user = users.find(u => String(u.userId || u.id || u.username || '') === String(userSelect.value || ''));
    if (!user) return;

    // Normalize permissions string/object safely
    let perms = user.permissions;
    if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
    }
    if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
        perms = {};
    }
    user.permissions = perms;

    if (user.role === 'admin' && String(user.userId || user.id || '').toLowerCase() === 'admin') {
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

        if (!userSelect || !userSelect.value) {
            alert('Please select a user first.');
            return;
        }

        const userIndex = users.findIndex(u => String(u.userId || u.id || u.username || '') === String(userSelect.value || ''));
        if (userIndex === -1) {
            alert('Selected user not found.');
            return;
        }

        const permCheckboxes = document.querySelectorAll('.perm-checkbox');
        const selectedActions = [];
        permCheckboxes.forEach(cb => {
            if (cb.checked) selectedActions.push(cb.value);
        });

        let currentPerms = users[userIndex].permissions;
        if (typeof currentPerms === 'string') {
            try { currentPerms = JSON.parse(currentPerms); } catch (e) { currentPerms = {}; }
        }
        if (!currentPerms || Array.isArray(currentPerms) || typeof currentPerms !== 'object') {
            currentPerms = {};
        }

        // Apply/Update rights for all section checkboxes
        sectionCheckboxes.forEach(cb => {
            const sec = cb.value;
            if (cb.checked) {
                currentPerms[sec] = [...selectedActions];
            } else {
                delete currentPerms[sec];
            }
        });

        users[userIndex].permissions = currentPerms;

        // Save charges rate
        const chargesInput = document.getElementById('rightsUserCharges');
        if (chargesInput) {
            users[userIndex].charges = parseFloat(chargesInput.value) || 0;
            currentPerms.charges = users[userIndex].charges;
        }

        await saveUsers();
        alert('User rights updated successfully!');
    });
}

// ==========================================
// USER CATEGORIES ASSIGNMENT
// ==========================================
window.populateCategoryAssignDropdown = function () {
    const select = document.getElementById('categoryAssignUserSelect');
    if (!select) return;

    const currentSelection = select.value;
    select.innerHTML = '<option value="">Select a user...</option>';

    users.forEach(u => {
        const uId = String(u.userId || u.id || u.username || '');
        const isSuperAdmin = uId.toLowerCase() === 'admin';
        if (!isSuperAdmin && uId) {
            const option = document.createElement('option');
            option.value = uId;
            option.textContent = `${u.fullName || u.userName || uId} (${u.role || 'user'})`;
            select.appendChild(option);
        }
    });

    if (currentSelection && users.some(u => String(u.userId || u.id || u.username || '') === String(currentSelection))) {
        select.value = currentSelection;
    }
};

window.populateCategoryAssignGrid = function () {
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

window.onCategoryAssignUserChange = function () {
    const userSelect = document.getElementById('categoryAssignUserSelect');
    const checkboxes = document.querySelectorAll('.cat-assign-checkbox');

    checkboxes.forEach(cb => cb.checked = false);

    if (!userSelect || !userSelect.value) return;

    const user = users.find(u => String(u.userId || u.id || u.username || '') === String(userSelect.value || ''));
    if (!user) return;

    let assigned = (user.permissions && user.permissions.assignedCategories)
        ? user.permissions.assignedCategories
        : (user.assignedCategories || []);

    let loopCount = 0;
    while (typeof assigned === 'string' && loopCount < 3) {
        try {
            assigned = JSON.parse(assigned);
        } catch (e) {
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

        const userIndex = users.findIndex(u => String(u.userId || u.id || u.username || '') === String(userSelect.value || ''));
        if (userIndex === -1) return;

        const checkboxes = document.querySelectorAll('.cat-assign-checkbox');
        const selectedCategories = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

        // Ensure permissions object exists and is parsed
        let perms = users[userIndex].permissions;
        let loopCount = 0;
        while (typeof perms === 'string' && loopCount < 3) {
            try { perms = JSON.parse(perms); } catch (e) { break; }
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

window.enforceUserPermissions = function () {
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
            } catch (e) {
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

                        // Enforce Publish/Draft rights - Force Draft for anyone except Super Admin
                        if (String(currentUser.userId || '').toLowerCase() !== 'admin' || !sectionRights.includes('Publish')) {
                            restrictPublishForSection(sectionId);
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error("Error enforcing permissions", e);
    }
};

window.restrictPublishForSection = function (sectionId) {
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

window.toggleApproval = async function (type, index) {
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

window.updatePendingApprovalsBadge = function () {
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
    } catch (e) {
        console.error("Error updating badges", e);
    }
};

window.populateAdminHeader = function () {
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
    } catch (e) { }

    liveRatesForm.addEventListener("submit", async function (e) {
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



window.showPage = function (pageId) {
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
window.showUserPerformanceStats = function (username) {
    performanceTargetUser = username;
    window.showPage('performance');
};



window.setPerformanceFilter = function (filterType, btn) {
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

window.applyCustomDateFilter = function () {
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
        threeMonthsAgo.setHours(0, 0, 0, 0);
        return dTime >= threeMonthsAgo.getTime();
    } else if (filterType === 'custom') {
        if (!customStart || !customEnd) return true;
        const sTime = new Date(customStart).setHours(0, 0, 0, 0);
        const eTime = new Date(customEnd).setHours(23, 59, 59, 999);
        return dTime >= sTime && dTime <= eTime;
    }
    return true;
}

window.compilePerformanceMetrics = function () {
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

window.renderPerformanceCharts = function (userStats, filteredCategories, filteredProducts, filteredDeals, filteredAds, filteredBanners, filteredBlogs, filteredBroadcasts, filteredTravel) {
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

window.openUserPostingInvoice = function (username) {
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

window.closeUserInvoiceModal = function () {
    const modal = document.getElementById('userInvoiceModal');
    if (modal) modal.classList.add('hidden');
};

window.onInvoiceFilterChange = function () {
    const val = document.getElementById('invoiceFilterSelect').value;
    const customContainer = document.getElementById('invoiceCustomDateRange');
    if (val === 'custom') {
        customContainer.classList.remove('hidden');
    } else {
        customContainer.classList.add('hidden');
        recalculateInvoice();
    }
};

window.onInvoiceCustomDateChange = function () {
    recalculateInvoice();
};

window.recalculateInvoice = function () {
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
        try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
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

window.printUserInvoice = function () {
    window.print();
};

// --- Seller Management Functions ---

window.generateSellerId = function () {
    const idField = document.getElementById('sellerId');
    if (idField && sellerEditIndex === -1) {
        const num = Math.floor(100000 + Math.random() * 900000);
        idField.value = 'SEL-' + num;
    }
};

window.toggleSellerBranchFields = function () {
    const branches = document.getElementById('sellerBranches')?.value || 'No';
    const branchFields = document.getElementById('sellerBranchFields');
    const nonBranchFields = document.getElementById('sellerNonBranchFields');
    if (branchFields && nonBranchFields) {
        if (branches === 'Yes') {
            branchFields.style.display = 'block';
            nonBranchFields.style.display = 'none';
            document.getElementById('sellerBranchAddress').required = true;
        } else {
            branchFields.style.display = 'none';
            nonBranchFields.style.display = 'block';
            document.getElementById('sellerBranchAddress').required = false;
        }
    }
};

window.toggleSellerStatusCheckbox = function (status) {
    const active = document.getElementById('sellerStatusActive');
    const inactive = document.getElementById('sellerStatusInactive');
    const suspended = document.getElementById('sellerStatusSuspended');
    if (status === 'Active') {
        if (active.checked) {
            inactive.checked = false;
            suspended.checked = false;
        }
    } else if (status === 'Inactive') {
        if (inactive.checked) {
            active.checked = false;
            suspended.checked = false;
        }
    } else if (status === 'Suspended') {
        if (suspended.checked) {
            active.checked = false;
            inactive.checked = false;
        }
    }
};

window.cancelSellerEdit = function () {
    sellerEditIndex = -1;
    document.getElementById('sellerForm').reset();
    if (document.getElementById('sellerArea')) {
        document.getElementById('sellerArea').dispatchEvent(new Event('change'));
    }
    document.getElementById('sellerFormTitle').textContent = 'Add New Seller';
    document.getElementById('btnCancelSeller').style.display = 'none';
    window.generateSellerId();
    window.toggleSellerBranchFields();
};

window.updateSellerDatalist = function () {
    let dl = document.getElementById('sellerNamesDatalist');
    if (!dl) {
        dl = document.createElement('datalist');
        dl.id = 'sellerNamesDatalist';
        document.body.appendChild(dl);
    }
    if (dl && Array.isArray(sellers)) {
        const uniqueNames = [...new Set(sellers.map(s => s.businessName).filter(Boolean))];
        dl.innerHTML = uniqueNames.map(name => `<option value="${name}"></option>`).join('');
    }
};

window.renderSellers = function () {
    const list = document.getElementById('sellerList');
    if (!list) return;

    const cleanStr = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchSellerPost = (item, seller) => {
        if (!item || !seller) return false;

        const sBusName = cleanStr(seller.businessName);
        const sOwnerName = cleanStr(seller.ownerName);
        const sSellerId = cleanStr(seller.sellerId);

        const fieldsToTest = [
            item.brand,
            item.companyName,
            item.seller,
            item.businessName,
            item.addedBy,
            item.postBy,
            item["Post By"],
            item.shopName,
            item.sellerName
        ];

        for (let f of fieldsToTest) {
            if (!f) continue;
            const cVal = cleanStr(f);
            if (!cVal) continue;
            if (sSellerId && cVal === sSellerId) return true;
            if (sBusName && (cVal === sBusName || (cVal.length >= 4 && sBusName.length >= 4 && (cVal.includes(sBusName) || sBusName.includes(cVal))))) return true;
            if (sOwnerName && sOwnerName.length >= 3 && (cVal === sOwnerName || (cVal.length >= 4 && cVal.includes(sOwnerName)))) return true;
        }
        return false;
    };

    const totalItems = sellers.length;
    const totalPages = Math.ceil(totalItems / sellerPageSize) || 1;

    if (sellerCurrentPage > totalPages) sellerCurrentPage = totalPages;
    if (sellerCurrentPage < 1) sellerCurrentPage = 1;

    const startIndex = (sellerCurrentPage - 1) * sellerPageSize;
    const endIndex = Math.min(startIndex + sellerPageSize, totalItems);
    const paginatedSellers = sellers.slice(startIndex, endIndex);

    let html = '';
    paginatedSellers.forEach((s, i) => {
        const index = startIndex + i;
        const prodCount = (products || []).filter(p => matchSellerPost(p, s)).length;
        const dealCount = (deals || []).filter(d => matchSellerPost(d, s)).length;
        const orderCount = 0;

        const verifiedBadge = s.verifiedSeller
            ? `<span class="status-pill active" style="background:#d1fae5 !important; border:1px solid #a7f3d0 !important; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:4px; font-weight:bold; color:#047857 !important;"><i class="fa-solid fa-circle-check"></i> Yes</span>`
            : `<span class="status-pill pending" style="background:#f1f5f9 !important; border:1px solid #cbd5e1 !important; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:4px; font-weight:bold; color:#64748b !important;"><i class="fa-solid fa-circle-xmark"></i> No</span>`;

        let statusClass = 'active';
        if (s.status === 'Inactive') statusClass = 'pending';
        if (s.status === 'Suspended') statusClass = 'suspended';

        let statusStyle = '';
        if (s.status === 'Suspended') statusStyle = 'background:#fee2e2 !important; color:#b91c1c !important; border:1px solid #fca5a5 !important; padding:4px 10px; border-radius:12px; font-weight:bold;';
        else if (s.status === 'Inactive') statusStyle = 'background:#fef3c7 !important; color:#b45309 !important; border:1px solid #fde68a !important; padding:4px 10px; border-radius:12px; font-weight:bold;';
        else statusStyle = 'background:#d1fae5 !important; color:#047857 !important; border:1px solid #a7f3d0 !important; padding:4px 10px; border-radius:12px; font-weight:bold;';

        const statusLabel = s.status || 'Active';

        html += `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.08);">
                <td style="padding: 12px 10px;">
                    <span style="font-weight:700; color:#0284c7; font-size:13px;">${s.sellerId || 'SEL-000000'}</span>
                </td>
                <td style="padding: 12px 10px;">
                    <span style="font-weight:700; color:#0f172a; font-size:14px;">${s.businessName || 'N/A'}</span>
                </td>
                <td style="padding: 12px 10px;">
                    <span style="color:#334155; font-size:13px; font-weight:600;">${s.businessType || 'Retailer'}</span>
                </td>
                <td style="padding: 12px 10px;">
                    <span style="color:#334155; font-size:13px; font-weight:600;">${s.city || 'N/A'}</span>
                </td>
                <td style="padding: 12px 10px;">
                    <span style="background:#0284c7; color:#ffffff; font-weight:bold; font-size:12px; padding:3px 10px; border-radius:6px; display:inline-block;">${prodCount}</span>
                </td>
                <td style="padding: 12px 10px;">
                    <span style="background:#d97706; color:#ffffff; font-weight:bold; font-size:12px; padding:3px 10px; border-radius:6px; display:inline-block;">${dealCount}</span>
                </td>
                <td style="padding: 12px 10px;">
                    <span style="background:#059669; color:#ffffff; font-weight:bold; font-size:12px; padding:3px 10px; border-radius:6px; display:inline-block;">${orderCount}</span>
                </td>
                <td style="padding: 12px 10px; text-align: center;">
                    <button onclick="window.toggleSellerListings(${index})" style="background:${s.listingsHidden ? '#ef4444' : '#10b981'}; color:white; border:none; padding:5px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px; min-width:65px; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
                        ${s.listingsHidden ? 'Show' : 'Hide'}
                    </button>
                </td>
                <td style="padding: 12px 10px;">
                    ${verifiedBadge}
                </td>
                <td style="padding: 12px 10px;">
                    <span class="status-pill ${statusClass}" style="${statusStyle}">${statusLabel.toUpperCase()}</span>
                </td>
                <td style="padding: 12px 10px;">
                    <div class="action-buttons-group">
                        <button class="action-btn purple" onclick="window.editSeller(${index})" title="Edit Seller"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn blue" onclick="window.viewSellerProfile(${index})" title="View Profile"><i class="fa-solid fa-eye"></i></button>
                        <button class="action-btn red" onclick="window.deleteSeller(${index})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    list.innerHTML = html;

    const paginationContainer = document.getElementById('sellerPaginationContainer');
    if (paginationContainer) {
        if (totalItems <= sellerPageSize) {
            paginationContainer.style.display = 'none';
        } else {
            paginationContainer.style.display = 'flex';
            const showFrom = totalItems === 0 ? 0 : startIndex + 1;
            const showTo = endIndex;

            let pagesHtml = '';
            pagesHtml += `<button onclick="window.changeSellerPage(${sellerCurrentPage - 1})" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" ${sellerCurrentPage === 1 ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}><i class="fa-solid fa-chevron-left"></i> Prev</button>`;
            pagesHtml += `<span style="font-weight: 600; color: #334155; font-size: 0.8rem; margin: 0 10px;">Page ${sellerCurrentPage} of ${totalPages}</span>`;
            pagesHtml += `<button onclick="window.changeSellerPage(${sellerCurrentPage + 1})" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 6px;" ${sellerCurrentPage === totalPages ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>Next <i class="fa-solid fa-chevron-right"></i></button>`;

            paginationContainer.innerHTML = `
                <div style="color: #475569; font-weight: 500; font-size: 0.8rem;">
                    Showing ${showFrom} - ${showTo} of ${totalItems} sellers
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    ${pagesHtml}
                </div>
            `;
        }
    }

    const totalSellerEl = document.getElementById('totalSellers');
    if (totalSellerEl) totalSellerEl.textContent = totalItems;
    const totalCompEl = document.getElementById('totalCompanies');
    if (totalCompEl) totalCompEl.textContent = totalItems;

    if (typeof window.updateSellerDatalist === 'function') {
        window.updateSellerDatalist();
    }
};

window.changeSellerPage = function (page) {
    sellerCurrentPage = page;
    renderSellers();
};

window.toggleSellerListings = async function(index) {
    if (sellers[index]) {
        sellers[index].listingsHidden = !sellers[index].listingsHidden;
        await DataService.saveSellers(sellers);
        window.renderSellers();
    }
};

window.editSeller = function (index) {
    const s = sellers[index];
    if (!s) return;

    sellerEditIndex = index;
    document.getElementById('sellerFormTitle').textContent = 'Edit Seller: ' + s.businessName;
    document.getElementById('btnCancelSeller').style.display = 'inline-block';

    document.getElementById('sellerId').value = s.sellerId || '';
    document.getElementById('sellerBusinessName').value = s.businessName || '';
    document.getElementById('sellerOwnerName').value = s.ownerName || '';
    document.getElementById('sellerBusinessType').value = s.businessType || '';
    document.getElementById('sellerMobile').value = s.mobileNumber || '';
    document.getElementById('sellerWhatsapp').value = s.whatsappNumber || '';
    document.getElementById('sellerEmail').value = s.email || '';
    document.getElementById('sellerWebsite').value = s.website || '';
    document.getElementById('sellerFacebook').value = s.facebookPage || '';
    document.getElementById('sellerInstagram').value = s.instagramPage || '';
    document.getElementById('sellerAddress').value = s.address || '';
    if (document.getElementById('sellerArea')) {
        document.getElementById('sellerArea').value = s.area || '';
        document.getElementById('sellerArea').dispatchEvent(new Event('change'));
    }
    if (document.getElementById('sellerBlockNo')) document.getElementById('sellerBlockNo').value = s.blockNo || '';
    document.getElementById('sellerCity').value = s.city || '';
    document.getElementById('sellerBranches').value = s.branches || 'No';
    document.getElementById('sellerBranchAddress').value = s.branchAddress || '';
    document.getElementById('sellerBranchPhone').value = s.branchPhone || '';
    document.getElementById('sellerBranchWhatsapp').value = s.branchWhatsapp || '';
    document.getElementById('sellerProvince').value = s.province || '';
    document.getElementById('sellerMapsLink').value = s.googleMapsLink || '';
    if (document.getElementById('sellerLatitude')) document.getElementById('sellerLatitude').value = s.latitude || '';
    if (document.getElementById('sellerLongitude')) document.getElementById('sellerLongitude').value = s.longitude || '';
    document.getElementById('sellerCategory').value = s.category || '';
    document.getElementById('sellerSubCategories').value = s.subCategories || '';
    document.getElementById('sellerDescription').value = s.businessDescription || '';
    document.getElementById('sellerHours').value = s.operatingHours || '';

    document.getElementById('sellerVerified').checked = !!s.verifiedSeller;
    document.getElementById('sellerFeatured').checked = !!s.featuredSeller;
    document.getElementById('sellerPremium').checked = !!s.premiumSeller;

    document.getElementById('sellerStatusActive').checked = !!s.statusActive;
    document.getElementById('sellerStatusInactive').checked = !!s.statusInactive;
    document.getElementById('sellerStatusSuspended').checked = !!s.statusSuspended;

    window.toggleSellerBranchFields();

    document.getElementById('sellerFormTitle').scrollIntoView({ behavior: 'smooth' });
};

window.deleteSeller = async function (index) {
    if (confirm('Are you sure you want to delete this seller?')) {
        sellers.splice(index, 1);
        try {
            await DataService.saveSellers(sellers);
            window.renderSellers();
            alert('Seller deleted successfully!');
        } catch (err) {
            alert('Error deleting seller: ' + err.message);
        }
    }
};

window.viewSellerProfile = function (index) {
    const s = sellers[index];
    if (!s) return;

    const prodCount = (products || []).filter(p => {
        const addedBy = String(p.addedBy || '').toLowerCase().trim();
        const busName = String(s.businessName || '').toLowerCase().trim();
        const ownName = String(s.ownerName || '').toLowerCase().trim();
        const selId = String(s.sellerId || '').toLowerCase().trim();
        return addedBy === busName || addedBy === ownName || addedBy === selId || String(p.companyName || '').toLowerCase().trim() === busName;
    }).length;

    const dealCount = (deals || []).filter(d => {
        const addedBy = String(d.addedBy || '').toLowerCase().trim();
        const busName = String(s.businessName || '').toLowerCase().trim();
        const ownName = String(s.ownerName || '').toLowerCase().trim();
        const selId = String(s.sellerId || '').toLowerCase().trim();
        return addedBy === busName || addedBy === ownName || addedBy === selId || String(d.companyName || '').toLowerCase().trim() === busName;
    }).length;

    const orderCount = 0;

    document.getElementById('profileBusinessName').textContent = s.businessName || 'Business Name';
    document.getElementById('profileOwnerName').textContent = 'Owner: ' + (s.ownerName || 'Owner Name');
    document.getElementById('profileCategory').textContent = s.category || 'Category';
    document.getElementById('profileCity').textContent = s.city || 'City';
    document.getElementById('profilePhone').textContent = s.mobileNumber || 'Phone';
    document.getElementById('profileWhatsApp').textContent = s.whatsappNumber || 'WhatsApp';

    document.getElementById('profileProductsCount').textContent = prodCount;
    document.getElementById('profileDealsCount').textContent = dealCount;
    document.getElementById('profileOrdersCount').textContent = orderCount;

    document.getElementById('profileHours').textContent = s.operatingHours || 'Not specified';
    document.getElementById('profileDescription').textContent = s.businessDescription || 'No description provided.';

    const verifiedBadge = document.getElementById('profileVerifiedBadge');
    if (s.verifiedSeller) {
        verifiedBadge.className = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-xl p-3 text-center';
    } else {
        verifiedBadge.className = 'border-slate-800 bg-slate-800/30 text-slate-500 rounded-xl p-3 text-center opacity-40';
    }

    const featuredBadge = document.getElementById('profileFeaturedBadge');
    if (s.featuredSeller) {
        featuredBadge.className = 'border-amber-500/30 bg-amber-500/10 text-amber-400 rounded-xl p-3 text-center';
    } else {
        featuredBadge.className = 'border-slate-800 bg-slate-800/30 text-slate-500 rounded-xl p-3 text-center opacity-40';
    }

    const premiumBadge = document.getElementById('profilePremiumBadge');
    if (s.premiumSeller) {
        premiumBadge.className = 'border-sky-500/30 bg-sky-500/10 text-sky-400 rounded-xl p-3 text-center';
    } else {
        premiumBadge.className = 'border-slate-800 bg-slate-800/30 text-slate-500 rounded-xl p-3 text-center opacity-40';
    }

    const modal = document.getElementById('sellerProfileModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.closeSellerProfile = function () {
    const modal = document.getElementById('sellerProfileModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

const sellerForm = document.getElementById('sellerForm');
if (sellerForm) {
    sellerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const sellerId = document.getElementById('sellerId').value;
            const businessName = document.getElementById('sellerBusinessName').value;
            const ownerName = document.getElementById('sellerOwnerName').value;
            const businessType = document.getElementById('sellerBusinessType').value;
            const mobileNumber = document.getElementById('sellerMobile').value;
            const whatsappNumber = document.getElementById('sellerWhatsapp').value;
            const email = document.getElementById('sellerEmail').value;
            const website = document.getElementById('sellerWebsite').value;
            const facebookPage = document.getElementById('sellerFacebook').value;
            const instagramPage = document.getElementById('sellerInstagram').value;
            const address = document.getElementById('sellerAddress').value;
            const area = document.getElementById('sellerArea') ? document.getElementById('sellerArea').value : '';
            const blockNo = document.getElementById('sellerBlockNo') ? document.getElementById('sellerBlockNo').value : '';
            const areaBlock = (area && blockNo) ? `${area} - ${blockNo}` : (area || blockNo || '');
            const city = document.getElementById('sellerCity').value;
            const branches = document.getElementById('sellerBranches').value;
            const branchAddress = document.getElementById('sellerBranchAddress').value;
            const branchPhone = document.getElementById('sellerBranchPhone').value;
            const branchWhatsapp = document.getElementById('sellerBranchWhatsapp').value;
            const province = document.getElementById('sellerProvince').value;
            const googleMapsLink = document.getElementById('sellerMapsLink').value;
            const latitude = document.getElementById('sellerLatitude') ? document.getElementById('sellerLatitude').value : '';
            const longitude = document.getElementById('sellerLongitude') ? document.getElementById('sellerLongitude').value : '';
            const category = document.getElementById('sellerCategory').value;
            const subCategories = document.getElementById('sellerSubCategories').value;
            const businessDescription = document.getElementById('sellerDescription').value;
            const operatingHours = document.getElementById('sellerHours').value;

            const verifiedSeller = document.getElementById('sellerVerified').checked;
            const featuredSeller = document.getElementById('sellerFeatured').checked;
            const premiumSeller = document.getElementById('sellerPremium').checked;

            const statusActive = document.getElementById('sellerStatusActive').checked;
            const statusInactive = document.getElementById('sellerStatusInactive').checked;
            const statusSuspended = document.getElementById('sellerStatusSuspended').checked;

            let status = 'Active';
            if (statusInactive) status = 'Inactive';
            if (statusSuspended) status = 'Suspended';

            const newSeller = {
                id: sellerEditIndex === -1 ? DataService.generateUUID() : sellers[sellerEditIndex].id,
                sellerId,
                businessName,
                ownerName,
                businessType,
                mobileNumber,
                whatsappNumber,
                email,
                website,
                facebookPage,
                instagramPage,
                address,
                area,
                blockNo,
                areaBlock,
                city,
                branches,
                branchAddress,
                branchPhone,
                branchWhatsapp,
                province,
                googleMapsLink,
                category,
                subCategories,
                businessDescription,
                operatingHours,
                verifiedSeller,
                featuredSeller,
                premiumSeller,
                statusActive,
                statusInactive,
                statusSuspended,
                status,
                latitude,
                longitude
            };

            if (sellerEditIndex === -1) {
                if (sellers.some(s => s.sellerId === sellerId)) {
                    alert('Duplicate Seller ID. Please regenerate.');
                    return;
                }
                sellers.push(newSeller);
            } else {
                sellers[sellerEditIndex] = newSeller;
            }

            try {
                await DataService.saveSellers(sellers);
                alert(sellerEditIndex === -1 ? 'Seller Added Successfully!' : 'Seller Updated Successfully!');
                window.cancelSellerEdit();
                window.renderSellers();
                if (typeof window.populateSellersDatalist === 'function') {
                    window.populateSellersDatalist();
                }
            } catch (err) {
                alert('Error saving seller: ' + err.message);
            }
        } catch (outerErr) {
            console.error("Error in seller submit:", outerErr);
            alert("Error in seller submit: " + outerErr.message);
        }
    });
}

/* =========================================================================
   DYNAMIC GROCERY SCHEMA LOGIC (SCHEMA-ADAPTED)
   ========================================================================= */

const groceryCatSelect = document.getElementById("prodCategory");
const grocerySubCatSelect = document.getElementById("prodSubCategory");
const groceryFields = document.getElementById("groceryProductFields");
const groceryTable = document.getElementById("groceryProductTable");

let currentGroceryFields = [];
let currentGroceryProducts = [];

const COMMON_FIELDS = [
    { field_name: "item_name", field_label: "Item / Product Name", field_type: "text", is_required: true },
    { field_name: "brand", field_label: "Brand", field_type: "text", is_required: true },
    { field_name: "model", field_label: "Model", field_type: "text", is_required: true },
    { field_name: "condition", field_label: "Condition", field_type: "text", is_required: true },
    { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
    { field_name: "stock_status", field_label: "Stock Status", field_type: "text", is_required: true },
    { field_name: "warranty", field_label: "Warranty", field_type: "text", is_required: true }
];

const SPECIALIZED_FIELDS_MAP = {
    // Groceries
    "Retail": [
        { field_name: "quality", field_label: "Quality", field_type: "text", is_required: false }
    ],
    "Vegetables": [
        { field_name: "quality", field_label: "Quality", field_type: "text", is_required: false },
        { field_name: "unit", field_label: "Unit", field_type: "text", is_required: false }
    ],
    "Fruits": [
        { field_name: "quality", field_label: "Quality", field_type: "text", is_required: false },
        { field_name: "unit", field_label: "Unit", field_type: "text", is_required: false }
    ],
    // Computers - Laptops
    "Laptops": [
        { field_name: "item_name", field_label: "Item / Product Name", field_type: "text", is_required: true },
        { field_name: "image", field_label: "Image", field_type: "image", is_required: false },
        { field_name: "brand", field_label: "Brand", field_type: "select", field_options: ["Acer", "Asus", "CTL", "Dell", "Ergo", "Haier", "Hp", "Lenovo", "Samsung", "Toshiba"], is_required: true },
        { field_name: "model", field_label: "Model", field_type: "text", is_required: true },
        { field_name: "processor", field_label: "Processor", field_type: "text", is_required: true },
        { field_name: "ram", field_label: "RAM (GB)", field_type: "select", field_options: ["2", "4", "6", "8", "12", "16", "20", "24", "32", "64", "128"], is_required: true },
        { field_name: "ram_type", field_label: "RAM Type", field_type: "select", field_options: ["DDR2", "DDR3", "DDR4", "DDR5"], is_required: true },
        { field_name: "storage_capacity", field_label: "Storage Capacity", field_type: "select", field_options: ["16", "32", "64", "80", "120", "128", "160", "180", "250", "256", "320", "500", "512", "650", "750", "1 TB", "2 TB", "3 TB", "4 TB", "5 TB", "6 TB", "8 TB"], is_required: true },
        { field_name: "storage_type", field_label: "Storage Type", field_type: "select", field_options: ["SATA HDD", "SATA SSD", "SSD M1", "SSD M2", "SSD M2 NVME"], is_required: true },
        { field_name: "graphics", field_label: "Graphics", field_type: "select", field_options: ["512 MB", "1 GB", "2 GB", "4 GB", "6 GB", "8 GB"], is_required: true },
        { field_name: "graphics_company", field_label: "Graphics Company", field_type: "text", is_required: true },
        { field_name: "screen_size", field_label: "Screen Size", field_type: "select", field_options: ["8\"", "10\"", "11.6\"", "12.6\"", "13.3\"", "14\"", "15\"", "15.6\"", "16\"", "17\"", "17.3\"", "19\""], is_required: true },
        { field_name: "screen_resolution", field_label: "Screen Resolution", field_type: "text", is_required: true },
        { field_name: "display_type", field_label: "Display Type", field_type: "select", field_options: ["HD", "FHD", "UHD"], is_required: true },
        { field_name: "condition", field_label: "Condition", field_type: "select", field_options: ["New", "Like a New", "Normal", "Lower"], is_required: true },
        { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
        { field_name: "stock_status", field_label: "Stock Status", field_type: "select", field_options: ["Available", "Finish"], is_required: true },
        { field_name: "warranty", field_label: "Warranty", field_type: "select", field_options: ["Yes", "No", "Limited Time"], is_required: true },
        { field_name: "description", field_label: "Description", field_type: "text", is_required: false }
    ],
    // Computers - Chromebooks
    "Chromebooks": [
        { field_name: "item_name", field_label: "Item / Product Name", field_type: "text", is_required: true },
        { field_name: "brand", field_label: "Brand", field_type: "select", field_options: ["Acer", "Asus", "CTL", "Dell", "Hp", "Lenovo", "Samsung"], is_required: true },
        { field_name: "image", field_label: "Image", field_type: "image", is_required: false },
        { field_name: "model", field_label: "Model", field_type: "text", is_required: true },
        { field_name: "processor", field_label: "Processor", field_type: "text", is_required: true },
        { field_name: "ram", field_label: "RAM", field_type: "select", field_options: ["2 GB", "4 GB", "6 GB", "8 GB"], is_required: true },
        { field_name: "storage", field_label: "Storage", field_type: "select", field_options: ["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"], is_required: true },
        { field_name: "screen_size", field_label: "Screen Size", field_type: "select", field_options: ["8\"", "10\"", "11.6\"", "12.6\"", "13.3\"", "14\""], is_required: true },
        { field_name: "screen_resolution", field_label: "Screen Resolution", field_type: "text", is_required: true },
        { field_name: "touchscreen", field_label: "Touchscreen", field_type: "select", field_options: ["Yes", "No"], is_required: true },
        { field_name: "rotate_360", field_label: "Rotate 360", field_type: "select", field_options: ["Yes", "No"], is_required: true },
        { field_name: "condition", field_label: "Condition", field_type: "select", field_options: ["New", "Like New", "Used"], is_required: true },
        { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
        { field_name: "stock_status", field_label: "Stock Status", field_type: "select", field_options: ["Available", "Finish"], is_required: true },
        { field_name: "warranty", field_label: "Warranty", field_type: "select", field_options: ["Yes", "Conditional", "No"], is_required: true },
        { field_name: "description", field_label: "Description", field_type: "text", is_required: false }
    ],
    // Computers - Desktop PCs / Desktop PC
    "Desktop PCs": [
        { field_name: "processor", field_label: "Processor", field_type: "text", is_required: true },
        { field_name: "generation", field_label: "Generation", field_type: "text", is_required: true },
        { field_name: "ram", field_label: "RAM", field_type: "text", is_required: true },
        { field_name: "storage", field_label: "Storage", field_type: "text", is_required: true },
        { field_name: "storage_type", field_label: "Storage Type", field_type: "text", is_required: true },
        { field_name: "graphics_card", field_label: "Graphics Card", field_type: "text", is_required: true },
        { field_name: "graphics_memory", field_label: "Graphics Memory", field_type: "text", is_required: true },
        { field_name: "motherboard", field_label: "Motherboard", field_type: "text", is_required: true },
        { field_name: "psu", field_label: "PSU", field_type: "text", is_required: true },
        { field_name: "case_type", field_label: "Case Type", field_type: "text", is_required: true }
    ],
    "Desktop PC": [
        { field_name: "processor", field_label: "Processor", field_type: "text", is_required: true },
        { field_name: "generation", field_label: "Generation", field_type: "text", is_required: true },
        { field_name: "ram", field_label: "RAM", field_type: "text", is_required: true },
        { field_name: "storage", field_label: "Storage", field_type: "text", is_required: true },
        { field_name: "storage_type", field_label: "Storage Type", field_type: "text", is_required: true },
        { field_name: "graphics_card", field_label: "Graphics Card", field_type: "text", is_required: true },
        { field_name: "graphics_memory", field_label: "Graphics Memory", field_type: "text", is_required: true },
        { field_name: "motherboard", field_label: "Motherboard", field_type: "text", is_required: true },
        { field_name: "psu", field_label: "PSU", field_type: "text", is_required: true },
        { field_name: "case_type", field_label: "Case Type", field_type: "text", is_required: true }
    ],
    // Monitors
    "Monitors": [
        { field_name: "screen_size", field_label: "Screen Size", field_type: "text", is_required: true },
        { field_name: "resolution", field_label: "Resolution", field_type: "text", is_required: true },
        { field_name: "panel_type", field_label: "Panel Type", field_type: "text", is_required: true },
        { field_name: "refresh_rate", field_label: "Refresh Rate", field_type: "text", is_required: true },
        { field_name: "response_time", field_label: "Response Time", field_type: "text", is_required: true },
        { field_name: "aspect_ratio", field_label: "Aspect Ratio", field_type: "text", is_required: true },
        { field_name: "ports", field_label: "Ports (Multi-select)", field_type: "text", is_required: true },
        { field_name: "adaptive_sync", field_label: "Adaptive Sync", field_type: "text", is_required: true },
        { field_name: "curved", field_label: "Curved", field_type: "text", is_required: true }
    ],
    // Printers / Printers & Scanners
    "Printers": [
        { field_name: "item_name", field_label: "Item / Product Name", field_type: "text", is_required: true },
        { field_name: "brand", field_label: "Brand", field_type: "select", field_options: ["HP", "Canon", "Epson", "Brother", "Samsung", "Pantum", "Xerox", "Ricoh", "Other"], is_required: true },
        { field_name: "image", field_label: "Product Image", field_type: "image", is_required: false },
        { field_name: "model", field_label: "Model", field_type: "text", is_required: true },
        { field_name: "printer_type", field_label: "Printer Type", field_type: "select", field_options: ["Inkjet", "Laser", "LED", "Dot Matrix", "Thermal", "All-in-One"], is_required: true },
        { field_name: "technology", field_label: "Technology", field_type: "select", field_options: ["Monochrome", "Color"], is_required: true },
        { field_name: "print_color", field_label: "Print Color", field_type: "select", field_options: ["Black & White", "Color", "B&W + Color"], is_required: true },
        { field_name: "print_speed", field_label: "Print Speed (PPM)", field_type: "number", is_required: false },
        { field_name: "print_resolution", field_label: "Print Resolution", field_type: "text", is_required: false },
        { field_name: "duplex_printing", field_label: "Duplex Printing", field_type: "select", field_options: ["Automatic", "Manual", "Not Supported"], is_required: false },
        { field_name: "scanner", field_label: "Scanner", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "copier", field_label: "Copier", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "fax", field_label: "Fax", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "connectivity", field_label: "Connectivity (Multi-select)", field_type: "select", field_options: ["USB", "Wi-Fi", "Ethernet", "Bluetooth", "Wi-Fi Direct"], is_required: true },
        { field_name: "paper_size", field_label: "Paper Size (Multi-select)", field_type: "select", field_options: ["A4", "A3", "A5", "A6", "Letter", "Legal", "Envelopes"], is_required: true },
        { field_name: "paper_tray_capacity", field_label: "Paper Tray Capacity", field_type: "number", is_required: false },
        { field_name: "monthly_duty_cycle", field_label: "Monthly Duty Cycle", field_type: "number", is_required: false },
        { field_name: "ink_toner_type", field_label: "Ink / Toner Type", field_type: "text", is_required: false },
        { field_name: "ink_toner_yield", field_label: "Ink / Toner Yield", field_type: "text", is_required: false },
        { field_name: "condition", field_label: "Condition", field_type: "select", field_options: ["New", "Used", "Refurbished"], is_required: true },
        { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
        { field_name: "stock_status", field_label: "Stock Status", field_type: "select", field_options: ["In Stock", "Out of Stock", "Pre-Order"], is_required: true },
        { field_name: "warranty", field_label: "Warranty", field_type: "select", field_options: ["No Warranty", "3 Months", "6 Months", "1 Year", "2 Years", "Seller Warranty", "Brand Warranty"], is_required: false },
        { field_name: "description", field_label: "Description", field_type: "text", is_required: false }
    ],
    "Printers & Scanners": [
        { field_name: "item_name", field_label: "Item / Product Name", field_type: "text", is_required: true },
        { field_name: "brand", field_label: "Brand", field_type: "select", field_options: ["HP", "Canon", "Epson", "Brother", "Samsung", "Pantum", "Xerox", "Ricoh", "Other"], is_required: true },
        { field_name: "image", field_label: "Product Image", field_type: "image", is_required: false },
        { field_name: "model", field_label: "Model", field_type: "text", is_required: true },
        { field_name: "printer_type", field_label: "Printer Type", field_type: "select", field_options: ["Inkjet", "Laser", "LED", "Dot Matrix", "Thermal", "All-in-One"], is_required: true },
        { field_name: "technology", field_label: "Technology", field_type: "select", field_options: ["Monochrome", "Color"], is_required: true },
        { field_name: "print_color", field_label: "Print Color", field_type: "select", field_options: ["Black & White", "Color", "B&W + Color"], is_required: true },
        { field_name: "print_speed", field_label: "Print Speed (PPM)", field_type: "number", is_required: false },
        { field_name: "print_resolution", field_label: "Print Resolution", field_type: "text", is_required: false },
        { field_name: "duplex_printing", field_label: "Duplex Printing", field_type: "select", field_options: ["Automatic", "Manual", "Not Supported"], is_required: false },
        { field_name: "scanner", field_label: "Scanner", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "copier", field_label: "Copier", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "fax", field_label: "Fax", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "connectivity", field_label: "Connectivity (Multi-select)", field_type: "select", field_options: ["USB", "Wi-Fi", "Ethernet", "Bluetooth", "Wi-Fi Direct"], is_required: true },
        { field_name: "paper_size", field_label: "Paper Size (Multi-select)", field_type: "select", field_options: ["A4", "A3", "A5", "A6", "Letter", "Legal", "Envelopes"], is_required: true },
        { field_name: "paper_tray_capacity", field_label: "Paper Tray Capacity", field_type: "number", is_required: false },
        { field_name: "monthly_duty_cycle", field_label: "Monthly Duty Cycle", field_type: "number", is_required: false },
        { field_name: "ink_toner_type", field_label: "Ink / Toner Type", field_type: "text", is_required: false },
        { field_name: "ink_toner_yield", field_label: "Ink / Toner Yield", field_type: "text", is_required: false },
        { field_name: "condition", field_label: "Condition", field_type: "select", field_options: ["New", "Used", "Refurbished"], is_required: true },
        { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
        { field_name: "stock_status", field_label: "Stock Status", field_type: "select", field_options: ["In Stock", "Out of Stock", "Pre-Order"], is_required: true },
        { field_name: "warranty", field_label: "Warranty", field_type: "select", field_options: ["No Warranty", "3 Months", "6 Months", "1 Year", "2 Years", "Seller Warranty", "Brand Warranty"], is_required: false },
        { field_name: "description", field_label: "Description", field_type: "text", is_required: false }
    ],
    // Storage Devices
    "Storage Devices": [
        { field_name: "storage_type", field_label: "Storage Type", field_type: "text", is_required: true },
        { field_name: "capacity", field_label: "Capacity", field_type: "text", is_required: true },
        { field_name: "interface", field_label: "Interface", field_type: "text", is_required: true },
        { field_name: "form_factor", field_label: "Form Factor", field_type: "text", is_required: true },
        { field_name: "read_speed", field_label: "Read Speed", field_type: "text", is_required: false },
        { field_name: "write_speed", field_label: "Write Speed", field_type: "text", is_required: false }
    ],
    // Laptop Charger
    "Laptop Charger": [
        { field_name: "item_name", field_label: "Item / Product Name", field_type: "text", is_required: true },
        { field_name: "brand", field_label: "Brand", field_type: "select", field_options: ["HP", "Dell", "Lenovo", "Acer", "Asus", "Apple", "Toshiba", "MSI", "Samsung", "Universal", "Other"], is_required: true },
        { field_name: "image", field_label: "Product Image", field_type: "image", is_required: false },
        { field_name: "compatible_brand", field_label: "Compatible Brand", field_type: "select", field_options: ["HP", "Dell", "Lenovo", "Acer", "Asus", "Apple", "Toshiba", "MSI", "Samsung", "Universal", "Other"], is_required: true },
        { field_name: "compatible_model", field_label: "Compatible Model", field_type: "text", is_required: true },
        { field_name: "charger_type", field_label: "Charger Type", field_type: "select", field_options: ["Original", "Compatible", "Universal"], is_required: true },
        { field_name: "output_voltage", field_label: "Output Voltage", field_type: "number", is_required: true },
        { field_name: "output_current", field_label: "Output Current", field_type: "number", is_required: true },
        { field_name: "wattage", field_label: "Power / Wattage", field_type: "number", is_required: true },
        { field_name: "connector_type", field_label: "Connector Type", field_type: "select", field_options: ["Barrel Pin", "USB-C", "MagSafe", "Surface Connector", "Other"], is_required: true },
        { field_name: "connector_size", field_label: "Connector Size", field_type: "text", is_required: false },
        { field_name: "input_voltage", field_label: "Input Voltage", field_type: "text", is_required: true },
        { field_name: "input_frequency", field_label: "Input Frequency", field_type: "text", is_required: false },
        { field_name: "power_plug_type", field_label: "Power Plug Type", field_type: "select", field_options: ["UK/PK 3-Pin", "EU 2-Pin", "US 2-Pin", "Other"], is_required: false },
        { field_name: "cable_included", field_label: "Cable Included", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "cable_length", field_label: "Cable Length", field_type: "number", is_required: false },
        { field_name: "polarity", field_label: "Polarity", field_type: "select", field_options: ["Center Positive", "Center Negative", "N/A"], is_required: false },
        { field_name: "condition", field_label: "Condition", field_type: "select", field_options: ["New", "Used", "Refurbished"], is_required: true },
        { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
        { field_name: "stock_status", field_label: "Stock Status", field_type: "select", field_options: ["In Stock", "Out of Stock", "Pre-Order"], is_required: true },
        { field_name: "warranty", field_label: "Warranty", field_type: "select", field_options: ["No Warranty", "3 Months", "6 Months", "1 Year", "2 Years", "Seller Warranty", "Brand Warranty"], is_required: false },
        { field_name: "description", field_label: "Description", field_type: "text", is_required: false }
    ],
    // Laptop Bags
    "Laptop Bags": [
        { field_name: "bag_type", field_label: "Bag Type", field_type: "text", is_required: true },
        { field_name: "compatible_laptop_size", field_label: "Compatible Laptop Size", field_type: "text", is_required: true },
        { field_name: "material", field_label: "Material", field_type: "text", is_required: true },
        { field_name: "compartments", field_label: "Compartments", field_type: "number", is_required: true },
        { field_name: "water_resistant", field_label: "Water Resistant", field_type: "text", is_required: true },
        { field_name: "color", field_label: "Color", field_type: "text", is_required: true }
    ],
    // Keyboards
    "Keyboard": [
        { field_name: "item_name", field_label: "Item / Product Name", field_type: "text", is_required: true },
        { field_name: "brand", field_label: "Brand", field_type: "select", field_options: ["Logitech", "HP", "Dell", "Lenovo", "Razer", "Corsair", "Redragon", "A4Tech", "Rapoo", "Fantech", "Other"], is_required: true },
        { field_name: "image", field_label: "Product Image", field_type: "image", is_required: false },
        { field_name: "model", field_label: "Model", field_type: "text", is_required: true },
        { field_name: "keyboard_type", field_label: "Keyboard Type", field_type: "select", field_options: ["Standard", "Mechanical", "Membrane", "Scissor", "Gaming", "Ergonomic"], is_required: true },
        { field_name: "switch_type", field_label: "Switch Type", field_type: "select", field_options: ["Membrane", "Mechanical", "Linear", "Tactile", "Clicky", "Scissor", "N/A"], is_required: false },
        { field_name: "layout", field_label: "Layout", field_type: "select", field_options: ["Full Size", "Tenkeyless (TKL)", "75%", "65%", "60%", "Compact", "Other"], is_required: true },
        { field_name: "connection", field_label: "Connection", field_type: "select", field_options: ["USB", "Wireless 2.4GHz", "Bluetooth", "USB + Bluetooth", "USB + Wireless"], is_required: true },
        { field_name: "wireless", field_label: "Wireless", field_type: "select", field_options: ["Yes", "No"], is_required: true },
        { field_name: "backlit", field_label: "Backlit", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "rgb_lighting", field_label: "RGB Lighting", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "number_of_keys", field_label: "Number of Keys", field_type: "number", is_required: false },
        { field_name: "n_key_rollover", field_label: "N-Key Rollover", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "anti_ghosting", field_label: "Anti-Ghosting", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "multimedia_keys", field_label: "Multimedia Keys", field_type: "select", field_options: ["Dedicated", "Function Keys", "No"], is_required: false },
        { field_name: "range", field_label: "Wired / Wireless Range", field_type: "text", is_required: false },
        { field_name: "battery", field_label: "Battery / Battery Life", field_type: "text", is_required: false },
        { field_name: "compatibility", field_label: "Compatibility (Multi-select)", field_type: "select", field_options: ["Windows", "macOS", "Linux", "ChromeOS", "Android", "iOS"], is_required: false },
        { field_name: "color", field_label: "Color", field_type: "select", field_options: ["Black", "White", "Grey", "Other"], is_required: false },
        { field_name: "condition", field_label: "Condition", field_type: "select", field_options: ["New", "Used", "Refurbished"], is_required: true },
        { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
        { field_name: "stock_status", field_label: "Stock Status", field_type: "select", field_options: ["In Stock", "Out of Stock", "Pre-Order"], is_required: true },
        { field_name: "warranty", field_label: "Warranty", field_type: "select", field_options: ["No Warranty", "3 Months", "6 Months", "1 Year", "2 Years", "Seller Warranty", "Brand Warranty"], is_required: false },
        { field_name: "description", field_label: "Description", field_type: "text", is_required: false }
    ],
    // Mouse
    "Mouse": [
        { field_name: "item_name", field_label: "Item / Product Name", field_type: "text", is_required: true },
        { field_name: "brand", field_label: "Brand", field_type: "select", field_options: ["Logitech", "HP", "Dell", "Lenovo", "Razer", "Corsair", "A4Tech", "Rapoo", "Fantech", "Redragon", "Other"], is_required: true },
        { field_name: "image", field_label: "Product Image", field_type: "image", is_required: false },
        { field_name: "model", field_label: "Model", field_type: "text", is_required: true },
        { field_name: "mouse_type", field_label: "Mouse Type", field_type: "select", field_options: ["Standard", "Gaming", "Ergonomic", "Vertical", "Trackball", "Travel"], is_required: true },
        { field_name: "connection", field_label: "Connection", field_type: "select", field_options: ["USB", "Wireless 2.4GHz", "Bluetooth", "USB + Bluetooth"], is_required: true },
        { field_name: "wireless", field_label: "Wireless", field_type: "select", field_options: ["Yes", "No"], is_required: true },
        { field_name: "sensor_type", field_label: "Sensor Type", field_type: "select", field_options: ["Optical", "Laser", "BlueTrack", "Other"], is_required: false },
        { field_name: "dpi", field_label: "DPI", field_type: "number", is_required: false },
        { field_name: "adjustable_dpi", field_label: "Adjustable DPI", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "buttons", field_label: "Buttons", field_type: "number", is_required: false },
        { field_name: "polling_rate", field_label: "Polling Rate", field_type: "select", field_options: ["125Hz", "250Hz", "500Hz", "1000Hz", "2000Hz", "4000Hz", "8000Hz"], is_required: false },
        { field_name: "tracking_speed", field_label: "Tracking Speed", field_type: "text", is_required: false },
        { field_name: "acceleration", field_label: "Acceleration", field_type: "text", is_required: false },
        { field_name: "rgb_lighting", field_label: "RGB Lighting", field_type: "select", field_options: ["Yes", "No"], is_required: false },
        { field_name: "cable_length", field_label: "Cable Length", field_type: "number", is_required: false },
        { field_name: "battery_type", field_label: "Battery Type", field_type: "select", field_options: ["AA", "AAA", "Rechargeable", "Built-in", "N/A"], is_required: false },
        { field_name: "battery_life", field_label: "Battery Life", field_type: "text", is_required: false },
        { field_name: "compatibility", field_label: "Compatibility (Multi-select)", field_type: "select", field_options: ["Windows", "macOS", "Linux", "ChromeOS"], is_required: false },
        { field_name: "color", field_label: "Color", field_type: "select", field_options: ["Black", "White", "Grey", "Other"], is_required: false },
        { field_name: "condition", field_label: "Condition", field_type: "select", field_options: ["New", "Used", "Refurbished"], is_required: true },
        { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
        { field_name: "stock_status", field_label: "Stock Status", field_type: "select", field_options: ["In Stock", "Out of Stock", "Pre-Order"], is_required: true },
        { field_name: "warranty", field_label: "Warranty", field_type: "select", field_options: ["No Warranty", "3 Months", "6 Months", "1 Year", "2 Years", "Seller Warranty", "Brand Warranty"], is_required: false },
        { field_name: "description", field_label: "Description", field_type: "text", is_required: false }
    ],
    // Power Cord
    "Power Code": [
        { field_name: "cable_type", field_label: "Cable Type", field_type: "text", is_required: true },
        { field_name: "connector_type", field_label: "Connector Type", field_type: "text", is_required: true },
        { field_name: "cable_length", field_label: "Cable Length", field_type: "text", is_required: true },
        { field_name: "rated_voltage", field_label: "Rated Voltage", field_type: "text", is_required: true },
        { field_name: "rated_current", field_label: "Rated Current", field_type: "text", is_required: true },
        { field_name: "compatible_device", field_label: "Compatible Device", field_type: "text", is_required: true }
    ]
};

const multimediaFieldConfig = {
    speakers: [
        {
            name: "item",
            label: "Item / Product Name",
            type: "text",
            required: true
        },
        {
            name: "brand",
            label: "Brand",
            type: "select",
            options: [
                "AD-7000",
                "Altec Lansing",
                "Audionic",
                "Blaster",
                "Creative",
                "Classic",
                "Edifier",
                "Fantech",
                "Faster",
                "F&D",
                "Havit",
                "HP",
                "JBL",
                "Logitech",
                "Max230",
                "Max550",
                "Mega40",
                "Mega100",
                "Microlab",
                "Pace",
                "Rainbow",
                "Reborn",
                "Redragon",
                "Ronin",
                "SteelSeries",
                "Sony",
                "Vision35",
                "Xiaomi",
                "Generic / No Brand",
                "Other"
            ],
            required: true
        },
        {
            name: "model",
            label: "Model",
            type: "text",
            required: false
        },
        {
            name: "speaker_type",
            label: "Speaker Type",
            type: "select",
            options: [
                "2.0",
                "2.1",
                "5.1",
                "7.1",
                "Soundbar",
                "Portable"
            ],
            required: true
        },
        {
            name: "power_output",
            label: "Power Output",
            type: "text",
            required: false
        },
        {
            name: "connection",
            label: "Connection",
            type: "multiselect",
            options: [
                "USB",
                "AUX",
                "Bluetooth",
                "3.5mm",
                "Optical"
            ],
            required: true
        },
        {
            name: "bluetooth",
            label: "Bluetooth",
            type: "select",
            options: ["Yes", "No"],
            required: false
        },
        {
            name: "subwoofer",
            label: "Subwoofer",
            type: "select",
            options: ["Yes", "No"],
            required: false
        },
        {
            name: "rgb",
            label: "RGB",
            type: "select",
            options: ["Yes", "No"],
            required: false
        },
        {
            name: "condition",
            label: "Condition",
            type: "select",
            options: [
                "New",
                "Used",
                "Refurbished"
            ],
            required: true
        },
        {
            name: "price",
            label: "Price",
            type: "number",
            required: true
        },
        {
            name: "stock",
            label: "Stock Status",
            type: "select",
            options: [
                "In Stock",
                "Out of Stock",
                "Pre-Order"
            ],
            required: true
        },
        {
            name: "warranty",
            label: "Warranty",
            type: "select",
            options: [
                "No Warranty",
                "3 Months",
                "6 Months",
                "1 Year",
                "2 Years",
                "Seller Warranty",
                "Brand Warranty"
            ],
            required: false
        }
    ],

    headphones: [
        {
            name: "item",
            label: "Item / Product Name",
            type: "text",
            required: true
        },
        {
            name: "brand",
            label: "Brand",
            type: "text",
            required: true
        },
        {
            name: "model",
            label: "Model",
            type: "text",
            required: false
        },
        {
            name: "headphone_type",
            label: "Headphone Type",
            type: "select",
            options: [
                "Over-Ear",
                "On-Ear",
                "In-Ear",
                "Gaming",
                "TWS"
            ],
            required: true
        },
        {
            name: "connection",
            label: "Connection",
            type: "select",
            options: [
                "Wired",
                "Bluetooth",
                "Wireless 2.4GHz",
                "USB"
            ],
            required: true
        },
        {
            name: "microphone",
            label: "Microphone",
            type: "select",
            options: ["Yes", "No"],
            required: false
        },
        {
            name: "noise_cancellation",
            label: "Noise Cancellation",
            type: "select",
            options: ["Yes", "No"],
            required: false
        },
        {
            name: "battery_life",
            label: "Battery Life",
            type: "text",
            required: false
        },
        {
            name: "condition",
            label: "Condition",
            type: "select",
            options: [
                "New",
                "Used",
                "Refurbished"
            ],
            required: true
        },
        {
            name: "price",
            label: "Price",
            type: "number",
            required: true
        },
        {
            name: "stock",
            label: "Stock Status",
            type: "select",
            options: [
                "In Stock",
                "Out of Stock",
                "Pre-Order"
            ],
            required: true
        },
        {
            name: "warranty",
            label: "Warranty",
            type: "select",
            options: [
                "No Warranty",
                "3 Months",
                "6 Months",
                "1 Year",
                "Seller Warranty",
                "Brand Warranty"
            ],
            required: false
        }
    ],

    microphones: [
        {
            name: "item",
            label: "Item / Product Name",
            type: "text",
            required: true
        },
        {
            name: "brand",
            label: "Brand",
            type: "text",
            required: true
        },
        {
            name: "model",
            label: "Model",
            type: "text",
            required: false
        },
        {
            name: "microphone_type",
            label: "Microphone Type",
            type: "select",
            options: [
                "Condenser",
                "Dynamic",
                "USB",
                "Lavalier",
                "Wireless",
                "Gaming"
            ],
            required: true
        },
        {
            name: "connection",
            label: "Connection",
            type: "select",
            options: [
                "USB",
                "XLR",
                "3.5mm",
                "Bluetooth",
                "Wireless"
            ],
            required: true
        },
        {
            name: "pickup_pattern",
            label: "Pickup Pattern",
            type: "select",
            options: [
                "Cardioid",
                "Omnidirectional",
                "Bidirectional",
                "Supercardioid"
            ],
            required: false
        },
        {
            name: "noise_cancellation",
            label: "Noise Cancellation",
            type: "select",
            options: ["Yes", "No"],
            required: false
        },
        {
            name: "condition",
            label: "Condition",
            type: "select",
            options: [
                "New",
                "Used",
                "Refurbished"
            ],
            required: true
        },
        {
            name: "price",
            label: "Price",
            type: "number",
            required: true
        },
        {
            name: "stock",
            label: "Stock Status",
            type: "select",
            options: [
                "In Stock",
                "Out of Stock",
                "Pre-Order"
            ],
            required: true
        },
        {
            name: "warranty",
            label: "Warranty",
            type: "select",
            options: [
                "No Warranty",
                "3 Months",
                "6 Months",
                "1 Year",
                "Seller Warranty",
                "Brand Warranty"
            ],
            required: false
        }
    ],

    "data-cables": [
        {
            name: "item",
            label: "Item / Product Name",
            type: "text",
            required: true
        },
        {
            name: "brand",
            label: "Brand",
            type: "text",
            required: true
        },
        {
            name: "cable_type",
            label: "Cable Type",
            type: "text",
            required: true
        },
        {
            name: "connector_1",
            label: "Connector 1",
            type: "select",
            options: [
                "USB-A",
                "USB-C",
                "Micro USB",
                "Lightning"
            ],
            required: true
        },
        {
            name: "connector_2",
            label: "Connector 2",
            type: "select",
            options: [
                "USB-A",
                "USB-C",
                "Micro USB",
                "Lightning"
            ],
            required: true
        },
        {
            name: "length",
            label: "Cable Length",
            type: "text",
            required: true
        },
        {
            name: "data_speed",
            label: "Data Transfer Speed",
            type: "text",
            required: false
        },
        {
            name: "charging_power",
            label: "Charging Power",
            type: "text",
            required: false
        },
        {
            name: "condition",
            label: "Condition",
            type: "select",
            options: [
                "New",
                "Used",
                "Refurbished"
            ],
            required: true
        },
        {
            name: "price",
            label: "Price",
            type: "number",
            required: true
        },
        {
            name: "stock",
            label: "Stock Status",
            type: "select",
            options: [
                "In Stock",
                "Out of Stock",
                "Pre-Order"
            ],
            required: true
        },
        {
            name: "warranty",
            label: "Warranty",
            type: "select",
            options: [
                "No Warranty",
                "3 Months",
                "6 Months",
                "1 Year",
                "Seller Warranty",
                "Brand Warranty"
            ],
            required: false
        }
    ],

    usb: [
        {
            name: "item",
            label: "Item / Product Name",
            type: "text",
            required: true
        },
        {
            name: "brand",
            label: "Brand",
            type: "text",
            required: true
        },
        {
            name: "usb_type",
            label: "USB Type",
            type: "select",
            options: [
                "USB 2.0",
                "USB 3.0",
                "USB 3.2",
                "USB-C"
            ],
            required: true
        },
        {
            name: "capacity",
            label: "Capacity",
            type: "select",
            options: [
                "8GB",
                "16GB",
                "32GB",
                "64GB",
                "128GB",
                "256GB",
                "512GB"
            ],
            required: true
        },
        {
            name: "read_speed",
            label: "Read Speed",
            type: "text",
            required: false
        },
        {
            name: "write_speed",
            label: "Write Speed",
            type: "text",
            required: false
        },
        {
            name: "condition",
            label: "Condition",
            type: "select",
            options: [
                "New",
                "Used",
                "Refurbished"
            ],
            required: true
        },
        {
            name: "price",
            label: "Price",
            type: "number",
            required: true
        },
        {
            name: "stock",
            label: "Stock Status",
            type: "select",
            options: [
                "In Stock",
                "Out of Stock",
                "Pre-Order"
            ],
            required: true
        },
        {
            name: "warranty",
            label: "Warranty",
            type: "select",
            options: [
                "No Warranty",
                "3 Months",
                "6 Months",
                "1 Year",
                "Seller Warranty",
                "Brand Warranty"
            ],
            required: false
        }
    ],

    "hdmi-cables": [
        {
            name: "item",
            label: "Item / Product Name",
            type: "text",
            required: true
        },
        {
            name: "brand",
            label: "Brand",
            type: "text",
            required: true
        },
        {
            name: "hdmi_version",
            label: "HDMI Version",
            type: "select",
            options: [
                "HDMI 1.4",
                "HDMI 2.0",
                "HDMI 2.1"
            ],
            required: true
        },
        {
            name: "length",
            label: "Cable Length",
            type: "text",
            required: true
        },
        {
            name: "resolution",
            label: "Resolution Support",
            type: "select",
            options: [
                "1080p",
                "4K",
                "8K"
            ],
            required: true
        },
        {
            name: "refresh_rate",
            label: "Refresh Rate",
            type: "select",
            options: [
                "60Hz",
                "120Hz",
                "144Hz"
            ],
            required: false
        },
        {
            name: "hdr",
            label: "HDR",
            type: "select",
            options: ["Yes", "No"],
            required: false
        },
        {
            name: "arc",
            label: "ARC / eARC",
            type: "select",
            options: ["Yes", "No"],
            required: false
        },
        {
            name: "condition",
            label: "Condition",
            type: "select",
            options: [
                "New",
                "Used",
                "Refurbished"
            ],
            required: true
        },
        {
            name: "price",
            label: "Price",
            type: "number",
            required: true
        },
        {
            name: "stock",
            label: "Stock Status",
            type: "select",
            options: [
                "In Stock",
                "Out of Stock",
                "Pre-Order"
            ],
            required: true
        },
        {
            name: "warranty",
            label: "Warranty",
            type: "select",
            options: [
                "No Warranty",
                "3 Months",
                "6 Months",
                "1 Year",
                "Seller Warranty",
                "Brand Warranty"
            ],
            required: false
        }
    ]
};

function getFallbackFieldsForSubcategory(subCategoryName) {
    if (subCategoryName === "Laptops" || subCategoryName === "Chromebooks" || subCategoryName === "Printers" || subCategoryName === "Printers & Scanners" || subCategoryName === "Laptop Charger" || subCategoryName === "Keyboard" || subCategoryName === "Mouse") {
        return SPECIALIZED_FIELDS_MAP[subCategoryName];
    }

    const specialized = SPECIALIZED_FIELDS_MAP[subCategoryName] || [];

    if (subCategoryName === "Retail" || subCategoryName === "Vegetables" || subCategoryName === "Fruits") {
        const legacyGroceryMapping = {
            "Retail": [
                { field_name: "item", field_label: "Item", field_type: "text", is_required: true },
                { field_name: "quality", field_label: "Quality", field_type: "text", is_required: false },
                { field_name: "brand", field_label: "Brand", field_type: "text", is_required: false },
                { field_name: "price", field_label: "Price", field_type: "number", is_required: true }
            ],
            "Vegetables": [
                { field_name: "item", field_label: "Item", field_type: "text", is_required: true },
                { field_name: "quality", field_label: "Quality", field_type: "text", is_required: false },
                { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
                { field_name: "unit", field_label: "Unit", field_type: "text", is_required: false }
            ],
            "Fruits": [
                { field_name: "item", field_label: "Item", field_type: "text", is_required: true },
                { field_name: "quality", field_label: "Quality", field_type: "text", is_required: false },
                { field_name: "price", field_label: "Price", field_type: "number", is_required: true },
                { field_name: "unit", field_label: "Unit", field_type: "text", is_required: false }
            ]
        };
        return legacyGroceryMapping[subCategoryName];
    }

    const specializedNames = specialized.map(s => s.field_name);
    const filteredCommon = COMMON_FIELDS.filter(c => !specializedNames.includes(c.field_name));

    return [
        ...filteredCommon,
        ...specialized,
        { field_name: "description", field_label: "Description", field_type: "text", is_required: false }
    ];
}

function isGroceryCategory(catName) {
    return catName === 'Grocery' || catName === 'Groceries' || catName === 'Computers' || catName === 'Computer';
}

function toggleGroceryProductUI() {
    const isGrocery = groceryCatSelect && isGroceryCategory(groceryCatSelect.value);

    const legacyImageGroup = document.getElementById('legacyImageGroup');
    const legacyFields = document.getElementById('dynamicProductFields');
    const legacySubmitBtn = document.getElementById('btnLegacyProductSubmit');
    const staticStatus = document.getElementById('staticStatusContainer');
    const legacySearch = document.getElementById('legacySearchToolbar');
    const legacyTableHeader = document.getElementById('legacyTableHeader');
    const adminProductList = document.getElementById('adminProductList');
    const adminProductPagination = document.getElementById('adminProductPagination');

    if (isGrocery) {
        if (legacyImageGroup) legacyImageGroup.style.display = 'none';
        if (legacyFields) {
            legacyFields.style.display = 'none';
            legacyFields.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
        }
        if (legacySubmitBtn) legacySubmitBtn.style.display = 'none';
        if (staticStatus) staticStatus.style.display = 'none';
        if (legacySearch) legacySearch.style.display = 'none';
        if (legacyTableHeader) legacyTableHeader.style.display = 'none';
        if (adminProductList) adminProductList.style.display = 'none';
        if (adminProductPagination) adminProductPagination.style.display = 'none';

        if (groceryFields) {
            groceryFields.style.display = 'block';
            groceryFields.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
        }
        if (groceryTable) groceryTable.style.display = 'block';

        if (grocerySubCatSelect && grocerySubCatSelect.value) {
            loadGrocerySubcategoryFields(grocerySubCatSelect.value);
            loadGroceryProducts(grocerySubCatSelect.value);
        } else {
            if (groceryFields) groceryFields.innerHTML = "";
            if (groceryTable) groceryTable.innerHTML = "";
        }
    } else {
        if (legacyImageGroup) legacyImageGroup.style.display = 'block';
        if (legacyFields) {
            legacyFields.style.display = 'block';
            legacyFields.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
        }
        if (legacySubmitBtn) legacySubmitBtn.style.display = 'block';
        if (staticStatus) staticStatus.style.display = 'block';
        if (legacySearch) legacySearch.style.display = 'block';
        if (legacyTableHeader) legacyTableHeader.style.display = 'grid';
        if (adminProductList) adminProductList.style.display = 'block';
        if (adminProductPagination) adminProductPagination.style.display = 'flex';

        if (groceryFields) {
            groceryFields.style.display = 'none';
            groceryFields.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
        }
        if (groceryTable) groceryTable.style.display = 'none';
    }
}

// Hook category selection change
if (groceryCatSelect) {
    groceryCatSelect.addEventListener('change', toggleGroceryProductUI);
}

// Hook subcategory selection change
if (grocerySubCatSelect) {
    grocerySubCatSelect.addEventListener('change', () => {
        const multimediaType = document.getElementById("multimediaType");
        const multimediaTypeWrapper = document.getElementById("multimediaTypeWrapper");

        if (multimediaType) multimediaType.value = "";
        if (multimediaTypeWrapper) multimediaTypeWrapper.classList.add("hidden");

        if (groceryFields) groceryFields.innerHTML = "";
        if (groceryTable) groceryTable.innerHTML = "";

        if (groceryCatSelect && isGroceryCategory(groceryCatSelect.value)) {
            const subCategoryName = grocerySubCatSelect.value;
            if (subCategoryName) {
                if (subCategoryName.toLowerCase() === "multimedia") {
                    if (multimediaTypeWrapper) multimediaTypeWrapper.classList.remove("hidden");
                    return;
                }
                loadGrocerySubcategoryFields(subCategoryName);
                loadGroceryProducts(subCategoryName);
            }
        }
    });
}

// Hook multimedia type change
const multimediaTypeSelect = document.getElementById("multimediaType");
if (multimediaTypeSelect) {
    multimediaTypeSelect.addEventListener("change", function () {
        const type = this.value;
        if (!type) {
            if (groceryFields) groceryFields.innerHTML = "";
            if (groceryTable) groceryTable.innerHTML = "";
            return;
        }
        loadMultimediaFields(type);
    });
}

async function loadMultimediaFields(type) {
    const fields = [...(multimediaFieldConfig[type] || [])];

    // Inject image field next to warranty
    const warrantyIndex = fields.findIndex(f => f.name === "warranty");
    if (warrantyIndex !== -1 && !fields.some(f => f.name === "image")) {
        fields.splice(warrantyIndex + 1, 0, {
            name: "image",
            label: "Product Image",
            type: "image",
            required: true
        });
    }

    if (!fields.some(f => f.name === "description")) {
        fields.push({
            name: "description",
            label: "Description ( Add a box for Complete details )",
            type: "textarea",
            required: false
        });
    }

    const adaptedFields = fields.map((f, index) => ({
        id: f.name,
        field_name: f.name,
        field_label: f.label,
        field_type: f.type,
        is_required: f.required,
        field_options: f.options || []
    }));

    currentGroceryFields = adaptedFields;
    renderGroceryProductForm();

    await loadProductsByMultimediaType(grocerySubCatSelect.value, type);
}

async function loadProductsByMultimediaType(subCategoryName, type) {
    await loadGroceryProducts(subCategoryName);
}

// Also trigger on initial load check
setTimeout(toggleGroceryProductUI, 1000);


/* =========================================
   LOAD GROCERY SUBCATEGORY FIELDS
========================================= */

async function loadGrocerySubcategoryFields(subCategoryName) {
    let fields = [];
    try {
        const client = await DataService.ensureSupabase();
        const { data, error } = await client
            .from("subcategory_fields")
            .select(`
                id,
                field_name,
                field_label,
                field_type,
                is_required,
                display_order
            `)
            .eq("subcategory_id", subCategoryName)
            .eq("is_active", true)
            .order("display_order");

        if (!error && data && data.length > 0) {
            fields = data;
        }
    } catch (e) {
        console.warn("subcategory_fields query failed, using defaults:", e);
    }

    if (!fields || fields.length === 0) {
        fields = getFallbackFieldsForSubcategory(subCategoryName);
        fields = fields.map((f, index) => ({
            id: f.id || `field_${index}`,
            field_name: f.field_name,
            field_label: f.field_label,
            field_type: f.field_type,
            is_required: f.is_required,
            field_options: f.field_options
        }));
    }

    currentGroceryFields = fields;
    renderGroceryProductForm();
}


/* =========================================
   GENERATE GROCERY PRODUCT FORM
========================================= */

function renderGroceryProductForm() {
    if (!currentGroceryFields.length) {
        groceryFields.innerHTML = `
            <div class="p-4 rounded-xl bg-yellow-500/10
                        border border-yellow-500/20 text-yellow-300">
                No fields have been configured for this
                Sub Category yet.
            </div>
        `;
        return;
    }

    const descriptionField = currentGroceryFields.find(f => f.field_name && f.field_name.toLowerCase() === "description");
    const otherFields = currentGroceryFields.filter(f => !f.field_name || f.field_name.toLowerCase() !== "description");

    let html = `
        <div class="form-container text-left" style="margin-top: 20px;">
            <h3>Add Product</h3>
            <div class="form-row">
    `;

    otherFields.forEach(field => {
        let input = "";
        const required = field.is_required ? "required" : "";

        if (field.field_type === "select") {
            const optionsHtml = (field.field_options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('');
            input = `
                <select
                    id="field_${field.id}"
                    data-field-id="${field.id}"
                    ${required}
                >
                    <option value="">Select ${field.field_label}</option>
                    ${optionsHtml}
                </select>
            `;
        } else if (field.field_type === "image") {
            input = `
                <div style="display: flex; gap: 8px; width: 100%; align-items: center;">
                    <input
                        type="url"
                        id="field_${field.id}"
                        data-field-id="${field.id}"
                        class="admin-input"
                        placeholder="https://..."
                        style="flex: 1; margin-bottom: 0; background: rgba(255,255,255,0.9) !important; color: #0f172a !important; border: 1px solid var(--border-color) !important; border-radius: 10px; height: 30px !important; box-sizing: border-box; padding: 2px 8px !important; font-size: 0.8rem !important;"
                        ${required}
                    >
                    <input
                        type="file"
                        id="upload_${field.id}"
                        accept="image/*"
                        style="display: none;"
                    >
                    <button
                        type="button"
                        class="btn btn-secondary"
                        onclick="document.getElementById('upload_${field.id}').click()"
                        style="padding: 4px 12px; height: 30px; display: flex; align-items: center; justify-content: center; background: #64748b; color: #fff; border-radius: 8px; border: none; cursor: pointer; font-size: 0.8rem; box-sizing: border-box; font-weight: 600; margin-bottom: 8px;"
                    >
                        <i class="fa-solid fa-upload"></i>
                    </button>
                </div>
                <span
                    id="status_${field.id}"
                    style="font-size: 0.75rem; color: var(--accent-color); margin-top: 3px; display: none;"
                >
                    Uploading...
                </span>
            `;
        } else if (field.field_type === "number") {
            input = `
                <input
                    type="number"
                    id="field_${field.id}"
                    data-field-id="${field.id}"
                    ${required}
                >
            `;
        } else if (field.field_type === "date") {
            input = `
                <input
                    type="date"
                    id="field_${field.id}"
                    data-field-id="${field.id}"
                    ${required}
                >
            `;
        } else if (field.field_type === "multiselect") {
            const checkboxHtml = (field.field_options || []).map((opt, i) => `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer; color: #fff; font-size: 0.85rem; user-select: none;">
                    <input 
                        type="checkbox" 
                        class="multiselect-checkbox-${field.id}" 
                        value="${opt}" 
                        style="width: 16px !important; height: 16px !important; margin: 0 !important; cursor: pointer;"
                    >
                    <span>${opt}</span>
                </label>
            `).join('');
            
            input = `
                <div id="field_${field.id}" data-field-id="${field.id}" data-type="checkbox-group" style="padding: 10px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border-color); border-radius: 8px; max-height: 150px; overflow-y: auto; box-sizing: border-box; width: 100%;">
                    ${checkboxHtml}
                </div>
            `;
        } else {
            input = `
                <input
                    type="text"
                    id="field_${field.id}"
                    data-field-id="${field.id}"
                    ${required}
                >
            `;
        }

        html += `
            <div class="input-group">
                <label>
                    ${escapeHtml(field.field_label)}
                    ${field.is_required
                ? '<span style="color: var(--accent-color);">*</span>'
                : ''}
                </label>
                ${input}
            </div>
        `;
    });

    html += `
            </div>
    `;

    if (descriptionField) {
        const required = descriptionField.is_required ? "required" : "";
        html += `
            <div class="input-group" style="width: 100%; margin-top: 15px; margin-bottom: 15px; box-sizing: border-box; text-align: left; padding: 0 4px;">
                <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; color: rgba(255, 255, 255, 0.7);">
                    ${escapeHtml(descriptionField.field_label)}
                    ${descriptionField.is_required ? '<span style="color: var(--accent-color);">*</span>' : ''}
                </label>
                <textarea
                    id="field_${descriptionField.id}"
                    data-field-id="${descriptionField.id}"
                    class="admin-input"
                    style="width: 100%; height: 100px; padding: 10px 12px; background: rgba(255,255,255,0.9) !important; color: #0f172a !important; border: 1px solid var(--border-color) !important; border-radius: 10px; resize: vertical; box-sizing: border-box;"
                    placeholder="Enter complete details..."
                    ${required}
                ></textarea>
            </div>
        `;
    }

    html += `
            <!-- Standard Seller's / Shop's Area (Same for all categories) -->
            <h4 class="form-section-title" style="margin-top:25px; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; font-weight:bold; color:var(--primary-color);">Seller's / Shop's Area</h4>
            <div class="form-row">
                <div class="input-group">
                    <label>Seller <span style="color: var(--accent-color);">*</span></label>
                    <select id="prodSeller" required>
                        <option value="">Select Seller Type</option>
                        <option value="Owner">Owner</option>
                        <option value="Retailer">Retailer</option>
                        <option value="Wholesaler">Wholesaler</option>
                    </select>
                </div>
                <div class="input-group" id="laptopCompanyGroup" style="opacity: 0.4; pointer-events: none;">
                    <label>Shop / Office / Company Name <span style="color: var(--accent-color);">*</span></label>
                    <input type="text" id="prodCompanyName" placeholder="Shop / Office / Company Name" list="sellersDatalist" disabled>
                </div>
            </div>
            
            <div class="input-group">
                <label>Address <span style="color: var(--accent-color);">*</span></label>
                <input type="text" id="prodAddress" placeholder="Full Address" required>
            </div>

            <div class="form-row">
                <div class="input-group">
                    <label>Area <span style="color: var(--accent-color);">*</span></label>
                    <select id="prodArea" required>
                        <option value="">Select Area</option>
                        <option value="Metroville">Metroville</option>
                        <option value="Bahadurabad">Bahadurabad</option>
                        <option value="Burns Road">Burns Road</option>
                        <option value="Clifton">Clifton</option>
                        <option value="Defence">Defence</option>
                        <option value="Federal B Area">Federal B Area</option>
                        <option value="Gulshan-e-Iqbal">Gulshan-e-Iqbal</option>
                        <option value="Gulistan-e-Johar">Gulistan-e-Johar</option>
                        <option value="Korangi">Korangi</option>
                        <option value="Korangi Industrial Area">Korangi Industrial Area</option>
                        <option value="Landhi">Landhi</option>
                        <option value="Mehran Town">Mehran Town</option>
                        <option value="Liaquatabad">Liaquatabad</option>
                        <option value="Malir">Malir</option>
                        <option value="North Nazimabad">North Nazimabad</option>
                        <option value="Nazimabad">Nazimabad</option>
                        <option value="Orangi">Orangi</option>
                        <option value="PECHS">PECHS</option>
                        <option value="Saddar">Saddar</option>
                        <option value="Shah Faisal">Shah Faisal</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Sub Area / Block / Sector <span style="color: var(--accent-color);">*</span></label>
                    <select id="prodBlockNo" required>
                        <option value="">Select Sub Area / Block / Sector</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>City <span style="color: var(--accent-color);">*</span></label>
                    <select id="prodCity" required>
                        <option value="Karachi">Karachi</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="input-group">
                    <label>Phone No. <span style="color: var(--accent-color);">*</span></label>
                    <input type="text" id="prodPhone" placeholder="Phone No." required>
                </div>
                <div class="input-group">
                    <label>Whatsapp No. <span style="color: var(--accent-color);">*</span></label>
                    <input type="text" id="prodWhatsapp" placeholder="Whatsapp No." required>
                </div>
            </div>

            <div class="form-row">
                <div class="input-group" style="flex: 2;">
                    <label>Website address (if available)</label>
                    <input type="url" id="prodWebsite" placeholder="https://...">
                </div>
                <div class="input-group" style="flex: 1;">
                    <label>Status <span style="color: var(--accent-color);">*</span></label>
                    <select id="prodStatus" required>
                        <option value="Publish">Publish</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
            </div>

            <button
                type="button"
                id="btnSaveDynamicProduct"
                onclick="saveDynamicGroceryProduct()"
                class="btn btn-primary"
                style="width: 100%; margin-top: 15px;">
                Add Product
            </button>

        </div>
    `;

    groceryFields.innerHTML = html;

    // Attach listeners for Seller Type toggle & Block updates
    const containerGrocery = document.getElementById('groceryProductFields');
    const sellerSelect = containerGrocery ? containerGrocery.querySelector('#prodSeller') : null;
    const shopField = containerGrocery ? containerGrocery.querySelector('#prodCompanyName') : null;
    const shopGroup = containerGrocery ? containerGrocery.querySelector('#laptopCompanyGroup') : null;
    if (sellerSelect && shopField && shopGroup) {
        sellerSelect.addEventListener('change', () => {
            const val = sellerSelect.value;
            if (val === 'Retailer' || val === 'Wholesaler') {
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
        });
    }

    const prodAreaSelect = containerGrocery ? containerGrocery.querySelector('#prodArea') : null;
    const prodBlockNoSelect = containerGrocery ? containerGrocery.querySelector('#prodBlockNo') : null;
    if (prodAreaSelect && prodBlockNoSelect) {
        prodAreaSelect.addEventListener('change', () => {
            window.updateBlockOptionsGlobal(prodAreaSelect.value, prodBlockNoSelect);
        });
    }

    // Attach ImgBB Upload listener for type "image" dynamic fields
    currentGroceryFields.forEach(field => {
        if (field.field_type === "image") {
            const uploadEl = document.getElementById(`upload_${field.id}`);
            const inputEl = document.getElementById(`field_${field.id}`);
            const statusEl = document.getElementById(`status_${field.id}`);
            if (uploadEl && inputEl && statusEl) {
                uploadEl.addEventListener('change', async function () {
                    const file = this.files[0];
                    if (!file) return;

                    statusEl.style.display = 'inline-block';
                    statusEl.textContent = 'Uploading...';
                    statusEl.style.color = 'var(--accent-color)';

                    const formData = new FormData();
                    formData.append('image', file);

                    try {
                        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                            method: 'POST',
                            body: formData
                        });
                        const resData = await response.json();
                        if (resData.success) {
                            inputEl.value = resData.data.url;
                            statusEl.textContent = 'Upload successful!';
                            statusEl.style.color = '#2ecc71';
                        } else {
                            throw new Error(resData.error?.message || 'Upload failed');
                        }
                    } catch (error) {
                        console.error('Upload Error:', error);
                        let msg = error.message;
                        if (msg === 'Failed to fetch') {
                            console.warn('ImgBB network error, falling back to Base64');
                            try {
                                const b64 = await fileToBase64(file);
                                inputEl.value = b64;
                                statusEl.textContent = 'Saved locally (Base64)';
                                statusEl.style.color = '#f39c12';
                                return;
                            } catch(e) {
                                msg = "Network error and Base64 fallback failed.";
                            }
                        }
                        statusEl.textContent = 'Upload failed.';
                        statusEl.style.color = '#e74c3c';
                        alert('Failed to upload image: ' + msg);
                    } finally {
                        setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
                    }
                });
            }
        }
    });
}


/* =========================================
   SAVE GROCERY PRODUCT
========================================= */

window.saveDynamicGroceryProduct = async function () {
    const categoryName = groceryCatSelect.options[groceryCatSelect.selectedIndex]?.text || groceryCatSelect.value;
    const subCategoryName = grocerySubCatSelect.value;

    if (!categoryName || !subCategoryName) {
        alert("Please select Category and Sub Category.");
        return;
    }

    const dynamicData = {};

    for (const field of currentGroceryFields) {
        const input = document.getElementById(`field_${field.id}`);
        if (!input) continue;

        if (field.is_required) {
            const isVisible = input.offsetWidth > 0 || input.offsetHeight > 0 || input.getClientRects().length > 0;
            if (!isVisible) {
                console.log("Skipping validation for hidden field:", field.field_label);
                continue;
            }

            // Skip validation if select element has no selectable options configured
            if (input.tagName === 'SELECT' && input.options.length <= 1) {
                console.log("Skipping validation for select field with no options:", field.field_label);
                continue;
            }

            let hasVal = false;
            if (field.field_type === "multiselect" || input.multiple) {
                if (input.dataset.type === "checkbox-group") {
                    const checked = input.querySelectorAll('input[type="checkbox"]:checked');
                    hasVal = checked.length > 0;
                } else {
                    hasVal = Array.from(input.selectedOptions).length > 0;
                }
            } else {
                hasVal = !!input.value.trim();
            }
            
            if (!hasVal) {
                // Safely bypass connection field to prevent user blocking from database sync issues
                if (field.field_name === "connection") {
                    console.log("Bypassing empty required connection field to prevent blocking.");
                    continue;
                }
                console.warn("Validation failed for field:", field.field_label, "ID:", `field_${field.id}`, "Element:", input, "Value:", input.value);
                alert(`${field.field_label} is required.`);
                if (input.focus) input.focus();
                return;
            }
        }

        if (field.field_type === "multiselect") {
            let selectedOptions = [];
            if (input.dataset.type === "checkbox-group") {
                selectedOptions = Array.from(input.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            } else {
                selectedOptions = Array.from(input.selectedOptions).map(opt => opt.value);
            }
            dynamicData[field.field_name] = selectedOptions.join(', ');
        } else {
            dynamicData[field.field_name] =
                field.field_type === "number"
                    ? Number(input.value)
                    : input.value.trim();
        }
    }

    // Get Seller/Shop fields relative to the grocery fields container to prevent ID collisions
    const container = document.getElementById('groceryProductFields') || document;
    const sellerType = container.querySelector('#prodSeller')?.value || "";
    const companyName = container.querySelector('#prodCompanyName')?.value || "";
    const address = container.querySelector('#prodAddress')?.value || "";
    const area = container.querySelector('#prodArea')?.value || "";
    const blockNo = container.querySelector('#prodBlockNo')?.value || "";
    const city = container.querySelector('#prodCity')?.value || "Karachi";
    const phone = container.querySelector('#prodPhone')?.value || "";
    const whatsapp = container.querySelector('#prodWhatsapp')?.value || "";
    const website = container.querySelector('#prodWebsite')?.value || "";
    const status = container.querySelector('#prodStatus')?.value || "Publish";

    if (!sellerType || !address || !area || !blockNo || !phone || !whatsapp) {
        alert("Please fill in all required Seller / Shop fields.");
        return;
    }

    // Merge seller fields into dynamicData (extra_fields)
    Object.assign(dynamicData, {
        seller: sellerType,
        companyName,
        address,
        area,
        blockNo,
        city,
        phone,
        whatsapp,
        website,
        status
    });

    const client = await DataService.ensureSupabase();

    let userName = "Admin";
    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            userName = currentUser.fullName || currentUser.username || currentUser.userId || 'Admin';
        }
    } catch (e) { }

    const multimediaTypeEl = document.getElementById("multimediaType");
    let multimediaTypeValue = null;
    if (multimediaTypeEl && !multimediaTypeEl.parentElement.classList.contains("hidden") && multimediaTypeEl.value) {
        multimediaTypeValue = multimediaTypeEl.options[multimediaTypeEl.selectedIndex]?.text;
    }

    const payload = {
        category: categoryName,
        sub_category: subCategoryName,
        multimedia_type: multimediaTypeValue,
        image: dynamicData.image || "https://via.placeholder.com/150",
        status: status,
        added_by: userName,
        updated_date: new Date().toISOString(),
        extra_fields: dynamicData
    };

    let resultError;

    if (window.currentEditingProductId) {
        delete payload.added_by; // Prevent overwriting the original author when editing
        const { error } = await client
            .from("products")
            .update(payload)
            .eq("id", window.currentEditingProductId);
        resultError = error;
    } else {
        payload.id = DataService.generateUUID ? DataService.generateUUID() : uuidv4();
        payload.created_date = new Date().toISOString();
        const { error } = await client
            .from("products")
            .insert(payload);
        resultError = error;
    }

    if (resultError) {
        console.error(resultError);
        alert("Failed to save product: " + resultError.message);
        return;
    }

    alert(window.currentEditingProductId ? "Product updated successfully." : "Product added successfully.");
    window.currentEditingProductId = null;

    await loadGroceryProducts(subCategoryName);
    renderGroceryProductForm();
}


/* =========================================
   LOAD GROCERY PRODUCTS
========================================= */

async function loadGroceryProducts(subCategoryName) {
    const client = await DataService.ensureSupabase();
    const categoryName = groceryCatSelect.options[groceryCatSelect.selectedIndex]?.text || groceryCatSelect.value;
    const categoryQueryValue = (categoryName === "Computers" || categoryName === "Computer")
        ? ["Computers", "Computer"]
        : [categoryName];

    let query = client
        .from("products")
        .select(`
            id,
            category,
            sub_category,
            multimedia_type,
            image,
            status,
            added_by,
            created_date,
            updated_date,
            extra_fields
        `)
        .in("category", categoryQueryValue)
        .eq("sub_category", subCategoryName);

    if (subCategoryName.toLowerCase() === "multimedia") {
        const multimediaTypeEl = document.getElementById("multimediaType");
        if (multimediaTypeEl && multimediaTypeEl.value) {
            const displayType = multimediaTypeEl.options[multimediaTypeEl.selectedIndex]?.text;
            query = query.eq("multimedia_type", displayType);
        }
    }

    const { data, error } = await query.order("created_date", {
        ascending: false
    });

    if (error) {
        console.error(error);
        groceryTable.innerHTML = `
            <div class="text-red-400">
                Failed to load products.
            </div>
        `;
        return;
    }

    currentGroceryProducts = (data || []).map(p => ({
        id: p.id,
        category: p.category,
        subCategory: p.sub_category,
        multimediaType: p.multimedia_type,
        image: p.image,
        status: p.status,
        addedBy: p.added_by,
        createdDate: p.created_date,
        updatedDate: p.updated_date,
        data: p.extra_fields || {}
    }));

    renderGroceryProductTable();
}


/* =========================================
   GENERATE GROCERY PRODUCT TABLE
========================================= */

function renderGroceryProductTable() {
    if (!currentGroceryProducts.length) {
        groceryTable.innerHTML = `
            <div class="p-6 text-center text-gray-400 rounded-2xl bg-white/5 border border-white/10" style="margin-top: 20px;">
                No products found in this Sub Category.
            </div>
        `;
        return;
    }

    const categoryName = groceryCatSelect.options[groceryCatSelect.selectedIndex]?.text || groceryCatSelect.value;
    const subCategory = grocerySubCatSelect?.value || "";
    const isComputer = categoryName === "Computers" || categoryName === "Computer";

    if (isComputer) {
        let html = `
            <div class="list-container" style="margin-top: 20px;">
                <h3>Existing Products</h3>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th style="width: 70px; text-align: center;">Image</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Post By</th>
                            <th style="text-align: center; width: 150px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        currentGroceryProducts.forEach(product => {
            const brandVal = product.data?.brand ?? "";
            const modelVal = product.data?.model ?? "";
            const priceVal = product.data?.price ?? "";
            const imgUrl = product.image || "https://via.placeholder.com/150";

            html += `
                <tr>
                    <td style="text-align: center; vertical-align: middle;">
                        <img src="${imgUrl}" alt="${escapeHtml(brandVal)}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                    </td>
                    <td style="vertical-align: middle;">${escapeHtml(brandVal)}</td>
                    <td style="vertical-align: middle;">${escapeHtml(modelVal)}</td>
                    <td style="vertical-align: middle;">${escapeHtml(product.subCategory || subCategory)}</td>
                    <td style="vertical-align: middle;">${escapeHtml(String(priceVal))}</td>
                    <td style="vertical-align: middle;">${escapeHtml(product.addedBy || "Admin")}</td>
                    <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
                        <button
                            onclick="toggleGroceryProductApproval('${product.id}')"
                            style="background: ${product.status === 'Draft' ? '#ef4444' : '#22c55e'}; color: white; border: none; padding: 4px 10px; border-radius: 9999px; cursor: pointer; font-size: 0.75rem; font-weight: 600; margin-right: 5px;"
                            title="${product.status === 'Draft' ? 'Click to Approve' : 'Click to reject to Draft'}"
                        >
                            ${product.status === 'Draft' ? 'Approve' : 'Approved'}
                        </button>
                        <button
                            onclick="editGroceryProduct('${product.id}')"
                            style="background: #e2e8f0; color: #475569; border: none; padding: 4px 10px; border-radius: 9999px; cursor: pointer; font-size: 0.75rem; font-weight: 600; margin-right: 5px;"
                        >
                            Edit
                        </button>
                        <button
                            onclick="deleteGroceryProduct('${product.id}')"
                            style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 9999px; cursor: pointer; font-size: 0.75rem; font-weight: 600;"
                        >
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
        groceryTable.innerHTML = html;
        return;
    }

    let html = `
        <div class="list-container" style="margin-top: 20px;">
            <h3>Existing Products</h3>
            <table class="admin-table">
                <thead>
                    <tr>
    `;

    currentGroceryFields.forEach(field => {
        html += `
            <th>
                ${escapeHtml(field.field_label)}
            </th>
        `;
    });

    html += `
                        <th style="text-align: center;">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody>
    `;

    currentGroceryProducts.forEach(product => {
        html += `<tr>`;

        currentGroceryFields.forEach(field => {
            const value = product.data?.[field.field_name] ?? "";
            html += `
                <td>
                    ${escapeHtml(String(value))}
                </td>
            `;
        });

        html += `
            <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
                <button
                    onclick="toggleGroceryProductApproval('${product.id}')"
                    style="background: ${product.status === 'Draft' ? '#ef4444' : '#22c55e'}; color: white; border: none; padding: 4px 10px; border-radius: 9999px; cursor: pointer; font-size: 0.75rem; font-weight: 600; margin-right: 5px;"
                    title="${product.status === 'Draft' ? 'Click to Approve' : 'Click to reject to Draft'}"
                >
                    ${product.status === 'Draft' ? 'Approve' : 'Approved'}
                </button>
                <button
                    onclick="editGroceryProduct('${product.id}')"
                    style="background: #e2e8f0; color: #475569; border: none; padding: 4px 10px; border-radius: 9999px; cursor: pointer; font-size: 0.75rem; font-weight: 600; margin-right: 5px;"
                >
                    Edit
                </button>
                <button
                    onclick="deleteGroceryProduct('${product.id}')"
                    style="background: #fee2e2; color: #ef4444; border: none; padding: 4px 10px; border-radius: 9999px; cursor: pointer; font-size: 0.75rem; font-weight: 600;"
                >
                    Delete
                </button>
            </td>
        `;

        html += `</tr>`;
    });

    html += `
                </tbody>
            </table>

        </div>
    `;

    groceryTable.innerHTML = html;
}


/* =========================================
   DELETE GROCERY PRODUCT
========================================= */

window.deleteGroceryProduct = async function (productId) {
    if (!confirm("Delete this product?")) return;

    const client = await DataService.ensureSupabase();
    const { error } = await client
        .from("products")
        .delete()
        .eq("id", productId);

    if (error) {
        console.error(error);
        alert("Failed to delete product: " + error.message);
        return;
    }

    await loadGroceryProducts(grocerySubCatSelect.value);
}


/* =========================================
   TOGGLE GROCERY PRODUCT APPROVAL
========================================= */

window.toggleGroceryProductApproval = async function (productId) {
    const product = currentGroceryProducts.find(p => p.id === productId);
    if (!product) return;

    const newStatus = product.status === "Publish" ? "Draft" : "Publish";
    const client = await DataService.ensureSupabase();
    const { error } = await client
        .from("products")
        .update({ status: newStatus, updated_date: new Date().toISOString() })
        .eq("id", productId);

    if (error) {
        console.error(error);
        alert("Failed to update status: " + error.message);
        return;
    }

    alert(`Product status changed to ${newStatus}.`);
    await loadGroceryProducts(grocerySubCatSelect.value);
}


/* =========================================
   EDIT GROCERY PRODUCT
========================================= */

window.editGroceryProduct = async function (productId) {
    const product = currentGroceryProducts.find(p => p.id === productId);
    if (!product) return;

    if (product.subCategory && product.subCategory.toLowerCase() === "multimedia") {
        const multimediaTypeEl = document.getElementById("multimediaType");
        const multimediaTypeWrapper = document.getElementById("multimediaTypeWrapper");
        if (multimediaTypeWrapper) multimediaTypeWrapper.classList.remove("hidden");

        if (multimediaTypeEl && product.multimediaType) {
            for (let i = 0; i < multimediaTypeEl.options.length; i++) {
                if (multimediaTypeEl.options[i].text.toLowerCase() === product.multimediaType.toLowerCase()) {
                    multimediaTypeEl.selectedIndex = i;
                    break;
                }
            }
            await loadMultimediaFields(multimediaTypeEl.value);
        }
    }

    currentGroceryFields.forEach(field => {
        const input = document.getElementById(`field_${field.id}`);
        if (!input) return;

        if (field.field_type === "multiselect") {
            const val = product.data?.[field.field_name] ?? "";
            const selectedVals = val.split(',').map(s => s.trim());
            if (input.dataset.type === "checkbox-group") {
                input.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = selectedVals.includes(cb.value);
                });
            } else {
                Array.from(input.options).forEach(opt => {
                    opt.selected = selectedVals.includes(opt.value);
                });
            }
        } else {
            input.value = product.data?.[field.field_name] ?? "";
        }
    });

    // Fill Seller/Shop fields
    const sellerSelect = document.getElementById('prodSeller');
    if (sellerSelect) {
        sellerSelect.value = product.data?.seller || "";
        sellerSelect.dispatchEvent(new Event('change'));
    }

    const fieldsToMap = {
        'prodCompanyName': product.data?.companyName || "",
        'prodAddress': product.data?.address || "",
        'prodArea': product.data?.area || "",
        'prodPhone': product.data?.phone || "",
        'prodWhatsapp': product.data?.whatsapp || "",
        'prodWebsite': product.data?.website || "",
        'prodStatus': product.data?.status || "Publish"
    };

    for (const [id, val] of Object.entries(fieldsToMap)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    // Trigger Area change to populate Blocks, then set Block value
    const areaEl = document.getElementById('prodArea');
    if (areaEl) {
        areaEl.dispatchEvent(new Event('change'));
        const blockEl = document.getElementById('prodBlockNo');
        if (blockEl) {
            blockEl.value = product.data?.blockNo || "";
        }
    }

    window.currentEditingProductId = productId;

    const btn = document.getElementById('btnSaveDynamicProduct');
    if (btn) btn.textContent = 'Save Changes';

    // Scroll to form
    const formEl = document.getElementById('products').querySelector('.form-container');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.populateSellersDatalist = function () {
    const datalist = document.getElementById('sellersDatalist');
    if (datalist) {
        datalist.innerHTML = '';
        (sellers || []).forEach(s => {
            if (s.businessName) {
                const opt = document.createElement('option');
                opt.value = s.businessName;
                datalist.appendChild(opt);
            }
        });
    }
};

document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'prodCompanyName') {
        const enteredVal = e.target.value.trim().toLowerCase();
        if (!enteredVal) return;

        console.log("Searching for seller with query:", enteredVal);

        // Find the matched seller using the global sellers array
        const matchedSeller = (sellers || []).find(s =>
            (s.businessName && s.businessName.trim().toLowerCase() === enteredVal) ||
            (s.ownerName && s.ownerName.trim().toLowerCase() === enteredVal)
        );

        if (matchedSeller) {
            console.log("Matched Seller Profile Found in Admin:", matchedSeller);

            // Scope the selector lookup to the active container to prevent duplicate ID collisions
            const container = e.target.closest('#groceryProductFields') || 
                              e.target.closest('#dynamicProductFields') || 
                              document;

            const addrField = container.querySelector('#prodAddress');
            const areaField = container.querySelector('#prodArea');
            const blockField = container.querySelector('#prodBlockNo');
            const cityField = container.querySelector('#prodCity');
            const phoneField = container.querySelector('#prodPhone');
            const whatsappField = container.querySelector('#prodWhatsapp');
            const websiteField = container.querySelector('#prodWebsite');
            const sellerTypeField = container.querySelector('#prodSeller');

            // Autofill Seller Type dropdown
            if (sellerTypeField && matchedSeller.businessType) {
                sellerTypeField.value = matchedSeller.businessType;
                sellerTypeField.dispatchEvent(new Event('change'));
            }

            if (addrField) {
                addrField.value = matchedSeller.address || "";
            }

            if (cityField) {
                const targetCity = (matchedSeller.city || "Karachi").trim().toLowerCase();
                for (let i = 0; i < cityField.options.length; i++) {
                    const optText = cityField.options[i].text.trim().toLowerCase();
                    const optVal = cityField.options[i].value.trim().toLowerCase();
                    if (optText === targetCity || optVal === targetCity) {
                        cityField.selectedIndex = i;
                        break;
                    }
                }
            }

            if (areaField) {
                const targetArea = (matchedSeller.area || "").trim().toLowerCase();
                for (let i = 0; i < areaField.options.length; i++) {
                    const optText = areaField.options[i].text.trim().toLowerCase();
                    const optVal = areaField.options[i].value.trim().toLowerCase();
                    if (optText === targetArea || optVal === targetArea) {
                        areaField.selectedIndex = i;
                        areaField.dispatchEvent(new Event('change'));
                        break;
                    }
                }
            }

            setTimeout(() => {
                if (blockField) {
                    const targetBlock = (matchedSeller.blockNo || matchedSeller.block_no || "").trim().toLowerCase();
                    for (let i = 0; i < blockField.options.length; i++) {
                        const optText = blockField.options[i].text.trim().toLowerCase();
                        const optVal = blockField.options[i].value.trim().toLowerCase();
                        if (optText === targetBlock || optVal === targetBlock) {
                            blockField.selectedIndex = i;
                            break;
                        }
                    }
                }
            }, 150);

            if (phoneField) {
                phoneField.value = matchedSeller.mobileNumber || matchedSeller.phone || "";
            }
            if (whatsappField) {
                whatsappField.value = matchedSeller.whatsappNumber || matchedSeller.whatsapp || "";
            }
            if (websiteField) {
                websiteField.value = matchedSeller.website || "";
            }
        }
    }
});



