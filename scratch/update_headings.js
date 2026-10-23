const fs = require('fs');

const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

// 3. Price Comparison
const old3 = `                        <h2 style="font-family: 'Times New Roman', Times, serif;"
                            class="text-3xl font-bold text-[#0f2249] leading-tight whitespace-nowrap">Price Comparison
                        </h2>`;
const new3 = `                        <h2 style="font-family: 'Times New Roman', Times, serif;"
                            class="text-2xl font-bold text-[#0f2249] leading-tight whitespace-nowrap">Price Comparison
                        </h2>`;

// 5. Travel & Tours
const old5 = `                                <h2 class="text-3xl md:text-4xl font-black text-white tracking-wide leading-tight"
                                    style="font-family: Georgia, 'Times New Roman', serif;">`;
const new5 = `                                <h2 class="text-2xl font-bold text-white tracking-wide leading-tight"
                                    style="font-family: 'Times New Roman', Times, serif;">`;

// 6. Smart Savings Blog
const old6 = `                    <h2 class="text-2xl font-bold text-gray-800">Smart Savings Blog</h2>`;
const new6 = `                    <h2 style="font-family: 'Times New Roman', Times, serif;" class="text-2xl font-bold text-gray-800">Smart Savings Blog</h2>`;

// 7. Real People. Real Savings.
const old7 = `                            <h2 class="text-2xl md:text-4xl font-extrabold text-white leading-tight">`;
const new7 = `                            <h2 style="font-family: 'Times New Roman', Times, serif;" class="text-2xl font-bold text-white leading-tight">`;

// 8. Compare Prices Instantly While Shopping
const old8 = `                            <h2 style="font-family: 'Times New Roman', Times, serif;"
                                class="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                                Compare Prices Instantly<br>While Shopping
                            </h2>`;
const new8 = `                            <h2 style="font-family: 'Times New Roman', Times, serif;"
                                class="text-2xl font-bold text-white leading-tight">
                                Compare Prices Instantly<br>While Shopping
                            </h2>`;

// 9. Never miss the best deals!
const old9 = `                            <h2 style="font-family: 'Times New Roman', Times, serif;"
                                class="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                                Never miss the<br><span`;
const new9 = `                            <h2 style="font-family: 'Times New Roman', Times, serif;"
                                class="text-2xl font-bold text-white leading-tight">
                                Never miss the<br><span`;

// 10. Get in Touch With Us
const old10 = `                        <h2 style="font-family: 'Times New Roman', Times, serif;"
                            class="text-2xl sm:text-3xl font-extrabold text-[#005221] leading-tight">
                            Get in Touch With Us
                        </h2>`;
const new10 = `                        <h2 style="font-family: 'Times New Roman', Times, serif;"
                            class="text-2xl font-bold text-[#005221] leading-tight">
                            Get in Touch With Us
                        </h2>`;

// 11. Frequently Asked Questions
const old11 = `                        <h2 style="font-family: 'Times New Roman', Times, serif;"
                            class="text-3xl font-extrabold text-[#005221] mb-3">
                            Frequently Asked Questions
                        </h2>`;
const new11 = `                        <h2 style="font-family: 'Times New Roman', Times, serif;"
                            class="text-2xl font-bold text-[#005221] mb-3">
                            Frequently Asked Questions
                        </h2>`;

const replacements = [
  { name: '3. Price Comparison', oldStr: old3, newStr: new3 },
  { name: '5. Travel & Tours', oldStr: old5, newStr: new5 },
  { name: '6. Smart Savings Blog', oldStr: old6, newStr: new6 },
  { name: '7. Real People. Real Savings.', oldStr: old7, newStr: new7 },
  { name: '8. Compare Prices Instantly', oldStr: old8, newStr: new8 },
  { name: '9. Never miss the best deals!', oldStr: old9, newStr: new9 },
  { name: '10. Get in Touch With Us', oldStr: old10, newStr: new10 },
  { name: '11. Frequently Asked Questions', oldStr: old11, newStr: new11 }
];

replacements.forEach(r => {
  const oldFormatted = r.oldStr.replace(/\r?\n/g, eol);
  const newFormatted = r.newStr.replace(/\r?\n/g, eol);
  if (content.includes(oldFormatted)) {
    content = content.replace(oldFormatted, newFormatted);
    console.log(`Successfully updated: ${r.name}`);
  }
});

fs.writeFileSync(file, content, 'utf8');
console.log('\nAll replacements written to index.html');
