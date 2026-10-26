const fs = require('fs');
const path = require('path');

const foodHtmlPath = path.join(__dirname, '..', 'pages', 'food.html');
let content = fs.readFileSync(foodHtmlPath, 'utf8');

// Replace the legacy block between line 222 and line 407
const legacyStartStr = `html,
body{
  min-height:100%;
  overflow-x:hidden;
}

body{
  position:relative;
  background-color: #F4F9F2;
  color: #1F2937;
  min-height: 100vh;
}`;

const legacyTarget = content.substring(
  content.indexOf('html,\r\nbody{\r\n  min-height:100%;') !== -1 
    ? content.indexOf('html,\r\nbody{\r\n  min-height:100%;')
    : content.indexOf('html,\nbody{\n  min-height:100%;')
);

// Find from that position up to @keyframes scroll
const scrollKeyframesIdx = legacyTarget.indexOf('@keyframes scroll');
if (scrollKeyframesIdx !== -1) {
  const legacyBlock = legacyTarget.substring(0, scrollKeyframesIdx);
  
  const cleanReplacement = `html,
body {
  min-height: 100%;
  overflow-x: hidden;
}

body {
  position: relative;
  background-color: #F7F8F5;
  color: #26332B;
  min-height: 100vh;
}

/* Footer Fix */
footer,
.footer {
  position: relative;
  z-index: 20;
}

/* Image Filter */
.food-img-filter {
  filter: saturate(1.05) contrast(1.02);
}

select,
input,
textarea {
  color: #26332B !important;
  background: #ffffff !important;
}

select::placeholder,
input::placeholder,
textarea::placeholder {
  color: #68756C !important;
}

`;

  content = content.replace(legacyBlock, cleanReplacement);
  console.log('Replaced legacy style block successfully');
} else {
  console.error('Could not find scrollKeyframesIdx');
}

// Also update #goTopBtn background from linear-gradient(135deg,#f97316,#ef4444) to StopBuy brand green
content = content.replace(
  'background: linear-gradient(135deg,#f97316,#ef4444);',
  'background: #0A3D2A;'
);
content = content.replace(
  'box-shadow:\n    0 10px 30px rgba(239,68,68,.35),\n    inset 0 1px 0 rgba(255,255,255,.25);',
  'box-shadow: 0 10px 25px rgba(10, 61, 42, 0.25);'
);

fs.writeFileSync(foodHtmlPath, content, 'utf8');
console.log('Saved cleaned food.html');
