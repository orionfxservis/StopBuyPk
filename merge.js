const fs = require('fs');

// 1. Process style.css
let style1 = fs.readFileSync('css/style.css', 'utf8');
let refStyle = fs.readFileSync('ref_style.css', 'utf8');

// Replace .logo in style1
let logoRegex = /\.logo\s*\{[^}]+\}/;
let refLogoRegex = /(\.logo\s*\{[^}]+\})/;
let matchLogo = refStyle.match(refLogoRegex);
if(matchLogo) {
    style1 = style1.replace(logoRegex, matchLogo[1]);
}

// Remove old product grid from style1
let oldGridIndex = style1.indexOf('/* ===== FIX PRODUCT GRID ===== */');
if(oldGridIndex !== -1) {
    style1 = style1.substring(0, oldGridIndex);
}

// Extract sections from refStyle
let startProducts = refStyle.indexOf('/* ---- Products Section ---- */');
let endFooter = refStyle.indexOf('/* ---- Media Queries ---- */');
let productsToFooter = refStyle.substring(startProducts, endFooter);

// Extract media query additions
let mediaContent = `
@media(max-width:768px) {
    .product-grid { gap: 20px; }
    .blog-grid { gap: 20px; }
    .contact-container { padding: 25px; }
    .footer { padding: 40px 20px 20px; }
}
`;

fs.writeFileSync('css/style.css', style1 + '\n' + productsToFooter + '\n' + mediaContent);


// 2. Process index.html
let index1 = fs.readFileSync('index.html', 'utf8');
let refIndex = fs.readFileSync('ref_index.html', 'utf8');

let oldIndexHtmlStart = index1.indexOf('<!-- ================= NEARBY ================= -->');
let oldIndexEnd = index1.lastIndexOf('</body>');
let index1Top = index1.substring(0, oldIndexHtmlStart);
let index1Bottom = index1.substring(oldIndexEnd);

let newIndexHtmlStart = refIndex.indexOf('<!-- Near You Deals Section -->');
let newIndexEnd = refIndex.lastIndexOf('</body>');
let sectionsHtml = refIndex.substring(newIndexHtmlStart, newIndexEnd);

fs.writeFileSync('index.html', index1Top + sectionsHtml + index1Bottom);
console.log("Merge completed successfully!");
