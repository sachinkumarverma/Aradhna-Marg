const fs = require('fs');

function fixFile(path) {
  const file = fs.readFileSync(path, 'utf8');

  const count1 = (file.match(/<div/g) || []).length;
  const count2 = (file.match(/<\/div>/g) || []).length;

  console.log(path, 'div', count1, '</div>', count2);
  
  if (count1 > count2) {
    const diff = count1 - count2;
    const closingDivs = Array(diff).fill('</div>').join('\\n');
    const fixedFile = file.replace(/(\{\/\* RIGHT COLUMN: Settings & Metadata \*\/\})/, closingDivs + "\\n\\n              $1");
    fs.writeFileSync(path, fixedFile);
    console.log("Fixed", path, "with", diff, "divs");
  }
}

fixFile('frontend/src/pages/admin/articles/form.tsx');
fixFile('frontend/src/pages/admin/puranas/form.tsx');
