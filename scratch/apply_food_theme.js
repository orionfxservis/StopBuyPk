const fs = require('fs');
const path = require('path');

const foodHtmlPath = path.join(__dirname, '..', 'pages', 'food.html');
const foodJsPath = path.join(__dirname, '..', 'js', 'food.js');

let foodHtml = fs.readFileSync(foodHtmlPath, 'utf8');
let foodJs = fs.readFileSync(foodJsPath, 'utf8');

console.log('Original food.html length:', foodHtml.length);
console.log('Original food.js length:', foodJs.length);

// 1. UPDATE CSS STYLES IN food.html
const userThemeCSS = `
/* StopBuy.pk — Food page theme only */
:root {
  --food-bg: #F7F8F5;
  --food-surface: #FFFFFF;
  --food-brand: #0A3D2A;
  --food-brand-hover: #072F20;
  --food-heading: #173D2B;
  --food-text: #26332B;
  --food-muted: #68756C;
  --food-border: #DCE4DC;
  --food-accent: #E66B16;
  --food-accent-bg: #FFF4E8;
  --food-success: #16834A;
  --food-error: #B42318;
  --food-disabled: #E8ECE8;
  --food-radius: 12px;
  --food-shadow: 0 3px 14px rgba(10, 61, 42, 0.07);
}

/* Apply these styles only inside the food page content */
.food-page {
  background: var(--food-bg);
  color: var(--food-text);
}

.food-page .food-section,
.food-page .product-card,
.food-page .filter-panel,
.food-page .product-details,
.food-page .order-panel {
  background: var(--food-surface);
  border: 1px solid var(--food-border);
  border-radius: var(--food-radius);
}

.food-page .product-card {
  box-shadow: var(--food-shadow);
}

.food-page h1,
.food-page h2,
.food-page h3 {
  color: var(--food-heading);
}

.food-page .muted,
.food-page .product-location,
.food-page .product-date {
  color: var(--food-muted);
}

.food-page .primary-button {
  background: var(--food-brand);
  color: #FFFFFF;
}

.food-page .primary-button:hover {
  background: var(--food-brand-hover);
}

.food-page .product-price,
.food-page .best-price {
  color: var(--food-success);
}

.food-page .deal-badge {
  background: var(--food-accent-bg);
  color: #A84908;
}

.food-page input,
.food-page select,
.food-page textarea {
  background: #FFFFFF;
  color: var(--food-text);
  border: 1px solid var(--food-border);
  border-radius: 8px;
}

.food-page :focus-visible {
  outline: 2px solid var(--food-success);
  outline-offset: 2px;
}

/* Scoped Overrides for Food Page Components */
.food-page .food-category {
  background: #FFFFFF !important;
  border: 1px solid var(--food-border) !important;
  border-radius: 999px !important;
  color: var(--food-text) !important;
  padding: 8px 18px !important;
  box-shadow: 0 2px 6px rgba(10, 61, 42, 0.04) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transition: all 0.25s ease !important;
}

.food-page .food-category span {
  color: var(--food-text) !important;
  font-weight: 600 !important;
}

.food-page .food-category i {
  color: var(--food-brand) !important;
  filter: none !important;
}

.food-page .food-category:hover {
  border-color: var(--food-brand) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(10, 61, 42, 0.09) !important;
}

.food-page .food-category.active {
  background: var(--food-brand) !important;
  border-color: var(--food-brand) !important;
  color: #FFFFFF !important;
  box-shadow: 0 4px 14px rgba(10, 61, 42, 0.2) !important;
}

.food-page .food-category.active span,
.food-page .food-category.active i {
  color: #FFFFFF !important;
}

.food-page .dark-panel {
  background: var(--food-surface) !important;
  border: 1px solid var(--food-border) !important;
  color: var(--food-text) !important;
  box-shadow: var(--food-shadow) !important;
}

.food-page .dark-panel label {
  color: var(--food-heading) !important;
}

.food-page .dark-panel input,
.food-page .dark-panel select {
  background: #FFFFFF !important;
  border: 1px solid var(--food-border) !important;
  color: var(--food-text) !important;
}

.food-page .dark-panel input:focus,
.food-page .dark-panel select:focus {
  border-color: var(--food-success) !important;
  outline: 2px solid var(--food-success) !important;
  outline-offset: 1px;
}

.food-page .quickFilterBtn {
  height: 42px;
  border-radius: 14px;
  background: #FFFFFF !important;
  border: 1px solid var(--food-border) !important;
  color: var(--food-text) !important;
  font-size: 12px;
  font-weight: 600;
  transition: .25s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.food-page .quickFilterBtn:hover {
  background: #F7F8F5 !important;
  border-color: var(--food-brand) !important;
  color: var(--food-brand) !important;
}

.food-page .quickFilterBtn.active-filter {
  background: var(--food-brand) !important;
  border-color: var(--food-brand) !important;
  color: #FFFFFF !important;
}

.food-page .miniStatCard {
  background: var(--food-surface) !important;
  border: 1px solid var(--food-border) !important;
  border-radius: 16px;
  box-shadow: var(--food-shadow);
}

.food-page .miniStatCard h4 {
  color: var(--food-heading) !important;
}

.food-page .miniStatCard p {
  color: var(--food-muted) !important;
}

.food-page .food-scroll::-webkit-scrollbar {
  width: 6px;
}
.food-page .food-scroll::-webkit-scrollbar-track {
  background: #F1F4F0;
  border-radius: 4px;
}
.food-page .food-scroll::-webkit-scrollbar-thumb {
  background: #DCE4DC;
  border-radius: 4px;
}
.food-page .food-scroll::-webkit-scrollbar-thumb:hover {
  background: #16834A;
}
`;

