const fs = require('fs');
const path = require('path');

const foodHtmlPath = path.join(__dirname, '..', 'pages', 'food.html');
let content = fs.readFileSync(foodHtmlPath, 'utf8');

// Replace the entire 3-column banner row from line 442 to 522
const bannersRowStart = content.indexOf('<!-- Banners & Search Panel Row (3-Column Layout) -->');
const trendingSearchStart = content.indexOf('<!-- Trending Searches -->');

if (bannersRowStart !== -1 && trendingSearchStart !== -1) {
  const currentBannersRow = content.substring(bannersRowStart, trendingSearchStart);
  
  const updatedBannersRow = `<!-- Banners & Search Panel Row (3-Column Layout) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch mb-6">
          
          <!-- Left Banner (Grocery/Deals) (Reduced ~30% height: 195px) -->
          <div class="hidden lg:flex lg:col-span-3 bg-white border border-[#DCE4DC] rounded-3xl p-4 flex-col justify-between text-[#26332B] relative overflow-hidden shadow-[0_3px_14px_rgba(10,61,42,0.07)] h-[195px] shrink-0 text-left">
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
          </div>

          <!-- Middle Column: Search Panel (Reduced ~30% height: 195px) -->
          <div class="col-span-12 lg:col-span-6 flex flex-col justify-between bg-white border border-[#DCE4DC] p-4 sm:p-5 rounded-3xl shadow-[0_3px_14px_rgba(10,61,42,0.07)] relative overflow-hidden h-[195px]">
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
          </div>

          <!-- Right Banner (Restaurant/Food) (Reduced ~30% height: 195px) -->
          <div class="hidden lg:flex lg:col-span-3 bg-[#FFF4E8] border border-[#FCE2CE] rounded-3xl p-4 flex-col justify-between text-[#26332B] relative overflow-hidden shadow-[0_3px_14px_rgba(10,61,42,0.07)] h-[195px] shrink-0 text-left">
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
          </div>

      </div>\n\n\t`;

  content = content.replace(currentBannersRow, updatedBannersRow);
  console.log('Successfully replaced 3-column banner row');
} else {
  console.error('Could not locate banners row bounds');
}

// Replace Featured Offers heading from text-white to text-[#173D2B]
content = content.replace(
  /<h3 class="text-lg font-bold text-white mb-4 px-2">\s*Featured Offers\s*<\/h3>/,
  '<h3 class="text-lg font-bold text-[#173D2B] mb-4 px-2">\n\t\t\t\t\tFeatured Offers\n\t\t</h3>'
);

fs.writeFileSync(foodHtmlPath, content, 'utf8');
console.log('Saved updated food.html');
