// Food Deals Data
const foodDeals = [
  {
    id: 1,
    name: "Zinger Burger Deal",
    restaurant: "Burger Lab",
    area: "Gulshan-e-Iqbal",
    city: "Karachi",
    distanceKm: 1.2,
    price: 850,
    originalPrice: 1100,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    description: "Enjoy our signature Zinger Burger with crispy chicken, fresh lettuce, and our secret sauce. Comes with a regular fries and a 250ml drink. Perfect for a quick meal!",
    phone: "03001234567",
    whatsapp: "03001234567",
    tags: ["Fast Food", "Burger", "Combo"]
  },
  {
    id: 2,
    name: "Chicken Tikka Pizza (Large)",
    restaurant: "Pizza Max",
    area: "Bahadurabad",
    city: "Karachi",
    distanceKm: 2.5,
    price: 1450,
    originalPrice: 1800,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    description: "Large 13-inch Chicken Tikka Pizza loaded with premium cheese, spicy chicken chunks, onions, and capsicum. Hand-tossed dough baked to perfection.",
    phone: "03119876543",
    whatsapp: "03119876543",
    tags: ["Pizza", "Spicy", "Family"]
  },
  {
    id: 3,
    name: "Chicken Biryani (Single)",
    restaurant: "Student Biryani",
    area: "Saddar",
    city: "Karachi",
    distanceKm: 4.0,
    price: 350,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80",
    description: "Authentic Karachi style spicy chicken biryani with a tender piece of chicken and aloo (potato). Served with raita and fresh salad.",
    phone: "03001122334",
    whatsapp: "03001122334",
    tags: ["Desi", "Rice", "Spicy"]
  },
  {
    id: 4,
    name: "Platter of 10 Seekh Kabab",
    restaurant: "Meerath Kabab House",
    area: "Tariq Road",
    city: "Karachi",
    distanceKm: 3.2,
    price: 1200,
    originalPrice: 1500,
    image: "https://images.unsplash.com/photo-1599487405200-a5fb97be535c?auto=format&fit=crop&w=600&q=80",
    description: "Juicy beef seekh kababs grilled on charcoal, served with pure mint chutney, sliced onions, and 4 special parathas.",
    phone: "03334455667",
    whatsapp: "03334455667",
    tags: ["Barbeque", "Beef", "Desi"]
  },
  {
    id: 5,
    name: "Club Sandwich Combo",
    restaurant: "KBC RESTAURANT",
    area: "Nazimabad",
    city: "Karachi",
    distanceKm: 5.5,
    price: 650,
    originalPrice: 850,
    image: "../images/club-sandwich.png",
    description: "Triple layered toasted bread filled with roasted chicken, fried egg, cheese slices, mayo, tomatoes, and iceberg lettuce. Served with crispy fries and coleslaw.",
    phone: "03217788990",
    whatsapp: "03217788990",
    tags: ["Sandwich", "Snacks", "Combo"]
  },
  {
    id: 6,
    name: "Mighty Zinger",
    restaurant: "KFC (Local Branch)",
    area: "Gulistan-e-Johar",
    city: "Karachi",
    distanceKm: 6.8,
    price: 1050,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1608897013039-b2f43846ce9a?auto=format&fit=crop&w=600&q=80",
    description: "Two crispy zinger fillets, fresh lettuce, mayo, and cheese in a massive sesame bun. The ultimate burger experience for big appetites.",
    phone: "111532532",
    whatsapp: "",
    tags: ["Fast Food", "Burger"]
  },
  {
    id: 7,
    name: "Haleem",
    restaurant: "Mazaydar Haleem",
    area: "Yaseenabad",
    city: "Karachi",
    distanceKm: 3.5,
    price: 450,
    originalPrice: null,
    image: "../images/haleem.png",
    description: "Famous thick and spicy Haleem made with pure ghee and rich lentils. Topped with fried onions, ginger, and lemon.",
    phone: "03001239988",
    whatsapp: "03001239988",
    tags: ["Desi", "Haleem"]
  },
  {
    id: 8,
    name: "Broast & Burgers Combo",
    restaurant: "Jans Broast",
    area: "Saddar & Clifton",
    city: "Karachi",
    distanceKm: 4.2,
    price: 1350,
    originalPrice: 1600,
    image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80",
    description: "A complete deal featuring crispy fried chicken broast chunks and a juicy burger, served with special garlic sauce and fries.",
    phone: "02135678901",
    whatsapp: "03456789012",
    tags: ["Broast", "Fast Food"]
  },
  {
    id: 9,
    name: "Zinger Burger",
    restaurant: "Super Burger & Broast",
    area: "Ancholi Block 17",
    city: "Karachi",
    distanceKm: 5.1,
    price: 450,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=600&q=80",
    description: "Delicious and highly affordable crispy zinger burger wrapped in soft buns with creamy mayo.",
    phone: "03212345678",
    whatsapp: "03212345678",
    tags: ["Burger", "Zinger"]
  },
  {
    id: 10,
    name: "Famous Bun Kabab",
    restaurant: "Burns Road's Bun Kabab",
    area: "Frere Chowk",
    city: "Karachi",
    distanceKm: 6.5,
    price: 150,
    originalPrice: 200,
    image: "../images/bun-kabab.png",
    description: "The classic and legendary Burns Road bun kabab with spicy lentil patty, fluffy egg, and signature green chutney.",
    phone: "03009998887",
    whatsapp: "",
    tags: ["Street Food", "Desi", "Snacks"]
  },
  {
    id: 11,
    name: "Special BBQ Platter",
    restaurant: "Ghaffar Kabab House",
    area: "Port Grand",
    city: "Karachi",
    distanceKm: 8.2,
    price: 2400,
    originalPrice: 2800,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    description: "A huge assortment of BBQ items including Chicken Tikka, Malai Boti, Seekh Kabab, and Fish Tikka, served with fresh naan and chutneys.",
    phone: "03111111222",
    whatsapp: "03111111222",
    tags: ["BBQ", "Desi", "Platter"]
  },
  {
    id: 12,
    name: "Beef Chapli Kabab",
    restaurant: "Peshawari Chapli Kabab",
    area: "Hassan Square",
    city: "Karachi",
    distanceKm: 2.1,
    price: 300,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=600&q=80",
    description: "Authentic oversized beef chapli kabab fried in beef tallow, served with traditional peshawari naan.",
    phone: "03444445555",
    whatsapp: "",
    tags: ["Desi", "Beef", "Peshawari"]
  },
  {
    id: 13,
    name: "Shawarma Wrap",
    restaurant: "Syrian Shawarma",
    area: "Sindhi Muslim",
    city: "Karachi",
    distanceKm: 3.8,
    price: 350,
    originalPrice: 400,
    image: "https://images.unsplash.com/photo-1529124235471-1d5754ea8f0d?auto=format&fit=crop&w=600&q=80",
    description: "Authentic middle-eastern shawarma with garlic sauce, pickles, and properly marinated grilled chicken wrapped in soft pita.",
    phone: "03009876543",
    whatsapp: "03009876543",
    tags: ["Fast Food", "Arabian", "Wrap"]
  }
];

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
    const activeClass = isSelected ? 'border-yellow-400 shadow-yellow-500/20 bg-slate-900/90 ring-1 ring-yellow-400' : 'border-slate-800 hover:border-yellow-500/50 hover:bg-slate-900/60';
    
    return `
      <article data-id="${f.id}" class="food-item glass-card p-3 sm:p-4 cursor-pointer transition-colors duration-300 flex flex-row gap-3 ${activeClass}">
        <div class="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800">
          <img src="${f.image}" alt="${f.name}" class="w-full h-full object-cover opacity-90 hover:opacity-100 transition" />
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-semibold text-sm sm:text-base text-slate-100 leading-tight">${f.name}</h3>
              <span class="text-xs font-semibold text-emerald-400 whitespace-nowrap ml-2">Rs. ${f.price}</span>
            </div>
            <p class="text-[0.7rem] sm:text-xs text-slate-400 mb-1">${f.restaurant}</p>
          </div>
          <div class="flex justify-between items-end">
            <p class="text-[0.7rem] text-slate-500">📍 ${f.area}</p>
            <span class="px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-[0.65rem] text-yellow-300">
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

function selectFoodItem(id) {
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
  if (window.innerWidth < 1024) {
    setTimeout(() => {
      const adContainer = document.getElementById('featuredAdContainer');
      if (adContainer) {
        adContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}

// Initial Setup
if (foodListingsEl) {
  renderFoodList();
  
  // Select first item by default if data exists
  if (foodDeals.length > 0) {
    selectFoodItem(foodDeals[0].id);
  }

  // Search Listeners
  if (foodSearchBtn) {
    foodSearchBtn.addEventListener('click', renderFoodList);
  }
  if (foodSearchInput) {
    foodSearchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') renderFoodList();
    });
  }
}

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
       b.classList.remove('border-yellow-500', 'bg-yellow-500/10');
       b.classList.add('border-slate-700', 'bg-slate-800/40');
    });
    // set active
    btn.classList.add('border-yellow-500', 'bg-yellow-500/10');
    btn.classList.remove('border-slate-700', 'bg-slate-800/40');
  });
});
