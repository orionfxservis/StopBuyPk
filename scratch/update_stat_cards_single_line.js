const fs = require('fs');
const path = require('path');

const foodHtmlPath = path.join(__dirname, '..', 'pages', 'food.html');
let content = fs.readFileSync(foodHtmlPath, 'utf8');

// 1. Update the CSS for miniStatCard in food.html to single-line layout and standard color fills
const oldCssBlock = `.food-page .miniStatCard {
  background: var(--food-surface) !important;
  border: 1px solid var(--food-border) !important;
  border-radius: 14px;
  box-shadow: var(--food-shadow);
  padding: 8px 10px !important;
  min-height: 68px;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  transition: all 0.25s ease;
}

.food-page .miniStatCard:hover {
  transform: translateY(-2px);
  border-color: var(--food-brand) !important;
  box-shadow: 0 6px 16px rgba(10, 61, 42, 0.1);
}

.food-page .miniStatCard span {
  font-size: 16px !important;
  line-height: 1 !important;
  margin-bottom: 2px !important;
}

.food-page .miniStatCard .stat-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}

.food-page .miniStatCard h4 {
  color: var(--food-heading) !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  line-height: 1.1 !important;
  margin: 0 !important;
}

.food-page .miniStatCard p {
  color: var(--food-muted) !important;
  font-size: 0.7rem !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  margin: 0 !important;
}`;

const newCssBlock = `/* Single Line Stat Cards with Standard Color Fills */
.food-page .miniStatCard {
  border-radius: 14px;
  padding: 10px 14px !important;
  min-height: 44px;
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  white-space: nowrap !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
}

.food-page .miniStatCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.food-page .miniStatCard .stat-icon,
.food-page .miniStatCard > span {
  font-size: 18px !important;
  line-height: 1 !important;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  margin: 0 !important;
}

.food-page .miniStatCard .stat-text {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 5px !important;
  white-space: nowrap !important;
}

.food-page .miniStatCard h4 {
  font-size: 1.05rem !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  margin: 0 !important;
  white-space: nowrap !important;
}

.food-page .miniStatCard p {
  font-size: 0.8rem !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  margin: 0 !important;
  white-space: nowrap !important;
}

/* Card 1: Brands - Standard Emerald Green Fill */
.food-page .stat-card-brands,
.food-page #brandStatCard {
  background: linear-gradient(135deg, #EAF7EE 0%, #D6F2DF 100%) !important;
  border: 1px solid #A2DDB8 !important;
}
.food-page .stat-card-brands h4,
.food-page #brandStatCard h4 {
  color: #0A3D2A !important;
}
.food-page .stat-card-brands p,
.food-page #brandStatCard p {
  color: #175336 !important;
}
.food-page .stat-card-brands:hover,
.food-page #brandStatCard:hover {
  border-color: #0A3D2A !important;
}

/* Card 2: Live Deals - Standard Amber / Orange Fill */
.food-page .stat-card-deals,
.food-page #liveDealsStatCard {
  background: linear-gradient(135deg, #FFF3E6 0%, #FFE6CC 100%) !important;
  border: 1px solid #FFC999 !important;
}
.food-page .stat-card-deals h4,
.food-page #liveDealsStatCard h4 {
  color: #C24E05 !important;
}
.food-page .stat-card-deals p,
.food-page #liveDealsStatCard p {
  color: #8C3700 !important;
}
.food-page .stat-card-deals:hover,
.food-page #liveDealsStatCard:hover {
  border-color: #E66B16 !important;
}

/* Card 3: Areas - Standard Sky Blue Fill */
.food-page .stat-card-areas,
.food-page #areasStatCard {
  background: linear-gradient(135deg, #EBF5FF 0%, #D4EAFF 100%) !important;
  border: 1px solid #B3DAFE !important;
}
.food-page .stat-card-areas h4,
.food-page #areasStatCard h4 {
  color: #026597 !important;
}
.food-page .stat-card-areas p,
.food-page #areasStatCard p {
  color: #074B70 !important;
}
.food-page .stat-card-areas:hover,
.food-page #areasStatCard:hover {
  border-color: #0284C7 !important;
}

/* Card 4: User Rating - Standard Violet / Purple Fill */
.food-page .stat-card-rating,
.food-page #ratingStatCard {
  background: linear-gradient(135deg, #F8EEFD 0%, #EED7FB 100%) !important;
  border: 1px solid #DCBEF8 !important;
}
.food-page .stat-card-rating h4,
.food-page #ratingStatCard h4 {
  color: #6B21A8 !important;
}
.food-page .stat-card-rating p,
.food-page #ratingStatCard p {
  color: #4C137F !important;
}
.food-page .stat-card-rating:hover,
.food-page #ratingStatCard:hover {
  border-color: #7E22CE !important;
}`;

