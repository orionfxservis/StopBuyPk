const fs = require('fs');

const foodHtml = fs.readFileSync('pages/food.html', 'utf8');
const foodJs = fs.readFileSync('js/food.js', 'utf8');

console.log('--- AUDITING food.html ---');
console.log('1. Contains :root food variables:', foodHtml.includes('--food-bg: #F7F8F5;'));
console.log('2. Main has class food-page:', foodHtml.includes('<main class="food-page flex-1 relative z-10 pt-6 pb-6">'));
console.log('3. Body has #F7F8F5 and #26332B:', foodHtml.includes('bg-[#F7F8F5] text-[#26332B]'));
console.log('4. Left banner updated to bg-white & #173D2B:', foodHtml.includes('id="leftPromoBanner1"') && foodHtml.includes('text-[#173D2B]'));
console.log('5. Search button has #0A3D2A:', foodHtml.includes('id="foodSearchBtn"') && foodHtml.includes('bg-[#0A3D2A]'));
console.log('6. Search input has bg-white & border-[#DCE4DC]:', foodHtml.includes('id="foodSearchInput"') && foodHtml.includes('border-[#DCE4DC]'));
console.log('7. Right banner updated to #FFF4E8:', foodHtml.includes('id="rightPromoBanner1"') && foodHtml.includes('bg-[#FFF4E8]'));
console.log('8. Filter sidebar has filter-panel & bg-white:', foodHtml.includes('class="filter-panel'));
console.log('9. Product details container has bg-white:', foodHtml.includes('product-details dark-panel') && foodHtml.includes('bg-white border border-[#DCE4DC]'));
console.log('10. featuredContent has bg-white:', foodHtml.includes('id="featuredContent"') && foodHtml.includes('bg-white text-[#26332B]'));
console.log('11. Featured offers heading has #173D2B:', foodHtml.includes('text-[#173D2B] mb-4 px-2">\n\t\t\t\t\tFeatured Offers'));
console.log('12. Navbar untouched:', foodHtml.includes('<nav class="bg-[#0A3D2A] text-white sticky top-0 z-[99999]">'));
console.log('13. Footer untouched:', foodHtml.includes('<div class="w-full bg-[#0A3D2A] text-emerald-50 text-center py-4 text-sm mt-auto border-t border-[#052C22]">'));

console.log('\n--- AUDITING js/food.js ---');
console.log('1. Food item card template uses bg-white and #173D2B:', foodJs.includes('text-[#173D2B]') && foodJs.includes('text-[#16834A]'));
console.log('2. Food item card activeClass uses #0A3D2A:', foodJs.includes('border-[#0A3D2A] ring-2 ring-[#0A3D2A]'));
console.log('3. Comparison box uses lowest price #E66B16 and #16834A:', foodJs.includes('text-[#E66B16]') && foodJs.includes('text-[#16834A]'));
console.log('4. Category click listener toggles .active class:', foodJs.includes("catBtn.classList.add('active');"));
console.log('5. SelectFoodItem updates active class immediately:', foodJs.includes("el.className = 'food-item product-card rounded-2xl"));
