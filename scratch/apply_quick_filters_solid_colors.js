const fs = require('fs');
const path = require('path');

const foodHtmlPath = path.join(__dirname, '..', 'pages', 'food.html');
const foodJsPath = path.join(__dirname, '..', 'js', 'food.js');

let foodHtml = fs.readFileSync(foodHtmlPath, 'utf8');
let foodJs = fs.readFileSync(foodJsPath, 'utf8');

// Normalize line endings
const normalize = str => str.replace(/\r\n/g, '\n');
foodHtml = normalize(foodHtml);
foodJs = normalize(foodJs);

// 1. UPDATE CSS IN food.html
const oldCssBlock = `.food-page .quickFilterBtn {
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
}`;

const newCssBlock = `/* Quick Filter Buttons - 4 Different Standard Solid Colors */
.food-page .quickFilterBtn {
  height: 42px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border: 1px solid transparent;
  color: #FFFFFF !important;
  cursor: pointer;
  white-space: nowrap;
}

.food-page .quickFilterBtn span {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

/* 1. Hot Deals - Standard Solid Red */
.food-page .qf-hot-deals,
.food-page #hotDealsBtn {
  background-color: #DC2626 !important;
  border-color: #B91C1C !important;
  color: #FFFFFF !important;
}
.food-page .qf-hot-deals:hover,
.food-page #hotDealsBtn:hover {
  background-color: #B91C1C !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
}

/* 2. Free Delivery - Standard Solid Green */
.food-page .qf-free-delivery,
.food-page #freeDeliveryBtn {
  background-color: #16834A !important;
  border-color: #15803D !important;
  color: #FFFFFF !important;
}
.food-page .qf-free-delivery:hover,
.food-page #freeDeliveryBtn:hover {
  background-color: #15803D !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 131, 74, 0.35);
}

/* 3. Top Rated - Standard Solid Amber / Gold */
.food-page .qf-top-rated,
.food-page #topRatedBtn {
  background-color: #D97706 !important;
  border-color: #B45309 !important;
  color: #FFFFFF !important;
}
.food-page .qf-top-rated:hover,
.food-page #topRatedBtn:hover {
  background-color: #B45309 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
}

/* 4. Open Now - Standard Solid Blue */
.food-page .qf-open-now,
.food-page #openNowBtn {
  background-color: #2563EB !important;
  border-color: #1D4ED8 !important;
  color: #FFFFFF !important;
}
.food-page .qf-open-now:hover,
.food-page #openNowBtn:hover {
  background-color: #1D4ED8 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

/* Selected / Active State */
.food-page .quickFilterBtn.active-filter {
  outline: 3px solid #0A3D2A !important;
  outline-offset: 2px !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3) !important;
  transform: scale(1.02);
  filter: brightness(0.92);
}`;

if (foodHtml.includes(oldCssBlock)) {
  foodHtml = foodHtml.replace(oldCssBlock, newCssBlock);
  console.log('CSS block replaced successfully in food.html.');
} else {
  console.error('Could not find oldCssBlock in food.html');
}

// 2. UPDATE HTML BUTTONS IN food.html
const oldHtmlButtons = `<div class="grid grid-cols-2 gap-2 mb-5">

  <button class="quickFilterBtn" id="hotDealsBtn">🔥 <span class="lang-en">Hot Deals</span><span class="lang-ur">زبردست ڈیلز</span></button>
  <button class="quickFilterBtn">🚚 <span class="lang-en">Free Delivery</span><span class="lang-ur">مفت ڈیلیوری</span></button>
  <button class="quickFilterBtn">⭐ <span class="lang-en">Top Rated</span><span class="lang-ur">سب سے زیادہ پسندیدہ</span></button>
  <button class="quickFilterBtn">🕒 <span class="lang-en">Open Now</span><span class="lang-ur">اب کھولیں</span></button>

</div>`;

const newHtmlButtons = `<div class="grid grid-cols-2 gap-2 mb-5">

  <button class="quickFilterBtn qf-hot-deals" id="hotDealsBtn">🔥 <span class="lang-en">Hot Deals</span><span class="lang-ur">زبردست ڈیلز</span></button>
  <button class="quickFilterBtn qf-free-delivery" id="freeDeliveryBtn">🚚 <span class="lang-en">Free Delivery</span><span class="lang-ur">مفت ڈیلیوری</span></button>
  <button class="quickFilterBtn qf-top-rated" id="topRatedBtn">⭐ <span class="lang-en">Top Rated</span><span class="lang-ur">سب سے زیادہ پسندیدہ</span></button>
  <button class="quickFilterBtn qf-open-now" id="openNowBtn">🕒 <span class="lang-en">Open Now</span><span class="lang-ur">اب کھولیں</span></button>

</div>`;

if (foodHtml.includes(oldHtmlButtons)) {
  foodHtml = foodHtml.replace(oldHtmlButtons, newHtmlButtons);
  console.log('HTML buttons replaced successfully in food.html.');
} else {
  console.error('Could not find oldHtmlButtons in food.html');
}

fs.writeFileSync(foodHtmlPath, foodHtml, 'utf8');

// 3. UPDATE js/food.js to toggle active-filter cleanly
const oldJsListener = `  document.querySelectorAll('.quickFilterBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active-filter');
      btn.classList.toggle('border-emerald-500');
      btn.classList.toggle('text-emerald-400');
      renderFoodList();
    });
  });`;

const newJsListener = `  document.querySelectorAll('.quickFilterBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active-filter');
      renderFoodList();
    });
  });`;

if (foodJs.includes(oldJsListener)) {
  foodJs = foodJs.replace(oldJsListener, newJsListener);
  console.log('JS click listener updated successfully in food.js.');
} else {
  console.log('Old JS listener not found directly, checking regex...');
  foodJs = foodJs.replace(
    /document\.querySelectorAll\('\.quickFilterBtn'\)\.forEach\(btn => \{\s*btn\.addEventListener\('click',\s*\(\) => \{\s*btn\.classList\.toggle\('active-filter'\);[\s\S]*?renderFoodList\(\);\s*\}\);\s*\}\);/,
    newJsListener
  );
}

fs.writeFileSync(foodJsPath, foodJs, 'utf8');
console.log('All files updated successfully.');
