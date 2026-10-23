const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../../../../../Freelance/Web Designing/Price Comparison/Sample 5/pages/food.html');
// Or direct absolute path:
const absPath = 'd:\\Freelance\\Web Designing\\Price Comparison\\Sample 5\\pages\\food.html';

let content = fs.readFileSync(absPath, 'utf8');

const targetIdx = content.indexOf('Hot & Roll');
if (targetIdx === -1) {
    console.error('Hot & Roll not found');
    process.exit(1);
}

// Find </main> after Hot & Roll
const mainIdx = content.indexOf('</main>', targetIdx);
if (mainIdx === -1) {
    console.error('</main> not found');
    process.exit(1);
}

// Slice out the ticker close to </main>
const sectionEnd = content.slice(targetIdx, mainIdx + '</main>'.length);
console.log('Found sectionEnd:');
console.log(sectionEnd);

const replacement = `Hot & Roll</p>
                </div>
              </div>

            </div>
        </div>
      </div>

      <!-- Promotional Ad Banner (Moved under Featured Offers) -->
      <div class="relative w-full rounded-3xl overflow-hidden shadow-md border border-slate-700/60 mt-8 bg-slate-950 flex items-center justify-center">
          <img src="../images/banner/OrionFx - Web Banner.gif" alt="Stop Buy Promotional Banner"
              class="w-full h-auto max-h-[140px] md:max-h-[180px] object-cover md:object-fill">
      </div>

    </div>
  </main>`;

// Standardize CRLF if needed
const newSectionEnd = replacement.replace(/\r?\n/g, '\r\n');
content = content.replace(sectionEnd, newSectionEnd);
fs.writeFileSync(absPath, content, 'utf8');
console.log('Successfully updated pages/food.html');