// Insert userThemeCSS inside <style>
if (foodHtml.includes('<style>')) {
  foodHtml = foodHtml.replace('<style>', '<style>\n' + userThemeCSS);
} else {
  console.error('Could not find <style> tag in food.html');
}

// Update body class
foodHtml = foodHtml.replace(
  /<body class="[^"]*">/,
  '<body class="bg-[#F7F8F5] text-[#26332B] antialiased min-h-screen flex flex-col relative overflow-x-hidden">'
);

// Update main class to include food-page
foodHtml = foodHtml.replace(
  /<main class="flex-1 relative z-10 pt-6 pb-6">/,
  '<main class="food-page flex-1 relative z-10 pt-6 pb-6">'
);

// 2. UPDATE TOP 3-COLUMN BANNERS & SEARCH PANEL
// Left banner
const leftBannerOld = `<div class="hidden lg:flex lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex-col justify-between text-white relative overflow-hidden shadow-lg h-[195px] shrink-0 text-left">
              <div class="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900 opacity-95 z-0"></div>
              <div class="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-red-500/10 blur-2xl"></div>
              <div class="absolute -right-12 -bottom-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl"></div>

              <div class="relative z-10 space-y-1">
                  <span class="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Hot Deals</span>

                  <!-- Left Promo Content Container -->
                  <div id="leftPromoBanner1" class="transition-opacity duration-300 space-y-0.5 mt-1">
                      <h3 class="text-base font-bold leading-tight text-white font-serif mt-0.5">🛒 Grocery Specials</h3>
                      <p class="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2">Shop daily household essentials and groceries at lowest prices.</p>
                  </div>
              </div>
              <div class="relative z-10">
                  <a id="leftPromoLink1" href="./grocery.html" class="inline-flex items-center justify-center w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all duration-300 text-center">
                      View Specials
                  </a>
              </div>
          </div>`;

const leftBannerNew = `<div class="hidden lg:flex lg:col-span-3 bg-white border border-[#DCE4DC] rounded-3xl p-4 flex-col justify-between text-[#26332B] relative overflow-hidden shadow-[0_3px_14px_rgba(10,61,42,0.07)] h-[195px] shrink-0 text-left">
              <div class="relative z-10 space-y-1">
                  <span class="text-[9px] font-black uppercase tracking-wider text-[#16834A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Hot Deals</span>

                  <!-- Left Promo Content Container -->
                  <div id="leftPromoBanner1" class="transition-opacity duration-300 space-y-0.5 mt-1">
                      <h3 class="text-base font-bold leading-tight text-[#173D2B] font-serif mt-0.5">🛒 Grocery Specials</h3>
                      <p class="text-[10px] text-[#68756C] font-medium leading-tight line-clamp-2">Shop daily household essentials and groceries at lowest prices.</p>
                  </div>
              </div>
              <div class="relative z-10">
                  <a id="leftPromoLink1" href="./grocery.html" class="inline-flex items-center justify-center w-full py-1.5 bg-[#0A3D2A] hover:bg-[#072F20] text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-300 text-center">
                      View Specials
                  </a>
              </div>
          </div>`;

if (foodHtml.includes('id="leftPromoBanner1"')) {
  foodHtml = foodHtml.replace(leftBannerOld, leftBannerNew);
}

