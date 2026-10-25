const fs = require('fs');

const updates = [
  {
    file: 'index.html',
    src: './images/banner/orion-fx-digital-success-banner-03.png',
    containerBorder: 'border-slate-700/50'
  },
  {
    file: 'pages/categories.html',
    src: '../images/banner/orion-fx-digital-success-banner-03.png',
    containerBorder: 'border-slate-200'
  },
  {
    file: 'pages/computers.html',
    src: '../images/banner/orion-fx-digital-success-banner-03.png',
    containerBorder: 'border-slate-200'
  },
  {
    file: 'pages/food.html',
    src: '../images/banner/orion-fx-digital-success-banner-03.png',
    containerBorder: 'border-slate-700/60'
  },
  {
    file: 'pages/grocery.html',
    src: '../images/banner/orion-fx-digital-success-banner-03.png',
    containerBorder: 'border-slate-200'
  }
];

updates.forEach(({ file, src, containerBorder }) => {
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');

  // Regex to match the promotional banner block inside the https://orionfx.net link
  const bannerRegex = /(<a\s+href=["']https:\/\/orionfx\.net["'][^>]*>)\s*<div\s+class=["'][^"']*bg-\[#020b1c\][^"']*["']>\s*<img\s+src=["'][^"']*banner[^"']*["'][^>]*>\s*<\/div>\s*(<\/a>)/i;

  const match = content.match(bannerRegex);
  if (match) {
    const isRoot = file === 'index.html';
    const indent = isRoot ? '                    ' : '                ';
    const imgIndent = isRoot ? '                        ' : '                    ';

    const newContainer = `${match[1]}
${indent}<div class="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-md border ${containerBorder} bg-[#020b1c] transition duration-300 group-hover:shadow-xl">
${imgIndent}<img src="${src}" alt="Orion FX Digital Success Banner" 
${imgIndent}    width="2079" height="266"
${imgIndent}    class="w-full h-auto block aspect-[2079/266] max-h-[266px]" style="aspect-ratio: 2079 / 266;">
${indent}</div>
${isRoot ? '                ' : '            '}${match[2]}`;

    content = content.replace(bannerRegex, newContainer);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Successfully updated ${file}`);
  } else {
    console.warn(`Could not match bannerRegex in ${file}`);
  }
});
