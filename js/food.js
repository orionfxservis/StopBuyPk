let foodDeals = [];
const foodListingsEl = document.getElementById('foodListings');
const foodSearchInput = document.getElementById('foodSearchInput');
const foodSearchBtn = document.getElementById('foodSearchBtn');

// Featured Ad Elements
const featuredPlaceholder = document.getElementById('featuredPlaceholder');
const featuredContent = document.getElementById('featuredContent');
const fImg = document.getElementById('fImg');
const fDistance = document.getElementById('fDistance');
const fName = document.getElementById('fName');
const fPrice = document.getElementById('fPrice');
const fLocation = document.getElementById('fLocation');
const fDesc = document.getElementById('fDesc');
const fCallBtn = document.getElementById('fCallBtn');
const fOrderBtn = document.getElementById('fOrderBtn');
const orderModal = document.getElementById('orderModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const modalDateTime = document.getElementById('modalDateTime');
const modalRestaurant = document.getElementById('modalRestaurant');
const modalProductName = document.getElementById('modalProductName');
const modalLocation = document.getElementById('modalLocation');
const modalPhone = document.getElementById('modalPhone');
const modalRate = document.getElementById('modalRate');
const modalQuantity = document.getElementById('modalQuantity');
const modalTotalAmount = document.getElementById('modalTotalAmount');

let selectedFoodId = null;

function renderFoodList() {
  if (!foodListingsEl) return;
  
  const q = foodSearchInput ? foodSearchInput.value.trim().toLowerCase() : '';
  let filtered = foodDeals.slice();

  if (q) {
    filtered = filtered.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.restaurant.toLowerCase().includes(q) || 
      f.area.toLowerCase().includes(q)
    );
  }

  // Sort by Distance
  filtered.sort((a, b) => a.distanceKm - b.distanceKm);

  if (filtered.length === 0) {
    foodListingsEl.innerHTML = `
      <div class="glass-card p-6 text-center text-slate-400">
        No food items found for "${q}".
      </div>
    `;
    return;
  }

  foodListingsEl.innerHTML = filtered.map(f => {
    const isSelected = f.id === selectedFoodId;
    const activeClass = isSelected ? 'border-[#f97316] shadow-[0_10px_35px_rgba(249,115,22,0.18)] bg-slate-800/90 ring-1 ring-[#f97316]' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 bg-slate-900/60 shadow-sm';
    
    return `
      <article data-id="${f.id}" class="food-item rounded-2xl p-3 sm:p-4 cursor-pointer transition-colors duration-300 flex flex-row gap-3 border backdrop-blur-md ${activeClass}">
        <div class="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800 shadow-inner">
          <img src="${f.image}" alt="${f.name}" class="w-full h-full object-cover transition duration-300 hover:scale-105 food-img-filter" />
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-bold text-sm sm:text-base text-slate-100 leading-tight">${f.name}</h3>
              <span class="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 whitespace-nowrap ml-2">Rs. ${f.price}</span>
            </div>
            <p class="text-[0.7rem] sm:text-xs text-slate-400 mb-1 font-medium">${f.restaurant}</p>
          </div>
          <div class="flex justify-between items-end">
            <p class="text-[0.7rem] text-slate-400 font-medium">ðŸ“ ${f.area}</p>
            <span class="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[0.65rem] text-emerald-400 font-semibold shadow-sm">
              ${f.distanceKm.toFixed(1)} km
            </span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Add event listeners to newly rendered items
  document.querySelectorAll('.food-item').forEach(el => {
    el.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      selectFoodItem(id);
    });
  });
}

function selectFoodItem(id, preventScroll = false) {
  selectedFoodId = id;
  const item = foodDeals.find(f => f.id === id);
  
  if (item) {
    // Hide placeholder, show content
    featuredPlaceholder.classList.add('hidden');
    featuredContent.classList.remove('hidden');

    // Populate Details
    fImg.src = item.image;
    fDistance.textContent = `${item.distanceKm.toFixed(1)} km away`;
    fName.textContent = item.name;
    fPrice.innerHTML = `Rs. ${item.price} ${item.originalPrice ? `<span class="text-sm line-through text-slate-500 ml-1">Rs. ${item.originalPrice}</span>` : ''}`;
    fLocation.textContent = `${item.restaurant}, ${item.area}, ${item.city}`;
    fDesc.textContent = item.description;

    // Contact Buttons Setup
    if (item.phone) {
      fCallBtn.classList.remove('hidden');
      fCallBtn.onclick = () => window.location.href = `tel:${item.phone}`;
    } else {
      fCallBtn.classList.add('hidden');
    }

    if (fOrderBtn) {
      fOrderBtn.classList.remove('hidden');
      fOrderBtn.onclick = () => {
        // Set dynamic static details
        const d = new Date();
        if (modalDateTime) modalDateTime.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        if (modalRestaurant) modalRestaurant.textContent = item.restaurant;
        if (modalProductName) modalProductName.textContent = item.name;
        if (modalLocation) modalLocation.textContent = `${item.area}, ${item.city}`;
        if (modalPhone) modalPhone.textContent = item.phone || '';
        if (modalRate) modalRate.textContent = item.price;
        if (modalQuantity) modalQuantity.value = 1;

        const calcTotal = () => {
          let q = parseInt(modalQuantity.value) || 1;
          if (modalTotalAmount) modalTotalAmount.textContent = `Rs. ${item.price * q}`;
        };
        calcTotal(); // Initialize default amount
        
        if (modalQuantity) modalQuantity.oninput = calcTotal;
        if (orderModal) orderModal.classList.remove('hidden');
      };
    }
  }
  
  // Re-render list to show active state
  renderFoodList();
  
  // On mobile, scroll to the detail section automatically
  if (!preventScroll && window.innerWidth < 1024) {
    setTimeout(() => {
      const adContainer = document.getElementById('featuredAdContainer');
      if (adContainer) {
        adContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}

// Initial Setup
async function initFoodDeals() {
  if (typeof DataService !== 'undefined') {
    const allProducts = await DataService.getProducts();
    // Filter for Food Category
    const foodProducts = allProducts.filter(p => p.category && p.category.toLowerCase() === 'food');
    
    // Map to the format food.js expects
    foodDeals = foodProducts.map(p => {
      // Dynamic fields might have different capitalization, safely extract them
      const restaurant = p.restaurant || p.brand || p.subCategory || 'Unknown Restaurant';
      const area = p.area || p.location || 'Unknown Area';
      const city = p.city || 'Karachi';
      const distanceKm = parseFloat(p.distance || p.distanceKm) || 2.5;
      const phone = p.phone || p.contact || '';
      const whatsapp = p.whatsapp || phone;
      
      // Handle tags
      let tags = [];
      if (Array.isArray(p.tags)) {
        tags = p.tags;
      } else if (typeof p.tags === 'string') {
        tags = p.tags.split(',').map(t => t.trim()).filter(t => t);
      } else if (p.subCategory) {
        tags = [p.subCategory];
      }

      return {
        id: p.id,
        name: p.name || 'Unnamed Item',
        restaurant: restaurant,
        area: area,
        city: city,
        distanceKm: distanceKm,
        price: parseFloat(p.price || 0),
        originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : null,
        image: p.image || 'https://via.placeholder.com/600x400?text=No+Image',
        description: p.description || p.details || p.name || '',
        phone: phone,
        whatsapp: whatsapp,
        tags: tags
      };
    });
  }

  if (foodListingsEl) {
    renderFoodList();
    
    // Select first item by default if data exists
    if (foodDeals.length > 0) {
      selectFoodItem(foodDeals[0].id, true);
    }

    // Search Listeners (Live Search)
    if (foodSearchBtn) {
      foodSearchBtn.addEventListener('click', renderFoodList);
    }
    if (foodSearchInput) {
      foodSearchInput.addEventListener('input', () => {
        renderFoodList();
      });
    }

    // Category Tag Listeners
    document.querySelectorAll('.food-category').forEach(catBtn => {
      catBtn.addEventListener('click', () => {
        const searchVal = catBtn.getAttribute('data-search') || catBtn.querySelector('span').textContent.trim();
        if (foodSearchInput) {
          foodSearchInput.value = searchVal;
          renderFoodList();
        }
      });
    });
  }
}

initFoodDeals();

// Modal Listeners
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => orderModal.classList.add('hidden'));
}
if (cancelModalBtn) {
  cancelModalBtn.addEventListener('click', () => orderModal.classList.add('hidden'));
}
if (orderModal) {
  orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) orderModal.classList.add('hidden');
  });
}

const paymentBtns = document.querySelectorAll('.pymt-btn');
paymentBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // reset all
    paymentBtns.forEach(b => {
       b.classList.remove('border-emerald-500', 'bg-emerald-50/50');
       b.classList.add('border-slate-200', 'bg-slate-50');
    });
    // set active
    btn.classList.add('border-emerald-500', 'bg-emerald-50/50');
    btn.classList.remove('border-slate-200', 'bg-slate-50');
  });
});

// Mobile Go Back Button Logic
const goBackBtn = document.getElementById('goBackBtn');
if (goBackBtn) {
  // Show/Hide based on scroll
  window.addEventListener('scroll', () => {
    if (window.innerWidth < 1024 && window.scrollY > 400) {
      goBackBtn.classList.remove('hidden');
    } else {
      goBackBtn.classList.add('hidden');
    }
  });

  // Click to go back to selected card or top
  goBackBtn.addEventListener('click', () => {
    if (selectedFoodId) {
      const card = document.querySelector(`.food-item[data-id="${selectedFoodId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
