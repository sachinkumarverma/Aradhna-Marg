/**
 * Production SEO & Metadata Constants
 * Production Domain: https://aradhnamarg.com
 */

export const SITE_ORIGIN = (
  import.meta.env.VITE_SITE_URL ||
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  'https://aradhnamarg.com'
).replace(/\/+$/, '');

export const SITE_NAME_EN = 'Aradhna Marg';
export const SITE_NAME_HI = 'आराधना मार्ग';

export const DEFAULT_SEO = {
  hi: {
    title: 'आराधना मार्ग - भजनों, आरती, चालीसा, एवं पौराणिक कथाओं का पावन संग्रह',
    description:
      'आराधना मार्ग पर पाएं सम्पूर्ण सनातन भक्ति साहित्य, मधुर भजन, आरती, चालीसा, स्तोत्र, श्रीमद्भागवत व अष्टादश महापुराण और प्रमुख हिन्दू पर्वों की प्रामाणिक जानकारी।',
    keywords: [
      'आराधना मार्ग',
      'भजन',
      'आरती',
      'चालीसा',
      'महापुराण',
      'श्रीमद्भागवत',
      'सनातन धर्म',
      'हिन्दू त्योहार',
      'भक्ति'
    ]
  },
  en: {
    title: 'Aradhna Marg - Sacred Devotional Portal for Bhajans, Puranas, Aarti & Festivals',
    description:
      'Explore authentic Hindu devotional bhajans, sacred puranas, divine stotrams, aartis, chalisas, and festive wisdom in Hindi and English on Aradhna Marg.',
    keywords: [
      'Aradhna Marg',
      'Bhajans',
      'Aarti',
      'Chalisa',
      'Puranas',
      'Hindu Scriptures',
      'Sanatan Dharma',
      'Festivals',
      'Devotional Songs'
    ]
  }
};

export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/logo.png`;
export const TWITTER_HANDLE = '@AradhnaMarg';