// Middle search column
const searchColOld = `<div class="col-span-12 lg:col-span-6 flex flex-col justify-between bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-lg relative overflow-hidden h-[195px]">
              <!-- Glow -->
              <div class="absolute -top-20 -right-20 w-60 h-60 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div class="absolute -bottom-20 -left-20 w-60 h-60 bg-[#d61c22]/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div class="flex flex-col gap-1 relative z-10">
                  <h2 class="text-lg sm:text-xl font-bold text-slate-100">
                      <span class="lang-en">Food Deals & Restaurants</span><span class="lang-ur">کھانوں کی ڈیلز اور ریسٹورنٹس</span>
                  </h2>
                  <p class="text-[0.7rem] text-slate-400 font-medium leading-snug">
                      <span class="lang-en">Nearby places first. We display trusted and verified listings around you.</span><span class="lang-ur">سب سے پہلے آپ کے قریب کی جگہیں۔ ہم آپ کو آپ کے اردگرد قابلِ اعتماد اور تصدیق شدہ مقامات دکھاتے ہیں۔</span>
                  </p>
              </div>
              
              <div class="flex flex-col sm:flex-row gap-2.5 sm:items-center relative z-10 mt-auto">
                  <div class="flex-1 relative">
                      <input id="foodSearchInput" type="text"
                          data-en-placeholder="e.g. Pizza, Burger, Desi"
                          data-ur-placeholder="مثال: پیزا، برگر، دیسی..."
                          placeholder="مثال: پیزا، برگر، دیسی..."
                          style="padding-inline-start: 3rem; padding-inline-end: 1rem;"
                          class="w-full bg-slate-950/50 border border-slate-700 rounded-2xl text-xs sm:text-sm py-2 outline-none text-slate-100 placeholder:text-slate-500 shadow-sm transition" />
                      <div class="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400 text-xs" style="inset-inline-start: 0.6rem;">
                          🔍
                      </div>
                  </div>
                  <button id="foodSearchBtn"
                          class="px-5 py-2 rounded-2xl bg-gradient-to-r from-[#d61c22] to-red-700 text-white font-semibold text-xs sm:text-sm shadow-[0_8px_20px_rgba(214,28,34,0.3)] hover:brightness-110 whitespace-nowrap transition">
                      <span class="lang-en">Search</span><span class="lang-ur">تلاش</span>
                  </button>
              </div>
          </div>`;

const searchColNew = `<div class="col-span-12 lg:col-span-6 flex flex-col justify-between bg-white border border-[#DCE4DC] p-4 sm:p-5 rounded-3xl shadow-[0_3px_14px_rgba(10,61,42,0.07)] relative overflow-hidden h-[195px]">
              <div class="flex flex-col gap-1 relative z-10">
                  <h2 class="text-lg sm:text-xl font-bold text-[#173D2B]">
                      <span class="lang-en">Food Deals & Restaurants</span><span class="lang-ur">کھانوں کی ڈیلز اور ریسٹورنٹس</span>
                  </h2>
                  <p class="text-[0.7rem] text-[#68756C] font-medium leading-snug">
                      <span class="lang-en">Nearby places first. We display trusted and verified listings around you.</span><span class="lang-ur">سب سے پہلے آپ کے قریب کی جگہیں۔ ہم آپ کو آپ کے اردگرد قابلِ اعتماد اور تصدیق شدہ مقامات دکھاتے ہیں۔</span>
                  </p>
              </div>
              
              <div class="flex flex-col sm:flex-row gap-2.5 sm:items-center relative z-10 mt-auto">
                  <div class="flex-1 relative">
                      <input id="foodSearchInput" type="text"
                          data-en-placeholder="e.g. Pizza, Burger, Desi"
                          data-ur-placeholder="مثال: پیزا، برگر، دیسی..."
                          placeholder="مثال: پیزا، برگر، دیسی..."
                          style="padding-inline-start: 3rem; padding-inline-end: 1rem;"
                          class="w-full bg-white border border-[#DCE4DC] rounded-2xl text-xs sm:text-sm py-2 outline-none text-[#26332B] placeholder:text-[#68756C] shadow-sm transition focus:border-[#16834A]" />
                      <div class="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F7F8F5] flex items-center justify-center border border-[#DCE4DC] text-[#68756C] text-xs" style="inset-inline-start: 0.6rem;">
                          🔍
                      </div>
                  </div>
                  <button id="foodSearchBtn"
                          class="px-5 py-2 rounded-2xl bg-[#0A3D2A] hover:bg-[#072F20] text-white font-semibold text-xs sm:text-sm shadow-sm transition">
                      <span class="lang-en">Search</span><span class="lang-ur">تلاش</span>
                  </button>
              </div>
          </div>`;

if (foodHtml.includes('id="foodSearchInput"')) {
  foodHtml = foodHtml.replace(searchColOld, searchColNew);
}

// Right banner
const rightBannerOld = `<div class="hidden lg:flex lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex-col justify-between text-white relative overflow-hidden shadow-lg h-[195px] shrink-0 text-left">
              <div class="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900 opacity-95 z-0"></div>
              <div class="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-red-500/10 blur-2xl"></div>
              <div class="absolute -left-12 -bottom-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl"></div>

              <div class="relative z-10 space-y-1">
                  <span class="text-[9px] font-black uppercase tracking-wider text-[#d61c22] bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Featured Offers</span>

                  <!-- Right Promo Content Container -->
                  <div id="rightPromoBanner1" class="transition-opacity duration-300 space-y-0.5 mt-1">
                      <h3 class="text-base font-bold leading-tight text-white font-serif mt-0.5">🍔 Restaurant Deals</h3>
                      <p class="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2">Save up to 40% on popular nearby food stuff and fast food joints.</p>
                  </div>
              </div>
              <div class="relative z-10 text-left">
                  <a id="rightPromoLink1" href="./food.html" class="inline-flex items-center justify-center w-full py-1.5 bg-[#d61c22] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all duration-300 text-center">
                      Claim Offer
                  </a>
              </div>
          </div>`;

