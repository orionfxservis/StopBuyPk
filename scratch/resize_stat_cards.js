const fs = require('fs');
const path = require('path');

const foodHtmlPath = path.join(__dirname, '..', 'pages', 'food.html');
let content = fs.readFileSync(foodHtmlPath, 'utf8');

// Target the .food-page .miniStatCard CSS block in food.html
const oldCssBlock = `.food-page .miniStatCard {
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
}`;

const newCssBlock = `.food-page .miniStatCard {
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

// Normalize line endings for replacement
const normalize = str => str.replace(/\r\n/g, '\n');
const normalizedContent = normalize(content);
const normalizedOldBlock = normalize(oldCssBlock);
const normalizedNewBlock = normalize(newCssBlock);

if (normalizedContent.includes(normalizedOldBlock)) {
  content = normalizedContent.replace(normalizedOldBlock, normalizedNewBlock);
  console.log('CSS block replaced successfully.');
} else {
  console.error('Could not find old CSS block for miniStatCard');
}

// Adjust container margin from mt-6 mb-8 to mt-4 mb-6
content = content.replace(
  'grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 mb-8',
  'grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-6'
);

fs.writeFileSync(foodHtmlPath, content, 'utf8');
console.log('Successfully updated pages/food.html');
