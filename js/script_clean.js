// Language Toggle Logic
    const currentLang = localStorage.getItem('qeematLang') || 'ur';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ur' ? 'rtl' : 'ltr';

    document.addEventListener('DOMContentLoaded', () => {
      const toggleBtn = document.getElementById('langToggleBtn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const newLang = document.documentElement.lang === 'ur' ? 'en' : 'ur';
          document.documentElement.lang = newLang;
          document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
          localStorage.setItem('qeematLang', newLang);
        });
      }
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }

    // Login Dropdown toggle
    const loginToggleBtn = document.getElementById('loginToggleBtn');
    const loginDropdown = document.getElementById('loginDropdown');
    const loginTabUser = document.getElementById('loginTabUser');
    const loginTabAdmin = document.getElementById('loginTabAdmin');
    const loginInputUserName = document.getElementById('loginInputUserName');
    const loginInputCompany = document.getElementById('loginInputCompany');
    const loginInputUserId = document.getElementById('loginInputUserId');
    const loginInputPassword = document.getElementById('loginInputPassword');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    let currentLoginMode = 'user';

    if (loginToggleBtn && loginDropdown) {
      loginToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        loginDropdown.classList.toggle('hidden');
      });
      loginDropdown.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent closing when clicking inside
      });
      document.addEventListener('click', () => {
        loginDropdown.classList.add('hidden');
      });
    }

    if (loginTabUser && loginTabAdmin && loginInputUserName && loginInputCompany) {
      // Toggle to User mode
      loginTabUser.addEventListener('click', () => {
        currentLoginMode = 'user';
        // Update Buttons
        loginTabUser.className = "flex-[1.2] pb-2 text-emerald-400 border-b-2 border-emerald-400 font-semibold text-sm";
        loginTabAdmin.className = "flex-[1] pb-2 text-slate-400 font-medium text-sm hover:text-slate-200 border-b-2 border-transparent";
        // Show user specific fields
        loginInputUserName.classList.remove('hidden');
        loginInputCompany.classList.remove('hidden');
      });

      // Toggle to Admin mode
      loginTabAdmin.addEventListener('click', () => {
        currentLoginMode = 'admin';
        // Update Buttons
        loginTabAdmin.className = "flex-[1] pb-2 text-emerald-400 border-b-2 border-emerald-400 font-semibold text-sm";
        loginTabUser.className = "flex-[1.2] pb-2 text-slate-400 font-medium text-sm hover:text-slate-200 border-b-2 border-transparent";
        // Hide user specific fields
        loginInputUserName.classList.add('hidden');
        loginInputCompany.classList.add('hidden');
      });
    }

    if (loginSubmitBtn) {
      loginSubmitBtn.addEventListener('click', () => {
        if (currentLoginMode === 'admin') {
          const userId = loginInputUserId.value.trim();
          const pass = loginInputPassword.value;
          
          const isFaisal = userId.toLowerCase() === 'faisal' && pass === '1234';
          const isAshraf = userId.toLowerCase() === 'ashraf taj' && pass === '1234';
          
          if (isFaisal || isAshraf) {
            // Check if we are currently inside the 'pages' directory
            const isInPages = window.location.pathname.includes('/pages/');
            const adminPath = isInPages ? 'admin.html' : 'pages/admin.html';
            window.location.href = adminPath;
          } else {
            alert('Invalid Admin credentials!');
          }
        } else {
          alert('User login successful (demo)');
          loginDropdown.classList.add('hidden');
        }
      });
    }

    // Category dropdown
    const categoryToggle = document.getElementById('categoryToggle');
    const categoryMenu = document.getElementById('categoryMenu');
    const categoryLabel = document.getElementById('categoryLabel');
    let currentCategory = 'all';

    if (categoryToggle) {
      categoryToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        categoryMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        categoryMenu.classList.add('hidden');
      });
      categoryMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.target.closest('button[data-category]');
        if (!btn) return;
        currentCategory = btn.getAttribute('data-category');
        
        if (currentCategory === 'food') {
          window.location.href = 'pages/food.html';
          return;
        }

        categoryLabel.textContent = btn.textContent.trim();
        categoryMenu.classList.add('hidden');
        renderProducts();
      });
    }

    // Demo products data
    const products = [
      { name: 'Sugar 1kg / Ú†ÛŒÙ†ÛŒ 1Ú©Ù„Ùˆ', category: 'grocery', city: 'Karachi', area: 'Gulshan-e-Iqbal', distanceKm: 1.2, price: 155 },
      { name: 'Sugar 1kg / Ú†ÛŒÙ†ÛŒ 1Ú©Ù„Ùˆ', category: 'grocery', city: 'Karachi', area: 'Bahadurabad', distanceKm: 3.1, price: 150 },
      { name: 'Sugar 1kg / Ú†ÛŒÙ†ÛŒ 1Ú©Ù„Ùˆ', category: 'grocery', city: 'Karachi', area: 'Nazimabad', distanceKm: 4.2, price: 148 },
      { name: 'Milk 1L Pack / Ø¯ÙˆØ¯Ú¾ 1Ù„ÛŒÙ¹Ø±', category: 'grocery', city: 'Lahore', area: 'Model Town', distanceKm: 0.8, price: 235 },
      { name: 'Milk 1L Pack / Ø¯ÙˆØ¯Ú¾ 1Ù„ÛŒÙ¹Ø±', category: 'grocery', city: 'Lahore', area: 'Johar Town', distanceKm: 2.4, price: 230 },
      { name: 'Tomato 1kg / Ù¹Ù…Ø§Ù¹Ø± 1Ú©Ù„Ùˆ', category: 'vegetables', city: 'Karachi', area: 'Saddar', distanceKm: 2.0, price: 95 },
      { name: 'Potato 1kg / Ø¢Ù„Ùˆ 1Ú©Ù„Ùˆ', category: 'vegetables', city: 'Karachi', area: 'Gulshan-e-Iqbal', distanceKm: 1.2, price: 75 },
      { name: 'Chicken 1kg / Ú†Ú©Ù† 1Ú©Ù„Ùˆ', category: 'meat', city: 'Lahore', area: 'Township', distanceKm: 1.5, price: 495 },
      { name: 'Beef 1kg / Ø¨ÛŒÙ 1Ú©Ù„Ùˆ', category: 'meat', city: 'Karachi', area: 'Liaquatabad', distanceKm: 3.7, price: 780 },
      { name: 'Cooking Oil 1L / Ú©ÙˆÚ©Ù†Ú¯ Ø¢Ø¦Ù„', category: 'grocery', city: 'Karachi', area: 'Defence', distanceKm: 5.2, price: 540 },
      { name: 'Smartphone 6.5" 128GB', category: 'electronics', city: 'Karachi', area: 'Saddar Mobile Market', distanceKm: 6.0, price: 46500 },
      { name: 'Smartphone 6.5" 128GB', category: 'electronics', city: 'Lahore', area: 'Hall Road', distanceKm: 4.5, price: 45990 },
      { name: 'Shampoo 340ml / Ø´ÛŒÙ…Ù¾Ùˆ', category: 'personal', city: 'Karachi', area: 'Gulistan-e-Johar', distanceKm: 2.8, price: 430 },
      { name: 'Washing Powder 2kg / ÙˆØ§Ø´Ù†Ú¯ Ù¾Ø§Ø¤ÚˆØ±', category: 'grocery', city: 'Lahore', area: 'DHA', distanceKm: 5.0, price: 880 }
    ];

    const productRowsEl = document.getElementById('productRows');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    function distanceBadge(km) {
      if (km <= 1.5) return '<span class="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[0.6rem]">Near</span>';
      if (km <= 3.5) return '<span class="px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 text-[0.6rem]">Medium</span>';
      return '<span class="px-1.5 py-0.5 rounded-full bg-slate-700/70 text-slate-200 text-[0.6rem]">Far</span>';
    }

    function renderProducts() {
      if (!productRowsEl) return;
      const q = searchInput.value.trim().toLowerCase();
      let filtered = products.slice();

      if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
      }
      if (q) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
      }

      // sort by distance first, then price
      filtered.sort((a, b) => {
        if (a.distanceKm === b.distanceKm) return a.price - b.price;
        return a.distanceKm - b.distanceKm;
      });

      productRowsEl.innerHTML = filtered.map(p => `
        <div class="product-row grid grid-cols-12 px-2 sm:px-3 py-2 text-[0.7rem] sm:text-xs">
          <div class="col-span-5 flex flex-col">
            <span class="text-slate-100"><span class="lang-en">${p.name.split(' / ')[0]}</span><span class="lang-ur">${p.name.split(' / ')[1] || p.name}</span></span>
            <span class="text-slate-500">${p.city}</span>
          </div>
          <div class="col-span-3 flex flex-col text-center">
            <span class="text-slate-200">${p.area}</span>
          </div>
          <div class="col-span-2 flex flex-col items-center">
            <span class="text-slate-200">${p.distanceKm.toFixed(1)} km</span>
            ${distanceBadge(p.distanceKm)}
          </div>
          <div class="col-span-2 flex flex-col text-right">
            <span class="text-emerald-400 font-semibold">Rs ${p.price.toLocaleString()}</span>
          </div>
        </div>
      `).join('') || `
        <div class="px-3 py-4 text-center text-[0.75rem] text-slate-500">
          <span class="lang-en">No items found for your search</span><span class="lang-ur">Ø§Ø¨Ú¾ÛŒ Ø§Ø³ ØªÙ„Ø§Ø´ Ú©Û’ Ù„ÛŒÛ’ ÚˆÛŒÙ¹Ø§ Ù…ÙˆØ¬ÙˆØ¯ Ù†ÛÛŒÚº</span>
        </div>
      `;
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const q = searchInput.value.trim().toLowerCase();
        const foodKeywords = ['burger', 'pizza', 'food', 'zinger', 'broast', 'haleem', 'fast food', 'fries', 'desi', 'karahi', 'biryani'];
        if (foodKeywords.some(kw => q.includes(kw))) {
          window.location.href = `pages/food.html?search=${encodeURIComponent(searchInput.value.trim())}`;
          return;
        }
        renderProducts();
      });
    }
    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim().toLowerCase();
          const foodKeywords = ['burger', 'pizza', 'food', 'zinger', 'broast', 'haleem', 'fast food', 'fries', 'desi', 'karahi', 'biryani'];
          if (foodKeywords.some(kw => q.includes(kw))) {
            window.location.href = `pages/food.html?search=${encodeURIComponent(searchInput.value.trim())}`;
            return;
          }
          renderProducts();
        }
      });
    }

    // Initial render
    renderProducts();

    // Dynamic year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Check User Location on Load
    function checkUserLocation() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log("User location detected:", lat, lon);
            
            const btn = document.getElementById('headerLocationBtn');
            if (btn) {
              btn.innerHTML = 'ðŸ“ Location Active';
              btn.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md transition';
            }
            // In a real app, send these coordinates to your backend
            // or use reverse-geocoding to set the user's city/area.
          },
          (error) => {
            console.warn("Location access denied or unavailable:", error.message);
            const btn = document.getElementById('headerLocationBtn');
            if (btn) {
              btn.innerHTML = 'ðŸ‡µðŸ‡° Default View';
              btn.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 shadow-md transition';
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        console.warn("Geolocation is not supported by this browser.");
      }
    }

    // Request location when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkUserLocation);
    } else {
      checkUserLocation();
    }

    // Balloons generation
    const balloonLayer = document.querySelector('.balloon-layer');
    const commodityIcons = ['ðŸ…', 'ðŸ¥”', 'ðŸ—', 'ðŸ¥›', 'ðŸš', 'ðŸ“±', 'ðŸ§´', 'ðŸ§¼', 'ðŸ¥¦', 'ðŸŠ', 'ðŸ¥©', 'ðŸ›¢ï¸'];

    function createBalloon() {
      if (!balloonLayer) return;
      const b = document.createElement('div');
      b.className = 'balloon';
      const icon = document.createElement('div');
      icon.className = 'balloon-icon';
      icon.textContent = commodityIcons[Math.floor(Math.random() * commodityIcons.length)];
      b.style.left = Math.random() * 100 + 'vw';
      const duration = 12 + Math.random() * 8;
      b.style.animationDuration = duration + 's';
      balloonLayer.appendChild(b);
      b.appendChild(icon);

      // Blow near top
      const blowTime = (duration - 1.2) * 1000;
      const timer = setTimeout(() => {
        b.classList.add('blow');
      }, blowTime);

      b.addEventListener('animationend', () => {
        clearTimeout(timer);
        b.remove();
      });
    }

    // Initial balloons
    for (let i = 0; i < 8; i++) {
      setTimeout(createBalloon, i * 1200);
    }
    // Continuous balloons
    setInterval(createBalloon, 2800);

    // Active Navigation Link Highlight on Scroll
    const navLinks = document.querySelectorAll('.nav-link');
    const targetIDs = Array.from(navLinks).map(link => link.getAttribute('href')).filter(href => href && href.startsWith('#'));
    // Deduplicate IDs in case desktop and mobile menus share them
    const uniqueIDs = [...new Set(targetIDs)];
    const targetElements = uniqueIDs.map(id => document.querySelector(id)).filter(el => el);

    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;
      let current = '';

      targetElements.forEach((el) => {
        // get offsetTop of the element from the document body
        let top = el.offsetTop;
        let parent = el.offsetParent;
        while(parent) {
          top += parent.offsetTop;
          parent = parent.offsetParent;
        }
        
        top = top - 120; // adjust for sticky header height + padding
        const height = el.offsetHeight;
        
        if (scrollY >= top && scrollY < top + height) {
          current = el.getAttribute('id');
        }
      });

      // Special case for reaching the bottom of the page
      if ((window.innerHeight + scrollY) >= document.body.offsetHeight - 50) {
        if (targetElements.length > 0) {
          const lastEl = targetElements[targetElements.length - 1];