const rightBannerNew = `<div class="hidden lg:flex lg:col-span-3 bg-[#FFF4E8] border border-[#FCE2CE] rounded-3xl p-4 flex-col justify-between text-[#26332B] relative overflow-hidden shadow-[0_3px_14px_rgba(10,61,42,0.07)] h-[195px] shrink-0 text-left">
              <div class="relative z-10 space-y-1">
                  <span class="text-[9px] font-black uppercase tracking-wider text-[#A84908] bg-[#FFF4E8] px-2 py-0.5 rounded-full border border-orange-200/80 deal-badge">Featured Offers</span>

                  <!-- Right Promo Content Container -->
                  <div id="rightPromoBanner1" class="transition-opacity duration-300 space-y-0.5 mt-1">
                      <h3 class="text-base font-bold leading-tight text-[#173D2B] font-serif mt-0.5">🍔 Restaurant Deals</h3>
                      <p class="text-[10px] text-[#68756C] font-medium leading-tight line-clamp-2">Save up to 40% on popular nearby food stuff and fast food joints.</p>
                  </div>
              </div>
              <div class="relative z-10 text-left">
                  <a id="rightPromoLink1" href="./food.html" class="inline-flex items-center justify-center w-full py-1.5 bg-[#E66B16] hover:bg-[#cf5d0e] text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-300 text-center">
                      Claim Offer
                  </a>
              </div>
          </div>`;

if (foodHtml.includes('id="rightPromoBanner1"')) {
  foodHtml = foodHtml.replace(rightBannerOld, rightBannerNew);
}

// 3. UPDATE FILTER SIDEBAR
// Replace dark classes in filter sidebar
foodHtml = foodHtml.replace(
  '<div class="dark-panel rounded-3xl p-5 sticky top-24 h-[650px] overflow-y-auto food-scroll shadow-lg">',
  '<div class="filter-panel dark-panel rounded-3xl p-5 sticky top-24 h-[650px] overflow-y-auto food-scroll shadow-[0_3px_14px_rgba(10,61,42,0.07)] bg-white border border-[#DCE4DC]">'
);

foodHtml = foodHtml.replace(
  /class="text-xs text-slate-300 font-semibold mb-1 block"/g,
  'class="text-xs text-[#173D2B] font-semibold mb-1 block"'
);

foodHtml = foodHtml.replace(
  /class="w-full bg-slate-800\/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 outline-none"/g,
  'class="w-full bg-white border border-[#DCE4DC] rounded-lg px-3 py-2 text-sm text-[#26332B] focus:border-[#16834A] outline-none"'
);

foodHtml = foodHtml.replace(
  /class="w-1\/2 bg-slate-800\/50 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-100 focus:border-emerald-500 outline-none"/g,
  'class="w-1\/2 bg-white border border-[#DCE4DC] rounded-lg px-2 py-1 text-sm text-[#26332B] focus:border-[#16834A] outline-none"'
);

foodHtml = foodHtml.replace(
  /class="w-full bg-slate-800\/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"/g,
  'class="w-full bg-white border border-[#DCE4DC] rounded-lg px-3 py-2 text-sm text-[#26332B] focus:border-[#16834A] outline-none"'
);

foodHtml = foodHtml.replace(
  /class="flex items-center gap-2 text-sm text-slate-300"/g,
  'class="flex items-center gap-2 text-sm text-[#26332B]"'
);

foodHtml = foodHtml.replace(
  /<button id="clearFilters" class="w-full mt-3 py-2.5 rounded-xl bg-slate-800\/50 border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition shadow-sm">/,
  '<button id="clearFilters" class="w-full mt-3 py-2.5 rounded-xl bg-[#F7F8F5] border border-[#DCE4DC] text-sm font-semibold text-[#68756C] hover:bg-[#E8ECE8] hover:text-[#0A3D2A] hover:border-[#0A3D2A] transition shadow-sm">'
);

// 4. UPDATE PRODUCT DETAILS PANEL IN food.html
foodHtml = foodHtml.replace(
  '<div class="dark-panel p-0 overflow-hidden rounded-3xl flex flex-col h-[650px] shadow-lg" id="featuredAdContainer">',
  '<div class="product-details dark-panel p-0 overflow-hidden rounded-3xl flex flex-col h-[650px] shadow-[0_3px_14px_rgba(10,61,42,0.07)] bg-white border border-[#DCE4DC]" id="featuredAdContainer">'
);

foodHtml = foodHtml.replace(
  '<div id="featuredPlaceholder" class="h-full flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">',
  '<div id="featuredPlaceholder" class="h-full flex flex-col items-center justify-center py-20 text-[#68756C] text-center px-6">'
);

