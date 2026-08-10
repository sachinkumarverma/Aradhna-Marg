const fs = require('fs');

let file = fs.readFileSync('frontend/src/pages/admin/festivals/form.tsx', 'utf8');

if (!file.includes('TranslationPanel')) {
  // It probably does include it but we need the import
  file = file.replace(/import React/, "import { TranslationPanel } from '../../features/translations/TranslationPanel';\nimport React");
} else if (!file.includes('import { TranslationPanel }')) {
  file = file.replace(/import React/, "import { TranslationPanel } from '../../features/translations/TranslationPanel';\nimport React");
}

file = file.replace(/onGenerateLive=\{\(t\)/, "onGenerateLive={(t: any)");

fs.writeFileSync('frontend/src/pages/admin/festivals/form.tsx', file);
