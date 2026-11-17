import React from 'react';
import { ShieldCheck, BookOpen, UserCheck, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n/LanguageContext';

export interface DevotionalProvenanceCardProps {
  type: 'bhajan' | 'article' | 'festival' | 'purana';
  title?: string;
  slug?: string;
  authorName?: string | null;
  traditionalSource?: string;
  publishedDate?: string;
}

// Classical, historically established attributions for prominent Sanatan hymns
const TRADITIONAL_COMPOSERS: Record<string, { hi: string; en: string }> = {
  'hanuman-chalisa': {
    hi: 'गोस्वामी तुलसीदास (Goswami Tulsidas)',
    en: 'Goswami Tulsidas'
  },
  madhurashtakam: {
    hi: 'श्रीमद् वल्लभाचार्य (Shri Vallabhacharya)',
    en: 'Shri Vallabhacharya'
  },
  'shiv-tandav-stotram': {
    hi: 'पारंपरिक शिव स्तुति / रावण विरचित (Classical Shiv Stotra)',
    en: 'Classical Shiv Stotra'
  },
  'gopi-geet': {
    hi: 'श्रीमद्भागवत महापुराण (दशम स्कंध) / महर्षि वेदव्यास',
    en: 'Shrimad Bhagavata Mahapurana / Maharshi Ved Vyasa'
  },
  'geet-govind-by-jaydev-mahaprabhu': {
    hi: 'जयदेव महाप्रभु (Jayadeva Goswami)',
    en: 'Jayadeva Goswami'
  },
  'bhishma-stuti': {
    hi: 'श्रीमद्भागवत महापुराण / महर्षि वेदव्यास',
    en: 'Shrimad Bhagavata Mahapurana / Maharshi Ved Vyasa'
  },
  'payo-ji-maine-ram-ratan-dhan-payo': {
    hi: 'भक्त शिरोमणि मीराबाई (Mirabai)',
    en: 'Bhakt Shiromani Mirabai'
  },
  'mere-to-girdhar-gopal-doosro-na-koi': {
    hi: 'भक्त शिरोमणि मीराबाई (Mirabai)',
    en: 'Bhakt Shiromani Mirabai'
  },
  'aali-ri-mohe-lage-vrindavan-neeko': {
    hi: 'भक्त शिरोमणि मीराबाई (Mirabai)',
    en: 'Bhakt Shiromani Mirabai'
  },
  'girija-stuti': {
    hi: 'गोस्वामी तुलसीदास (श्रीरामचरितमानस)',
    en: 'Goswami Tulsidas (Ramcharitmanas)'
  }
};

export const DevotionalProvenanceCard: React.FC<DevotionalProvenanceCardProps> = ({
  type,
  title: _title,
  slug,
  authorName,
  traditionalSource,
  publishedDate: _publishedDate
}) => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  // Determine composer / origin
  let composer = authorName?.trim();
  if (!composer && slug && TRADITIONAL_COMPOSERS[slug]) {
    composer = isHi ? TRADITIONAL_COMPOSERS[slug].hi : TRADITIONAL_COMPOSERS[slug].en;
  }
  if (!composer) {
    if (type === 'purana') {
      composer = isHi ? 'परंपरागत महर्षि वेदव्यास (Maharshi Ved Vyasa)' : 'Maharshi Ved Vyasa (Traditional)';
    } else if (type === 'festival') {
      composer = isHi ? 'सनातन वैदिक पंचांग एवं धर्मशास्त्र' : 'Vedic Panchang & Dharma Shastras';
    } else {
      composer = isHi
        ? 'पारंपरिक सनातन भक्ति रचना (सार्वजनिक डोमेन)'
        : 'Traditional Sanatan Devotional Composition (Public Domain)';
    }
  }

  const editorialReviewer = 'Aradhna Marg Editorial Team';
  const editorialReviewerHi = 'आराधना मार्ग सम्पादकीय दल';

  return (
    <div
      className="bg-gradient-to-b from-[#FFFDF9] via-white to-[#FAF6EE] rounded-2xl p-5 sm:p-7 border border-amber-200/90 shadow-xs mt-6 overflow-hidden"
      aria-label={isHi ? 'स्रोत एवं संपादकीय समीक्षा' : 'Source & Editorial Review'}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-amber-200/70 mb-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-darkBrown font-hindi-heading leading-tight">
            {isHi ? 'स्रोत, रचनाकार एवं सम्पादकीय समीक्षा' : 'Source, Provenance & Editorial Review'}
          </h3>
        </div>
      </div>

      {/* Grid of Provenance Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
        {/* Item 1: Original Composition / Author */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-amber-100 flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {isHi ? 'मूल रचनाकार / स्रोत' : 'Original Author / Source'}
            </span>
            <p className="font-semibold text-darkBrown font-hindi-heading text-sm sm:text-base">{composer}</p>
            {traditionalSource && <p className="text-slate-500 text-xs mt-0.5 font-hindi-body">{traditionalSource}</p>}
          </div>
        </div>

        {/* Item 2: Editorial Review */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-amber-100 flex items-start gap-3">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {isHi ? 'सम्पादकीय समीक्षा' : 'Editorial Review & Verification'}
            </span>
            <p className="font-semibold text-darkBrown font-hindi-heading text-sm sm:text-base">
              {isHi ? editorialReviewerHi : editorialReviewer}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {isHi
                ? 'पारंपरिक संदर्भों एवं प्रामाणिक टीकाओं के आधार पर सम्पादित व सत्यापित'
                : 'Curated and verified against classical devotional texts'}
            </p>
          </div>
        </div>
      </div>

      {/* Rights & Feedback Footer */}
      <div className="mt-4 pt-3.5 border-t border-amber-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500">
        <p className="leading-normal">
          {isHi
            ? 'धार्मिक एवं व्यक्तिगत स्वाध्याय हेतु संकलित। सभी पारंपरिक रचनाएं सार्वजनिक डोमेन (Public Domain) में हैं।'
            : 'Preserved for devotional worship, study, and prayer. Traditional scriptures are in the public domain.'}
        </p>
        <Link
          to="/about"
          className="inline-flex items-center gap-1 text-saffron hover:text-orange-700 font-semibold shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{isHi ? 'संपादकीय नीति पढ़ें' : 'Read Editorial Policy'}</span>
        </Link>
      </div>
    </div>
  );
};