foodHtml = foodHtml.replace(
  '<h3 class="text-xl font-bold text-slate-100 mb-2">',
  '<h3 class="text-xl font-bold text-[#173D2B] mb-2">'
);

foodHtml = foodHtml.replace(
  '<div id="featuredContent" class="hidden flex flex-col h-full bg-[rgba(15,23,42,0.9)]">',
  '<div id="featuredContent" class="hidden flex flex-col h-full bg-white text-[#26332B]">'
);

foodHtml = foodHtml.replace(
  '<button class="absolute top-4 left-4 lg:hidden bg-slate-900/80 backdrop-blur-md border border-slate-700 text-orange-500 hover:text-orange-400 hover:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm z-10 flex items-center gap-2 transition"',
  '<button class="absolute top-4 left-4 lg:hidden bg-white/95 backdrop-blur-md border border-[#DCE4DC] text-[#E66B16] hover:bg-orange-50 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm z-10 flex items-center gap-2 transition"'
);

foodHtml = foodHtml.replace(
  '<div class="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 px-4 py-1 rounded-full text-xs font-semibold shadow-sm">',
  '<div class="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-[#DCE4DC] text-[#26332B] px-4 py-1 rounded-full text-xs font-semibold shadow-sm">'
);

foodHtml = foodHtml.replace(
  '<h2 id="fName" class="text-lg sm:text-xl font-extrabold text-slate-100 leading-tight">Product Name</h2>',
  '<h2 id="fName" class="text-lg sm:text-xl font-extrabold text-[#173D2B] leading-tight">Product Name</h2>'
);

foodHtml = foodHtml.replace(
  '<span id="fDetailsDistance" class="text-xs font-semibold text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 whitespace-nowrap">1.2 km</span>',
  '<span id="fDetailsDistance" class="text-xs font-semibold text-[#16834A] px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 whitespace-nowrap">1.2 km</span>'
);

foodHtml = foodHtml.replace(
  '<div id="fPrice" class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 whitespace-nowrap ml-4">',
  '<div id="fPrice" class="text-xl font-bold text-[#16834A] whitespace-nowrap ml-4">'
);

foodHtml = foodHtml.replace(
  '<div id="fVariety" class="font-medium text-emerald-400">Product Variety</div>',
  '<div id="fVariety" class="font-medium text-[#16834A]">Product Variety</div>'
);

foodHtml = foodHtml.replace(
  '<div id="fPostedDate" class="text-[11px] text-slate-400 font-medium whitespace-nowrap ml-4">',
  '<div id="fPostedDate" class="text-[11px] text-[#68756C] font-medium whitespace-nowrap ml-4">'
);

foodHtml = foodHtml.replace(
  '<h3 class="text-sm font-semibold text-slate-300 mb-2">Product Details</h3>',
  '<h3 class="text-sm font-semibold text-[#173D2B] mb-2">Product Details</h3>'
);

foodHtml = foodHtml.replace(
  '<p id="fDesc" class="text-[14px] leading-6 text-slate-400">Product details here...</p>',
  '<p id="fDesc" class="text-[14px] leading-6 text-[#68756C]">Product details here...</p>'
);

foodHtml = foodHtml.replace(
  '<div class="flex items-center gap-2 text-sm text-slate-300 font-medium">\n                      <i class="fas fa-store text-emerald-500 w-4 text-center"></i>\n                      <span id="fBrand">Brand Name</span>\n                    </div>\n                    <div class="flex items-start gap-2 text-sm text-slate-400 font-medium">',
  '<div class="flex items-center gap-2 text-sm text-[#26332B] font-medium">\n                      <i class="fas fa-store text-[#16834A] w-4 text-center"></i>\n                      <span id="fBrand">Brand Name</span>\n                    </div>\n                    <div class="flex items-start gap-2 text-sm text-[#68756C] font-medium">'
);

foodHtml = foodHtml.replace(
  '<div id="priceComparisonBox" class="mt-4 mb-4 p-3 rounded-xl bg-slate-800/20 border border-emerald-500/20 hidden">',
  '<div id="priceComparisonBox" class="mt-4 mb-4 p-3 rounded-xl bg-emerald-50/40 border border-emerald-200 hidden">'
);

foodHtml = foodHtml.replace(
  '<span class="text-sm font-bold text-emerald-400">\n                        📊 Price Comparison\n                      </span>',
  '<span class="text-sm font-bold text-[#0A3D2A]">\n                        📊 Price Comparison\n                      </span>'
);

foodHtml = foodHtml.replace(
  '<span class="text-xs text-slate-300" id="comparisonStandardType">',
  '<span class="text-xs text-[#68756C]" id="comparisonStandardType">'
);

// Buttons in details panel
foodHtml = foodHtml.replace(
  '<div class="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-800">',
  '<div class="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-[#DCE4DC]">'
);

