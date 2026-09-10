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
const fVariety = document.getElementById('fVariety');
const fBrand = document.getElementById('fBrand');
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



function getAverageRating(id) {
  const idStr = id ? String(id) : '';
  let ratings = JSON.parse(localStorage.getItem(`food_ratings_${idStr}`));
  if (!ratings || ratings.length === 0) {
    const hash = idStr ? [...idStr].reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const defaultRating = 4 + (hash % 11) / 10;
    ratings = [defaultRating];
  }
  const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return { avg: avg.toFixed(1), count: ratings.length };
}

function renderStars(id) {
  const { avg, count } = getAverageRating(id);
  const ratingVal = parseFloat(avg);
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (ratingVal >= i) {
      starsHtml += '<i class="fas fa-star text-yellow-400"></i>';
    } else if (ratingVal >= i - 0.5) {
      starsHtml += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    } else {
      starsHtml += '<i class="far fa-star text-slate-600"></i>';
    }
  }
  return `
    <div class="flex flex-col items-center gap-0.5 mt-1.5">
      <div class="flex items-center gap-0.5">${starsHtml}</div>
      <span class="text-[9px] text-slate-400 font-bold">${avg} (${count})</span>
    </div>
  `;
}

function renderFoodList() {
  if (!foodListingsEl) return;

  const viewerLatStr = localStorage.getItem("stopbuy_latitude");
  const viewerLonStr = localStorage.getItem("stopbuy_longitude");
  const viewerLat = viewerLatStr ? parseFloat(viewerLatStr) : 24.8607;
  const viewerLon = viewerLonStr ? parseFloat(viewerLonStr) : 67.0011;

  foodDeals.forEach(f => {
    let pLat, pLon;
    if (f.latitude && f.longitude) {
      pLat = parseFloat(f.latitude);
      pLon = parseFloat(f.longitude);
    } else {
      const pCoords = estimateCoordinates(f.address, f.area, f.city);
      pLat = pCoords.lat;
      pLon = pCoords.lon;
    }
    f.distanceKm = calculateDistance(viewerLat, viewerLon, pLat, pLon);
  });

  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('search') || '';
  const q = (foodSearchInput ? (foodSearchInput.value.trim() || qParam) : qParam).toLowerCase();
  if (foodSearchInput && qParam && !foodSearchInput.value) {
    foodSearchInput.value = qParam;
  }
  const filterCat = document.getElementById('filterCategory')?.value || '';
  const filterSubCat = document.getElementById('filterSubCategory')?.value || '';
  const filterProd = document.getElementById('filterProduct')?.value || '';
  const filterVariety = document.getElementById('filterVariety')?.value || '';
  const filterBrand = document.getElementById('filterBrand')?.value || '';
  const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;

  const activeQuicks = Array.from(document.querySelectorAll('.quickFilterBtn.active-filter'))
    .map(btn => btn.querySelector('.lang-en').textContent.trim());

  const markets = Array.from(document.querySelectorAll('.marketFilter:checked')).map(el => el.value);
  const units = Array.from(document.querySelectorAll('.unitFilter:checked')).map(el => el.value);

  let filtered = foodDeals.filter(f => {
    if (q && !(f.name.toLowerCase().includes(q) || f.variety.toLowerCase().includes(q) || f.address.toLowerCase().includes(q))) return false;
    const cityParam = urlParams.get('city') || '';
    if (cityParam) {
      const city = cityParam.toLowerCase().trim();
      if (city && !(f.city.toLowerCase().includes(city) || f.address.toLowerCase().includes(city))) return false;
    }
    const areaParam = urlParams.get('area') || '';
    if (areaParam) {
      const area = areaParam.toLowerCase().trim();
      if (area && !(f.area.toLowerCase().includes(area) || f.address.toLowerCase().includes(area))) return false;
    }
    if (filterCat && f.category !== filterCat) return false;
    if (filterSubCat && f.subCategory !== filterSubCat) return false;
    if (filterProd && f.name !== filterProd) return false;
    if (filterVariety && f.variety !== filterVariety) return false;
    if (filterBrand && f.brand !== filterBrand) return false;

    if (f.price < minPrice || f.price > maxPrice) return false;

    if (markets.length > 0 && f.market && !markets.includes(f.market)) return false;
    if (units.length > 0 && f.unit && !units.includes(f.unit)) return false;

    if (activeQuicks.includes('Hot Deals') && (!f.tags || !f.tags.includes('Hot Deals'))) return false;
    if (activeQuicks.includes('Free Delivery') && (!f.tags || !f.tags.includes('Free Delivery'))) return false;
    if (activeQuicks.includes('Top Rated') && (!f.tags || !f.tags.includes('Top Rated'))) return false;
    if (activeQuicks.includes('Open Now') && (!f.tags || !f.tags.includes('Open Now'))) return false;

    return true;
  });

  // Sort by Sort By Dropdown selection (min price to max price by default)
  const sortBy = document.getElementById('sortProducts')?.value || urlParams.get('sort') || 'priceLow';
  
  if (sortBy === 'priceLow') {
    filtered.sort((a, b) => {
      const tierDiff = getProximityTier(a.distanceKm) - getProximityTier(b.distanceKm);
      if (tierDiff !== 0) return tierDiff;
      
      const priceDiff = a.price - b.price;
      if (priceDiff !== 0) return priceDiff;

      return a.name.localeCompare(b.name);
    });
  } else if (sortBy === 'priceHigh') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'latest') {
    filtered.sort((a, b) => b.id - a.id);
  } else if (sortBy === 'discount') {
    filtered.sort((a, b) => {
      const discountA = a.originalPrice ? (a.originalPrice - a.price) : 0;
      const discountB = b.originalPrice ? (b.originalPrice - b.price) : 0;
      return discountB - discountA;
    });
  } else {
    filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  if (filtered.length === 0) {
    foodListingsEl.innerHTML = `
      <div class="glass-card p-6 text-center text-slate-400">
        No food items match your filters.
      </div>
    `;
    return;
  }

  foodListingsEl.innerHTML = filtered.map(f => {
    const isSelected = String(f.id) === String(selectedFoodId);
    const activeClass = isSelected ? 'border-[#f97316] shadow-[0_10px_35px_rgba(249,115,22,0.18)] bg-slate-800/90 ring-1 ring-[#f97316]' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 bg-slate-900/60 shadow-sm';

    return `
      <article data-id="${f.id}" class="food-item rounded-2xl p-3 sm:p-4 cursor-pointer transition-colors duration-300 flex flex-row gap-3 border backdrop-blur-md ${activeClass}">
        <div class="flex flex-col items-center shrink-0">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-800 shadow-inner">
            <img src="${f.image}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150';" alt="${f.name}" class="w-full h-full object-cover transition duration-300 hover:scale-105 food-img-filter" />
          </div>
          ${renderStars(f.id)}
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-bold text-sm sm:text-base text-slate-100 leading-tight">${f.name}</h3>
              <span class="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 whitespace-nowrap ml-2">Rs. ${f.price}</span>
            </div>
            <p class="text-[0.7rem] sm:text-xs text-slate-400 mb-1 font-medium">${f.variety}</p>
            ${f.description ? `<p class="text-[0.65rem] sm:text-[0.7rem] text-slate-500 mb-2 line-clamp-2">${f.description}</p>` : ''}
          </div>
          <div class="flex justify-between items-end">
            <p class="text-[0.7rem] text-slate-400 font-medium">📍 ${f.fullLocation}</p>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Add event listeners to newly rendered items
  document.querySelectorAll('.food-item').forEach(el => {
    el.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      selectFoodItem(id);
    });
  });
}

function selectFoodItem(id, preventScroll = false) {
  selectedFoodId = id;
  const item = foodDeals.find(f => String(f.id) === String(id));

  if (item) {
    // Hide placeholder, show content
    if (featuredPlaceholder) featuredPlaceholder.classList.add('hidden');
    if (featuredContent) featuredContent.classList.remove('hidden');

    // Populate Details
    if (fImg) fImg.src = item.image;
    if (fDistance) fDistance.textContent = `${item.distanceKm.toFixed(1)} km away`;
    const fDetailsDistance = document.getElementById('fDetailsDistance');
    if (fDetailsDistance) fDetailsDistance.textContent = `${item.distanceKm.toFixed(1)} km`;
    if (fName) fName.textContent = item.name;
    if (fVariety) fVariety.textContent = item.variety;
    if (fBrand) fBrand.textContent = item.brand || item.subCategory || 'No Brand Specified';
    if (fPrice) fPrice.innerHTML = `Rs. ${item.price} ${item.originalPrice ? `<span class="text-sm line-through text-slate-500 ml-1">Rs. ${item.originalPrice}</span>` : ''}`;
    if (fLocation) document.getElementById('fLocation').textContent =
      item.fullLocation || item.address;
    if (fDesc) fDesc.textContent = item.description;

    const fRatingDisplay = document.getElementById('fRatingDisplay');
    if (fRatingDisplay) {
      const { avg, count } = getAverageRating(item.id);
      const ratingVal = parseFloat(avg);
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (ratingVal >= i) {
          starsHtml += '<i class="fas fa-star text-yellow-400"></i>';
        } else if (ratingVal >= i - 0.5) {
          starsHtml += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
        } else {
          starsHtml += '<i class="far fa-star text-slate-600"></i>';
        }
      }
      fRatingDisplay.innerHTML = `${starsHtml} <span class="text-slate-300 font-bold ml-1">${avg} (${count} reviews)</span>`;
    }

    // Price Comparison Box Logic
    const compBox = document.getElementById('priceComparisonBox');
    const compStandardType = document.getElementById('comparisonStandardType');
    const compResults = document.getElementById('comparisonResults');

    if (compBox && compResults) {
      if (item.standardProductType) {
        compBox.classList.remove('hidden');
        if (compStandardType) compStandardType.textContent = item.standardProductType;

        const comparisons = foodDeals.filter(p => p.standardProductType && p.standardProductType.toLowerCase() === item.standardProductType.toLowerCase());
        
        if (comparisons.length > 0) {
          // Sort by price
          comparisons.sort((a, b) => a.price - b.price);
          
          const lowest = comparisons[0];
          const top5 = comparisons.slice(0, 5);
          const saving = item.price - lowest.price;

          let html = '';
          
          // Lowest Price Section
          html += `
            <div class="mb-3">
              <div class="text-[11px] font-bold text-yellow-400 mb-1">🏆 Lowest Price</div>
              <div class="flex justify-between items-center bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
                <span class="font-bold text-slate-100">${lowest.brand || lowest.variety || 'Unknown'}</span>
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-yellow-400">Rs. ${lowest.price}</span>
                  <span class="text-[10px] text-slate-400">(${lowest.distanceKm.toFixed(1)} km)</span>
                </div>
              </div>
            </div>
          `;

          // Nearby Options Section
          html += `
            <div class="mb-3">
              <div class="text-[11px] font-bold text-emerald-400 mb-1">📍 Nearby Options</div>
              <div class="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
          `;
          
          top5.forEach(comp => {
            const isCurrent = String(comp.id) === String(item.id);
            html += `
              <div class="flex justify-between items-center py-1 border-b border-slate-700/30 ${isCurrent ? 'bg-emerald-500/10 px-1 rounded' : ''}">
                <span class="text-slate-300 font-medium">${comp.brand || comp.variety || 'Unknown'} ${isCurrent ? '<span class="text-[9px] text-emerald-400 font-bold">(Current)</span>' : ''}</span>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-100">Rs. ${comp.price}</span>
                  <span class="text-[10px] text-slate-400">(${comp.distanceKm.toFixed(1)} km)</span>
                </div>
              </div>
            `;
          });

          html += `
              </div>
            </div>
          `;

          // Savings Section
          if (saving > 0) {
            html += `
              <div class="mt-2 bg-emerald-500/15 border border-emerald-500/30 p-2 rounded-lg flex items-center justify-between text-emerald-400 font-extrabold text-[13px]">
                <span>💰 You Save Up To</span>
                <span>Rs. ${saving}</span>
              </div>
            `;
          } else {
            html += `
              <div class="mt-2 bg-slate-700/30 border border-slate-700/50 p-2 rounded-lg flex items-center justify-between text-slate-300 font-bold text-[11px]">
                <span>✨ You are viewing the lowest price listing!</span>
              </div>
            `;
          }

          compResults.innerHTML = html;
        } else {
          compResults.innerHTML = `<div class="text-slate-400 text-[11px] italic">No comparison data available.</div>`;
        }
      } else {
        compBox.classList.add('hidden');
      }
    }

    // Handle Video Display
    const fVideoContainer = document.getElementById('fVideoContainer');
    const fVideoFrame = document.getElementById('fVideoFrame');
    const fVideoLink = document.getElementById('fVideoLink');
    if (fVideoContainer) {
      if (item.videoLink) {
        fVideoContainer.classList.remove('hidden');
        let embedUrl = item.videoLink;
        // Basic YouTube URL parsing
        let ytMatch = item.videoLink.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch) {
          embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
          if (fVideoFrame) {
            fVideoFrame.src = embedUrl;
            fVideoFrame.classList.remove('hidden');
          }
          if (fVideoLink) fVideoLink.classList.add('hidden');
        } else {
          if (fVideoFrame) fVideoFrame.classList.add('hidden');
          if (fVideoLink) {
            fVideoLink.href = item.videoLink;
            fVideoLink.classList.remove('hidden');
          }
        }
      } else {
        fVideoContainer.classList.add('hidden');
        if (fVideoFrame) fVideoFrame.src = '';
      }
    }

    // Contact Buttons Setup
    if (item.phone) {
      if (fCallBtn) {
        fCallBtn.classList.remove('hidden');
        fCallBtn.onclick = () => window.location.href = `tel:${item.phone}`;
      }
    } else {
      if (fCallBtn) fCallBtn.classList.add('hidden');
    }

    if (fOrderBtn) {
      fOrderBtn.classList.remove('hidden');
      fOrderBtn.onclick = () => {
        // Set dynamic static details
        const d = new Date();
        if (modalDateTime) modalDateTime.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        if (modalRestaurant) modalRestaurant.textContent = item.variety;
        if (modalProductName) modalProductName.textContent = item.name;
        if (modalLocation) modalLocation.textContent = `${item.fullLocation}`;
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

// Helper to process raw products data
function processProducts(allProducts) {
  const foodProducts = allProducts.filter(p => p.category && p.category.toLowerCase() === 'food' && (p.status === 'Publish' || p.prodStatus === 'Publish' || (!p.status && !p.prodStatus && (!p.addedBy || p.addedBy.toLowerCase() === 'admin'))));
  return foodProducts.map(p => {
    let variety = p.variety || p.brand || p.subCategory || 'No Variety Specified';
    const parts = [];
    if (p.qty) parts.push(p.qty);
    if (p.gram) parts.push(p.gram);
    if (parts.length > 0) {
      variety = `${variety} (${parts.join(' - ')})`;
    }
    const address = p.address || '';
    const areaVal = p.area || p.areaBlock || '';
    const blockVal = p.blockNo || p.block || '';
    const areaCombined = (areaVal && blockVal) ? `${areaVal} - ${blockVal}` : (areaVal || blockVal || '');
    const city = p.city || '';

    const fullLocation = [address, areaCombined, city]
      .filter(Boolean)
      .join(', ');
    const distanceKm = parseFloat(p.distance || p.distanceKm) || 2.5;
    const phone = p.phone || p.contact || '';
    const whatsapp = p.whatsapp || phone;

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
      variety: variety,
      brand: p.brand || p.subCategory || '',
      category: p.category || '',
      subCategory: p.subCategory || '',
      market: p.market || '',
      unit: p.unit || '',
      address: address,
      area: areaVal,
      city: city,
      fullLocation: fullLocation,
      distanceKm: distanceKm,
      price: parseFloat(p.price || 0),
      originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : null,
      image: p.image || 'https://via.placeholder.com/600x400?text=No+Image',
      description: p.description || p.details || variety,
      phone: phone,
      whatsapp: whatsapp,
      videoLink: p.videoLink || null,
      tags: tags,
      standardProductType: p.standardProductType || ''
    };
  });
}

// Initial Setup
async function initFoodDeals() {
  // 1. Instantly load offline data from localStorage
  const localProducts = JSON.parse(localStorage.getItem("admin_products")) || [];
  foodDeals = processProducts(localProducts);

  // Render lists and select default immediately
  if (foodListingsEl) {
    renderFoodList();
    if (foodDeals.length > 0) {
      selectFoodItem(foodDeals[0].id, true);
    }
  }

  // Populate Select filters
  const populateSelect = (id, property) => {
    const el = document.getElementById(id);
    if (!el) return;
    const uniqueVals = [...new Set(foodDeals.map(f => f[property]).filter(Boolean))].sort();
    el.innerHTML = '<option value="">All</option>';
    uniqueVals.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      el.appendChild(opt);
    });
    el.removeEventListener('change', renderFoodList);
    el.addEventListener('change', renderFoodList);
  };

  const populateAllFilters = () => {
    populateSelect('filterCategory', 'category');
    populateSelect('filterSubCategory', 'subCategory');
    populateSelect('filterProduct', 'name');
    populateSelect('filterVariety', 'variety');
    populateSelect('filterBrand', 'brand');
  };

  const updateBrandCount = () => {
    const uniqueBrands = [...new Set(foodDeals.map(f => f.brand).filter(Boolean))];
    const brandCount = uniqueBrands.length;
    const brandCountEn = document.getElementById('brandCountEn');
    const brandCountUr = document.getElementById('brandCountUr');
    if (brandCountEn) brandCountEn.textContent = brandCount + '+';
    if (brandCountUr) brandCountUr.textContent = brandCount + '+';
  };

  populateAllFilters();
  updateBrandCount();

  // Click event for brandStatCard to connect it with filterBrand select in search panel
  const brandStatCard = document.getElementById('brandStatCard');
  if (brandStatCard) {
    brandStatCard.addEventListener('click', () => {
      const filterBrand = document.getElementById('filterBrand');
      if (filterBrand) {
        filterBrand.scrollIntoView({ behavior: 'smooth', block: 'center' });
        filterBrand.focus();
        filterBrand.classList.add('ring-2', 'ring-emerald-500', 'border-emerald-500');
        setTimeout(() => {
          filterBrand.classList.remove('ring-2', 'ring-emerald-500', 'border-emerald-500');
        }, 2000);
      }
    });
  }

  // 2. Fetch fresh products from Supabase in background (Non-blocking!)
  if (typeof DataService !== 'undefined') {
    DataService.getProducts().then(freshProducts => {
      if (freshProducts && freshProducts.length > 0) {
        foodDeals = processProducts(freshProducts);
        localStorage.setItem("admin_products", JSON.stringify(freshProducts));
        
        // Re-render and update UI with fresh data
        renderFoodList();
        populateAllFilters();
        updateBrandCount();
        if (foodDeals.length > 0) {
          selectFoodItem(foodDeals[0].id, true);
        }
      }
    }).catch(e => {
      console.warn("Failed to fetch fresh products from service", e);
    });

    // Update dynamic Live Deals count asynchronously (non-blocking)
    DataService.getDeals().then(mainDeals => {
      const liveDealsCount = mainDeals.filter(d => (d.category || '').toLowerCase() === 'food').length;
      const liveDealsCountEn = document.getElementById('liveDealsCountEn');
      const liveDealsCountUr = document.getElementById('liveDealsCountUr');
      if (liveDealsCountEn) liveDealsCountEn.textContent = liveDealsCount + '+';
      if (liveDealsCountUr) liveDealsCountUr.textContent = liveDealsCount + '+';
    }).catch(e => {
      console.warn("Failed to fetch live deals count from service, checking local fallback", e);
      const localDeals = JSON.parse(localStorage.getItem("admin_deals")) || [];
      const liveDealsCount = localDeals.filter(d => (d.category || '').toLowerCase() === 'food').length;
      const liveDealsCountEn = document.getElementById('liveDealsCountEn');
      const liveDealsCountUr = document.getElementById('liveDealsCountUr');
      if (liveDealsCountEn) liveDealsCountEn.textContent = liveDealsCount + '+';
      if (liveDealsCountUr) liveDealsCountUr.textContent = liveDealsCount + '+';
    });
  }

  // Click event for liveDealsStatCard to redirect to main page and trigger Food Deals modal
  const liveDealsStatCard = document.getElementById('liveDealsStatCard');
  if (liveDealsStatCard) {
    liveDealsStatCard.addEventListener('click', () => {
      window.location.href = '../index.html?openDeals=Food';
    });
  }

  document.getElementById('minPrice')?.addEventListener('input', renderFoodList);
  document.getElementById('maxPrice')?.addEventListener('input', renderFoodList);

  document.querySelectorAll('.marketFilter, .unitFilter').forEach(el => el.addEventListener('change', renderFoodList));
  document.getElementById('sortProducts')?.addEventListener('change', renderFoodList);

  document.querySelectorAll('.quickFilterBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active-filter');
      btn.classList.toggle('border-emerald-500');
      btn.classList.toggle('text-emerald-400');
      renderFoodList();
    });
  });

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

          if (window.innerWidth < 1024) {
            setTimeout(() => {
              const listingsContainer = document.getElementById('foodListings');
              if (listingsContainer) {
                listingsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }
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
if (paymentBtns) {
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
}

// Confirm Order Logic
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
if (confirmOrderBtn) {
  confirmOrderBtn.addEventListener('click', () => {
    // 1. Get rating value
    const stars = parseInt(document.getElementById('modalRating').value) || 0;
    const remarks = document.getElementById('modalRemarks').value || '';
    
    // Save rating to localStorage
    if (selectedFoodId && stars > 0) {
      let ratings = JSON.parse(localStorage.getItem(`food_ratings_${selectedFoodId}`)) || [];
      ratings.push(stars);
      localStorage.setItem(`food_ratings_${selectedFoodId}`, JSON.stringify(ratings));
    }

    // 2. Fetch all modal fields for order confirmation
    const dateTime = document.getElementById('modalDateTime')?.textContent || '';
    const restaurant = document.getElementById('modalRestaurant')?.textContent || '';
    const productName = document.getElementById('modalProductName')?.textContent || '';
    const location = document.getElementById('modalLocation')?.textContent || '';
    const phone = document.getElementById('modalPhone')?.textContent || '';
    const rate = document.getElementById('modalRate')?.textContent || '';
    const quantity = document.getElementById('modalQuantity')?.value || '1';
    const totalAmount = document.getElementById('modalTotalAmount')?.textContent || '';

    // Get input text fields
    const customerName = document.querySelector('#orderModal input[placeholder*="Ali Khan"]')?.value || '';
    const customerPhone = document.querySelector('#orderModal input[placeholder*="03"]')?.value || '';
    const customerAddress = document.querySelector('#orderModal textarea[placeholder*="House"]')?.value || '';
    
    // Detect selected payment method
    let paymentMethod = 'Cash On Delivery';
    const paymentButtons = document.querySelectorAll('#orderModal .pymt-btn');
    paymentButtons.forEach(btn => {
      if (btn.classList.contains('border-emerald-500') || btn.classList.contains('border-yellow-400') || btn.classList.contains('border-emerald-400')) {
        paymentMethod = btn.textContent.trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
      }
    });

    // 3. Construct WhatsApp Message
    const message = `================================\n         *STOP BUY*\n================================\n*Date & Time:* ${dateTime}\n--------------------------------\n*PRODUCT DETAIL:*\n- *Restaurant:* ${restaurant}\n- *Product:* ${productName}\n- *Price:* ${rate}\n- *Quantity:* ${quantity}\n- *Total Amount:* ${totalAmount}\n- *Payment Method:* ${paymentMethod}\n- *Rating:* ${stars} Stars\n- *Remarks:* ${remarks}\n--------------------------------\n*CUSTOMER DETAIL:*\n- *Name:* ${customerName}\n- *Phone/WhatsApp:* ${customerPhone}\n- *Delivery Address:* ${customerAddress}\n================================\n    *Order through "Stop Buy"*\n================================`;
    const encodedMsg = encodeURIComponent(message);

    // 4. Send message to restaurant
    const item = foodDeals.find(f => f.id === selectedFoodId);
    let whatsappNum = item && item.phone ? item.phone.replace(/[^0-9]/g, '') : '923001234567';
    if (!whatsappNum) whatsappNum = '923001234567';

    window.open(`https://wa.me/${whatsappNum}?text=${encodedMsg}`, '_blank');

    // Send copy to Admin
    setTimeout(() => {
        if (confirm("Order receipt sent to Seller! Press OK to send a copy to the Admin.")) {
            window.open(`https://wa.me/923330257246?text=${encodedMsg}`, '_blank');
        }
    }, 800);

    // 5. Hide Modal & reset
    if (orderModal) orderModal.classList.add('hidden');
    
    // Clear rating selection
    document.getElementById('modalRating').value = 0;
    const starElements = document.getElementById('orderRatingStars')?.querySelectorAll('i');
    if (starElements) {
      starElements.forEach(star => {
        star.classList.add('text-slate-300');
        star.classList.remove('text-yellow-400');
      });
    }
    
    // Reset inputs
    document.getElementById('modalRemarks').value = '';

    // 6. Refresh lists
    renderFoodList();
    if (selectedFoodId) {
      selectFoodItem(selectedFoodId, true);
    }
  });
}

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