// Normalize line endings for replacement
const normalize = str => str.replace(/\r\n/g, '\n');
let normalizedContent = normalize(content);
const normalizedOldBlock = normalize(oldCssBlock);
const normalizedNewBlock = normalize(newCssBlock);

if (normalizedContent.includes(normalizedOldBlock)) {
  normalizedContent = normalizedContent.replace(normalizedOldBlock, normalizedNewBlock);
  console.log('CSS block replaced successfully.');
} else {
  console.error('Could not find old CSS block for miniStatCard');
}

// 2. Update the HTML for the four cards
const oldHtmlSection = `<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-6">

  <div class="miniStatCard bg-gradient-to-br from-emerald-50 to-white cursor-pointer hover:scale-105 transition-transform" id="brandStatCard">
    <span>🍔</span>
    <div class="stat-text">
      <h4><span class="lang-en" id="brandCountEn">0</span><span class="lang-ur" id="brandCountUr">0</span></h4>
      <p><span class="lang-en">Brands</span><span class="lang-ur">برانڈز</span></p>
    </div>
  </div>

  <div class="miniStatCard bg-gradient-to-br from-amber-50 to-white cursor-pointer hover:scale-105 transition-transform" id="liveDealsStatCard">
    <span>🔥</span>
    <div class="stat-text">
      <h4><span class="lang-en" id="liveDealsCountEn">0</span><span class="lang-ur" id="liveDealsCountUr">0</span></h4>
      <p><span class="lang-en">Live Deals</span><span class="lang-ur">لائیو ڈیلز</span></p>
    </div>
  </div>

  <div class="miniStatCard bg-gradient-to-br from-sky-50 to-white">
    <span>📍</span>
    <div class="stat-text">
      <h4><span class="lang-en">25+</span><span class="lang-ur">25+</span></h4>
      <p><span class="lang-en">Areas</span><span class="lang-ur">علاقے</span></p>
    </div>
  </div>

  <div class="miniStatCard bg-gradient-to-br from-purple-50 to-white">
    <span>⭐</span>
    <div class="stat-text">
      <h4><span class="lang-en">4.8</span><span class="lang-ur">4.8</span></h4>
      <p><span class="lang-en">User Rating</span><span class="lang-ur">صارف کی درجہ بندی</span></p>
    </div>
  </div>

</div>`;

const newHtmlSection = `<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-6">

  <!-- Brands (Emerald Fill) -->
  <div class="miniStatCard stat-card-brands cursor-pointer hover:scale-[1.02] transition-transform" id="brandStatCard">
    <span class="stat-icon">🍔</span>
    <div class="stat-text">
      <h4><span class="lang-en" id="brandCountEn">0</span><span class="lang-ur" id="brandCountUr">0</span></h4>
      <p><span class="lang-en">Brands</span><span class="lang-ur">برانڈز</span></p>
    </div>
  </div>

  <!-- Live Deals (Amber/Orange Fill) -->
  <div class="miniStatCard stat-card-deals cursor-pointer hover:scale-[1.02] transition-transform" id="liveDealsStatCard">
    <span class="stat-icon">🔥</span>
    <div class="stat-text">
      <h4><span class="lang-en" id="liveDealsCountEn">0</span><span class="lang-ur" id="liveDealsCountUr">0</span></h4>
      <p><span class="lang-en">Live Deals</span><span class="lang-ur">لائیو ڈیلز</span></p>
    </div>
  </div>

  <!-- Areas (Sky Blue Fill) -->
  <div class="miniStatCard stat-card-areas" id="areasStatCard">
    <span class="stat-icon">📍</span>
    <div class="stat-text">
      <h4><span class="lang-en">25+</span><span class="lang-ur">25+</span></h4>
      <p><span class="lang-en">Areas</span><span class="lang-ur">علاقے</span></p>
    </div>
  </div>

  <!-- User Rating (Purple Fill) -->
  <div class="miniStatCard stat-card-rating" id="ratingStatCard">
    <span class="stat-icon">⭐</span>
    <div class="stat-text">
      <h4><span class="lang-en">4.8</span><span class="lang-ur">4.8</span></h4>
      <p><span class="lang-en">User Rating</span><span class="lang-ur">صارف کی درجہ بندی</span></p>
    </div>
  </div>

</div>`;

const normalizedOldHtml = normalize(oldHtmlSection);
const normalizedNewHtml = normalize(newHtmlSection);

if (normalizedContent.includes(normalizedOldHtml)) {
  normalizedContent = normalizedContent.replace(normalizedOldHtml, normalizedNewHtml);
  console.log('HTML section replaced successfully.');
} else {
  console.error('Could not find old HTML section');
}

fs.writeFileSync(foodHtmlPath, normalizedContent, 'utf8');
console.log('Successfully updated pages/food.html for single-line filled cards.');