foodHtml = foodHtml.replace(
  '<button id="fCallBtn" class="h-12 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all shadow-sm">',
  '<button id="fCallBtn" class="h-12 rounded-xl border border-[#DCE4DC] bg-[#F7F8F5] hover:bg-[#E8ECE8] text-[#26332B] font-semibold text-sm transition-all shadow-sm">'
);

foodHtml = foodHtml.replace(
  '<button id="fOrderBtn" class="h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-600 text-white font-bold text-sm shadow-[0_4px_12px_rgba(249,115,22,0.3)] transition-all"',
  '<button id="fOrderBtn" class="primary-button h-12 rounded-xl bg-[#0A3D2A] hover:bg-[#072F20] text-white font-bold text-sm shadow-[0_4px_12px_rgba(10,61,42,0.15)] transition-all"'
);

// 5. UPDATE FEATURED OFFERS TICKER
foodHtml = foodHtml.replace(
  '<h3 class="text-lg font-bold text-white mb-4 px-2">\n\t\t\t\t\tFeatured Offers\n\t\t</h3>',
  '<h3 class="text-lg font-bold text-[#173D2B] mb-4 px-2">\n\t\t\t\t\tFeatured Offers\n\t\t</h3>'
);

foodHtml = foodHtml.replace(
  '<div class="overflow-hidden relative w-full rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 py-2.5 px-2 shadow-sm" dir="ltr">',
  '<div class="overflow-hidden relative w-full rounded-2xl bg-white border border-[#DCE4DC] py-2.5 px-2 shadow-[0_3px_14px_rgba(10,61,42,0.07)]" dir="ltr">'
);

// 6. UPDATE PROMOTIONAL BANNER CONTAINER BORDER
foodHtml = foodHtml.replace(
  'border border-slate-700/60 bg-[#020b1c]',
  'border border-[#DCE4DC] bg-white'
);

// 7. ROTATION PROMO SCRIPTS IN food.html
foodHtml = foodHtml.replace(
  /<h3 class="text-base font-bold leading-tight text-white font-serif mt-0.5">\$\{item\.title\}<\/h3>\s*<p class="text-\[10px\] text-slate-400 font-medium leading-tight line-clamp-2">\$\{item\.desc\}<\/p>/g,
  '<h3 class="text-base font-bold leading-tight text-[#173D2B] font-serif mt-0.5">${item.title}</h3>\n                    <p class="text-[10px] text-[#68756C] font-medium leading-tight line-clamp-2">${item.desc}</p>'
);

// SAVE food.html
fs.writeFileSync(foodHtmlPath, foodHtml, 'utf8');
console.log('Successfully updated pages/food.html');

// NOW UPDATE js/food.js
// 1. renderStars - update empty stars and text
foodJs = foodJs.replace(
  `starsHtml += '<i class="far fa-star text-slate-600"></i>';`,
  `starsHtml += '<i class="far fa-star text-slate-300"></i>';`
);

foodJs = foodJs.replace(
  `<span class="text-[9px] text-slate-400 font-bold">\${avg} (\${count})</span>`,
  `<span class="text-[9px] text-[#68756C] font-bold">\${avg} (\${count})</span>`
);

// 2. renderFoodList - card rendering
const oldCardBlock = `  foodListingsEl.innerHTML = filtered.map(f => {
    const isSelected = String(f.id) === String(selectedFoodId);
    const activeClass = isSelected ? 'border-[#f97316] shadow-[0_10px_35px_rgba(249,115,22,0.18)] bg-slate-800/90 ring-1 ring-[#f97316]' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 bg-slate-900/60 shadow-sm';

    return \`
      <article data-id="\${f.id}" class="food-item rounded-2xl p-3 sm:p-4 cursor-pointer transition-colors duration-300 flex flex-row gap-3 border backdrop-blur-md \${activeClass}">
        <div class="flex flex-col items-center shrink-0">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-800 shadow-inner">
            <img src="\${f.image}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150';" alt="\${f.name}" class="w-full h-full object-cover transition duration-300 hover:scale-105 food-img-filter" />
          </div>
          \${renderStars(f.id)}
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-bold text-sm sm:text-base text-slate-100 leading-tight">\${f.name}</h3>
              <span class="text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 whitespace-nowrap ml-2">Rs. \${f.price}</span>
            </div>
            <p class="text-[0.7rem] sm:text-xs text-slate-400 mb-1 font-medium">\${f.variety}</p>
            \${f.description ? \`<p class="text-[0.65rem] sm:text-[0.7rem] text-slate-500 mb-2 line-clamp-2">\${f.description}</p>\` : ''}
          </div>
          <div class="flex justify-between items-end">
            <p class="text-[0.7rem] text-slate-400 font-medium">📍 \${f.fullLocation}</p>
          </div>
        </div>
      </article>
    \`;
  }).join('');`;

