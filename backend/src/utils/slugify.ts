const devanagariMap: Record<string, string> = {
  अ: 'a',
  आ: 'aa',
  इ: 'i',
  ई: 'ee',
  उ: 'u',
  ऊ: 'oo',
  ऋ: 'ri',
  ए: 'e',
  ऐ: 'ai',
  ओ: 'o',
  औ: 'au',
  अं: 'am',
  अः: 'ah',
  क: 'k',
  ख: 'kh',
  ग: 'g',
  घ: 'gh',
  ङ: 'ng',
  च: 'ch',
  छ: 'chh',
  ज: 'j',
  झ: 'jh',
  ञ: 'ny',
  ट: 't',
  ठ: 'th',
  ड: 'd',
  ढ: 'dh',
  ण: 'n',
  त: 't',
  थ: 'th',
  द: 'd',
  ध: 'dh',
  न: 'n',
  प: 'p',
  फ: 'ph',
  ब: 'b',
  भ: 'bh',
  म: 'm',
  य: 'y',
  र: 'r',
  ल: 'l',
  व: 'v',
  श: 'sh',
  ष: 'sh',
  स: 's',
  ह: 'h',
  'ा': 'a',
  'ि': 'i',
  'ी': 'ee',
  'ु': 'u',
  'ू': 'oo',
  'ृ': 'ri',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
  'ं': 'n',
  'ँ': 'n',
  '्': '',
  'ः': 'h'
};

export const transliterateHindi = (text: string): string => {
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    res += devanagariMap[ch] !== undefined ? devanagariMap[ch] : ch;
  }
  return res;
};

export const slugify = (text: string): string => {
  if (!text) return '';
  let str = text.trim();
  if (/[\u0900-\u097F]/.test(str)) {
    str = transliterateHindi(str);
  }
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
};

export const generateContentSlug = (primaryEn?: string | null, fallbackTitle?: string | null): string => {
  let text = primaryEn && primaryEn.trim() ? primaryEn : '';
  if (!text && fallbackTitle) {
    const parts = fallbackTitle.split(/[|/]/);
    for (const p of parts) {
      if (/[a-zA-Z]{3,}/.test(p)) {
        text = p;
        break;
      }
    }
    if (!text) {
      text = transliterateHindi(fallbackTitle);
    }
  }
  text = text.replace(/#\w+/g, '').replace(/\|\|/g, ' ');
  let slug = slugify(text);
  if (slug.length > 80) {
    const lastDash = slug.lastIndexOf('-');
    if (lastDash > 40) slug = slug.substring(0, lastDash);
  }
  return slug || 'content';
};
