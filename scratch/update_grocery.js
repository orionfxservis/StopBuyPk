const fs = require('fs');

const absPath = 'd:\\Freelance\\Web Designing\\Price Comparison\\Sample 5\\pages\\grocery.html';
let content = fs.readFileSync(absPath, 'utf8');

// 1. Ensure body has flex flex-col min-h-screen if not already
content = content.replace(
    '<body>',
    '<body class="min-h-screen flex flex-col text-[#1F2937] relative overflow-x-hidden">'
);

// 2. Place promotional ad banner right before footer
const targetFooter = '  <!-- FOOTER -->\r\n  <div class="w-full bg-[#0A3D2A] text-emerald-50 text-center py-4 text-sm mt-auto border-t border-[#052C22]">\r\n    &copy; 2026 StopBuyPk - Smart Price Comparison\r\n  </div>';

// Also handle \n in case
const bannerBlock = `    <!-- Promotional Ad Banner -->
    <div class="relative w-full rounded-3xl overflow-hidden shadow-md border border-slate-200 mt-8 mb-6 bg-slate-950 flex items-center justify-center">
        <img src="../images/banner/OrionFx - Web Banner.gif" alt="Stop Buy Promotional Banner"
            class="w-full h-auto max-h-[140px] md:max-h-[180px] object-cover md:object-fill">
    </div>
  </section>

  <!-- FOOTER -->
  <div class="w-full bg-[#0A3D2A] text-emerald-50 text-center py-4 text-sm mt-auto border-t border-[#052C22]">
    &copy; 2026 StopBuyPk - Smart Price Comparison
  </div>`;

if (content.includes(targetFooter)) {
    content = content.replace(targetFooter, bannerBlock.replace(/\r?\n/g, '\r\n'));
    console.log('Target footer matched and replaced with CRLF');
} else {
    // Try LF matching
    const targetLF = targetFooter.replace(/\r\n/g, '\n');
    if (content.includes(targetLF)) {
        content = content.replace(targetLF, bannerBlock.replace(/\r?\n/g, '\n'));
        console.log('Target footer matched and replaced with LF');
    } else {
        console.error('Target footer not found!');
        process.exit(1);
    }
}

fs.writeFileSync(absPath, content, 'utf8');
console.log('Successfully updated grocery.html');
