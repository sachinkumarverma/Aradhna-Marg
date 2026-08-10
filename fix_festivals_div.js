const fs = require('fs');

const file = fs.readFileSync('frontend/src/pages/admin/festivals/form.tsx', 'utf8');

// I replaced: `</div> </div> {/* RIGHT COLUMN` with `</div> <div className={...}> ... </div> </div> {/* RIGHT COLUMN`
// Let's check how many divs I added at the end.
const count1 = (file.match(/<div/g) || []).length;
const count2 = (file.match(/<\/div>/g) || []).length;

console.log('div', count1, '</div>', count2);

// Add the missing </div> just before RIGHT COLUMN
const fixedFile = file.replace(/(\{\/\* RIGHT COLUMN: Settings & Metadata \*\/\})/, "</div>\n\n              $1");

fs.writeFileSync('frontend/src/pages/admin/festivals/form.tsx', fixedFile);
