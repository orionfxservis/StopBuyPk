const fs = require('fs');

const absPath = 'd:\\Freelance\\Web Designing\\Price Comparison\\Sample 5\\pages\\computers.html';
let content = fs.readFileSync(absPath, 'utf8');

const target = `        <!-- Card Grid -->
        <div class="card-grid">
          <!-- Dynamic computer cards will load here -->
        </div>

      </main>

    </div>
  </div>`;

const replacement = `        <!-- Card Grid -->
        <div class="card-grid">
          <!-- Dynamic computer cards will load here -->
        </div>

      </main>

    </div>

    <!-- Promotional Ad Banner -->
    <div class="relative w-full rounded-3xl overflow-hidden shadow-md border border-slate-200 mt-8 mb-2 bg-slate-950 flex items-center justify-center">
        <img src="../images/banner/OrionFx - Web Banner.gif" alt="Stop Buy Promotional Banner"
            class="w-full h-auto max-h-[140px] md:max-h-[180px] object-cover md:object-fill">
    </div>

  </div>`;

if (content.includes(target.replace(/\r?\n/g, '\r\n'))) {
    content = content.replace(target.replace(/\r?\n/g, '\r\n'), replacement.replace(/\r?\n/g, '\r\n'));
    console.log('Matched and replaced with CRLF');
} else if (content.includes(target.replace(/\r?\n/g, '\n'))) {
    content = content.replace(target.replace(/\r?\n/g, '\n'), replacement.replace(/\r?\n/g, '\n'));
    console.log('Matched and replaced with LF');
} else {
    console.error('Target not found in computers.html');
    process.exit(1);
}

fs.writeFileSync(absPath, content, 'utf8');
console.log('Successfully added banner to computers.html');
