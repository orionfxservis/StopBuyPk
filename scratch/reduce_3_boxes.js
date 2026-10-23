const fs = require('fs');

const absPath = 'd:\\Freelance\\Web Designing\\Price Comparison\\Sample 5\\pages\\food.html';
let content = fs.readFileSync(absPath, 'utf8');

// 1. Replace 3-box row
const rowStartTag = '<!-- Banners & Search Panel Row (3-Column Layout) -->';
const rowEndTag = '<!-- Trending Searches -->';

const startIdx = content.indexOf(rowStartTag);
const endIdx = content.indexOf(rowEndTag);

if (startIdx === -1 || endIdx === -1) {
    console.error('Row markers not found!');
    process.exit(1);
}

const newRow = `<!-- Banners & Search Panel Row (3-Column Layout) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch mb-6">
          
          <!-- Left Banner (Grocery/Deals) (Reduced ~30% height: 195px) -->
          <div class="hidden lg:flex lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex-col justify-between text-white relative overflow-hidden shadow-lg h-[195px] shrink-0 text-left">
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
          </div>

          <!-- Middle Column: Search Panel (Reduced ~30% height: 195px) -->
          <div class="col-span-12 lg:col-span-6 flex flex-col justify-between bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-lg relative overflow-hidden h-[195px]">
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
          </div>

          <!-- Right Banner (Restaurant/Food) (Reduced ~30% height: 195px) -->
          <div class="hidden lg:flex lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex-col justify-between text-white relative overflow-hidden shadow-lg h-[195px] shrink-0 text-left">
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
          </div>

      </div>

	`;

content = content.slice(0, startIdx) + newRow.replace(/\r?\n/g, '\r\n') + content.slice(endIdx);

// 2. Also update rotateLeftPromo & rotateRightPromo innerHTML in script
content = content.replace(
    /bannerEl\.innerHTML = `[\s\S]*?<div class="text-3xl pt-2">[\s\S]*?<\/div>[\s\S]*?`;/g,
    `bannerEl.innerHTML = \`
                    <h3 class="text-base font-bold leading-tight text-white font-serif mt-0.5">\${item.title}</h3>
                    <p class="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2">\${item.desc}</p>
                \`;`
);

fs.writeFileSync(absPath, content, 'utf8');
console.log('Successfully updated 3 boxes in food.html');