const newCardBlock = `  foodListingsEl.innerHTML = filtered.map(f => {
    const isSelected = String(f.id) === String(selectedFoodId);
    const activeClass = isSelected 
      ? 'border-[#0A3D2A] ring-2 ring-[#0A3D2A] bg-emerald-50/40 shadow-md' 
      : 'border-[#DCE4DC] hover:border-[#16834A] hover:shadow-md bg-white shadow-[0_3px_14px_rgba(10,61,42,0.07)]';

    return \`
      <article data-id="\${f.id}" class="food-item product-card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 flex flex-row gap-3 border \${activeClass}">
        <div class="flex flex-col items-center shrink-0">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-50 border border-[#DCE4DC] shadow-inner">
            <img src="\${f.image}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150';" alt="\${f.name}" class="w-full h-full object-cover transition duration-300 hover:scale-105 food-img-filter" />
          </div>
          \${renderStars(f.id)}
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-bold text-sm sm:text-base text-[#173D2B] leading-tight">\${f.name}</h3>
              <span class="text-xs sm:text-sm font-extrabold text-[#16834A] whitespace-nowrap ml-2">Rs. \${f.price}</span>
            </div>
            <p class="text-[0.7rem] sm:text-xs text-[#68756C] mb-1 font-medium">\${f.variety}</p>
            \${f.description ? \`<p class="text-[0.65rem] sm:text-[0.7rem] text-[#68756C] mb-2 line-clamp-2">\${f.description}</p>\` : ''}
          </div>
          <div class="flex justify-between items-end">
            <p class="text-[0.7rem] text-[#68756C] font-medium">📍 \${f.fullLocation}</p>
          </div>
        </div>
      </article>
    \`;
  }).join('');`;

if (foodJs.includes('foodListingsEl.innerHTML = filtered.map')) {
  foodJs = foodJs.replace(oldCardBlock, newCardBlock);
}

// 3. selectFoodItem - update active classes on click & details text colors
foodJs = foodJs.replace(
  `if (fPrice) fPrice.innerHTML = \`Rs. \${item.price} \${item.originalPrice ? \`<span class="text-sm line-through text-slate-500 ml-1">Rs. \${item.originalPrice}</span>\` : ''}\`;`,
  `if (fPrice) fPrice.innerHTML = \`Rs. \${item.price} \${item.originalPrice ? \`<span class="text-sm line-through text-[#68756C] ml-1">Rs. \${item.originalPrice}</span>\` : ''}\`;`
);

foodJs = foodJs.replace(
  `fRatingDisplay.innerHTML = \`\${starsHtml} <span class="text-slate-300 font-bold ml-1">\${avg} (\${count} reviews)</span>\`;`,
  `fRatingDisplay.innerHTML = \`\${starsHtml} <span class="text-[#68756C] font-bold ml-1">\${avg} (\${count} reviews)</span>\`;`
);

// 4. Comparison box colors in selectFoodItem
const oldComparisonBlock = `          // Lowest Price Section
          html += \`
            <div class="mb-3">
              <div class="text-[11px] font-bold text-yellow-400 mb-1">🏆 Lowest Price</div>
              <div class="flex justify-between items-center bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
                <span class="font-bold text-slate-100">\${lowest.brand || lowest.variety || 'Unknown'}</span>
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-yellow-400">Rs. \${lowest.price}</span>
                  <span class="text-[10px] text-slate-400">(\${lowest.distanceKm.toFixed(1)} km)</span>
                </div>
              </div>
            </div>
          \`;

          // Nearby Options Section
          html += \`
            <div class="mb-3">
              <div class="text-[11px] font-bold text-emerald-400 mb-1">📍 Nearby Options</div>
              <div class="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
          \`;
          
          top5.forEach(comp => {
            const isCurrent = String(comp.id) === String(item.id);
            html += \`
              <div class="flex justify-between items-center py-1 border-b border-slate-700/30 \${isCurrent ? 'bg-emerald-500/10 px-1 rounded' : ''}">
                <span class="text-slate-300 font-medium">\${comp.brand || comp.variety || 'Unknown'} \${isCurrent ? '<span class="text-[9px] text-emerald-400 font-bold">(Current)</span>' : ''}</span>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-100">Rs. \${comp.price}</span>
                  <span class="text-[10px] text-slate-400">(\${comp.distanceKm.toFixed(1)} km)</span>
                </div>
              </div>
            \`;
          });

          html += \`
              </div>
            </div>
          \`;

          // Savings Section
          if (saving > 0) {
            html += \`
              <div class="mt-2 bg-emerald-500/15 border border-emerald-500/30 p-2 rounded-lg flex items-center justify-between text-emerald-400 font-extrabold text-[13px]">
                <span>💰 You Save Up To</span>
                <span>Rs. \${saving}</span>
              </div>
            \`;
          } else {
            html += \`
              <div class="mt-2 bg-slate-700/30 border border-slate-700/50 p-2 rounded-lg flex items-center justify-between text-slate-300 font-bold text-[11px]">
                <span>✨ You are viewing the lowest price listing!</span>
              </div>
            \`;
          }`;

