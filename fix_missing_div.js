const fs = require('fs');

function fix(path) {
  let file = fs.readFileSync(path, 'utf8');
  file = file.replace(/(\n\s*)<div className=\{activeLanguage === 'translation' \? 'block space-y-6' : 'hidden'\}>/, "$1</div>$1<div className={activeLanguage === 'translation' ? 'block space-y-6' : 'hidden'}>");
  fs.writeFileSync(path, file);
}

fix('frontend/src/pages/admin/articles/form.tsx');
fix('frontend/src/pages/admin/puranas/form.tsx');