const newComparisonBlock = `          // Lowest Price Section
          html += \`
            <div class="mb-3">
              <div class="text-[11px] font-bold text-[#E66B16] mb-1">🏆 Lowest Price</div>
              <div class="flex justify-between items-center bg-[#FFF4E8] border border-[#FCE2CE] p-2 rounded-lg">
                <span class="font-bold text-[#173D2B]">\${lowest.brand || lowest.variety || 'Unknown'}</span>
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-[#16834A]">Rs. \${lowest.price}</span>
                  <span class="text-[10px] text-[#68756C]">(\${lowest.distanceKm.toFixed(1)} km)</span>
                </div>
              </div>
            </div>
          \`;

          // Nearby Options Section
          html += \`
            <div class="mb-3">
              <div class="text-[11px] font-bold text-[#0A3D2A] mb-1">📍 Nearby Options</div>
              <div class="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
          \`;
          
          top5.forEach(comp => {
            const isCurrent = String(comp.id) === String(item.id);
            html += \`
              <div class="flex justify-between items-center py-1 border-b border-[#DCE4DC] \${isCurrent ? 'bg-emerald-50/70 px-1 rounded' : ''}">
                <span class="text-[#26332B] font-medium">\${comp.brand || comp.variety || 'Unknown'} \${isCurrent ? '<span class="text-[9px] text-[#16834A] font-bold">(Current)</span>' : ''}</span>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-[#16834A]">Rs. \${comp.price}</span>
                  <span class="text-[10px] text-[#68756C]">(\${comp.distanceKm.toFixed(1)} km)</span>
                </div>
              </div>
            \`;
          });

          html += \`
              </div>
            </div>
          \`;

          // Savings Section
          if (saving > 0) {
            html += \`
              <div class="mt-2 bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex items-center justify-between text-[#16834A] font-extrabold text-[13px]">
                <span>💰 You Save Up To</span>
                <span>Rs. \${saving}</span>
              </div>
            \`;
          } else {
            html += \`
              <div class="mt-2 bg-emerald-50/50 border border-emerald-200/60 p-2 rounded-lg flex items-center justify-between text-[#173D2B] font-bold text-[11px]">
                <span>✨ You are viewing the lowest price listing!</span>
              </div>
            \`;
          }`;

if (foodJs.includes('🏆 Lowest Price')) {
  foodJs = foodJs.replace(oldComparisonBlock, newComparisonBlock);
}

// 5. Update category tag listener to set active class
const oldCatListener = `    // Category Tag Listeners
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
    });`;

const newCatListener = `    // Category Tag Listeners
    document.querySelectorAll('.food-category').forEach(catBtn => {
      catBtn.addEventListener('click', () => {
        const searchVal = catBtn.getAttribute('data-search') || catBtn.querySelector('span').textContent.trim();
        document.querySelectorAll('.food-category').forEach(b => b.classList.remove('active'));
        catBtn.classList.add('active');

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
    });`;

if (foodJs.includes('// Category Tag Listeners')) {
  foodJs = foodJs.replace(oldCatListener, newCatListener);
}

// 6. Update selectFoodItem to refresh card border & ring on click
const oldSelectFoodItemStart = `function selectFoodItem(id, preventScroll = false) {
  selectedFoodId = id;
  const item = foodDeals.find(f => String(f.id) === String(id));`;

const newSelectFoodItemStart = `function selectFoodItem(id, preventScroll = false) {
  selectedFoodId = id;
  
  // Highlight active listing card immediately
  document.querySelectorAll('.food-item').forEach(el => {
    if (el.getAttribute('data-id') === String(id)) {
      el.className = 'food-item product-card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 flex flex-row gap-3 border border-[#0A3D2A] ring-2 ring-[#0A3D2A] bg-emerald-50/40 shadow-md';
    } else {
      el.className = 'food-item product-card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 flex flex-row gap-3 border border-[#DCE4DC] hover:border-[#16834A] hover:shadow-md bg-white shadow-[0_3px_14px_rgba(10,61,42,0.07)]';
    }
  });

  const item = foodDeals.find(f => String(f.id) === String(id));`;

if (foodJs.includes('function selectFoodItem(id, preventScroll = false) {')) {
  foodJs = foodJs.replace(oldSelectFoodItemStart, newSelectFoodItemStart);
}

// 7. Update clear filters button to remove active class from category pills
const oldClearFilters = `  const clearFiltersBtn = document.getElementById('clearFilters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {`;

if (foodJs.includes('clearFiltersBtn.addEventListener')) {
  foodJs = foodJs.replace(
    /clearFiltersBtn\.addEventListener\('click',\s*\(\)\s*=>\s*\{/,
    `clearFiltersBtn.addEventListener('click', () => {\n      document.querySelectorAll('.food-category').forEach(b => b.classList.remove('active'));`
  );
}

// SAVE js/food.js
fs.writeFileSync(foodJsPath, foodJs, 'utf8');
console.log('Successfully updated js/food.js');
